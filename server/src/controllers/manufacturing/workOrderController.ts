import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';

/**
 * Get all Work Orders
 */
export const getWorkOrders = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { status, bomId, priority, startDate, endDate, page = '1', limit = '20' } = req.query;

    const where: any = { companyId };
    if (status) where.status = status;
    if (bomId) where.bomId = bomId;
    if (priority) where.priority = priority;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          bom: {
            select: {
              id: true,
              name: true,
              finishedProduct: {
                select: { id: true, name: true, code: true, unit: true },
              },
            },
          },
          plan: { select: { id: true, name: true, planNumber: true } },
          _count: { select: { jobCards: true, inspections: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: workOrders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching work orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single Work Order
 */
export const getWorkOrder = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        bom: {
          include: {
            finishedProduct: true,
            items: {
              include: {
                product: true, // Raw material
              },
            },
          },
        },
        plan: true,
        jobCards: {
          orderBy: { operationSequence: 'asc' },
        },
        inspections: {
          orderBy: { date: 'desc' },
        },
        wastageLogs: {
          orderBy: { recordedAt: 'desc' },
        },
      },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    return res.json({ success: true, data: workOrder });
  } catch (error: any) {
    logger.error('Error fetching work order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a Work Order
 */
export const createWorkOrder = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const {
      bomId,
      plannedQty,
      startDate,
      dueDate,
      planId,
      priority,
      assignedTo,
      notes,
    } = req.body;

    if (!bomId || !plannedQty) {
      return res.status(400).json({
        success: false,
        message: 'BOM ID and planned quantity are required',
      });
    }

    // Verify BOM exists
    const bom = await prisma.billOfMaterial.findFirst({
      where: { id: bomId, companyId },
      include: {
        finishedProduct: true,
        items: true,
      },
    });

    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'Bill of Material not found',
      });
    }

    // Generate work order number
    const count = await prisma.workOrder.count({ where: { companyId } });
    const orderNumber = `WO-${String(count + 1).padStart(6, '0')}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        companyId,
        orderNumber,
        bomId,
        plannedQty: parseInt(plannedQty),
        completedQty: 0,
        status: 'PENDING',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        planId: planId || null,
        assignedTo: assignedTo || null,
        notes: notes || null,
      },
      include: {
        bom: {
          include: {
            finishedProduct: true,
            items: { include: { product: true } },
          },
        },
      },
    });

    logger.info(`Work Order ${orderNumber} created for BOM: ${bom.name}`);
    return res.status(201).json({ success: true, data: workOrder });
  } catch (error: any) {
    logger.error('Error creating work order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a Work Order
 */
export const updateWorkOrder = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { plannedQty, startDate, dueDate, priority, assignedTo, notes } = req.body;

    const existing = await prisma.workOrder.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only update pending work orders',
      });
    }

    const workOrder = await prisma.workOrder.update({
      where: { id , companyId: req.user.companyId },
      data: {
        plannedQty: plannedQty !== undefined ? parseInt(plannedQty) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        assignedTo,
        notes,
      },
      include: {
        bom: {
          include: {
            finishedProduct: true,
            items: { include: { product: true } },
          },
        },
      },
    });

    return res.json({ success: true, data: workOrder });
  } catch (error: any) {
    logger.error('Error updating work order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a Work Order
 */
export const deleteWorkOrder = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    if (workOrder.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete pending work orders',
      });
    }

    // Delete related records first
    await prisma.jobCard.deleteMany({ where: { workOrderId: id } });
    await prisma.workOrder.delete({ where: { id , companyId: req.user.companyId } });

    return res.json({ success: true, message: 'Work Order deleted' });
  } catch (error: any) {
    logger.error('Error deleting work order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Start a Work Order
 */
export const startWorkOrder = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        bom: {
          include: {
            finishedProduct: true,
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    if (workOrder.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Work Order cannot be started. Current status: ' + workOrder.status,
      });
    }

    // Check material availability based on BOM items
    for (const item of workOrder.bom.items) {
      const requiredQty = Number(item.quantity) * workOrder.plannedQty;
      const product = item.product;

      if (product.currentStock < requiredQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Required: ${requiredQty}, Available: ${product.currentStock}`,
        });
      }
    }

    const updated = await prisma.workOrder.update({
      where: { id , companyId: req.user.companyId },
      data: {
        status: 'IN_PROGRESS',
        startDate: workOrder.startDate || new Date(),
      },
      include: {
        bom: {
          include: {
            finishedProduct: true,
            items: { include: { product: true } },
          },
        },
        jobCards: true,
      },
    });

    logger.info(`Work Order ${workOrder.orderNumber} started`);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error starting work order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Complete a Work Order
 */
