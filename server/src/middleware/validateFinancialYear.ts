/**
 * Financial Year Validation Middleware
 * 
 * P0: Rejects transactions that fall outside an open (unlocked) financial year
 * Must be applied to routes that create/update financial transactions
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

interface AuthRequest extends Request {
    user?: { id: string; companyId: string; role: string };
    financialYear?: any;
}

/**
 * Middleware to validate that a transaction date is within an open financial year
 * 
 * Usage:
 *   router.post('/invoices', validateFinancialYear('invoiceDate'), createInvoice);
 *   router.put('/invoices/:id', validateFinancialYear('invoiceDate'), updateInvoice);
 * 
 * @param dateField - The request body field containing the transaction date
 */
export const validateFinancialYear = (dateField: string = 'date') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: Company not found'
                });
            }

            // Extract date from request body
            const dateValue = req.body[dateField];
            if (!dateValue) {
                // If no date provided, skip validation (let controller handle required field)
                return next();
            }

            const transactionDate = new Date(dateValue);
            if (isNaN(transactionDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid date format for ${dateField}`
                });
            }

            // Find the financial year for this date
            const financialYear = await prisma.financialYear.findFirst({
                where: {
                    companyId,
                    startDate: { lte: transactionDate },
                    endDate: { gte: transactionDate }
                }
            });

            if (!financialYear) {
                return res.status(400).json({
                    success: false,
                    message: `No financial year defined for date ${transactionDate.toISOString().split('T')[0]}. Please create a financial year first.`,
                    code: 'FY_NOT_FOUND'
                });
            }

            if (financialYear.isLocked) {
                // Check for admin override header
                const overrideToken = req.headers['x-fy-override'];
                const userRole = req.user?.role;

                if (overrideToken && ['OWNER', 'ADMIN'].includes(userRole || '')) {
                    // Allow override for admin with audit note
                    console.warn(`FY Override used by ${req.user?.id} for ${financialYear.name}`);

                    // Update override tracking
                    await prisma.financialYear.update({
                        where: { id: financialYear.id },
                        data: {
                            overrideCount: { increment: 1 },
                            lastOverrideAt: new Date(),
                            lastOverrideBy: req.user?.id,
                            lastOverrideNote: `Transaction override: ${dateField}=${dateValue}`
                        }
                    });
                } else {
                    return res.status(403).json({
                        success: false,
                        message: `Financial year ${financialYear.name} is locked. Transaction date ${transactionDate.toISOString().split('T')[0]} cannot be processed.`,
                        code: 'FY_LOCKED',
                        fyName: financialYear.name,
                        lockedAt: financialYear.lockedAt,
                        lockedBy: financialYear.lockedBy,
                        lockReason: financialYear.lockReason
                    });
                }
            }

            // Attach FY info to request for downstream use
            req.financialYear = financialYear;
            return next();
        } catch (error: any) {
            console.error('FY validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error validating financial year'
            });
        }
    };
};

/**
 * Middleware to ensure a financial year exists for the company
 * Useful for routes that need FY context but don't have a date field
 */
export const ensureFinancialYearExists = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const count = await prisma.financialYear.count({ where: { companyId } });

        if (count === 0) {
            // Auto-create a financial year for Indian fiscal calendar (April-March)
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

            console.log(`Auto-created FY ${year}-${year + 1} for company ${companyId}`);
        }

        return next();
    } catch (error: any) {
        console.error('Ensure FY error:', error);
        return next(); // Don't block on error, let the request continue
    }
};

/**
 * Helper function to check FY status programmatically (for use in services)
 */
export const checkFinancialYearStatus = async (
    companyId: string,
    transactionDate: Date
): Promise<{
    valid: boolean;
    message?: string;
    fyName?: string;
    isLocked?: boolean;
}> => {
    const financialYear = await prisma.financialYear.findFirst({
        where: {
            companyId,
            startDate: { lte: transactionDate },
            endDate: { gte: transactionDate }
        }
    });

    if (!financialYear) {
        return {
            valid: false,
            message: `No financial year defined for date ${transactionDate.toISOString().split('T')[0]}`
        };
    }

    if (financialYear.isLocked) {
        return {
            valid: false,
            message: `Financial year ${financialYear.name} is locked`,
            fyName: financialYear.name,
            isLocked: true
        };
    }

    return { valid: true, fyName: financialYear.name };
};
