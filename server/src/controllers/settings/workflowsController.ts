import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';

// @desc    Get all approval workflows
// @route   GET /api/v1/settings/workflows
// @access  Private
export const getWorkflows = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { active, documentType, page = 1, limit = 20 } = req.query;

        const where: any = { companyId };
        if (active !== undefined) where.active = active === 'true';
        if (documentType) where.documentType = documentType;

        const skip = (Number(page) - 1) * Number(limit);

        const [workflows, total] = await Promise.all([
            prisma.approvalWorkflow.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.approvalWorkflow.count({ where }),
        ]);

        return res.json({
            success: true,
            data: {
                items: workflows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    } catch (error: any) {
        logger.error('Get workflows error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch workflows',
            error: error.message,
        });
    }
};

// @desc    Get single workflow
// @route   GET /api/v1/settings/workflows/:id
// @access  Private
export const getWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const workflow = await prisma.approvalWorkflow.findFirst({
            where: { id, companyId },
        });

        if (!workflow) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }

        return res.json({
            success: true,
            data: workflow,
        });
    } catch (error: any) {
        logger.error('Get workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow',
            error: error.message,
        });
    }
};

// @desc    Create approval workflow
// @route   POST /api/v1/settings/workflows
// @access  Private
export const createWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const {
            name,
            documentType,
            description,
            thresholdAmount,
            steps,
            priority,
        } = req.body;

        if (!name || !documentType) {
            return res.status(400).json({
                success: false,
                message: 'Name and document type are required',
            });
        }

        // Check for existing workflow with same document type
        const existingWorkflow = await prisma.approvalWorkflow.findFirst({
            where: {
                companyId,
                documentType,
                active: true,
            },
        });

        if (existingWorkflow) {
            logger.warn('Active workflow already exists for document type:', documentType);
        }

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                name,
                description,
                documentType,
                thresholdAmount: thresholdAmount || null,
                steps: steps || [],
                priority: priority || 1,
                active: true,
                companyId,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Workflow created successfully',
            data: workflow,
        });
    } catch (error: any) {
        logger.error('Create workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create workflow',
            error: error.message,
        });
    }
};

// @desc    Update approval workflow
// @route   PUT /api/v1/settings/workflows/:id
// @access  Private
export const updateWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const {
            name,
            description,
            documentType,
            thresholdAmount,
            steps,
            priority,
            active,
        } = req.body;

        const existing = await prisma.approvalWorkflow.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }

        const workflow = await prisma.approvalWorkflow.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(documentType && { documentType }),
                ...(thresholdAmount !== undefined && { thresholdAmount }),
                ...(steps && { steps }),
                ...(priority !== undefined && { priority }),
                ...(active !== undefined && { active }),
            },
        });

        return res.json({
            success: true,
            message: 'Workflow updated successfully',
            data: workflow,
        });
    } catch (error: any) {
        logger.error('Update workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update workflow',
            error: error.message,
        });
    }
};

// @desc    Toggle workflow active status
// @route   POST /api/v1/settings/workflows/:id/toggle
// @access  Private
export const toggleWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const existing = await prisma.approvalWorkflow.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }

        const workflow = await prisma.approvalWorkflow.update({
            where: { id },
            data: { active: !existing.active },
        });

        return res.json({
            success: true,
            message: `Workflow ${workflow.active ? 'activated' : 'deactivated'}`,
            data: workflow,
        });
    } catch (error: any) {
        logger.error('Toggle workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle workflow',
            error: error.message,
        });
    }
};

// @desc    Delete approval workflow
// @route   DELETE /api/v1/settings/workflows/:id
// @access  Private
export const deleteWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const existing = await prisma.approvalWorkflow.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }

        await prisma.approvalWorkflow.delete({
            where: { id },
        });

        return res.json({
            success: true,
            message: 'Workflow deleted successfully',
        });
    } catch (error: any) {
        logger.error('Delete workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete workflow',
            error: error.message,
        });
    }
};

// @desc    Get workflow for a specific document
// @route   GET /api/v1/settings/workflows/for-document
// @access  Private
export const getWorkflowForDocument = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { documentType, amount } = req.query;

        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: 'Document type is required',
            });
        }

        const workflow = await prisma.approvalWorkflow.findFirst({
            where: {
                companyId,
                documentType: documentType as string,
                active: true,
                OR: [
                    { thresholdAmount: null },
                    { thresholdAmount: { lte: Number(amount) || 0 } },
                ],
            },
            orderBy: { priority: 'desc' },
        });

        return res.json({
            success: true,
            data: {
                requiresApproval: !!workflow,
                workflow: workflow || null,
            },
        });
    } catch (error: any) {
        logger.error('Get workflow for document error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get workflow for document',
            error: error.message,
        });
    }
};
