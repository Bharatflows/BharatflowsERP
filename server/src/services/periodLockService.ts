/**
 * Period Lock Service
 * 
 * Phase 8: Financial Integrity
 * 
 * Provides centralized checks for financial year and period locking.
 * All financial mutation controllers should call this before creating/modifying entries.
 */

import prisma from '../config/prisma';
import logger from '../config/logger';

export interface PeriodLockResult {
    isLocked: boolean;
    reason?: string;
    financialYearId?: string;
    periodName?: string;
}

/**
 * Check if a date falls within a locked financial period
 * 
 * @param companyId - The company ID
 * @param date - The date to check (voucher date, invoice date, etc.)
 * @returns PeriodLockResult indicating if the period is locked
 */
export async function checkPeriodLock(
    companyId: string,
    date: Date
): Promise<PeriodLockResult> {
    try {
        // Find the financial year that contains this date
        const financialYear = await prisma.financialYear.findFirst({
            where: {
                companyId,
                startDate: { lte: date },
                endDate: { gte: date }
            }
        });

        if (!financialYear) {
            // No financial year defined for this date - allow operation
            logger.warn('No financial year found for date', { companyId, date });
            return { isLocked: false };
        }

        // Check if the entire financial year is locked
        if (financialYear.isLocked) {
            return {
                isLocked: true,
                reason: `Financial Year ${financialYear.name} is locked. ${financialYear.lockReason || ''}`.trim(),
                financialYearId: financialYear.id,
                periodName: financialYear.name
            };
        }

        // If we have period-level locking, check that too
        // (FinancialPeriod model may not exist in all setups)
        try {
            const period = await prisma.financialPeriod?.findFirst({
                where: {
                    financialYearId: financialYear.id,
                    startDate: { lte: date },
                    endDate: { gte: date },
                    isLocked: true
                }
            });

            if (period) {
                return {
                    isLocked: true,
                    reason: `Period ${period.name} is locked`,
                    financialYearId: financialYear.id,
                    periodName: period.name
                };
            }
        } catch (e) {
            // FinancialPeriod model may not exist
        }

        // No locks found
        return { isLocked: false, financialYearId: financialYear.id };

    } catch (error: any) {
        logger.error('Period lock check error:', error);
        // On error, fail open but log for investigation
        return { isLocked: false };
    }
}

/**
 * Throws an error if the period is locked - for use in controllers
 * 
 * @param companyId - The company ID
 * @param date - The date to check
 * @param operationType - Description of the operation being performed
 */
export async function requireUnlockedPeriod(
    companyId: string,
    date: Date,
    operationType: string = 'financial operation'
): Promise<void> {
    const result = await checkPeriodLock(companyId, date);

    if (result.isLocked) {
        const error = new Error(
            `Cannot perform ${operationType}: ${result.reason || 'Period is locked'}`
        );
        (error as any).statusCode = 403;
        (error as any).code = 'PERIOD_LOCKED';
        throw error;
    }
}

/**
 * Batch check multiple dates for period locks
 * Returns true if any of the dates fall in a locked period
 */
export async function anyPeriodLocked(
    companyId: string,
    dates: Date[]
): Promise<PeriodLockResult> {
    for (const date of dates) {
        const result = await checkPeriodLock(companyId, date);
        if (result.isLocked) {
            return result;
        }
    }
    return { isLocked: false };
}
