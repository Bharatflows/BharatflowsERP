import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all activities for a company, potentially filtered by date range or type
 */
export const getCalendarActivities = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const { start, end, type, createdBy } = req.query;

        const where: any = { companyId };

        if (createdBy === 'true') {
            where.createdBy = userId;
        }

        if (start && end) {
            where.date = {
                gte: new Date(start as string),
                lte: new Date(end as string),
            };
        } else if (start) {
            where.date = {
                gte: new Date(start as string),
            };
        }

        if (type) {
            where.type = type as string;
        }

        const activities = await prisma.activity.findMany({
            where,
            include: {
                lead: { select: { firstName: true, companyName: true } },
                party: { select: { name: true } }
            },
            orderBy: { date: 'asc' }
        });

        // --- ENHANCEMENT: Smart Reminders ---
        const smartActivities: any[] = [...activities];

        // 1. Overdue Invoices (Show on their Due Date)
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                companyId,
                balanceAmount: { gt: 0 },
                dueDate: start && end ? {
                    gte: new Date(start as string),
                    lte: new Date(end as string),
                } : { lt: new Date() }
            },
            include: { customer: { select: { name: true } } }
        });

        overdueInvoices.forEach(inv => {
            smartActivities.push({
                id: `inv-${inv.id}`,
                type: 'INVOICE',
                subject: `Overdue: Invoice #${inv.invoiceNumber}`,
                description: `Payment of ₹${inv.balanceAmount} is pending from ${inv.customer.name}`,
                date: inv.dueDate,
                priority: 'HIGH',
                isCompleted: false,
                party: inv.customer
            });
        });

        // 2. Low Stock Alerts (Show only if viewing "Today")
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const isViewingToday = !start || (new Date(start as string) <= endOfToday && (!end || new Date(end as string) >= startOfToday));

        if (isViewingToday) {
            const lowStockProducts = await prisma.product.findMany({
                where: {
                    companyId,
                    trackInventory: true,
                    currentStock: { lte: prisma.product.fields.reorderLevel as any } // Prisma doesn't support field vs field directly easily in where? 
                    // Actually, simple way: fetch all and filter or use raw if needed. 
                    // Safer: fetch products where currentStock <= reorderLevel
                }
            });

            // Note: Prisma 5.x supports field comparison with `prisma.product.fields`.
            // If not, we fetch and filter since it's usually a small set.

            lowStockProducts.filter(p => p.currentStock <= p.reorderLevel).forEach(p => {
                smartActivities.push({
                    id: `stock-${p.id}`,
                    type: 'INVENTORY',
                    subject: `Low Stock: ${p.name}`,
                    description: `Only ${p.currentStock} ${p.unit} left. Reorder level is ${p.reorderLevel}.`,
                    date: new Date(),
                    priority: 'MEDIUM',
                    isCompleted: false,
                });
            });
        }

        // 3. Work Orders (Production Planning)
        const workOrders = await prisma.workOrder.findMany({
            where: {
                companyId,
                status: { not: 'COMPLETED' },
                dueDate: start && end ? {
                    gte: new Date(start as string),
                    lte: new Date(end as string),
                } : { gte: new Date() }
            },
            include: {
                bom: {
                    include: {
                        finishedProduct: { select: { name: true } }
                    }
                }
            }
        });

        workOrders.forEach(wo => {
            smartActivities.push({
                id: `wo-${wo.id}`,
                type: 'PRODUCTION',
                subject: `Production: ${wo.orderNumber}`,
                description: `Work Order for ${wo.plannedQty} units of ${wo.bom.finishedProduct.name}. Status: ${wo.status}`,
                date: wo.dueDate,
                priority: wo.status === 'IN_PROGRESS' ? 'HIGH' : 'MEDIUM',
                isCompleted: false,
            });
        });

        // 4. Post-Dated Cheques (PDC Maturity Reminders)
        const pdcs = await prisma.postDatedCheque.findMany({
            where: {
                companyId,
                status: 'PENDING',
                maturityDate: start && end ? {
                    gte: new Date(start as string),
                    lte: new Date(end as string),
                } : { gte: new Date() }
            },
            include: { party: { select: { name: true } } }
        });

        pdcs.forEach(pdc => {
            smartActivities.push({
                id: `pdc-${pdc.id}`,
                type: 'CHEQUE',
                subject: `PDC Maturity: #${pdc.chequeNumber}`,
                description: `Cheque from ${pdc.party.name} for ₹${pdc.amount} is due today.`,
                date: pdc.maturityDate,
                priority: 'HIGH',
                isCompleted: false,
                party: pdc.party
            });
        });

        // 5. Equipment Maintenance
        const maintenance = await prisma.maintenanceSchedule.findMany({
            where: {
                companyId,
                status: { not: 'COMPLETED' },
                scheduledDate: start && end ? {
                    gte: new Date(start as string),
                    lte: new Date(end as string),
                } : { gte: new Date() }
            },
            include: { product: { select: { name: true } } }
        });

        maintenance.forEach(m => {
            smartActivities.push({
                id: `maint-${m.id}`,
                type: 'MAINTENANCE',
                subject: `Service: ${m.title}`,
                description: `${m.description || 'Routine maintenance'} for ${m.product?.name || 'Equipment'}.`,
                date: m.scheduledDate,
                priority: m.priority,
                isCompleted: false,
            });
        });

        res.json({ success: true, data: smartActivities });
        return;
    } catch (error: any) {
        console.error('Get calendar activities error:', error);
        res.status(500).json({ success: false, message: error.message });
        return;
    }
};

