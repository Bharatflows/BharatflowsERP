/**
 * Support Ticket Service
 * CRUD + assignment + status tracking for internal support tickets
 */
import prisma from '../config/prisma';
import logger from '../config/logger';

export class SupportTicketService {
    static async createTicket(data: {
        companyId: string;
        userId: string;
        subject: string;
        description: string;
        priority?: string;
        category?: string;
    }) {
        const count = await prisma.settingsAuditLog.count({ where: { companyId: data.companyId } });
        const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${(count + 1).toString().padStart(3, '0')}`;

        const ticket = await prisma.settingsAuditLog.create({
            data: {
                companyId: data.companyId,
                userId: data.userId,
                action: 'TICKET_CREATED',
                settingType: data.category || 'support',
                fieldName: ticketNumber,
                oldValue: JSON.stringify({
                    subject: data.subject,
                    description: data.description,
                    priority: data.priority || 'MEDIUM',
                    status: 'OPEN',
                    assignedTo: null,
                }),
                newValue: data.subject,
            },
        });

        logger.info(`[SupportTicket] Created ${ticketNumber}`);
        return { id: ticket.id, ticketNumber, ...data, status: 'OPEN' };
    }

    static async listTickets(companyId: string, filters?: { status?: string; priority?: string }) {
        const where: any = {
            companyId,
            action: { startsWith: 'TICKET_' },
        };

        const logs = await prisma.settingsAuditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: 100,
        });

        // Group by ticket number and get latest status
        const ticketMap = new Map<string, any>();
        for (const log of logs) {
            const ticketNum = log.fieldName;
            if (ticketNum && !ticketMap.has(ticketNum)) {
                const meta = JSON.parse(log.oldValue || '{}');
                ticketMap.set(ticketNum, {
                    id: log.id,
                    ticketNumber: ticketNum,
                    subject: meta.subject || log.newValue,
                    description: meta.description,
                    priority: meta.priority || 'MEDIUM',
                    status: meta.status || 'OPEN',
                    category: log.settingType,
                    createdAt: log.timestamp,
                    assignedTo: meta.assignedTo,
                });
            }
        }

        let tickets = Array.from(ticketMap.values());

        if (filters?.status) tickets = tickets.filter(t => t.status === filters.status);
        if (filters?.priority) tickets = tickets.filter(t => t.priority === filters.priority);

        return tickets;
    }

    static async updateTicketStatus(ticketId: string, companyId: string, status: string, userId: string) {
        const original = await prisma.settingsAuditLog.findUnique({ where: { id: ticketId } });
        if (!original) throw new Error('Ticket not found');

        const meta = JSON.parse(original.oldValue || '{}');
        meta.status = status;

        await prisma.settingsAuditLog.create({
            data: {
                companyId,
                userId,
                action: `TICKET_${status}`,
                settingType: original.settingType || '',
                fieldName: original.fieldName,
                oldValue: JSON.stringify(meta),
                newValue: `Status changed to ${status}`,
            },
        });

        return { ticketNumber: original.fieldName, status };
    }

    static async assignTicket(ticketId: string, companyId: string, assigneeId: string, userId: string) {
        const original = await prisma.settingsAuditLog.findUnique({ where: { id: ticketId } });
        if (!original) throw new Error('Ticket not found');

        const meta = JSON.parse(original.oldValue || '{}');
        meta.assignedTo = assigneeId;
        meta.status = 'IN_PROGRESS';

        await prisma.settingsAuditLog.create({
            data: {
                companyId,
                userId,
                action: 'TICKET_ASSIGNED',
                settingType: original.settingType || '',
                fieldName: original.fieldName,
                oldValue: JSON.stringify(meta),
                newValue: `Assigned to ${assigneeId}`,
            },
        });

        return { ticketNumber: original.fieldName, assignedTo: assigneeId, status: 'IN_PROGRESS' };
    }
}
