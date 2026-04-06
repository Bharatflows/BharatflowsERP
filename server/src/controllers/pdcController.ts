/**
 * Post-Dated Cheque (PDC) Controller
 * 
 * Handles PDC management for cheque payments with future maturity dates.
 * Part of Phase-0 Ledger Engine Refinement.
 */

import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import eventBus, { EventTypes } from '../services/eventBus';
import { AuditService } from '../services/auditService';  // H6: Audit logging for PDC operations
import { statusEngine } from '../services/status/statusEngine';

// @desc    Get all PDCs
// @route   GET /api/v1/banking/pdcs
// @access  Private
export const getPDCs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { status, type, upcoming } = req.query;

        const where: any = { companyId };

        if (status) where.status = String(status).toUpperCase();
        if (type) where.type = String(type).toUpperCase();

        // Filter for upcoming (maturing within next 7 days)
        if (upcoming === 'true') {
            const now = new Date();
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            where.maturityDate = { gte: now, lte: nextWeek };
            where.status = 'PENDING';
        }

        const pdcs = await prisma.postDatedCheque.findMany({
            where,
            include: {
                party: { select: { name: true, type: true } }
            },
            orderBy: { maturityDate: 'asc' }
        });

        res.json({
            success: true,
            count: pdcs.length,
            data: pdcs
        });
    } catch (error: any) {
        console.error('Get PDCs error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching PDCs'
        });
    }
};

// @desc    Get single PDC
// @route   GET /api/v1/banking/pdcs/:id
// @access  Private
export const getPDC = async (req: AuthRequest, res: Response) => {
    try {
        const pdc = await prisma.postDatedCheque.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            },
            include: {
                party: true
            }
        });

        if (!pdc) {
            return res.status(404).json({
                success: false,
                message: 'PDC not found'
            });
        }

        return res.json({
            success: true,
            data: pdc
        });
    } catch (error: any) {
        console.error('Get PDC error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching PDC'
        });
    }
};

// @desc    Create PDC
// @route   POST /api/v1/banking/pdcs
// @access  Private
export const createPDC = async (req: AuthRequest, res: Response) => {
    try {
        const {
            chequeNumber,
            bankName,
            branchName,
            amount,
            issuedDate,
            maturityDate,
            type,
            partyId,
            invoiceId,
            billId,
            reminderDays
        } = req.body;

        const companyId = req.user.companyId;

        // Validate required fields
        if (!chequeNumber || !bankName || !amount || !maturityDate || !type || !partyId) {
            return res.status(400).json({
                success: false,
                message: 'Cheque number, bank name, amount, maturity date, type, and party are required'
            });
        }

        // Validate type
        if (!['RECEIVED', 'ISSUED'].includes(type.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Type must be RECEIVED or ISSUED'
            });
        }

        const pdc = await prisma.postDatedCheque.create({
            data: {
                companyId,
                chequeNumber,
                bankName,
                branchName,
                amount: Number(amount),
                issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
                maturityDate: new Date(maturityDate),
                type: type.toUpperCase(),
                partyId,
                invoiceId,
                billId,
                reminderDays: reminderDays || 3,
                createdBy: req.user.id
            },
            include: {
                party: { select: { name: true } }
            }
        });

        // Emit domain event
        try {
            await eventBus.emit({
                companyId,
                eventType: EventTypes.PDC_CREATED,
                aggregateType: 'PostDatedCheque',
                aggregateId: pdc.id,
                payload: {
                    pdcId: pdc.id,
                    chequeNumber: pdc.chequeNumber,
                    amount: Number(pdc.amount),
                    maturityDate: pdc.maturityDate.toISOString(),
                    type: pdc.type,
                    partyId: pdc.partyId
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            });
        } catch (eventError) {
            console.warn('Failed to emit PDC_CREATED event:', eventError);
        }

        // H6 FIX: Audit log for PDC creation
        await AuditService.logChange(
            companyId,
            req.user.id,
            'PDC',
            pdc.id,
            'CREATE',
            null,
            pdc,
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'BANKING'
        );

        return res.status(201).json({
            success: true,
            data: pdc
        });
    } catch (error: any) {
        console.error('Create PDC error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating PDC'
        });
    }
};

// @desc    Mark PDC as deposited
// @route   POST /api/v1/banking/pdcs/:id/deposit
// @access  Private
export const depositPDC = async (req: AuthRequest, res: Response) => {
    try {
        const pdc = await prisma.postDatedCheque.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!pdc) {
            return res.status(404).json({
                success: false,
                message: 'PDC not found'
            });
        }

        // Validate transition via StatusEngine
        const validation = statusEngine.validateTransition('BANKING', pdc, 'DEPOSITED');
        if (!validation.allowed) {
            return res.status(400).json({
                success: false,
                message: validation.reason || `Cannot deposit PDC with status: ${pdc.status}`
            });
        }

        const updatedPDC = await prisma.postDatedCheque.update({
            where: { id: pdc.id , companyId: req.user.companyId },
            data: {
                status: 'DEPOSITED',
                depositedAt: new Date()
            }
        });

        // Emit event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.PDC_DEPOSITED,
            aggregateType: 'PostDatedCheque',
            aggregateId: pdc.id,
            payload: { pdcId: pdc.id, depositedAt: new Date().toISOString() },
            metadata: { userId: req.user.id, source: 'api' }
        });

        // H6 FIX: Audit log for PDC deposit
        await AuditService.logChange(
            req.user.companyId,
            req.user.id,
            'PDC',
            pdc.id,
            'UPDATE',
            { status: pdc.status },
            { status: 'DEPOSITED', depositedAt: new Date() },
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'BANKING'
        );

        return res.json({
            success: true,
            data: updatedPDC
        });
    } catch (error: any) {
        console.error('Deposit PDC error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error depositing PDC'
        });
    }
};

