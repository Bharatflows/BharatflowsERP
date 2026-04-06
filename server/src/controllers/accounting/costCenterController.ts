import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PrismaClient } from '@prisma/client';
import logger from '../../config/logger';

const prisma = new PrismaClient();

/**
 * Get all cost centers for a company
 */
export const getCostCenters = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { flat } = req.query; // If 'true', return flat list. If false/undefined, return hierarchical tree (handled in frontend usually, but we can fetch relations)

        const costCenters = await prisma.costCenter.findMany({
            where: { companyId },
            include: {
                parent: {
                    select: { id: true, name: true },
                },
                _count: {
                    select: { children: true, ledgers: true, budgetItems: true }
                }
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: costCenters,
        });
    } catch (error) {
        logger.error('Error fetching cost centers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cost centers',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Get a single cost center
 */
export const getCostCenter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const costCenter = await prisma.costCenter.findFirst({
            where: { id, companyId },
            include: {
                parent: {
                    select: { id: true, name: true },
                },
                children: {
                    select: { id: true, name: true, code: true },
                },
                _count: {
                    select: { ledgers: true, budgetItems: true }
                }
            },
        });

        if (!costCenter) {
            return res.status(404).json({
                success: false,
                message: 'Cost center not found',
            });
        }

        res.json({
            success: true,
            data: costCenter,
        });
    } catch (error) {
        logger.error(`Error fetching cost center ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cost center',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Create a new cost center
 */
export const createCostCenter = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { name, code, description, parentId } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required',
            });
        }

        // Check duplicate name
        const existing = await prisma.costCenter.findFirst({
            where: { companyId, name },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Cost center with this name already exists',
            });
        }

        // Verify parent if provided
        if (parentId) {
            const parent = await prisma.costCenter.findFirst({
                where: { id: parentId, companyId },
            });
            if (!parent) {
                return res.status(400).json({
                    success: false,
                    message: 'Parent cost center not found',
                });
            }
        }

        const costCenter = await prisma.costCenter.create({
            data: {
                companyId,
                name,
                code,
                description,
                parentId: parentId || null,
            },
            include: {
                parent: { select: { id: true, name: true } },
            },
        });

        res.status(201).json({
            success: true,
            data: costCenter,
            message: 'Cost center created successfully',
        });
    } catch (error) {
        logger.error('Error creating cost center:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating cost center',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Update a cost center
 */
export const updateCostCenter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;
        const { name, code, description, parentId } = req.body;

        const costCenter = await prisma.costCenter.findFirst({
            where: { id, companyId },
        });

        if (!costCenter) {
            return res.status(404).json({
                success: false,
                message: 'Cost center not found',
            });
        }

        // Prevent circular dependency if parentId is being updated
        if (parentId) {
            if (parentId === id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cost center cannot be its own parent',
                });
            }

            // Check if new parent is a descendant of this cost center
            // This is a simple BFS check for creating a loop
            let currentParentId = parentId;
            while (currentParentId) {
                const potentialParent = await prisma.costCenter.findUnique({
                    where: { id: currentParentId },
                    select: { parentId: true }
                });

                if (!potentialParent) break;
                if (potentialParent.parentId === id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot set a descendant as parent (circular reference)',
                    });
                }
                currentParentId = potentialParent.parentId;
            }

            // Verify parent existence
            const parent = await prisma.costCenter.findFirst({
                where: { id: parentId, companyId },
            });
            if (!parent) {
                return res.status(400).json({
                    success: false,
                    message: 'Parent cost center not found',
                });
            }
        }

        const updatedCostCenter = await prisma.costCenter.update({
            where: { id },
            data: {
                name,
                code,
                description,
                parentId: parentId === null ? null : parentId, // Handle Explicit null to remove parent
            },
            include: {
                parent: { select: { id: true, name: true } },
            },
        });

        res.json({
            success: true,
            data: updatedCostCenter,
            message: 'Cost center updated successfully',
        });
    } catch (error) {
        logger.error(`Error updating cost center ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error updating cost center',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Delete a cost center
 */
export const deleteCostCenter = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const costCenter = await prisma.costCenter.findFirst({
            where: { id, companyId },
            include: {
                _count: {
                    select: { children: true, ledgers: true, budgetItems: true }
                }
            },
        });

        if (!costCenter) {
            return res.status(404).json({
                success: false,
                message: 'Cost center not found',
            });
        }

        if (costCenter._count.children > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete cost center with sub-cost centers. Move or delete them first.',
            });
        }

        if (costCenter._count.ledgers > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete cost center with linked ledger postings.',
            });
        }

        if (costCenter._count.budgetItems > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete cost center with linked budget items.',
            });
        }

        await prisma.costCenter.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Cost center deleted successfully',
        });
    } catch (error) {
        logger.error(`Error deleting cost center ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error deleting cost center',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export default {
    getCostCenters,
    getCostCenter,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter
};
