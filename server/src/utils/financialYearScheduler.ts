import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Auto-create financial years for all companies.
 * Runs on server startup and can be scheduled to run daily.
 * 
 * Logic:
 * - For India, FY runs April 1 to March 31
 * - If current date falls within a range not covered by any FY, create one
 * - Mark the newly created FY as current if it covers today's date
 */
export async function autoCreateFinancialYears(): Promise<void> {
    try {
        logger.info('🗓️ Checking financial years for all companies...');

        const companies = await prisma.company.findMany({
            select: { id: true, businessName: true }
        });

        const today = new Date();
        // Determine current FY year (Apr-Mar cycle for India)
        // If we're in Jan-Mar, we're still in the FY that started previous April
        const fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        const currentFYStart = new Date(fyStartYear, 3, 1); // April 1
        const currentFYEnd = new Date(fyStartYear + 1, 2, 31); // March 31
        const fyName = `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`;

        let created = 0;

        for (const company of companies) {
            // Check if FY for this period already exists
            const existingFY = await prisma.financialYear.findFirst({
                where: {
                    companyId: company.id,
                    startDate: currentFYStart
                }
            });

            if (!existingFY) {
                // Create the financial year
                await prisma.financialYear.create({
                    data: {
                        name: fyName,
                        startDate: currentFYStart,
                        endDate: currentFYEnd,
                        isCurrent: true,
                        companyId: company.id
                    }
                });

                // Unmark previous FYs as current
                await prisma.financialYear.updateMany({
                    where: {
                        companyId: company.id,
                        startDate: { not: currentFYStart },
                        isCurrent: true
                    },
                    data: { isCurrent: false }
                });

                logger.info(`✅ Created FY ${fyName} for ${company.businessName}`);
                created++;
            }
        }

        if (created > 0) {
            logger.info(`🗓️ Created ${created} financial year(s)`);
        } else {
            logger.info('🗓️ All companies have current financial years');
        }
    } catch (error: any) {
        logger.error('❌ Error auto-creating financial years:', error.message);
    }
}

/**
 * Schedule to run daily at midnight to check and create FYs when needed.
 * Uses setInterval - in production, consider using node-cron or agenda.
 */
export function scheduleFinancialYearCheck(): void {
    // Run immediately on startup
    autoCreateFinancialYears();

    // Schedule daily check at midnight
    const msUntilMidnight = getMillisecondsUntilMidnight();

    setTimeout(() => {
        autoCreateFinancialYears();
        // Then run every 24 hours
        setInterval(autoCreateFinancialYears, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    logger.info(`📅 Financial year check scheduled (next run in ${Math.round(msUntilMidnight / 1000 / 60)} minutes)`);
}

function getMillisecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
}
