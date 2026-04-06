/**
 * Financial Year Controller
 * 
 * P0: Handles financial year management and period locking
 * Prevents transactions outside open financial years
 */

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuditService } from '../services/auditService';

interface AuthRequest extends Request {
    user?: { id: string; companyId: string; role: string };
}

/**
 * @desc    Get all financial years for company
 * @route   GET /api/v1/financial-years
 * @access  Private
 */
export const getFinancialYears = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        const financialYears = await prisma.financialYear.findMany({
            where: { companyId },
            orderBy: { startDate: 'desc' }
        });

        return res.json({
            success: true,
            data: financialYears
        });
    } catch (error: any) {
        console.error('Get financial years error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching financial years'
        });
    }
};

/**
 * @desc    Get current (active) financial year
 * @route   GET /api/v1/financial-years/current
 * @access  Private
 */
export const getCurrentFinancialYear = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;

        let currentFY = await prisma.financialYear.findFirst({
            where: { companyId, isCurrent: true }
        });

        // If no current FY, try to find one based on today's date
        if (!currentFY) {
            const today = new Date();
            currentFY = await prisma.financialYear.findFirst({
                where: {
                    companyId,
                    startDate: { lte: today },
                    endDate: { gte: today }
                }
            });
        }

        return res.json({
            success: true,
            data: currentFY
        });
    } catch (error: any) {
        console.error('Get current FY error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching current financial year'
        });
    }
};

/**
 * @desc    Create a new financial year
 * @route   POST /api/v1/financial-years
 * @access  Private (Admin only)
 */
export const createFinancialYear = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const { name, startDate, endDate, isCurrent } = req.body;

        // Validation
        if (!name || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Name, startDate, and endDate are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date'
            });
        }

        // Check for overlapping FY
        const overlapping = await prisma.financialYear.findFirst({
            where: {
                companyId,
                OR: [
                    { startDate: { lte: end }, endDate: { gte: start } }
                ]
            }
        });

        if (overlapping) {
            return res.status(400).json({
                success: false,
                message: `Overlaps with existing financial year: ${overlapping.name}`
            });
        }

        // If setting as current, unset others
        if (isCurrent) {
            await prisma.financialYear.updateMany({
                where: { companyId, isCurrent: true },
                data: { isCurrent: false }
            });
        }

        const financialYear = await prisma.financialYear.create({
            data: {
                name,
                startDate: start,
                endDate: end,
                isCurrent: isCurrent || false,
                companyId
            }
        });

        // Audit log
        await AuditService.logChange(
            companyId,
            userId,
            'COMPANY',
            financialYear.id,
            'CREATE',
            null,
            financialYear
        );

        return res.status(201).json({
            success: true,
            data: financialYear,
            message: 'Financial year created successfully'
        });
    } catch (error: any) {
        console.error('Create FY error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating financial year'
        });
    }
};

/**
 * @desc    Lock a financial year (prevent new transactions)
 * @route   POST /api/v1/financial-years/:id/lock
 * @access  Private (Admin only)
 */
export const lockFinancialYear = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const { id } = req.params;
        const { reason } = req.body;

        const fy = await prisma.financialYear.findFirst({
            where: { id, companyId }
        });

        if (!fy) {
            return res.status(404).json({
                success: false,
                message: 'Financial year not found'
            });
        }

        if (fy.isLocked) {
            return res.status(400).json({
                success: false,
                message: 'Financial year is already locked'
            });
        }

        const updatedFY = await prisma.financialYear.update({
            where: { id, companyId: req.user!.companyId },
            data: {
                isLocked: true,
                lockedAt: new Date(),
                lockedBy: userId,
                lockReason: reason || 'Period closed'
            }
        });

        // Audit log
        await AuditService.logChange(
            companyId,
            userId,
            'COMPANY',
            id,
            'UPDATE',
            { isLocked: false },
            { isLocked: true, lockedAt: updatedFY.lockedAt, reason }
        );

        return res.json({
            success: true,
            data: updatedFY,
            message: `Financial year ${fy.name} has been locked`
        });
    } catch (error: any) {
        console.error('Lock FY error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error locking financial year'
        });
    }
};

/**
 * @desc    Unlock a financial year (admin override)
 * @route   POST /api/v1/financial-years/:id/unlock
 * @access  Private (Admin only)
 */
export const unlockFinancialYear = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const { id } = req.params;
        const { overrideNote } = req.body;

        // Only OWNER or ADMIN can unlock
        if (!['OWNER', 'ADMIN'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Only Owner or Admin can unlock a financial year'
            });
        }

        // RISK MITIGATION: Require detailed reason (min 20 characters)
        if (!overrideNote || overrideNote.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Override note is required and must be at least 20 characters for audit trail. Please provide a detailed reason for unlocking.'
            });
        }

        const fy = await prisma.financialYear.findFirst({
            where: { id, companyId }
        });

        if (!fy) {
            return res.status(404).json({
                success: false,
                message: 'Financial year not found'
            });
        }

        if (!fy.isLocked) {
            return res.status(400).json({
                success: false,
                message: 'Financial year is not locked'
            });
        }

        // RISK MITIGATION: Enforce maximum 3 unlocks per financial year
        const currentOverrideCount = fy.overrideCount || 0;
        if (currentOverrideCount >= 3) {
            console.warn(`FY unlock limit reached for ${fy.name}`, {
                companyId,
                userId,
                fyId: id,
                currentCount: currentOverrideCount
            });

            return res.status(403).json({
                success: false,
                message: `Maximum unlock limit (3) reached for financial year ${fy.name}. This is to prevent data tampering. Please contact support for assistance.`,
                overrideCount: currentOverrideCount
            });
        }

        const updatedFY = await prisma.financialYear.update({
            where: { id, companyId: req.user!.companyId },
            data: {
                isLocked: false,
                overrideCount: { increment: 1 },
                lastOverrideAt: new Date(),
                lastOverrideBy: userId,
                lastOverrideNote: overrideNote
            }
        });

        // Critical audit log for override
        await AuditService.logChange(
            companyId,
            userId,
            'COMPANY',
            id,
            'UPDATE',
            { isLocked: true },
            { isLocked: false, overrideNote, overrideCount: updatedFY.overrideCount }
        );

        const remainingUnlocks = 3 - updatedFY.overrideCount;
        return res.json({
            success: true,
            data: updatedFY,
            message: `Financial year ${fy.name} has been unlocked. Override #${updatedFY.overrideCount} of 3`,
            warning: remainingUnlocks > 0
                ? `${remainingUnlocks} unlock(s) remaining for this financial year`
                : 'This was the final unlock allowed for this financial year'
        });
    } catch (error: any) {
        console.error('Unlock FY error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error unlocking financial year'
        });
    }
};

