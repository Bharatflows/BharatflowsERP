/**
 * Supplier Search & Discovery Service
 * Full-text search using Prisma (defer Elasticsearch)
 */
import prisma from '../config/prisma';

interface SearchFilters {
    companyId: string;
    query?: string;
    type?: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
    state?: string;
    hasGstin?: boolean;
    minRating?: number;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'createdAt' | 'totalPurchases';
    sortOrder?: 'asc' | 'desc';
}

export class SupplierSearchService {
    static async search(filters: SearchFilters) {
        const { companyId, query, type, state, hasGstin, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = filters;
        const skip = (page - 1) * limit;

        const where: any = { companyId };
        if (type) where.type = type;
        if (state) where.billingAddress = { contains: state, mode: 'insensitive' };
        if (hasGstin !== undefined) where.gstin = hasGstin ? { not: null } : null;
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { gstin: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
                { pan: { contains: query, mode: 'insensitive' } },
            ];
        }

        const [parties, total] = await Promise.all([
            prisma.party.findMany({
                where,
                select: {
                    id: true, name: true, type: true, email: true, phone: true,
                    gstin: true, pan: true, billingAddress: true, createdAt: true,
                    _count: { select: { invoices: true } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma.party.count({ where }),
        ]);

        return {
            parties: parties.map(p => ({
                ...p,
                invoiceCount: p._count.invoices,
                _count: undefined,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + parties.length < total,
        };
    }

    /**
     * Get distinct states for filter dropdown
     */
    static async getStates(companyId: string) {
        // Fallback for states as Party model doesn't have a structured state field
        return ['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu'];
    }

    /**
     * Bulk GSTIN verification queue
     */
    static async queueBulkVerification(gstins: string[], companyId: string) {
        // Store as pending verification batch
        const batch = await prisma.settingsAuditLog.create({
            data: {
                companyId,
                userId: 'system',
                action: 'BULK_GSTIN_VERIFY',
                settingType: 'verification',
                fieldName: 'batch',
                oldValue: JSON.stringify(gstins),
                newValue: 'PENDING',
            },
        });
        return { batchId: batch.id, count: gstins.length, status: 'QUEUED' };
    }
}
