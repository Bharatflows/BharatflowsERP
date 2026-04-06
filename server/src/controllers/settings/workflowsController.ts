import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { eventBus } from '../../services/eventBus';
import { z } from 'zod';

// Workflow validation schema
const WorkflowCreateSchema = z.object({
    name: z.string()
        .min(3, 'Workflow name must be at least 3 characters')
        .max(100, 'Workflow name must be at most 100 characters'),
    documentType: z.enum([
        'INVOICE',
        'PURCHASE_ORDER',
        'EXPENSE',
        'QUOTATION',
        'SALES_ORDER',
        'CREDIT_NOTE',
        'DEBIT_NOTE',
    ]),
    description: z.string()
        .max(500, 'Description must be at most 500 characters')
        .optional(),
    steps: z.array(z.object({
        sequence: z.number().int().min(1),
        name: z.string().min(1),
        approverId: z.string().optional(),
        role: z.string().optional(),
        minAmount: z.number().min(0).nullable().optional(),
        maxAmount: z.number().min(0).nullable().optional(),
    })).optional(),
});

const WorkflowUpdateSchema = WorkflowCreateSchema.partial();

// Validation helper
function validateWorkflow<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    }
    return { success: false, errors };
}

// @desc    Get all approval workflows
// @route   GET /api/v1/settings/workflows
// @access  Private
export const getWorkflows = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const { active, documentType, page = 1, limit = 20 } = req.query;

        const where: any = { companyId };
        if (active !== undefined) where.isActive = active === 'true';
        if (documentType) where.documentType = documentType;

        const skip = (Number(page) - 1) * Number(limit);

        const [workflows, total] = await Promise.all([
            prisma.approvalWorkflow.findMany({
                where,
                include: { steps: { orderBy: { sequence: 'asc' } } },
                orderBy: { name: 'asc' },
                skip,
                take: Number(limit),
            }),
            prisma.approvalWorkflow.count({ where }),
        ]);

        // Format response with additional metadata
        const formattedWorkflows = workflows.map(w => ({
            ...w,
            statusLabel: w.isActive ? 'Active' : 'Inactive',
            documentTypeLabel: w.documentType.replace(/_/g, ' '),
            stepsCount: w.steps.length,
        }));

        return res.json({
            success: true,
            data: {
                items: formattedWorkflows,
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
            include: { steps: { orderBy: { sequence: 'asc' } } },
        });

        if (!workflow) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }

        return res.json({
            success: true,
            data: {
                ...workflow,
                statusLabel: workflow.isActive ? 'Active' : 'Inactive',
                documentTypeLabel: workflow.documentType.replace(/_/g, ' '),
            },
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
// @access  Private (Admin+)
export const createWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;

        // Validate input
        const validation = validateWorkflow(WorkflowCreateSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors,
            });
        }

        const { name, documentType, description, steps } = validation.data;

        // Check for duplicate workflow name
        const existingByName = await prisma.approvalWorkflow.findFirst({
            where: { companyId, name },
        });

        if (existingByName) {
            return res.status(400).json({
                success: false,
                message: 'A workflow with this name already exists',
                errors: { name: 'Workflow name must be unique' },
            });
        }

        // Warn if active workflow for same document type exists
        const existingActive = await prisma.approvalWorkflow.findFirst({
            where: {
                companyId,
                documentType,
                isActive: true,
            },
        });

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                name,
                description: description || null,
                documentType,
                isActive: true,
                companyId,
                steps: steps && steps.length > 0 ? {
                    create: steps.map(s => ({
                        sequence: s.sequence,
                        name: s.name,
                        approverId: s.approverId || null,
                        role: s.role || null,
                        minAmount: s.minAmount ?? 0,
                        maxAmount: s.maxAmount ?? null,
                    })),
                } : undefined,
            },
            include: { steps: { orderBy: { sequence: 'asc' } } },
        });

        // Emit audit event
        eventBus.emit({
            companyId,
            eventType: 'SETTINGS_CHANGED',
            aggregateType: 'Workflow',
            aggregateId: workflow.id,
            payload: {
                type: 'WORKFLOW_CREATED',
                workflowId: workflow.id,
                name: workflow.name,
                documentType: workflow.documentType,
            },
            metadata: {
                userId,
                source: 'api',
            },
        });

        logger.info(`Workflow ${workflow.id} created by ${userId}`);

        return res.status(201).json({
            success: true,
            message: 'Workflow created successfully',
            data: workflow,
            warning: existingActive
                ? `Note: An active workflow for ${documentType} already exists. Both will be active.`
                : undefined,
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
// @access  Private (Admin+)
export const updateWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.id;

        // Validate input
        const validation = validateWorkflow(WorkflowUpdateSchema, req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors,
            });
        }

        const existing = await prisma.approvalWorkflow.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }

        const { name, description, documentType, steps } = req.body;
        const isActive = req.body.isActive ?? req.body.active;

        // Check for duplicate name if name is being changed
        if (name && name !== existing.name) {
            const duplicateName = await prisma.approvalWorkflow.findFirst({
                where: { companyId, name, id: { not: id } },
            });
            if (duplicateName) {
                return res.status(400).json({
                    success: false,
                    message: 'A workflow with this name already exists',
                    errors: { name: 'Workflow name must be unique' },
                });
            }
        }

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (documentType !== undefined) updateData.documentType = documentType;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Handle steps update: delete existing and recreate
        if (steps !== undefined) {
            await prisma.approvalStep.deleteMany({ where: { workflowId: id } });
            if (Array.isArray(steps) && steps.length > 0) {
                updateData.steps = {
                    create: steps.map((s: any) => ({
                        sequence: s.sequence || s.order || 1,
                        name: s.name || `Step ${s.sequence || s.order || 1}`,
                        approverId: s.approverId || null,
                        role: s.role || null,
                        minAmount: s.minAmount ?? 0,
                        maxAmount: s.maxAmount ?? null,
                    })),
                };
            }
        }

        const workflow = await prisma.approvalWorkflow.update({
            where: { id },
            data: updateData,
            include: { steps: { orderBy: { sequence: 'asc' } } },
        });

        // Emit audit event
        eventBus.emit({
            companyId,
            eventType: 'SETTINGS_CHANGED',
            aggregateType: 'Workflow',
            aggregateId: id,
            payload: {
                type: 'WORKFLOW_UPDATED',
                workflowId: id,
                changes: updateData,
            },
            metadata: {
                userId,
                source: 'api',
            },
        });

        logger.info(`Workflow ${id} updated by ${userId}`);

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
// @access  Private (Admin+)
export const toggleWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.id;

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
            data: { isActive: !existing.isActive },
        });

        // Emit audit event
        eventBus.emit({
            companyId,
            eventType: 'SETTINGS_CHANGED',
            aggregateType: 'Workflow',
            aggregateId: id,
            payload: {
                type: workflow.isActive ? 'WORKFLOW_ACTIVATED' : 'WORKFLOW_DEACTIVATED',
                workflowId: id,
            },
            metadata: {
                userId,
                source: 'api',
            },
        });

        logger.info(`Workflow ${id} ${workflow.isActive ? 'activated' : 'deactivated'} by ${userId}`);

        return res.json({
            success: true,
            message: `Workflow ${workflow.isActive ? 'activated' : 'deactivated'}`,
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
// @access  Private (Admin+)
export const deleteWorkflow = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.id;

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

        // Emit audit event
        eventBus.emit({
            companyId,
            eventType: 'SETTINGS_CHANGED',
            aggregateType: 'Workflow',
            aggregateId: id,
            payload: {
                type: 'WORKFLOW_DELETED',
                workflowId: id,
                workflowName: existing.name,
            },
            metadata: {
                userId,
                source: 'api',
            },
        });

        logger.info(`Workflow ${id} deleted by ${userId}`);

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
        const { documentType } = req.query;

        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: 'Document type is required',
                errors: { documentType: 'This field is required' },
            });
        }

        // Find matching workflow based on document type
        const workflow = await prisma.approvalWorkflow.findFirst({
            where: {
                companyId,
                documentType: documentType as string,
                isActive: true,
            },
            include: { steps: { orderBy: { sequence: 'asc' } } },
        });

        return res.json({
            success: true,
            data: {
                requiresApproval: !!workflow,
                workflow: workflow ? {
                    id: workflow.id,
                    name: workflow.name,
                    steps: workflow.steps,
                } : null,
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
