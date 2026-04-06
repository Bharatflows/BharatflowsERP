import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { getNextNumber } from '../services/sequenceService';
import eventBus, { EventTypes } from '../services/eventBus';
import logger from '../config/logger';

// ==================== BOM CRUD ====================

// Get all BOMs
export const getBOMs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        const boms = await prisma.billOfMaterial.findMany({
            where: { companyId },
            include: {
                finishedProduct: {
                    select: { id: true, name: true, code: true, unit: true }
                },
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, code: true, unit: true, purchasePrice: true }
                        }
                    }
                },
                _count: { select: { workOrders: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate total cost for each BOM
        const bomsWithCost = boms.map(bom => {
            const materialCost = bom.items.reduce((sum, item) => {
                return sum + (Number(item.quantity) * Number(item.product.purchasePrice));
            }, 0);
            const totalCost = materialCost + Number(bom.laborCost) + Number(bom.overheadCost);
            return {
                ...bom,
                materialCost,
                totalCost,
                rawMaterialCount: bom.items.length
            };
        });

        res.json({ success: true, data: bomsWithCost });
    } catch (error: any) {
        logger.error('Get BOMs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single BOM
export const getBOM = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const bom = await prisma.billOfMaterial.findFirst({
            where: { id, companyId },
            include: {
                finishedProduct: true,
                items: {
                    include: {
                        product: true
                    }
                },
                workOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!bom) {
            res.status(404).json({ success: false, message: 'BOM not found' });
            return;
        }

        res.json({ success: true, data: bom });
    } catch (error: any) {
        logger.error('Get BOM error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create BOM
export const createBOM = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, code, finishedProductId, outputQuantity, laborCost, overheadCost, notes, items } = req.body;
        const companyId = req.user!.companyId;

        if (!name || !finishedProductId) {
            res.status(400).json({ success: false, message: 'Name and finished product are required' });
            return;
        }

        const bom = await prisma.billOfMaterial.create({
            data: {
                name,
                code,
                finishedProductId,
                outputQuantity: outputQuantity || 1,
                laborCost: laborCost || 0,
                overheadCost: overheadCost || 0,
                notes,
                companyId,
                items: items ? {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unit: item.unit,
                        notes: item.notes
                    }))
                } : undefined
            },
            include: {
                finishedProduct: true,
                items: { include: { product: true } }
            }
        });

        // Emit BOM_CREATED event
        await eventBus.emit({
            companyId,
            eventType: EventTypes.BOM_CREATED,
            aggregateType: 'BillOfMaterial',
            aggregateId: bom.id,
            payload: {
                name: bom.name,
                code: bom.code,
                finishedProductId: bom.finishedProductId
            },
            metadata: { userId: req.user!.id, source: 'api' }
        });

        res.status(201).json({ success: true, data: bom });
    } catch (error: any) {
        logger.error('Create BOM error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update BOM
export const updateBOM = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, code, finishedProductId, outputQuantity, laborCost, overheadCost, notes, isActive, items } = req.body;
        const companyId = req.user!.companyId;

        // Verify ownership
        const existing = await prisma.billOfMaterial.findFirst({ where: { id, companyId } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'BOM not found' });
            return;
        }

        // Update BOM and replace items if provided
        const bom = await prisma.$transaction(async (tx) => {
            // Delete existing items if new items provided
            if (items) {
                await tx.bOMItem.deleteMany({ where: { bomId: id } });
            }

            return tx.billOfMaterial.update({
                where: { id },
                data: {
                    name,
                    code,
                    finishedProductId,
                    outputQuantity,
                    laborCost,
                    overheadCost,
                    notes,
                    isActive,
                    items: items ? {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unit: item.unit,
                            notes: item.notes
                        }))
                    } : undefined
                },
                include: {
                    finishedProduct: true,
                    items: { include: { product: true } }
                }
            });
        });



        // Emit BOM_UPDATED event
        await eventBus.emit({
            companyId,
            eventType: EventTypes.BOM_UPDATED,
            aggregateType: 'BillOfMaterial',
            aggregateId: bom.id,
            payload: {
                name: bom.name,
                code: bom.code,
                finishedProductId: bom.finishedProductId
            },
            metadata: { userId: req.user!.id, source: 'api' }
        });

        res.json({ success: true, data: bom });
    } catch (error: any) {
        logger.error('Update BOM error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete BOM
export const deleteBOM = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const existing = await prisma.billOfMaterial.findFirst({
            where: { id, companyId },
            include: { _count: { select: { workOrders: true } } }
        });

        if (!existing) {
            res.status(404).json({ success: false, message: 'BOM not found' });
            return;
        }

        if (existing._count.workOrders > 0) {
            res.status(400).json({
                success: false,
                message: 'Cannot delete BOM with existing work orders. Deactivate it instead.'
            });
            return;
        }

        await prisma.billOfMaterial.delete({ where: { id , companyId: req.user.companyId } });

        // Emit BOM_DELETED event
        await eventBus.emit({
            companyId,
            eventType: EventTypes.BOM_DELETED,
            aggregateType: 'BillOfMaterial',
            aggregateId: id,
            payload: { name: existing.name, code: existing.code },
            metadata: { userId: req.user!.id, source: 'api' }
        });
        res.json({ success: true, message: 'BOM deleted successfully' });
    } catch (error: any) {
        logger.error('Delete BOM error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== WORK ORDER CRUD ====================

// Get all Work Orders
export const getWorkOrders = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { status, bomId } = req.query;

        const where: any = { companyId };
        if (status) where.status = status;
        if (bomId) where.bomId = bomId;

        const workOrders = await prisma.workOrder.findMany({
            where,
            include: {
                bom: {
                    include: {
                        finishedProduct: {
                            select: { id: true, name: true, code: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate progress percentage
        const ordersWithProgress = workOrders.map(wo => ({
            ...wo,
            progress: wo.plannedQty > 0 ? Math.round((wo.completedQty / wo.plannedQty) * 100) : 0,
            productName: wo.bom.finishedProduct.name
        }));

        res.json({ success: true, data: ordersWithProgress });
    } catch (error: any) {
        logger.error('Get Work Orders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single Work Order
export const getWorkOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const workOrder = await prisma.workOrder.findFirst({
            where: { id, companyId },
            include: {
                bom: {
                    include: {
                        finishedProduct: true,
                        items: { include: { product: true } }
                    }
                }
            }
        });

        if (!workOrder) {
            res.status(404).json({ success: false, message: 'Work Order not found' });
            return;
        }

        res.json({ success: true, data: workOrder });
    } catch (error: any) {
        logger.error('Get Work Order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create Work Order
export const createWorkOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { bomId, plannedQty, priority, startDate, dueDate, assignedTo, notes } = req.body;
        const companyId = req.user!.companyId;

        if (!bomId || !plannedQty) {
            res.status(400).json({ success: false, message: 'BOM and planned quantity are required' });
            return;
        }

        // Verify BOM exists
        const bom = await prisma.billOfMaterial.findFirst({ where: { id: bomId, companyId } });
        if (!bom) {
            res.status(404).json({ success: false, message: 'BOM not found' });
            return;
        }

        const orderNumber = await getNextNumber(companyId, 'WORK_ORDER');

        const workOrder = await prisma.workOrder.create({
            data: {
                orderNumber,
                bomId,
                planId: req.body.planId,
                plannedQty,
                priority: priority || 'MEDIUM',
                startDate: startDate ? new Date(startDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedTo,
                notes,
                companyId
            },
            include: {
                bom: {
                    include: { finishedProduct: true }
                }
            }
        });

        // Emit WORK_ORDER_CREATED event
        await eventBus.emit({
            companyId,
            eventType: EventTypes.WORK_ORDER_CREATED,
            aggregateType: 'WorkOrder',
            aggregateId: workOrder.id,
            payload: {
                orderNumber: workOrder.orderNumber,
                bomId: workOrder.bomId,
                plannedQty: workOrder.plannedQty,
                startDate: workOrder.startDate,
                dueDate: workOrder.dueDate
            },
            metadata: { userId: req.user!.id, source: 'api' }
        });

        res.status(201).json({ success: true, data: workOrder });
    } catch (error: any) {
        logger.error('Create Work Order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Work Order
// B1+B2: Includes raw material consumption and FG stock creation on completion
export const updateWorkOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { plannedQty, completedQty, status, priority, startDate, dueDate, assignedTo, notes } = req.body;
        const companyId = req.user!.companyId;
        const userId = req.user!.id;

        const existing = await prisma.workOrder.findFirst({
            where: { id, companyId },
            include: {
                bom: {
                    include: {
                        items: { include: { product: true } },
                        finishedProduct: true
                    }
                }
            }
        });

        if (!existing) {
            res.status(404).json({ success: false, message: 'Work Order not found' });
            return;
        }

        // Block updates on COMPLETED work orders
        if (existing.status === 'COMPLETED') {
            res.status(400).json({
                success: false,
                message: 'Cannot modify COMPLETED work order',
                code: 'WORK_ORDER_STATUS_LOCKED'
            });
            return;
        }

        const updateData: any = {};
        if (plannedQty !== undefined) updateData.plannedQty = plannedQty;
        if (completedQty !== undefined) updateData.completedQty = completedQty;
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
        if (notes !== undefined) updateData.notes = notes;

        // Determine final status and qty to process
        const finalCompletedQty = completedQty !== undefined ? completedQty : existing.completedQty;
        const finalPlannedQty = plannedQty !== undefined ? plannedQty : existing.plannedQty;
        let willComplete = false;
        let qtyToProcess = 0;

        // Auto-set status based on progress
        if (finalCompletedQty >= finalPlannedQty && existing.status !== 'COMPLETED') {
            updateData.status = 'COMPLETED';
            updateData.completedAt = new Date();
            willComplete = true;
            qtyToProcess = finalCompletedQty - existing.completedQty;
        } else if (finalCompletedQty > existing.completedQty) {
            updateData.status = 'IN_PROGRESS';
            qtyToProcess = finalCompletedQty - existing.completedQty;
        } else if (finalCompletedQty > 0 && existing.status === 'PENDING') {
            updateData.status = 'IN_PROGRESS';
        }

        // Execute in transaction for B1+B2 atomicity
        const workOrder = await prisma.$transaction(async (tx) => {
            // Update the work order first
            const updated = await tx.workOrder.update({
                where: { id },
                data: updateData,
                include: {
                    bom: { include: { finishedProduct: true, items: { include: { product: true } } } }
                }
            });

            // B1+B2: Process stock if quantity increased
            if (qtyToProcess > 0 && existing.bom) {
                const bom = existing.bom;

                // B1: Deduct raw materials
                for (const bomItem of bom.items) {
                    const deductQty = Number(bomItem.quantity) * qtyToProcess;
                    const product = await tx.product.findUnique({ where: { id: bomItem.productId } });

                    if (product && product.trackInventory) {
                        const previousStock = product.currentStock;
                        const newStock = previousStock - deductQty;

                        await tx.product.update({
                            where: { id: bomItem.productId },
                            data: { currentStock: newStock }
                        });

                        await tx.stockMovement.create({
                            data: {
                                companyId,
                                productId: bomItem.productId,
                                type: 'PRODUCTION',
                                quantity: -deductQty,
                                previousStock,
                                newStock,
                                reference: updated.orderNumber,
                                reason: `Raw material consumed for WO ${updated.orderNumber}`,
                                createdBy: userId
                            }
                        });

                        logger.info(`[B1] RM Deducted: ${deductQty} of ${product.name} for WO ${updated.orderNumber}`);
                    }
                }

                // B2: Add finished goods
                const fgProduct = bom.finishedProduct;
                const fgQty = qtyToProcess * Number(bom.outputQuantity || 1);

                if (fgProduct && fgProduct.trackInventory !== false) {
                    const previousFgStock = fgProduct.currentStock;
                    const newFgStock = previousFgStock + fgQty;

                    await tx.product.update({
                        where: { id: fgProduct.id },
                        data: { currentStock: newFgStock }
                    });

                    await tx.stockMovement.create({
                        data: {
                            companyId,
                            productId: fgProduct.id,
                            type: 'PRODUCTION',
                            quantity: fgQty,
                            previousStock: previousFgStock,
                            newStock: newFgStock,
                            reference: updated.orderNumber,
                            reason: `Finished goods from WO ${updated.orderNumber}`,
                            createdBy: userId
                        }
                    });

                    logger.info(`[B2] FG Added: ${fgQty} of ${fgProduct.name} from WO ${updated.orderNumber}`);
                }
            }

            return updated;
        });

        // Emit WORK_ORDER_UPDATED event
        await eventBus.emit({
            companyId,
            eventType: EventTypes.WORK_ORDER_UPDATED,
            aggregateType: 'WorkOrder',
            aggregateId: workOrder.id,
            payload: {
                orderNumber: workOrder.orderNumber,
                status: workOrder.status,
                completedQty: workOrder.completedQty,
                plannedQty: workOrder.plannedQty
            },
            metadata: { userId, source: 'api' }
        });

        if (workOrder.status === 'COMPLETED' && !existing.completedAt) {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.WORK_ORDER_COMPLETED,
                aggregateType: 'WorkOrder',
                aggregateId: workOrder.id,
                payload: {
                    orderNumber: workOrder.orderNumber,
                    completedQty: workOrder.completedQty,
                    completedAt: workOrder.completedAt
                },
                metadata: { userId, source: 'api' }
            });
        }

        // Emit domain event for ledger posting (WIP → FG Journal)
        if (qtyToProcess > 0) {
            try {
                await eventBus.emit({
                    companyId,
                    eventType: 'WORK_ORDER_PROGRESS',
                    aggregateType: 'WorkOrder',
                    aggregateId: workOrder.id,
                    payload: {
                        orderId: workOrder.id,
                        orderNumber: workOrder.orderNumber,
                        status: workOrder.status,
                        quantityProduced: qtyToProcess,
                        isCompleted: workOrder.status === 'COMPLETED'
                    },
                    metadata: { userId, source: 'api' }
                });
            } catch (eventError) {
                logger.warn(`Failed to emit WORK_ORDER_PROGRESS event: ${eventError}`);
            }
        }

        res.json({ success: true, data: workOrder });
    } catch (error: any) {
        logger.error('Update Work Order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Work Order
// H3: STRICT delete blocking for non-PENDING/CANCELLED work orders
export const deleteWorkOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const existing = await prisma.workOrder.findFirst({ where: { id, companyId } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Work Order not found' });
            return;
        }

        // H3: Block deletion of IN_PROGRESS or COMPLETED work orders
        const BLOCKED_STATUSES = ['IN_PROGRESS', 'COMPLETED'];
        if (BLOCKED_STATUSES.includes(existing.status)) {
            res.status(400).json({
                success: false,
                message: `Cannot delete ${existing.status} work order. Use CANCEL flow instead.`,
                code: 'INVALID_STATUS_FOR_DELETE'
            });
            return;
        }

        await prisma.workOrder.delete({ where: { id , companyId: req.user.companyId } });

        // Emit WORK_ORDER_DELETED event
        await eventBus.emit({
            companyId,
            eventType: EventTypes.WORK_ORDER_DELETED,
            aggregateType: 'WorkOrder',
            aggregateId: id,
            payload: { orderNumber: existing.orderNumber },
            metadata: { userId: req.user!.id, source: 'api' }
        });

        logger.info(`[H3] Work Order ${existing.orderNumber} deleted (status was ${existing.status})`);
        res.json({ success: true, message: 'Work Order deleted successfully' });
    } catch (error: any) {
        logger.error('Delete Work Order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== DASHBOARD ====================

// Production Dashboard Stats
export const getDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        // Get work order counts by status
        const workOrderStats = await prisma.workOrder.groupBy({
            by: ['status'],
            where: { companyId },
            _count: { id: true }
        });

        // Calculate totals
        const statusCounts: Record<string, number> = {};
        workOrderStats.forEach(stat => {
            statusCounts[stat.status] = stat._count.id;
        });

        const totalWorkOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);
        const activeWorkOrders = (statusCounts['PENDING'] || 0) + (statusCounts['IN_PROGRESS'] || 0);
        const completedThisMonth = await prisma.workOrder.count({
            where: {
                companyId,
                status: 'COMPLETED',
                completedAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });

        // Production quantities this month
        const monthlyProduction = await prisma.workOrder.aggregate({
            where: {
                companyId,
                status: 'COMPLETED',
                completedAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            },
            _sum: { completedQty: true }
        });

        // Active BOMs
        const activeBOMs = await prisma.billOfMaterial.count({
            where: { companyId, isActive: true }
        });

        // Recent work orders
        const recentWorkOrders = await prisma.workOrder.findMany({
            where: { companyId },
            include: {
                bom: {
                    include: {
                        finishedProduct: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Monthly production data (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await prisma.workOrder.findMany({
            where: {
                companyId,
                status: 'COMPLETED',
                completedAt: { gte: sixMonthsAgo }
            },
            select: { completedQty: true, completedAt: true }
        });

        // Group by month
        const productionByMonth: Record<string, number> = {};
        monthlyData.forEach(wo => {
            if (wo.completedAt) {
                const monthKey = wo.completedAt.toISOString().slice(0, 7);
                productionByMonth[monthKey] = (productionByMonth[monthKey] || 0) + wo.completedQty;
            }
        });

        res.json({
            success: true,
            data: {
                kpis: {
                    activeWorkOrders,
                    monthlyProduction: monthlyProduction._sum.completedQty || 0,
                    completedThisMonth,
                    pendingOrders: statusCounts['PENDING'] || 0,
                    inProgressOrders: statusCounts['IN_PROGRESS'] || 0,
                    activeBOMs
                },
                statusBreakdown: statusCounts,
                recentWorkOrders: recentWorkOrders.map(wo => ({
                    id: wo.id,
                    orderNumber: wo.orderNumber,
                    productName: wo.bom.finishedProduct.name,
                    plannedQty: wo.plannedQty,
                    completedQty: wo.completedQty,
                    status: wo.status,
                    progress: wo.plannedQty > 0 ? Math.round((wo.completedQty / wo.plannedQty) * 100) : 0
                })),
                productionByMonth
            }
        });
    } catch (error: any) {
        logger.error('Get Production Dashboard error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ==================== PRODUCTION PLANNING ====================

export const getProductionPlans = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const plans = await prisma.productionPlan.findMany({
            where: { companyId },
            include: {
                workOrders: {
                    include: {
                        bom: { include: { finishedProduct: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: plans });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createProductionPlan = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { name, description, startDate, endDate, status } = req.body;

        const planNumber = await getNextNumber(companyId, 'PRODUCTION_PLAN');

        const plan = await prisma.productionPlan.create({
            data: {
                planNumber,
                name,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status: status || 'DRAFT',
                companyId
            }
        });
        res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProductionPlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;
        const plan = await prisma.productionPlan.update({
            where: { id, companyId },
            data: req.body
        });
        res.json({ success: true, data: plan });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== QUALITY CONTROL ====================

export const getInspections = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const inspections = await prisma.qualityInspection.findMany({
            where: { companyId },
            include: {
                workOrder: true,
                product: { select: { name: true, code: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: inspections });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createInspection = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { workOrderId, productId, totalQty, passedQty, failedQty, inspectorName, status, notes, checkpoints } = req.body;

        const inspectionNumber = await getNextNumber(companyId, 'QUALITY_INSPECTION');

        const inspection = await prisma.qualityInspection.create({
            data: {
                inspectionNumber,
                workOrderId,
                productId,
                totalQty,
                passedQty,
                failedQty,
                inspectorName,
                status: status || 'PENDING',
                notes,
                checkpoints,
                companyId
            }
        });
        res.status(201).json({ success: true, data: inspection });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
