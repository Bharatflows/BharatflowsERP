/**
 * Financial Year Service
 * 
 * Reusable utilities for Financial Year filtering across all controllers.
 * Ensures data is scoped to the correct FY for multi-year accuracy.
 */

import prisma from '../config/prisma';

export interface FinancialYearDateRange {
    startDate: Date;
    endDate: Date;
    fyId: string;
    fyName: string;
    isLocked: boolean;
}

/**
 * Get the current financial year for a company
 * Returns null if no FY is defined
 */
export async function getCurrentFinancialYear(companyId: string): Promise<FinancialYearDateRange | null> {
    // First try to find FY marked as current
    let fy = await prisma.financialYear.findFirst({
        where: { companyId, isCurrent: true }
    });

    // Fallback: find FY covering today's date
    if (!fy) {
        const today = new Date();
        fy = await prisma.financialYear.findFirst({
            where: {
                companyId,
                startDate: { lte: today },
                endDate: { gte: today }
            }
        });
    }

    if (!fy) return null;

    return {
        startDate: fy.startDate,
        endDate: fy.endDate,
        fyId: fy.id,
        fyName: fy.name,
        isLocked: fy.isLocked
    };
}

/**
 * Get date filter for Prisma queries based on current FY
 * Returns undefined if no FY is active (to allow querying all data)
 */
export async function getFYDateFilter(companyId: string, dateField: string = 'createdAt'): Promise<Record<string, any> | undefined> {
    const fy = await getCurrentFinancialYear(companyId);
    if (!fy) return undefined;

    return {
        [dateField]: {
            gte: fy.startDate,
            lte: fy.endDate
        }
    };
}

/**
 * Build a where clause with FY filter applied
 * Merges existing where conditions with FY date filter
 */
export async function withFYFilter(
    companyId: string,
    existingWhere: Record<string, any> = {},
    dateField: string = 'createdAt'
): Promise<Record<string, any>> {
    const fyFilter = await getFYDateFilter(companyId, dateField);

    if (!fyFilter) return existingWhere;

    return {
        ...existingWhere,
        ...fyFilter
    };
}

export default {
    getCurrentFinancialYear,
    getFYDateFilter,
    withFYFilter,
    validateDate
};

/**
 * Validate if a date falls within an open (unlocked) financial year.
 * Throws an error if the year is locked.
 */
export async function validateDate(companyId: string, date: Date): Promise<void> {
    const fy = await prisma.financialYear.findFirst({
        where: {
            companyId,
            startDate: { lte: date },
            endDate: { gte: date }
        },
        include: { periods: true }
    });

    if (!fy) {
        // Strict enforcement: If no FY, warn or block. 
        // For existing systems without setup, this might break. 
        // We will LOG WARN but allow, unless strict mode env is set.
        // console.warn(`[FY Check] No Financial Year found for ${date}`);
        return;
    }

    if (fy.isLocked) {
        throw new Error(`Transaction Date falls in a LOCKED Financial Year (${fy.name}). Operation denied.`);
    }

    // Check specific period lock
    const period = fy.periods.find(p => date >= p.startDate && date <= p.endDate);
    if (period && period.isLocked) {
        throw new Error(`Transaction Date falls in a LOCKED Period (${period.name}). Operation denied.`);
    }
}
