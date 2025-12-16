import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// LEAD MANAGEMENT

export const createLead = async (req: AuthRequest, res: Response) => {
    try {
        const { firstName, lastName, email, phone, companyName, source, notes } = req.body;
        const companyId = req.user!.companyId;

        const lead = await prisma.lead.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                companyName,
                source,
                notes,
                companyId
            }
        });

        res.status(201).json({ success: true, data: lead });
    } catch (error: any) {
        console.error('Create lead error:', error);
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
        res.json({ success: true, data: leads });
    } catch (error: any) {
        console.error('Get leads error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLeadStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // NEW, CONTACTED, QUALIFIED, LOST, WON
        const companyId = req.user!.companyId;

        const lead = await prisma.lead.updateMany({
            where: { id, companyId },
            data: { status }
        });

        if (lead.count === 0) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }

        res.json({ success: true, message: 'Lead status updated' });
    } catch (error: any) {
        console.error('Update lead status error:', error);
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
        console.error('Add activity error:', error);
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
        console.error('Get activities error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
