/**
 * Escrow Milestone Service
 * Handles milestone-based escrow workflow: create, track, approve, release
 */
import prisma from '../config/prisma';
import logger from '../config/logger';
import { Prisma } from '@prisma/client';
import eventBus, { EventTypes } from './eventBus';

export class EscrowMilestoneService {
    /**
     * Add milestones to an existing escrow transaction
     * The sum of milestone amounts should equal the escrow total
     */
    static async addMilestones(
        escrowId: string,
        milestones: Array<{ title: string; description?: string; amount: number; dueDate?: Date }>
    ) {
        const escrow = await prisma.escrowTransaction.findUnique({ where: { id: escrowId } });
        if (!escrow) throw new Error('Escrow transaction not found');

        const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
        if (Math.abs(totalMilestoneAmount - Number(escrow.amount)) > 0.01) {
            throw new Error(`Milestone amounts (${totalMilestoneAmount}) must equal escrow amount (${escrow.amount})`);
        }

        const created = await prisma.$transaction(
            milestones.map((m, idx) =>
                prisma.escrowMilestone.create({
                    data: {
                        escrowId,
                        sequence: idx + 1,
                        title: m.title,
                        description: m.description,
                        amount: new Prisma.Decimal(m.amount),
                        dueDate: m.dueDate,
                    },
                })
            )
        );

        logger.info(`[EscrowMilestone] Added ${created.length} milestones to escrow ${escrowId}`);
        return created;
    }

    /**
     * Get milestones for an escrow transaction, ordered by sequence
     */
    static async getMilestones(escrowId: string) {
        return prisma.escrowMilestone.findMany({
            where: { escrowId },
            orderBy: { sequence: 'asc' },
        });
    }

    /**
     * Get an escrow with all milestones and progress summary
     */
    static async getEscrowWithProgress(escrowId: string) {
        const escrow = await prisma.escrowTransaction.findUnique({
            where: { id: escrowId },
            include: {
                milestones: { orderBy: { sequence: 'asc' } },
                payer: { select: { id: true, name: true } },
                payee: { select: { id: true, name: true } },
            },
        });

        if (!escrow) throw new Error('Escrow not found');

        const totalMilestones = escrow.milestones.length;
        const completedMilestones = escrow.milestones.filter(m => m.status === 'RELEASED').length;
        const approvedMilestones = escrow.milestones.filter(m => m.status === 'APPROVED').length;
        const releasedAmount = escrow.milestones
            .filter(m => m.status === 'RELEASED')
            .reduce((sum, m) => sum + Number(m.amount), 0);

        return {
            ...escrow,
            progress: {
                totalMilestones,
                completedMilestones,
                approvedMilestones,
                pendingMilestones: totalMilestones - completedMilestones - approvedMilestones,
                releasedAmount,
                remainingAmount: Number(escrow.amount) - releasedAmount,
                percentComplete: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
            },
        };
    }

    /**
     * Approve a milestone (mark work as verified, ready for fund release)
     */
    static async approveMilestone(milestoneId: string, approvedBy: string, evidence?: string) {
        const milestone = await prisma.escrowMilestone.findUnique({
            where: { id: milestoneId },
            include: { escrow: true },
        });

        if (!milestone) throw new Error('Milestone not found');
        if (milestone.status !== 'PENDING') throw new Error(`Milestone is ${milestone.status}, not PENDING`);

        // Check previous milestones are at least approved
        const previousIncomplete = await prisma.escrowMilestone.findFirst({
            where: {
                escrowId: milestone.escrowId,
                sequence: { lt: milestone.sequence },
                status: { in: ['PENDING'] },
            },
        });

        if (previousIncomplete) {
            throw new Error(`Previous milestone "${previousIncomplete.title}" must be approved first`);
        }

        const updated = await prisma.escrowMilestone.update({
            where: { id: milestoneId },
            data: {
                status: 'APPROVED',
                approvedBy,
                approvedAt: new Date(),
                evidence,
            },
        });

        logger.info(`[EscrowMilestone] Approved milestone "${updated.title}" for escrow ${milestone.escrowId}`);
        return updated;
    }

    /**
     * Release funds for an approved milestone
     */
    static async releaseMilestone(milestoneId: string, companyId: string) {
        return prisma.$transaction(async (tx) => {
            const milestone = await tx.escrowMilestone.findUnique({
                where: { id: milestoneId },
                include: { escrow: true },
            });

            if (!milestone) throw new Error('Milestone not found');
            if (milestone.status !== 'APPROVED') throw new Error(`Milestone must be APPROVED before release (current: ${milestone.status})`);

            // Release the milestone
            const updatedMilestone = await tx.escrowMilestone.update({
                where: { id: milestoneId },
                data: {
                    status: 'RELEASED',
                    completedAt: new Date(),
                },
            });

            // Update escrow releasedAmount
            const newReleasedAmount = Number(milestone.escrow.releasedAmount) + Number(milestone.amount);
            const allReleased = newReleasedAmount >= Number(milestone.escrow.amount);

            const updatedEscrow = await tx.escrowTransaction.update({
                where: { id: milestone.escrowId },
                data: {
                    releasedAmount: new Prisma.Decimal(newReleasedAmount),
                    status: allReleased ? 'RELEASED' : 'PARTIALLY_RELEASED',
                    releasedAt: allReleased ? new Date() : undefined,
                },
            });

            logger.info(
                `[EscrowMilestone] Released ${milestone.amount} for "${milestone.title}". ` +
                `Total released: ${newReleasedAmount}/${milestone.escrow.amount}. ` +
                `Escrow status: ${updatedEscrow.status}`
            );

            // Emit event
            await eventBus.emit({
                companyId,
                eventType: allReleased ? EventTypes.ESCROW_RELEASED : 'ESCROW_MILESTONE_RELEASED',
                aggregateType: 'Escrow',
                aggregateId: milestone.escrowId,
                payload: {
                    milestoneId: milestone.id,
                    milestoneTitle: milestone.title,
                    amount: Number(milestone.amount),
                    totalReleased: newReleasedAmount,
                    escrowStatus: updatedEscrow.status,
                },
                metadata: { userId: 'system', source: 'system' },
            });

            return { milestone: updatedMilestone, escrow: updatedEscrow };
        });
    }

    /**
     * Reject a milestone
     */
    static async rejectMilestone(milestoneId: string, reason: string) {
        const milestone = await prisma.escrowMilestone.findUnique({ where: { id: milestoneId } });
        if (!milestone) throw new Error('Milestone not found');
        if (milestone.status === 'RELEASED') throw new Error('Cannot reject a released milestone');

        const updated = await prisma.escrowMilestone.update({
            where: { id: milestoneId },
            data: {
                status: 'REJECTED',
                notes: reason,
            },
        });

        logger.info(`[EscrowMilestone] Rejected milestone "${updated.title}": ${reason}`);
        return updated;
    }

    /**
     * Reset a rejected milestone back to PENDING
     */
    static async resetMilestone(milestoneId: string) {
        const updated = await prisma.escrowMilestone.update({
            where: { id: milestoneId },
            data: {
                status: 'PENDING',
                approvedBy: null,
                approvedAt: null,
                evidence: null,
                notes: null,
            },
        });

        return updated;
    }
}
