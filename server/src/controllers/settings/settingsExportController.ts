/**
 * Settings Export/Import Controller
 * 
 * Handles backup and restore of application settings.
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';

interface SettingsExport {
    version: string;
    exportedAt: string;
    companyId: string;
    company: {
        businessName: string;
        gstin?: string; // Corrected from gstNumber
        pan?: string;
        valuationMethod?: string;
        fiscalYear?: string; // Corrected from fiscalYearStart
        // timezone?: string; // Removed as not in top-level Company
        // tdsEnabled?: boolean;
        // gstRegistered?: boolean;
    };
    sequences: Array<{
        documentType: string;
        prefix: string;
        nextNumber: number;
        format: string;
        fiscalYear?: string; // Added to interface
    }>;
    workflows: Array<{
        name: string;
        documentType: string;
        isActive: boolean;
        steps: Array<{
            sequence: number;
            name: string;
            approverId?: string;
            role?: string;
        }>;
    }>;
    ipWhitelist: Array<{
        ipAddress: string;
        description?: string;
        type: string;
        enabled: boolean;
    }>;
    expenseCategories: Array<{
        name: string;
        description?: string;
        budget?: number;
        color?: string;
    }>;
}

/**
 * GET /api/v1/settings/export
 * 
 * Export all settings as JSON for backup
 */