// @desc    Mark PDC as cleared (creates ledger entry)
// @route   POST /api/v1/banking/pdcs/:id/clear
// @access  Private
export const clearPDC = async (req: AuthRequest, res: Response) => {
    try {
        const pdc = await prisma.postDatedCheque.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!pdc) {
            return res.status(404).json({
                success: false,
                message: 'PDC not found'
            });
        }

        // Validate transition via StatusEngine
        const validation = statusEngine.validateTransition('BANKING', pdc, 'CLEARED');
        if (!validation.allowed) {
            return res.status(400).json({
                success: false,
                message: validation.reason || `PDC must be DEPOSITED before clearing. Current status: ${pdc.status}`
            });
        }

        const updatedPDC = await prisma.postDatedCheque.update({
            where: { id: pdc.id , companyId: req.user.companyId },
            data: {
                status: 'CLEARED',
                clearedAt: new Date()
            }
        });

        // Emit event for ledger posting
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.PDC_CLEARED,
            aggregateType: 'PostDatedCheque',
            aggregateId: pdc.id,
            payload: {
                pdcId: pdc.id,
                amount: Number(pdc.amount),
                type: pdc.type,
                partyId: pdc.partyId,
                clearedAt: new Date().toISOString()
            },
            metadata: { userId: req.user.id, source: 'api' }
        });

        // H6 FIX: Audit log for PDC clear
        await AuditService.logChange(
            req.user.companyId,
            req.user.id,
            'PDC',
            pdc.id,
            'UPDATE',
            { status: pdc.status },
            { status: 'CLEARED', clearedAt: new Date(), amount: Number(pdc.amount) },
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'BANKING'
        );

        return res.json({
            success: true,
            data: updatedPDC,
            message: 'PDC cleared. Ledger entry will be created via event.'
        });
    } catch (error: any) {
        console.error('Clear PDC error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error clearing PDC'
        });
    }
};

// @desc    Mark PDC as bounced
// @route   POST /api/v1/banking/pdcs/:id/bounce
// @access  Private
export const bouncePDC = async (req: AuthRequest, res: Response) => {
    try {
        const { reason } = req.body;

        const pdc = await prisma.postDatedCheque.findFirst({
            where: {
                id: req.params.id,
                companyId: req.user.companyId
            }
        });

        if (!pdc) {
            return res.status(404).json({
                success: false,
                message: 'PDC not found'
            });
        }

        const updatedPDC = await prisma.postDatedCheque.update({
            where: { id: pdc.id , companyId: req.user.companyId },
            data: {
                status: 'BOUNCED',
                bouncedAt: new Date(),
                bounceReason: reason || 'Insufficient funds'
            }
        });

        // Emit event
        await eventBus.emit({
            companyId: req.user.companyId,
            eventType: EventTypes.PDC_BOUNCED,
            aggregateType: 'PostDatedCheque',
            aggregateId: pdc.id,
            payload: {
                pdcId: pdc.id,
                reason: reason || 'Insufficient funds',
                partyId: pdc.partyId
            },
            metadata: { userId: req.user.id, source: 'api' }
        });

        // H6 FIX: Audit log for PDC bounce
        await AuditService.logChange(
            req.user.companyId,
            req.user.id,
            'PDC',
            pdc.id,
            'UPDATE',
            { status: pdc.status },
            { status: 'BOUNCED', bounceReason: reason || 'Insufficient funds' },
            req.ip,
            req.headers['user-agent'] || 'UNKNOWN',
            'BANKING'
        );

        return res.json({
            success: true,
            data: updatedPDC
        });
    } catch (error: any) {
        console.error('Bounce PDC error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error marking PDC as bounced'
        });
    }
};

// @desc    Get PDC maturity reminders
// @route   GET /api/v1/banking/pdcs/reminders
// @access  Private
export const getPDCReminders = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const now = new Date();

        // Get all pending PDCs where maturity - reminderDays <= now
        const pdcs = await prisma.postDatedCheque.findMany({
            where: {
                companyId,
                status: 'PENDING'
            },
            include: {
                party: { select: { name: true, type: true, phone: true, email: true } }
            },
            orderBy: { maturityDate: 'asc' }
        });

        // Filter PDCs that are due for reminder
        const reminders = pdcs.filter(pdc => {
            const reminderDate = new Date(pdc.maturityDate);
            reminderDate.setDate(reminderDate.getDate() - pdc.reminderDays);
            return now >= reminderDate;
        });

        res.json({
            success: true,
            count: reminders.length,
            data: reminders.map(pdc => ({
                ...pdc,
                daysUntilMaturity: Math.ceil(
                    (pdc.maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
            }))
        });
    } catch (error: any) {
        console.error('Get PDC reminders error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching PDC reminders'
        });
    }
};