/**
 * Create a new task (manually)
 */
export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const { subject, description, date, priority, leadId, partyId } = req.body;

        const task = await prisma.activity.create({
            data: {
                type: 'TASK',
                subject,
                description,
                date: date ? new Date(date) : new Date(),
                priority: priority || 'MEDIUM',
                isCompleted: false,
                leadId,
                partyId,
                companyId,
                createdBy: userId
            }
        });

        res.status(201).json({ success: true, data: task });
        return;
    } catch (error: any) {
        console.error('Create task error:', error);
        res.status(500).json({ success: false, message: error.message });
        return;
    }
};

/**
 * Update task status (completed/pending) or other fields
 */
export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;
        const { isCompleted, priority, subject, description, date } = req.body;

        if (date) {
            const newDate = new Date(date);
            if (id.startsWith('inv-')) {
                const invId = id.replace('inv-', '');
                await prisma.invoice.update({ where: { id: invId, companyId }, data: { dueDate: newDate } });
                return res.json({ success: true, message: 'Invoice rescheduled' });
            }
            if (id.startsWith('pdc-')) {
                const pdcId = id.replace('pdc-', '');
                await prisma.postDatedCheque.update({ where: { id: pdcId, companyId }, data: { maturityDate: newDate } });
                return res.json({ success: true, message: 'PDC rescheduled' });
            }
            if (id.startsWith('maint-')) {
                const maintId = id.replace('maint-', '');
                await prisma.maintenanceSchedule.update({ where: { id: maintId, companyId }, data: { scheduledDate: newDate } });
                return res.json({ success: true, message: 'Maintenance rescheduled' });
            }
            if (id.startsWith('wo-')) {
                const woId = id.replace('wo-', '');
                await prisma.workOrder.update({ where: { id: woId, companyId }, data: { dueDate: newDate } });
                return res.json({ success: true, message: 'Work Order rescheduled' });
            }
        }

        const activity = await prisma.activity.findFirst({
            where: { id, companyId }
        });

        if (!activity) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const updated = await prisma.activity.update({
            where: { id },
            data: {
                isCompleted: isCompleted !== undefined ? isCompleted : activity.isCompleted,
                priority: priority || activity.priority,
                subject: subject || activity.subject,
                description: description !== undefined ? description : activity.description,
                date: date ? new Date(date) : activity.date
            }
        });

        res.json({ success: true, data: updated });
        return;
    } catch (error: any) {
        console.error('Update task error:', error);
        res.status(500).json({ success: false, message: error.message });
        return;
    }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;

        const activity = await prisma.activity.findFirst({
            where: { id, companyId }
        });

        if (!activity) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await prisma.activity.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Task deleted successfully' });
        return;
    } catch (error: any) {
        console.error('Delete task error:', error);
        res.status(500).json({ success: false, message: error.message });
        return;
    }
};