export const exportSettings = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;

        // Fetch company details
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: {
                businessName: true,
                gstin: true, // Corrected
                pan: true,
                valuationMethod: true,
                fiscalYear: true, // Corrected
                // timezone: true,
                // tdsEnabled: true,
                // gstRegistered: true,
            },
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Fetch sequences
        const sequences = await prisma.sequence.findMany({
            where: { companyId },
            select: {
                documentType: true,
                prefix: true,
                nextNumber: true,
                format: true,
                fiscalYear: true, // Added missing field
            },
        });

        // Fetch approval workflows
        const workflows = await prisma.approvalWorkflow.findMany({
            where: { companyId },
            select: {
                name: true,
                documentType: true,
                isActive: true,
            },
            // Include steps from ApprovalStep relation
        });

        // Also fetch steps for each workflow
        const workflowIds = workflows.map(w => (w as any).id);
        const allSteps = await prisma.approvalStep.findMany({
            where: { workflowId: { in: workflowIds } },
            orderBy: { sequence: 'asc' },
        });

        // Fetch IP whitelist (without sensitive data)
        const ipWhitelist = await prisma.iPWhitelist.findMany({
            where: { companyId },
            select: {
                ipAddress: true,
                description: true,
                type: true,
                enabled: true,
            },
        });

        // Fetch expense categories
        const expenseCategories = await prisma.expenseCategory.findMany({
            where: { companyId },
            select: {
                name: true,
                description: true,
                budget: true,
                color: true,
            },
        });

        const exportData: SettingsExport = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            companyId,
            company: company as any,
            sequences: sequences.map(s => ({
                ...s,
                fiscalYear: s.fiscalYear || undefined,
                nextNumber: s.nextNumber || 1,
                format: s.format || '{PREFIX}-{NUMBER}',
            })),
            workflows: workflows.map(w => ({
                ...w,
                isActive: w.isActive,
                steps: [],
            })),
            ipWhitelist: ipWhitelist.map(ip => ({
                ...ip,
                description: ip.description || undefined,
            })),
            expenseCategories: expenseCategories.map(e => ({
                ...e,
                budget: e.budget ? Number(e.budget) : undefined,
                description: e.description || undefined,
            })),
        };

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=settings-backup-${new Date().toISOString().split('T')[0]}.json`
        );

        return res.json(exportData);
    } catch (error: any) {
        console.error('Error exporting settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to export settings',
            error: error.message,
        });
    }
};

/**
 * POST /api/v1/settings/import
 * 
 * Import settings from JSON backup
 */
export const importSettings = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        const importData: SettingsExport = req.body;

        // Validate import data
        if (!importData.version || !importData.exportedAt) {
            return res.status(400).json({
                success: false,
                message: 'Invalid settings file format',
            });
        }

        const results = {
            company: false,
            sequences: 0,
            workflows: 0,
            ipWhitelist: 0,
            expenseCategories: 0,
            errors: [] as string[],
        };

        // Update company settings (selective fields only)
        if (importData.company) {
            try {
                await prisma.company.update({
                    where: { id: companyId },
                    data: {
                        valuationMethod: importData.company.valuationMethod,
                        fiscalYear: importData.company.fiscalYear,
                        // timezone: importData.company.timezone,
                        // tdsEnabled: importData.company.tdsEnabled,
                        // gstRegistered: importData.company.gstRegistered,
                    },
                });
                results.company = true;
            } catch (error: any) {
                results.errors.push(`Company settings: ${error.message}`);
            }
        }

        // Import sequences (upsert)
        if (importData.sequences && importData.sequences.length > 0) {
            for (const seq of importData.sequences) {
                try {
                    await prisma.sequence.upsert({
                        where: {
                            companyId_documentType_fiscalYear: {
                                companyId,
                                documentType: seq.documentType,
                                fiscalYear: seq.fiscalYear || ""
                            },
                        },
                        update: {
                            prefix: seq.prefix,
                            format: seq.format,
                        },
                        create: {
                            companyId,
                            documentType: seq.documentType,
                            prefix: seq.prefix,
                            nextNumber: seq.nextNumber,
                            format: seq.format,
                            fiscalYear: seq.fiscalYear || ""
                        },
                    });
                    results.sequences++;
                } catch (error: any) {
                    results.errors.push(`Sequence ${seq.documentType}: ${error.message}`);
                }
            }
        }

        // Import workflows (create only if name doesn't exist)
        if (importData.workflows && importData.workflows.length > 0) {
            for (const wf of importData.workflows) {
                try {
                    const existing = await prisma.approvalWorkflow.findFirst({
                        where: { companyId, name: wf.name },
                    });

                    if (!existing) {
                        await prisma.approvalWorkflow.create({
                            data: {
                                companyId,
                                name: wf.name,
                                documentType: wf.documentType,
                                isActive: wf.isActive ?? true,
                            },
                        });
                        results.workflows++;
                    }
                } catch (error: any) {
                    results.errors.push(`Workflow ${wf.name}: ${error.message}`);
                }
            }
        }

        // Import IP whitelist
        if (importData.ipWhitelist && importData.ipWhitelist.length > 0) {
            for (const ip of importData.ipWhitelist) {
                try {
                    const existing = await prisma.iPWhitelist.findFirst({
                        where: { companyId, ipAddress: ip.ipAddress },
                    });

                    if (!existing) {
                        await prisma.iPWhitelist.create({
                            data: {
                                companyId,
                                ipAddress: ip.ipAddress,
                                description: ip.description,
                                type: ip.type,
                                enabled: ip.enabled,
                                createdBy: req.user.id,
                            },
                        });
                        results.ipWhitelist++;
                    }
                } catch (error: any) {
                    results.errors.push(`IP ${ip.ipAddress}: ${error.message}`);
                }
            }
        }

        // Import expense categories
        if (importData.expenseCategories && importData.expenseCategories.length > 0) {
            for (const cat of importData.expenseCategories) {
                try {
                    const existing = await prisma.expenseCategory.findFirst({
                        where: { companyId, name: cat.name },
                    });

                    if (!existing) {
                        await prisma.expenseCategory.create({
                            data: {
                                companyId,
                                name: cat.name,
                                description: cat.description,
                                budget: cat.budget,
                                color: cat.color || '#6366f1',
                            },
                        });
                        results.expenseCategories++;
                    }
                } catch (error: any) {
                    results.errors.push(`Category ${cat.name}: ${error.message}`);
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Settings imported successfully',
            data: {
                imported: {
                    company: results.company,
                    sequences: results.sequences,
                    workflows: results.workflows,
                    ipWhitelist: results.ipWhitelist,
                    expenseCategories: results.expenseCategories,
                },
                errors: results.errors,
            },
        });
    } catch (error: any) {
        console.error('Error importing settings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to import settings',
            error: error.message,
        });
    }
};