export const completeWorkOrder = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;
    const { completedQty, warehouseId } = req.body;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        bom: {
          include: {
            finishedProduct: true,
            items: { include: { product: true } },
          },
        },
        jobCards: true,
      },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Work Order is not in progress',
      });
    }

    // Check all job cards are completed (if any exist)
    if (workOrder.jobCards.length > 0) {
      const pendingJobs = workOrder.jobCards.filter(jc => jc.status !== 'COMPLETED');
      if (pendingJobs.length > 0) {
        return res.status(400).json({
          success: false,
          message: `${pendingJobs.length} job cards are still pending`,
        });
      }
    }

    const finalCompletedQty = completedQty || workOrder.plannedQty;
    const finishedProduct = workOrder.bom.finishedProduct;

    // Get current stock for finished product
    const currentStock = finishedProduct.currentStock;

    // Create stock entry for finished goods (production in)
    await prisma.stockMovement.create({
      data: {
        companyId,
        productId: finishedProduct.id,
        warehouseId: warehouseId || null,
        quantity: finalCompletedQty,
        previousStock: currentStock,
        newStock: currentStock + finalCompletedQty,
        type: 'PRODUCTION_IN',
        reference: workOrder.orderNumber,
        reason: `Completed Work Order ${workOrder.orderNumber}`,
        createdBy: userId,
      },
    });

    // Update finished product stock
    await prisma.product.update({
      where: { id: finishedProduct.id , companyId: req.user.companyId },
      data: { currentStock: currentStock + finalCompletedQty },
    });

    // Consume materials based on BOM items
    for (const item of workOrder.bom.items) {
      const consumedQty = Math.ceil(Number(item.quantity) * finalCompletedQty / Number(workOrder.bom.outputQuantity));
      const rawMaterial = item.product;
      const materialCurrentStock = rawMaterial.currentStock;

      await prisma.stockMovement.create({
        data: {
          companyId,
          productId: item.productId,
          warehouseId: warehouseId || null,
          quantity: -consumedQty,
          previousStock: materialCurrentStock,
          newStock: Math.max(0, materialCurrentStock - consumedQty),
          type: 'PRODUCTION_OUT',
          reference: workOrder.orderNumber,
          reason: `Material consumed for Work Order ${workOrder.orderNumber}`,
          createdBy: userId,
        },
      });

      // Update raw material stock
      await prisma.product.update({
        where: { id: item.productId , companyId: req.user.companyId },
        data: { currentStock: Math.max(0, materialCurrentStock - consumedQty) },
      });
    }

    const updated = await prisma.workOrder.update({
      where: { id , companyId: req.user.companyId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedQty: finalCompletedQty,
      },
      include: {
        bom: {
          include: {
            finishedProduct: true,
            items: { include: { product: true } },
          },
        },
        jobCards: true,
      },
    });

    logger.info(`Work Order ${workOrder.orderNumber} completed. Produced: ${finalCompletedQty}`);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error completing work order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update completed quantity (partial completion)
 */
