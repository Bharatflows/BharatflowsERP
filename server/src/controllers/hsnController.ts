import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase()) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }
    return dp[m][n];
}

// Calculate fuzzy match score (0 to 100, higher is better)
function fuzzyMatchScore(searchTerm: string, target: string): number {
    const search = searchTerm.toLowerCase();
    const targetLower = target.toLowerCase();

    // Exact match = 100
    if (targetLower === search) return 100;

    // Starts with = 90
    if (targetLower.startsWith(search)) return 90;

    // Contains = 70
    if (targetLower.includes(search)) return 70;

    // Word match = 60
    const words = targetLower.split(/\s+/);
    if (words.some(word => word.startsWith(search))) return 60;

    // Levenshtein-based score
    const distance = levenshteinDistance(search, targetLower.substring(0, search.length + 5));
    const maxLen = Math.max(search.length, target.length);
    const similarity = (1 - distance / maxLen) * 50;

    return Math.max(0, similarity);
}

/**
 * Search HSN codes with fuzzy matching
 * GET /api/v1/hsn/search?q=<query>&limit=<limit>
 */
export const searchHSN = async (req: AuthRequest, res: Response) => {
    try {
        const { q, limit = '20', category, isService } = req.query;
        const searchQuery = (q as string)?.trim() || '';
        const limitNum = Math.min(parseInt(limit as string) || 20, 100);

        // Build where conditions
        const where: any = { isActive: true };

        if (category) {
            where.category = { contains: category as string };
        }

        if (isService !== undefined) {
            where.isService = isService === 'true';
        }

        // If searching by HSN code (starts with digits)
        if (searchQuery && /^\d+$/.test(searchQuery)) {
            where.code = { startsWith: searchQuery };
        }

        // Fetch all matching records for fuzzy search
        const allHSNCodes = await prisma.hSN.findMany({
            where,
            take: searchQuery ? 500 : limitNum, // Get more for fuzzy filtering
            orderBy: { code: 'asc' }
        });

        let results = allHSNCodes;

        // Apply fuzzy matching on description if not searching by code
        if (searchQuery && !/^\d+$/.test(searchQuery)) {
            const scoredResults = allHSNCodes.map(hsn => ({
                ...hsn,
                matchScore: Math.max(
                    fuzzyMatchScore(searchQuery, hsn.description),
                    fuzzyMatchScore(searchQuery, hsn.category || ''),
                    fuzzyMatchScore(searchQuery, hsn.code)
                )
            }));

            // Filter by minimum score and sort by score
            results = scoredResults
                .filter(hsn => (hsn as any).matchScore >= 30)
                .sort((a, b) => (b as any).matchScore - (a as any).matchScore)
                .slice(0, limitNum);
        }

        return res.json({
            success: true,
            data: results,
            count: results.length
        });
    } catch (error: any) {
        console.error('HSN search error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search HSN codes',
            error: error.message
        });
    }
};

/**
 * Get single HSN by code
 * GET /api/v1/hsn/:code
 */
export const getHSNByCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;

        const hsn = await prisma.hSN.findUnique({
            where: { code }
        });

        if (!hsn) {
            return res.status(404).json({
                success: false,
                message: 'HSN code not found'
            });
        }

        return res.json({
            success: true,
            data: hsn
        });
    } catch (error: any) {
        console.error('Get HSN error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch HSN code',
            error: error.message
        });
    }
};

/**
 * Get all HSN codes (paginated)
 * GET /api/v1/hsn?page=1&limit=50&category=<category>
 */
export const getAllHSN = async (req: AuthRequest, res: Response) => {
    try {
        const { page = '1', limit = '50', category, isService, gstRate } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = Math.min(parseInt(limit as string) || 50, 100);
        const skip = (pageNum - 1) * limitNum;

        const where: any = { isActive: true };

        if (category) {
            where.category = { contains: category as string };
        }
        if (isService !== undefined) {
            where.isService = isService === 'true';
        }
        if (gstRate) {
            where.gstRate = parseFloat(gstRate as string);
        }

        const [items, total] = await Promise.all([
            prisma.hSN.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { code: 'asc' }
            }),
            prisma.hSN.count({ where })
        ]);

        return res.json({
            success: true,
            data: items,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        console.error('Get all HSN error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch HSN codes',
            error: error.message
        });
    }
};

/**
 * Create or update HSN code
 * POST /api/v1/hsn
 */
export const createHSN = async (req: AuthRequest, res: Response) => {
    try {
        const { code, description, gstRate, cgstRate, sgstRate, igstRate, unit, category, chapter, isService } = req.body;

        if (!code || !description || gstRate === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Code, description, and GST rate are required'
            });
        }

        // Validate code format (4-8 digits)
        if (!/^\d{4,8}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: 'HSN code must be 4-8 digits'
            });
        }

        const hsn = await prisma.hSN.upsert({
            where: { code },
            update: {
                description,
                gstRate: parseFloat(gstRate),
                cgstRate: cgstRate ? parseFloat(cgstRate) : parseFloat(gstRate) / 2,
                sgstRate: sgstRate ? parseFloat(sgstRate) : parseFloat(gstRate) / 2,
                igstRate: igstRate ? parseFloat(igstRate) : parseFloat(gstRate),
                unit,
                category,
                chapter,
                isService: isService || false
            },
            create: {
                code,
                description,
                gstRate: parseFloat(gstRate),
                cgstRate: cgstRate ? parseFloat(cgstRate) : parseFloat(gstRate) / 2,
                sgstRate: sgstRate ? parseFloat(sgstRate) : parseFloat(gstRate) / 2,
                igstRate: igstRate ? parseFloat(igstRate) : parseFloat(gstRate),
                unit,
                category,
                chapter,
                isService: isService || false
            }
        });

        return res.status(201).json({
            success: true,
            data: hsn,
            message: 'HSN code saved successfully'
        });
    } catch (error: any) {
        console.error('Create HSN error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save HSN code',
            error: error.message
        });
    }
};

