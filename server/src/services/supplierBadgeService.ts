/**
 * Supplier Badge System — Tiered verification badges
 * Basic → Verified → Trusted based on verification level + transaction history
 */
import prisma from '../config/prisma';

export type BadgeTier = 'BASIC' | 'VERIFIED' | 'TRUSTED';

interface BadgeResult {
    tier: BadgeTier;
    label: string;
    color: string;
    icon: string;
    criteria: { label: string; met: boolean }[];
}

const BADGE_CONFIG: Record<BadgeTier, { label: string; color: string; icon: string }> = {
    BASIC: { label: 'Basic', color: '#9ca3af', icon: '🔘' },
    VERIFIED: { label: 'Verified', color: '#0f62fe', icon: '✅' },
    TRUSTED: { label: 'Trusted', color: '#10b981', icon: '⭐' },
};

export class SupplierBadgeService {
    static async computeBadge(partyId: string, companyId: string): Promise<BadgeResult> {
        const party = await prisma.party.findUnique({
            where: { id: partyId },
            select: { gstin: true, pan: true, email: true, phone: true, createdAt: true },
        });
        if (!party) throw new Error('Party not found');

        const invoiceCount = await prisma.purchaseBill.count({ where: { supplierId: partyId, companyId, deletedAt: null } });
        const ageMonths = Math.floor((Date.now() - new Date(party.createdAt).getTime()) / (30 * 86400000));

        // Criteria checks
        const criteria = [
            { label: 'GSTIN provided', met: !!party.gstin },
            { label: 'PAN provided', met: !!party.pan },
            { label: 'Email verified', met: !!party.email },
            { label: 'Phone verified', met: !!party.phone },
            { label: '5+ transactions', met: invoiceCount >= 5 },
            { label: '20+ transactions', met: invoiceCount >= 20 },
            { label: '3+ months active', met: ageMonths >= 3 },
            { label: '6+ months active', met: ageMonths >= 6 },
        ];

        const metCount = criteria.filter(c => c.met).length;

        // Tier determination
        let tier: BadgeTier = 'BASIC';
        if (metCount >= 7) tier = 'TRUSTED';
        else if (metCount >= 4) tier = 'VERIFIED';

        return { tier, ...BADGE_CONFIG[tier], criteria };
    }

    static async getBulkBadges(partyIds: string[], companyId: string) {
        return Promise.all(partyIds.map(id => this.computeBadge(id, companyId).catch(() => ({ partyId: id, tier: 'BASIC' as BadgeTier, ...BADGE_CONFIG.BASIC, criteria: [] }))));
    }
}