export const updateCompletedQty = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { additionalQty } = req.body;

    if (!additionalQty || additionalQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional quantity must be greater than 0',
      });
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Work Order is not in progress',
      });
    }

    const newCompletedQty = workOrder.completedQty + parseInt(additionalQty);
    if (newCompletedQty > workOrder.plannedQty) {
      return res.status(400).json({
        success: false,
        message: `Cannot exceed planned quantity. Planned: ${workOrder.plannedQty}, Current completed: ${workOrder.completedQty}`,
      });
    }

    const updated = await prisma.workOrder.update({
      where: { id , companyId: req.user.companyId },
      data: {
        completedQty: newCompletedQty,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error updating completed quantity:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel a Work Order
 */
export const cancelWorkOrder = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { reason } = req.body;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    if (workOrder.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed work order',
      });
    }

    const updated = await prisma.workOrder.update({
      where: { id , companyId: req.user.companyId },
      data: {
        status: 'CANCELLED',
        notes: workOrder.notes
          ? `${workOrder.notes}\nCancellation: ${reason || 'No reason provided'}`
          : `Cancellation: ${reason || 'No reason provided'}`,
      },
    });

    // Cancel any pending job cards
    await prisma.jobCard.updateMany({
      where: {
        workOrderId: id,
        status: { in: ['PENDING', 'WORK_IN_PROGRESS'] },
      },
      data: {
        status: 'ON_HOLD',
      },
    });

    logger.info(`Work Order ${workOrder.orderNumber} cancelled`);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error cancelling work order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get material requirements for a work order
 * This calculates requirements based on the BOM items
 */
export const getMaterialRequirements = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
      include: {
        bom: {
          include: {
            finishedProduct: true,
            items: {
              include: {
                product: true, // Raw material
              },
            },
          },
        },
      },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    // Calculate requirements based on BOM items and planned quantity
    const requirements = workOrder.bom.items.map(item => {
      const requiredQty = Number(item.quantity) * workOrder.plannedQty / Number(workOrder.bom.outputQuantity);
      const available = item.product.currentStock;

      return {
        materialId: item.productId,
        materialName: item.product.name,
        materialCode: item.product.code,
        unit: item.unit || item.product.unit,
        required: Math.ceil(requiredQty),
        available,
        shortage: Math.max(0, Math.ceil(requiredQty) - available),
        sufficient: available >= Math.ceil(requiredQty),
      };
    });

    // Also include finished product info
    const finishedProductInfo = {
      productId: workOrder.bom.finishedProductId,
      productName: workOrder.bom.finishedProduct.name,
      productCode: workOrder.bom.finishedProduct.code,
      plannedQty: workOrder.plannedQty,
      completedQty: workOrder.completedQty,
      bomOutputQty: Number(workOrder.bom.outputQuantity),
    };

    return res.json({
      success: true,
      data: {
        workOrder: {
          id: workOrder.id,
          orderNumber: workOrder.orderNumber,
          status: workOrder.status,
        },
        finishedProduct: finishedProductInfo,
        materials: requirements,
        allMaterialsAvailable: requirements.every(r => r.sufficient),
      },
    });
  } catch (error: any) {
    logger.error('Error getting material requirements:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create job cards for a work order based on BOM or manual input
 */
export const createJobCards = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { operations } = req.body;

    const workOrder = await prisma.workOrder.findFirst({
      where: { id, companyId },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Operations array is required',
      });
    }

    // Generate job card numbers
    const existingCount = await prisma.jobCard.count({ where: { companyId } });

    const jobCards = await Promise.all(
      operations.map(async (op: any, index: number) => {
        const jobCardNumber = `JC-${String(existingCount + index + 1).padStart(6, '0')}`;

        return prisma.jobCard.create({
          data: {
            companyId,
            jobCardNumber,
            workOrderId: id,
            operationName: op.operationName,
            operationSequence: op.sequence || index + 1,
            workstation: op.workstation || null,
            forQuantity: workOrder.plannedQty,
            completedQty: 0,
            rejectedQty: 0,
            status: 'PENDING',
            employeeId: op.employeeId || null,
            employeeName: op.employeeName || null,
            plannedStartTime: op.plannedStartTime ? new Date(op.plannedStartTime) : null,
            plannedEndTime: op.plannedEndTime ? new Date(op.plannedEndTime) : null,
            remarks: op.notes || op.remarks || null,
          },
        });
      })
    );

    return res.status(201).json({ success: true, data: jobCards });
  } catch (error: any) {
    logger.error('Error creating job cards:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get work order statistics/summary
 */
export const getWorkOrderStats = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;

    const [statusCounts, priorityCounts, recentOrders] = await Promise.all([
      // Count by status
      prisma.workOrder.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
      }),
      // Count by priority
      prisma.workOrder.groupBy({
        by: ['priority'],
        where: { companyId },
        _count: { id: true },
      }),
      // Recent work orders
      prisma.workOrder.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          bom: {
            include: {
              finishedProduct: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach(s => {
      statusMap[s.status] = s._count.id;
    });

    const priorityMap: Record<string, number> = {};
    priorityCounts.forEach(p => {
      priorityMap[p.priority] = p._count.id;
    });

    return res.json({
      success: true,
      data: {
        byStatus: {
          pending: statusMap['PENDING'] || 0,
          inProgress: statusMap['IN_PROGRESS'] || 0,
          completed: statusMap['COMPLETED'] || 0,
          cancelled: statusMap['CANCELLED'] || 0,
        },
        byPriority: {
          low: priorityMap['LOW'] || 0,
          medium: priorityMap['MEDIUM'] || 0,
          high: priorityMap['HIGH'] || 0,
          urgent: priorityMap['URGENT'] || 0,
        },
        total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        recentOrders: recentOrders.map(wo => ({
          id: wo.id,
          orderNumber: wo.orderNumber,
          productName: wo.bom.finishedProduct.name,
          plannedQty: wo.plannedQty,
          completedQty: wo.completedQty,
          status: wo.status,
          priority: wo.priority,
          dueDate: wo.dueDate,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Error getting work order stats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  updateCompletedQty,
  cancelWorkOrder,
  getMaterialRequirements,
  createJobCards,
  getWorkOrderStats,
};
