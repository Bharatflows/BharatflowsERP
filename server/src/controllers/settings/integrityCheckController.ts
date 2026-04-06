/**
 * Integrity Check Controller
 * 
 * Enhanced integrity check with history tracking.
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';

/**
 * Run integrity check and save results
 */
export const runIntegrityCheck = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        const { checkTypes } = req.body; // Array of check types to run

        const startTime = Date.now();
        const allIssues: any[] = [];
        let totalChecks = 0;
        let criticalCount = 0;

        // Stock validation check
        if (!checkTypes || checkTypes.includes('STOCK_VALIDATION')) {
            totalChecks++;
            const stockIssues = await checkStockIntegrity(companyId);
            allIssues.push(...stockIssues);
            criticalCount += stockIssues.filter(i => i.severity === 'CRITICAL').length;
        }

        // Ledger balance check
        if (!checkTypes || checkTypes.includes('LEDGER_BALANCE')) {
            totalChecks++;
            const ledgerIssues = await checkLedgerIntegrity(companyId);
            allIssues.push(...ledgerIssues);
            criticalCount += ledgerIssues.filter(i => i.severity === 'CRITICAL').length;
        }

        // Sequence gaps check
        if (!checkTypes || checkTypes.includes('SEQUENCE_GAPS')) {
            totalChecks++;
            const sequenceIssues = await checkSequenceIntegrity(companyId);
            allIssues.push(...sequenceIssues);
            criticalCount += sequenceIssues.filter(i => i.severity === 'CRITICAL').length;
        }

        const duration = Date.now() - startTime;
        const status = criticalCount > 0 ? 'FAILURE' : (allIssues.length > 0 ? 'WARNING' : 'SUCCESS');

        // Save results to database
        const result = await prisma.integrityCheckResult.create({
            data: {
                companyId,
                checkType: checkTypes?.join(',') || 'ALL',
                status,
                issues: JSON.stringify(allIssues),
                totalChecks,
                issuesFound: allIssues.length,
                criticalIssues: criticalCount,
                duration,
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                id: result.id,
                status,
                totalChecks,
                issuesFound: allIssues.length,
                criticalIssues: criticalCount,
                duration,
                issues: allIssues,
            },
        });
    } catch (error: any) {
        console.error('Error running integrity check:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to run integrity check',
            error: error.message,
        });
    }
};

/**
 * Get integrity check history
 */
export const getIntegrityCheckHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        const { limit = 10, offset = 0 } = req.query;

        const results = await prisma.integrityCheckResult.findMany({
            where: { companyId },
            orderBy: { runAt: 'desc' },
            take: Number(limit),
            skip: Number(offset),
            select: {
                id: true,
                checkType: true,
                status: true,
                totalChecks: true,
                issuesFound: true,
                criticalIssues: true,
                runAt: true,
                duration: true,
            },
        });

        const total = await prisma.integrityCheckResult.count({
            where: { companyId },
        });

        return res.status(200).json({
            success: true,
            data: results,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error: any) {
        console.error('Error fetching integrity check history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch history',
            error: error.message,
        });
    }
};

/**
 * Get detailed results of a specific check
 */
export const getIntegrityCheckDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        const { id } = req.params;

        const result = await prisma.integrityCheckResult.findFirst({
            where: {
                id,
                companyId,
            },
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Integrity check result not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('Error fetching integrity check details:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch details',
            error: error.message,
        });
    }
};

// Helper functions for different integrity checks

async function checkStockIntegrity(companyId: string) {
    const issues: any[] = [];

    // Check for negative stock
    const negativeStock = await prisma.product.findMany({
        where: {
            companyId,
            currentStock: { lt: 0 },
        },
        select: { id: true, name: true, code: true, currentStock: true },
    });

    negativeStock.forEach(product => {
        issues.push({
            issueType: 'NEGATIVE_STOCK',
            severity: 'CRITICAL',
            entityType: 'Product',
            entityId: product.id,
            description: `Product "${product.name}" (${product.code}) has negative stock: ${product.currentStock}`,
        });
    });

    return issues;
}

async function checkLedgerIntegrity(companyId: string) {
    const issues: any[] = [];

    // Check for ledgers with unusual balances
    const ledgers = await prisma.ledger.findMany({
        where: { companyId },
        select: {
            id: true,
            name: true,
            openingBalance: true,
            openingType: true,
        },
    });

    // Example: Check for ledgers with zero opening balance that might be misconfigured
    // (This is a simplified check - you can add more sophisticated validations)
    const suspiciousLedgers = ledgers.filter(ledger =>
        Number(ledger.openingBalance) === 0
    );

    if (suspiciousLedgers.length > 10) {
        issues.push({
            issueType: 'MULTIPLE_ZERO_BALANCE_LEDGERS',
            severity: 'WARNING',
            entityType: 'Ledger',
            description: `Found ${suspiciousLedgers.length} ledgers with zero opening balance`,
        });
    }

    return issues;
}

async function checkSequenceIntegrity(companyId: string) {
    const issues: any[] = [];

    // Check for sequence gaps (basic check)
    const sequences = await prisma.sequence.findMany({
        where: { companyId },
        select: {
            id: true,
            documentType: true,
            nextNumber: true,
            prefix: true,
        },
    });

    sequences.forEach(seq => {
        if (seq.nextNumber <= 0) {
            issues.push({
                issueType: 'INVALID_SEQUENCE',
                severity: 'CRITICAL',
                entityType: 'Sequence',
                entityId: seq.id,
                description: `Sequence for ${seq.documentType} has invalid nextNumber: ${seq.nextNumber}`,
            });
        }
    });

    return issues;
}
