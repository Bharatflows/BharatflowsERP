import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import eventBus, { EventTypes } from '../services/eventBus';
import logger from '../config/logger';

// LEAD MANAGEMENT

export const createLead = async (req: AuthRequest, res: Response) => {
    try {
        const { name, firstName, lastName, email, phone, company, companyName, source, status, value, notes } = req.body;
        const companyId = req.user!.companyId;

        // Support both name formats (name or firstName/lastName)
        const leadName = name || `${firstName || ''} ${lastName || ''}`.trim();

        const lead = await prisma.lead.create({
            data: {
                firstName: leadName,
                lastName: lastName || null,
                email,
                phone,
                companyName: company || companyName,
                source,
                status: status || 'NEW',
                notes,
                companyId
            }
        });

        // --- ENHANCEMENT: CRM Auto-Followups ---
        const followUpIntervals = [3, 7, 15];
        try {
            const userId = req.user!.id;
            for (const days of followUpIntervals) {
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + days);

                await prisma.activity.create({
                    data: {
                        companyId,
                        leadId: lead.id,
                        type: 'CRM',
                        subject: `Follow-up (${days} Days): ${lead.firstName}`,
                        description: `Scheduled auto-followup for new lead ${lead.firstName}.`,
                        date: followUpDate,
                        priority: days <= 3 ? 'HIGH' : 'MEDIUM',
                        isCompleted: false,
                        createdBy: userId
                    }
                });
            }
        } catch (followUpError) {
            logger.error('Failed to create lead follow-up tasks:', followUpError);
            // Don't fail the lead creation
        }

        // Emit LEAD_CREATED event
        try {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.LEAD_CREATED,
                aggregateType: 'Lead',
                aggregateId: lead.id,
                payload: {
                    leadId: lead.id,
                    name: lead.firstName,
                    email: lead.email,
                    source: lead.source,
                    status: lead.status
                },
                metadata: { userId: req.user!.id, source: 'api' }
            });
        } catch (eventError) {
            logger.warn('Failed to emit LEAD_CREATED event:', eventError);
        }

        // Transform response to match frontend expectations
        res.status(201).json({
            success: true,
            data: {
                ...lead,
                name: lead.firstName,
                company: lead.companyName
            }
        });
    } catch (error: any) {
        logger.error('Create lead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLeads = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const leads = await prisma.lead.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { activities: true } } }
        });

        // Transform to match frontend expectations
        const transformedLeads = leads.map(lead => ({
            ...lead,
            name: lead.firstName,
            company: lead.companyName
        }));

        res.json({ success: true, data: transformedLeads });
    } catch (error: any) {
        logger.error('Get leads error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const lead = await prisma.lead.findFirst({
            where: { id, companyId },
            include: {
                activities: {
                    orderBy: { date: 'desc' },
                    take: 20
                }
            }
        });

        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }

        res.json({
            success: true,
            data: {
                ...lead,
                name: lead.firstName,
                company: lead.companyName
            }
        });
    } catch (error: any) {
        logger.error('Get lead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, firstName, lastName, email, phone, company, companyName, source, status, value, notes } = req.body;
        const companyId = req.user!.companyId;

        // Verify ownership
        const existing = await prisma.lead.findFirst({ where: { id, companyId } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }

        const leadName = name || firstName || existing.firstName;

        const lead = await prisma.lead.update({
            where: { id },
            data: {
                firstName: leadName,
                lastName: lastName ?? existing.lastName,
                email: email ?? existing.email,
                phone: phone ?? existing.phone,
                companyName: company || companyName || existing.companyName,
                source: source ?? existing.source,
                status: status ?? existing.status,
                notes: notes ?? existing.notes
            }
        });

        // Emit LEAD_UPDATED event
        try {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.LEAD_UPDATED,
                aggregateType: 'Lead',
                aggregateId: lead.id,
                payload: {
                    leadId: lead.id,
                    name: lead.firstName,
                    status: lead.status
                },
                metadata: { userId: req.user!.id, source: 'api' }
            });
        } catch (eventError) {
            logger.warn('Failed to emit LEAD_UPDATED event:', eventError);
        }

        res.json({
            success: true,
            data: {
                ...lead,
                name: lead.firstName,
                company: lead.companyName
            }
        });
    } catch (error: any) {
        logger.error('Update lead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLeadStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST
        const companyId = req.user!.companyId;

        const lead = await prisma.lead.updateMany({
            where: { id, companyId },
            data: { status }
        });

        if (lead.count === 0) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }

        // Emit LEAD_STATUS_CHANGED event
        try {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.LEAD_STATUS_CHANGED,
                aggregateType: 'Lead',
                aggregateId: id,
                payload: {
                    leadId: id,
                    newStatus: status
                },
                metadata: { userId: req.user!.id, source: 'api' }
            });
        } catch (eventError) {
            logger.warn('Failed to emit LEAD_STATUS_CHANGED event:', eventError);
        }

        res.json({ success: true, message: 'Lead status updated' });
    } catch (error: any) {
        logger.error('Update lead status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const existing = await prisma.lead.findFirst({ where: { id, companyId } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }

        // Delete associated activities first
        await prisma.activity.deleteMany({ where: { leadId: id } });

        await prisma.lead.delete({ where: { id } });
        res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (error: any) {
        logger.error('Delete lead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ACTIVITY LOGGING

export const addActivity = async (req: AuthRequest, res: Response) => {
    try {
        const { type, subject, description, leadId, partyId } = req.body;
        const companyId = req.user!.companyId;
        const userId = req.user!.id;

        const activity = await prisma.activity.create({
            data: {
                type, // CALL, MEETING, EMAIL, NOTE
                subject,
                description,
                leadId,
                partyId,
                companyId,
                createdBy: userId
            }
        });

        res.status(201).json({ success: true, data: activity });
    } catch (error: any) {
        logger.error('Add activity error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getActivities = async (req: AuthRequest, res: Response) => {
    try {
        const { leadId, partyId } = req.query;
        const companyId = req.user!.companyId;

        const where: any = { companyId };
        if (leadId) where.leadId = leadId as string;
        if (partyId) where.partyId = partyId as string;

        const activities = await prisma.activity.findMany({
            where,
            orderBy: { date: 'desc' }
        });

        res.json({ success: true, data: activities });
    } catch (error: any) {
        logger.error('Get activities error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DASHBOARD

export const getDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        // Get lead counts by status
        const leadStats = await prisma.lead.groupBy({
            by: ['status'],
            where: { companyId },
            _count: { id: true }
        });

        const statusCounts: Record<string, number> = {};
        leadStats.forEach(stat => {
            statusCounts[stat.status] = stat._count.id;
        });

        const totalLeads = Object.values(statusCounts).reduce((a, b) => a + b, 0);

        // Activities count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivities = await prisma.activity.count({
            where: {
                companyId,
                date: { gte: thirtyDaysAgo }
            }
        });

        // Lead Source Breakdown
        const sourceStats = await prisma.lead.groupBy({
            by: ['source'],
            where: { companyId },
            _count: { id: true }
        });

        const sourceBreakdown = sourceStats.map(stat => ({
            name: stat.source || 'Unknown',
            value: stat._count.id
        }));

        // Today's follow-ups (activities scheduled for today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayFollowups = await prisma.activity.count({
            where: {
                companyId,
                date: { gte: today, lt: tomorrow }
            }
        });

        // Recent activities list
        const recentActivityList = await prisma.activity.findMany({
            where: { companyId },
            include: {
                lead: { select: { firstName: true, companyName: true } },
                party: { select: { name: true } }
            },
            orderBy: { date: 'desc' },
            take: 10
        });

        // Conversion rate (WON / total leads)
        const wonLeads = statusCounts['WON'] || 0;
        const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

        res.json({
            success: true,
            data: {
                kpis: {
                    totalLeads,
                    newLeads: statusCounts['NEW'] || 0,
                    qualifiedLeads: statusCounts['QUALIFIED'] || 0,
                    wonLeads,
                    lostLeads: statusCounts['LOST'] || 0,
                    conversionRate: parseFloat(conversionRate),
                    todayFollowups,
                    recentActivities
                },
                statusBreakdown: statusCounts,
                sourceBreakdown,
                recentActivities: recentActivityList.map(act => ({
                    id: act.id,
                    type: act.type,
                    subject: act.subject,
                    leadName: act.lead?.firstName || act.party?.name || 'Unknown',
                    date: act.date
                }))
            }
        });
    } catch (error: any) {
        logger.error('Get CRM Dashboard error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getSalesFunnel = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        const funnelStats = await prisma.lead.groupBy({
            by: ['status'],
            where: { companyId },
            _count: { id: true }
        });

        // Map statuses to funnel stages
        const stages = [
            { stage: 'NEW', label: 'New Leads' },
            { stage: 'CONTACTED', label: 'Contacted' },
            { stage: 'QUALIFIED', label: 'Qualified' },
            { stage: 'PROPOSAL', label: 'Proposal Sent' },
            { stage: 'NEGOTIATION', label: 'Negotiation' },
            { stage: 'WON', label: 'Closed Won' }
        ];

        const funnelData = stages.map(s => {
            const stat = funnelStats.find(fs => fs.status === s.stage);
            return {
                stage: s.label,
                count: stat ? stat._count.id : 0
            };
        });

        res.json({ success: true, data: funnelData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// CUSTOMER SCORING
export const recalculateScore = async (req: AuthRequest, res: Response) => {
    try {
        const { CRMService } = await import('../services/crmService');
        const { customerId } = req.params;
        const companyId = req.user!.companyId;

        const score = await CRMService.calculateCustomerScore(companyId, customerId);

        res.json({ success: true, data: { creditScore: score } });
    } catch (error: any) {
        logger.error('Recalculate Score error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