/**
 * @desc    Set a financial year as current
 * @route   POST /api/v1/financial-years/:id/set-current
 * @access  Private (Admin only)
 */
export const setCurrentFinancialYear = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;

        const fy = await prisma.financialYear.findFirst({
            where: { id, companyId }
        });

        if (!fy) {
            return res.status(404).json({
                success: false,
                message: 'Financial year not found'
            });
        }

        // Unset all others, set this one
        await prisma.$transaction([
            prisma.financialYear.updateMany({
                where: { companyId, isCurrent: true },
                data: { isCurrent: false }
            }),
            prisma.financialYear.update({
                where: { id, companyId: req.user!.companyId },
                data: { isCurrent: true }
            })
        ]);

        return res.json({
            success: true,
            message: `${fy.name} is now the current financial year`
        });
    } catch (error: any) {
        console.error('Set current FY error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error setting current financial year'
        });
    }
};

/**
 * Helper function to check if a date is in an open (unlocked) financial year
 * Used by other controllers before creating transactions
 */
export const isDateInOpenFY = async (
    companyId: string,
    transactionDate: Date
): Promise<{ allowed: boolean; message?: string; fyName?: string }> => {
    const fy = await prisma.financialYear.findFirst({
        where: {
            companyId,
            startDate: { lte: transactionDate },
            endDate: { gte: transactionDate }
        }
    });

    if (!fy) {
        return {
            allowed: false,
            message: 'No financial year defined for this date. Please create a financial year first.'
        };
    }

    if (fy.isLocked) {
        return {
            allowed: false,
            message: `Financial year ${fy.name} is locked. Contact admin to unlock.`,
            fyName: fy.name
        };
    }

    return { allowed: true, fyName: fy.name };
};

/**
 * Helper to auto-create financial years if none exist
 * Called during company setup
 */
export const ensureFinancialYearExists = async (companyId: string): Promise<void> => {
    const count = await prisma.financialYear.count({ where: { companyId } });

    if (count === 0) {
        // Create current FY (April to March for India)
        const today = new Date();
        const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

        await prisma.financialYear.create({
            data: {
                name: `${year}-${(year + 1).toString().slice(-2)}`,
                startDate: new Date(year, 3, 1), // April 1
                endDate: new Date(year + 1, 2, 31), // March 31
                isCurrent: true,
                companyId
            }
        });
    }
};

/**
 * @desc    Get all financial periods for a financial year
 * @route   GET /api/v1/financial-years/:id/periods
 * @access  Private
 */
export const getFinancialPeriods = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { id } = req.params;

        // Verify FY belongs to company
        const fy = await prisma.financialYear.findFirst({
            where: { id, companyId }
        });

        if (!fy) {
            return res.status(404).json({
                success: false,
                message: 'Financial year not found'
            });
        }

        const periods = await prisma.financialPeriod.findMany({
            where: { financialYearId: id, companyId },
            orderBy: { startDate: 'asc' }
        });

        return res.json({
            success: true,
            data: periods
        });
    } catch (error: any) {
        console.error('Get financial periods error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching financial periods'
        });
    }
};

/**
 * @desc    Lock or unlock a financial period
 * @route   POST /api/v1/financial-years/periods/:id/lock
 * @access  Private (Admin only)
 */
export const lockFinancialPeriod = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id; // Type assertion since middleware ensures user exists
        const { id } = req.params;
        const { isLocked, reason } = req.body;

        const period = await prisma.financialPeriod.findFirst({
            where: { id, companyId },
            include: { financialYear: true } // Include FY for context
        });

        if (!period) {
            return res.status(404).json({
                success: false,
                message: 'Financial period not found'
            });
        }

        // Cannot unlock if FY is locked
        if (!isLocked && period.financialYear.isLocked) {
            return res.status(400).json({
                success: false,
                message: 'Cannot unlock period when the entire Financial Year is locked'
            });
        }

        const updatedPeriod = await prisma.financialPeriod.update({
            where: { id, companyId: req.user!.companyId },
            data: { isLocked }
        });

        // Audit log
        await AuditService.logChange(
            companyId,
            userId,
            'COMPANY',
            id,
            'UPDATE',
            { isLocked: period.isLocked },
            { isLocked, reason }
        );

        return res.json({
            success: true,
            data: updatedPeriod,
            message: `Financial period ${period.name} has been ${isLocked ? 'locked' : 'unlocked'}`
        });
    } catch (error: any) {
        console.error('Lock period error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error updating financial period status'
        });
    }
};
