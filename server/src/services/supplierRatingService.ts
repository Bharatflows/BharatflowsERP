/**
 * Supplier Rating Service
 * Transaction-based rating system with reviews
 */
import prisma from '../config/prisma';
import logger from '../config/logger';

interface RatingInput {
    companyId: string;
    partyId: string;
    userId: string;
    score: number;    // 1-5
    review?: string;
    invoiceId?: string; // Optional tie to a specific invoice
    dimensions?: {
        quality?: number;      // 1-5
        delivery?: number;     // 1-5
        communication?: number;// 1-5
        pricing?: number;      // 1-5
    };
}

export class SupplierRatingService {
    /**
     * Submit a rating for a supplier (uses SettingsAuditLog as storage)
     */
    static async submitRating(input: RatingInput) {
        if (input.score < 1 || input.score > 5) {
            throw new Error('Score must be between 1 and 5');
        }

        const rating = await prisma.settingsAuditLog.create({
            data: {
                companyId: input.companyId,
                userId: input.userId,
                action: 'SUPPLIER_RATING',
                settingType: 'ratings',
                fieldName: input.partyId,
                oldValue: JSON.stringify({
                    score: input.score,
                    review: input.review || '',
                    dimensions: input.dimensions || {},
                    invoiceId: input.invoiceId,
                }),
                newValue: String(input.score),
            },
        });

        logger.info(`[Rating] User ${input.userId} rated supplier ${input.partyId}: ${input.score}/5`);
        return {
            id: rating.id,
            partyId: input.partyId,
            score: input.score,
            review: input.review,
            createdAt: rating.timestamp,
        };
    }

    /**
     * Get all ratings for a supplier
     */
    static async getRatings(partyId: string, companyId: string) {
        const entries = await prisma.settingsAuditLog.findMany({
            where: {
                companyId,
                action: 'SUPPLIER_RATING',
                fieldName: partyId,
            },
            orderBy: { timestamp: 'desc' },
            include: { user: { select: { name: true } } },
        });

        return entries.map(e => {
            const meta = JSON.parse(e.oldValue || '{}');
            return {
                id: e.id,
                score: meta.score || parseInt(e.newValue || '0'),
                review: meta.review || '',
                dimensions: meta.dimensions || {},
                invoiceId: meta.invoiceId,
                reviewer: e.user?.name || 'Unknown',
                createdAt: e.timestamp,
            };
        });
    }

    /**
     * Get aggregate rating summary for a supplier
     */
    static async getRatingSummary(partyId: string, companyId: string) {
        const ratings = await this.getRatings(partyId, companyId);

        if (ratings.length === 0) {
            return { averageScore: 0, totalRatings: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        }

        const scores = ratings.map(r => r.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
        scores.forEach(s => { if (distribution[s] !== undefined) distribution[s]++; });

        // Dimension averages
        const dimScores = { quality: [] as number[], delivery: [] as number[], communication: [] as number[], pricing: [] as number[] };
        ratings.forEach(r => {
            if (r.dimensions?.quality) dimScores.quality.push(r.dimensions.quality);
            if (r.dimensions?.delivery) dimScores.delivery.push(r.dimensions.delivery);
            if (r.dimensions?.communication) dimScores.communication.push(r.dimensions.communication);
            if (r.dimensions?.pricing) dimScores.pricing.push(r.dimensions.pricing);
        });

        const avgDim = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

        return {
            averageScore: Math.round(avg * 10) / 10,
            totalRatings: ratings.length,
            distribution,
            dimensionAverages: {
                quality: avgDim(dimScores.quality),
                delivery: avgDim(dimScores.delivery),
                communication: avgDim(dimScores.communication),
                pricing: avgDim(dimScores.pricing),
            },
            recentReviews: ratings.slice(0, 5),
        };
    }

    /**
     * Get top-rated suppliers for a company
     */
    static async getTopRated(companyId: string, limit: number = 10) {
        const suppliers = await prisma.party.findMany({
            where: { companyId, type: { in: ['SUPPLIER', 'BOTH'] } },
            select: { id: true, name: true },
        });

        const rated = await Promise.all(
            suppliers.map(async (s) => ({
                ...s,
                rating: await this.getRatingSummary(s.id, companyId),
            }))
        );

        return rated
            .filter(r => r.rating.totalRatings > 0)
            .sort((a, b) => b.rating.averageScore - a.rating.averageScore)
            .slice(0, limit);
    }
}