/**
 * Bulk import HSN codes
 * POST /api/v1/hsn/import
 */
export const importHSNCodes = async (req: AuthRequest, res: Response) => {
    try {
        const { codes } = req.body;

        if (!Array.isArray(codes) || codes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'An array of HSN codes is required'
            });
        }

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const item of codes) {
            try {
                if (!item.code || !item.description || item.gstRate === undefined) {
                    skipped++;
                    continue;
                }

                await prisma.hSN.upsert({
                    where: { code: item.code },
                    update: {
                        description: item.description,
                        gstRate: parseFloat(item.gstRate),
                        cgstRate: item.cgstRate ? parseFloat(item.cgstRate) : parseFloat(item.gstRate) / 2,
                        sgstRate: item.sgstRate ? parseFloat(item.sgstRate) : parseFloat(item.gstRate) / 2,
                        igstRate: item.igstRate ? parseFloat(item.igstRate) : parseFloat(item.gstRate),
                        unit: item.unit,
                        category: item.category,
                        chapter: item.chapter,
                        isService: item.isService || false
                    },
                    create: {
                        code: item.code,
                        description: item.description,
                        gstRate: parseFloat(item.gstRate),
                        cgstRate: item.cgstRate ? parseFloat(item.cgstRate) : parseFloat(item.gstRate) / 2,
                        sgstRate: item.sgstRate ? parseFloat(item.sgstRate) : parseFloat(item.gstRate) / 2,
                        igstRate: item.igstRate ? parseFloat(item.igstRate) : parseFloat(item.gstRate),
                        unit: item.unit,
                        category: item.category,
                        chapter: item.chapter,
                        isService: item.isService || false
                    }
                });
                imported++;
            } catch (e: any) {
                errors.push(`${item.code}: ${e.message}`);
                skipped++;
            }
        }

        return res.json({
            success: true,
            message: `Imported ${imported} HSN codes, skipped ${skipped}`,
            data: { imported, skipped, errors: errors.slice(0, 10) }
        });
    } catch (error: any) {
        console.error('Import HSN error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to import HSN codes',
            error: error.message
        });
    }
};

/**
 * Get HSN code suggestions for a product name (fuzzy matching)
 * GET /api/v1/hsn/suggest?q=<product_name>
 */
export const suggestHSNForProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { q, limit = '5' } = req.query;
        const productName = (q as string)?.trim();
        const limitNum = Math.min(parseInt(limit as string) || 5, 20);

        if (!productName) {
            return res.status(400).json({
                success: false,
                message: 'Product name query is required'
            });
        }

        // Fetch active HSN codes
        const allHSNCodes = await prisma.hSN.findMany({
            where: { isActive: true },
            take: 1000 // Limit for performance
        });

        // Calculate fuzzy match score for each HSN
        const suggestions = allHSNCodes
            .map(hsn => ({
                ...hsn,
                matchScore: Math.max(
                    fuzzyMatchScore(productName, hsn.description),
                    fuzzyMatchScore(productName, hsn.category || '')
                ),
                matchReason: fuzzyMatchScore(productName, hsn.description) >= fuzzyMatchScore(productName, hsn.category || '')
                    ? 'description'
                    : 'category'
            }))
            .filter(hsn => hsn.matchScore >= 25)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limitNum);

        return res.json({
            success: true,
            data: suggestions,
            query: productName
        });
    } catch (error: any) {
        console.error('HSN suggestion error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get HSN suggestions',
            error: error.message
        });
    }
};

/**
 * Delete HSN code (soft delete by setting isActive = false)
 * DELETE /api/v1/hsn/:code
 */
export const deleteHSN = async (req: AuthRequest, res: Response) => {
    try {
        const { code } = req.params;

        const hsn = await prisma.hSN.update({
            where: { code },
            data: { isActive: false }
        });

        return res.json({
            success: true,
            message: 'HSN code deactivated',
            data: hsn
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'HSN code not found'
            });
        }
        console.error('Delete HSN error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete HSN code',
            error: error.message
        });
    }
};

/**
 * Get unique categories for filtering
 * GET /api/v1/hsn/categories
 */
export const getHSNCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.hSN.findMany({
            where: { isActive: true, category: { not: null } },
            select: { category: true },
            distinct: ['category']
        });

        const uniqueCategories = categories
            .map(c => c.category)
            .filter(Boolean)
            .sort();

        return res.json({
            success: true,
            data: uniqueCategories
        });
    } catch (error: any) {
        console.error('Get categories error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};

export default {
    searchHSN,
    getHSNByCode,
    getAllHSN,
    createHSN,
    importHSNCodes,
    suggestHSNForProduct,
    deleteHSN,
    getHSNCategories
};
