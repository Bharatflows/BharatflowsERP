/**
 * Escrow Auto-Release Scheduler
 * Configurable auto-release on milestone approval with cooling-off period
 */
import prisma from '../config/prisma';
import logger from '../config/logger';
import { EscrowMilestoneService } from './escrowMilestoneService';

export class EscrowAutoReleaseService {
    private static COOLING_PERIOD_HOURS = 48;

    /**
     * Check and auto-release approved milestones past the cooling period
     * Should be called by a cron job every hour
     */
    static async processAutoReleases() {
        const coolingThreshold = new Date();
        coolingThreshold.setHours(coolingThreshold.getHours() - this.COOLING_PERIOD_HOURS);

        // Find milestones that are APPROVED and past cooling period
        const readyMilestones = await prisma.escrowMilestone.findMany({
            where: {
                status: 'APPROVED',
                approvedAt: { lte: coolingThreshold },
            },
            include: {
                escrow: { select: { id: true, companyId: true, escrowNumber: true } },
            },
        });

        if (readyMilestones.length === 0) {
            logger.info('[AutoRelease] No milestones ready for auto-release');
            return { processed: 0, released: 0, failed: 0 };
        }

        let released = 0;
        let failed = 0;

        for (const milestone of readyMilestones) {
            try {
                await EscrowMilestoneService.releaseMilestone(
                    milestone.id,
                    milestone.escrow.companyId
                );
                released++;
                logger.info(
                    `[AutoRelease] Released milestone "${milestone.title}" ` +
                    `(₹${milestone.amount}) for ${milestone.escrow.escrowNumber}`
                );
            } catch (err: any) {
                failed++;
                logger.error(`[AutoRelease] Failed to release milestone ${milestone.id}: ${err.message}`);
            }
        }

        logger.info(`[AutoRelease] Processed ${readyMilestones.length}: ${released} released, ${failed} failed`);
        return { processed: readyMilestones.length, released, failed };
    }

    /**
     * Get upcoming auto-releases (milestones approved but still in cooling period)
     */
    static async getUpcomingReleases(companyId?: string) {
        const where: any = { status: 'APPROVED' };
        if (companyId) {
            where.escrow = { companyId };
        }

        const milestones = await prisma.escrowMilestone.findMany({
            where,
            include: {
                escrow: {
                    select: { escrowNumber: true, companyId: true, payer: { select: { name: true } }, payee: { select: { name: true } } },
                },
            },
            orderBy: { approvedAt: 'asc' },
        });

        return milestones.map(m => {
            const approvedAt = new Date(m.approvedAt!);
            const releaseAt = new Date(approvedAt.getTime() + this.COOLING_PERIOD_HOURS * 60 * 60 * 1000);
            const hoursRemaining = Math.max(0, (releaseAt.getTime() - Date.now()) / (60 * 60 * 1000));

            return {
                milestoneId: m.id,
                title: m.title,
                amount: Number(m.amount),
                escrowNumber: m.escrow.escrowNumber,
                approvedAt: m.approvedAt,
                releaseAt,
                hoursRemaining: Math.round(hoursRemaining * 10) / 10,
                isReady: hoursRemaining <= 0,
            };
        });
    }

    /**
     * Configure cooling period (admin setting)
     */
    static setCoolingPeriod(hours: number) {
        this.COOLING_PERIOD_HOURS = Math.max(1, Math.min(168, hours)); // 1hr to 7 days
        logger.info(`[AutoRelease] Cooling period set to ${this.COOLING_PERIOD_HOURS} hours`);
    }
}
