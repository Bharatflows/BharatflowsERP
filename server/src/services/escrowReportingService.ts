/**
 * Escrow Reporting Service
 * Fund utilization, project health scores, and aggregate metrics
 * Uses EscrowTransaction model (not 'Escrow')
 */
import prisma from '../config/prisma';

export class EscrowReportingService {
    /**
     * Fund utilization summary
     */
    static async getFundUtilization(companyId: string) {
        const escrows = await prisma.escrowTransaction.findMany({
            where: { companyId },
            select: { id: true, status: true, amount: true, releasedAmount: true, createdAt: true },
        });

        const total = escrows.reduce((s, e) => s + Number(e.amount || 0), 0);
        const released = escrows.reduce((s, e) => s + Number(e.releasedAmount || 0), 0);
        const held = total - released;

        const byStatus = { HELD: 0, PARTIALLY_RELEASED: 0, RELEASED: 0, DISPUTED: 0, REFUNDED: 0 } as Record<string, number>;
        escrows.forEach(e => { byStatus[e.status] = (byStatus[e.status] || 0) + 1; });

        return {
            totalFunds: total,
            releasedFunds: released,
            heldFunds: held,
            utilizationRate: total > 0 ? Math.round((released / total) * 100) : 0,
            escrowCount: escrows.length,
            byStatus,
        };
    }

    /**
     * Project health score for a single escrow
     * 0-100 scale based on milestone completion, timeliness, and dispute rate
     */
    static async getProjectHealth(escrowId: string) {
        const escrow = await prisma.escrowTransaction.findUnique({
            where: { id: escrowId },
            include: { milestones: true },
        });
        if (!escrow) throw new Error('Escrow not found');

        const milestones = escrow.milestones || [];
        const totalMs = milestones.length || 1;
        const completedMs = milestones.filter(m => m.status === 'RELEASED' || m.status === 'APPROVED').length;
        const disputedMs = milestones.filter(m => m.status === 'REJECTED').length;

        // Completion score (40%)
        const completionScore = (completedMs / totalMs) * 40;

        // Timeliness score (35%)
        const onTimeMs = milestones.filter(m => {
            if (!m.dueDate || !m.completedAt) return false;
            return new Date(m.completedAt) <= new Date(m.dueDate);
        }).length;
        const timelinessScore = totalMs > 0 ? (onTimeMs / totalMs) * 35 : 35;

        // Dispute score (25%)
        const disputeScore = (1 - disputedMs / totalMs) * 25;

        const overall = Math.round(completionScore + timelinessScore + disputeScore);
        const status = overall >= 75 ? 'HEALTHY' : overall >= 50 ? 'AT_RISK' : 'CRITICAL';

        return {
            escrowId,
            overallScore: overall,
            status,
            dimensions: { completion: Math.round(completionScore / 0.4), timeliness: Math.round(timelinessScore / 0.35), disputes: Math.round(disputeScore / 0.25) },
            milestoneStats: { total: totalMs, completed: completedMs, disputed: disputedMs, onTime: onTimeMs },
        };
    }

    /**
     * Aggregate escrow dashboard metrics
     */
    static async getDashboardMetrics(companyId: string) {
        const [utilization, recentEscrows] = await Promise.all([
            this.getFundUtilization(companyId),
            prisma.escrowTransaction.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, amount: true, status: true, createdAt: true, releasedAmount: true, escrowNumber: true },
            }),
        ]);

        // Monthly trend (last 6 months)
        const now = new Date();
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
            const count = await prisma.escrowTransaction.count({ where: { companyId, createdAt: { gte: start, lte: end } } });
            monthlyTrend.push({ month: start.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), count });
        }

        return { ...utilization, recentEscrows, monthlyTrend };
    }
}
