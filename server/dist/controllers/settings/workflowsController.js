"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowForDocument = exports.deleteWorkflow = exports.toggleWorkflow = exports.updateWorkflow = exports.createWorkflow = exports.getWorkflow = exports.getWorkflows = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
const eventBus_1 = require("../../services/eventBus");
const zod_1 = require("zod");
// Workflow validation schema
const WorkflowCreateSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(3, 'Workflow name must be at least 3 characters')
        .max(100, 'Workflow name must be at most 100 characters'),
    documentType: zod_1.z.enum([
        'INVOICE',
        'PURCHASE_ORDER',
        'EXPENSE',
        'QUOTATION',
        'SALES_ORDER',
        'CREDIT_NOTE',
        'DEBIT_NOTE',
    ]),
    description: zod_1.z.string()
        .max(500, 'Description must be at most 500 characters')
        .optional(),
    thresholdAmount: zod_1.z.number()
        .min(0, 'Threshold must be positive')
        .nullable()
        .optional(),
    steps: zod_1.z.array(zod_1.z.object({
        order: zod_1.z.number().int().min(1),
        approverType: zod_1.z.enum(['USER', 'ROLE', 'ANY']),
        approverId: zod_1.z.string().optional(),
        roleId: zod_1.z.string().optional(),
    })).optional(),
    priority: zod_1.z.number()
        .int()
        .min(1)
        .max(10)
        .default(1),
});
const WorkflowUpdateSchema = WorkflowCreateSchema.partial();
// Validation helper
function validateWorkflow(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    }
    return { success: false, errors };
}
// @desc    Get all approval workflows
// @route   GET /api/v1/settings/workflows
// @access  Private
const getWorkflows = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { active, documentType, page = 1, limit = 20 } = req.query;
        const where = { companyId };
        if (active !== undefined)
            where.active = active === 'true';
        if (documentType)
            where.documentType = documentType;
        const skip = (Number(page) - 1) * Number(limit);
        const [workflows, total] = await Promise.all([
            prisma_1.default.approvalWorkflow.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: Number(limit),
            }),
            prisma_1.default.approvalWorkflow.count({ where }),
        ]);
        // Format response with additional metadata
        const formattedWorkflows = workflows.map(w => ({
            ...w,
            statusLabel: w.active ? 'Active' : 'Inactive',
            documentTypeLabel: w.documentType.replace(/_/g, ' '),
            hasThreshold: w.thresholdAmount !== null,
            stepsCount: Array.isArray(w.steps) ? w.steps.length : 0,
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
    }
    catch (error) {
        logger_1.default.error('Get workflows error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch workflows',
            error: error.message,
        });
    }
};
exports.getWorkflows = getWorkflows;
// @desc    Get single workflow
// @route   GET /api/v1/settings/workflows/:id
// @access  Private
const getWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const workflow = await prisma_1.default.approvalWorkflow.findFirst({
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
            data: {
                ...workflow,
                statusLabel: workflow.active ? 'Active' : 'Inactive',
                documentTypeLabel: workflow.documentType.replace(/_/g, ' '),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch workflow',
            error: error.message,
        });
    }
};
exports.getWorkflow = getWorkflow;
// @desc    Create approval workflow
// @route   POST /api/v1/settings/workflows
// @access  Private (Admin+)
const createWorkflow = async (req, res) => {
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
        const { name, documentType, description, thresholdAmount, steps, priority } = validation.data;
        // Check for duplicate workflow name
        const existingByName = await prisma_1.default.approvalWorkflow.findFirst({
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
        const existingActive = await prisma_1.default.approvalWorkflow.findFirst({
            where: {
                companyId,
                documentType,
                active: true,
            },
        });
        const workflow = await prisma_1.default.approvalWorkflow.create({
            data: {
                name,
                description: description || null,
                documentType,
                thresholdAmount: thresholdAmount ?? null,
                steps: JSON.stringify(steps || []),
                priority: priority || 1,
                active: true,
                companyId,
            },
        });
        // Emit audit event
        eventBus_1.eventBus.emit({
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
        logger_1.default.info(`Workflow ${workflow.id} created by ${userId}`);
        return res.status(201).json({
            success: true,
            message: 'Workflow created successfully',
            data: workflow,
            warning: existingActive
                ? `Note: An active workflow for ${documentType} already exists. Both will be active.`
                : undefined,
        });
    }
    catch (error) {
        logger_1.default.error('Create workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create workflow',
            error: error.message,
        });
    }
};
exports.createWorkflow = createWorkflow;
// @desc    Update approval workflow
// @route   PUT /api/v1/settings/workflows/:id
// @access  Private (Admin+)
const updateWorkflow = async (req, res) => {
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
        const existing = await prisma_1.default.approvalWorkflow.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }
        const { name, description, documentType, thresholdAmount, steps, priority, active } = req.body;
        // Check for duplicate name if name is being changed
        if (name && name !== existing.name) {
            const duplicateName = await prisma_1.default.approvalWorkflow.findFirst({
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
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (documentType !== undefined)
            updateData.documentType = documentType;
        if (thresholdAmount !== undefined)
            updateData.thresholdAmount = thresholdAmount;
        if (steps !== undefined)
            updateData.steps = JSON.stringify(steps);
        if (priority !== undefined)
            updateData.priority = priority;
        if (active !== undefined)
            updateData.active = active;
        const workflow = await prisma_1.default.approvalWorkflow.update({
            where: { id },
            data: updateData,
        });
        // Emit audit event
        eventBus_1.eventBus.emit({
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
        logger_1.default.info(`Workflow ${id} updated by ${userId}`);
        return res.json({
            success: true,
            message: 'Workflow updated successfully',
            data: workflow,
        });
    }
    catch (error) {
        logger_1.default.error('Update workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update workflow',
            error: error.message,
        });
    }
};
exports.updateWorkflow = updateWorkflow;
// @desc    Toggle workflow active status
// @route   POST /api/v1/settings/workflows/:id/toggle
// @access  Private (Admin+)
const toggleWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const existing = await prisma_1.default.approvalWorkflow.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }
        const workflow = await prisma_1.default.approvalWorkflow.update({
            where: { id },
            data: { active: !existing.active },
        });
        // Emit audit event
        eventBus_1.eventBus.emit({
            companyId,
            eventType: 'SETTINGS_CHANGED',
            aggregateType: 'Workflow',
            aggregateId: id,
            payload: {
                type: workflow.active ? 'WORKFLOW_ACTIVATED' : 'WORKFLOW_DEACTIVATED',
                workflowId: id,
            },
            metadata: {
                userId,
                source: 'api',
            },
        });
        logger_1.default.info(`Workflow ${id} ${workflow.active ? 'activated' : 'deactivated'} by ${userId}`);
        return res.json({
            success: true,
            message: `Workflow ${workflow.active ? 'activated' : 'deactivated'}`,
            data: workflow,
        });
    }
    catch (error) {
        logger_1.default.error('Toggle workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle workflow',
            error: error.message,
        });
    }
};
exports.toggleWorkflow = toggleWorkflow;
// @desc    Delete approval workflow
// @route   DELETE /api/v1/settings/workflows/:id
// @access  Private (Admin+)
const deleteWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const existing = await prisma_1.default.approvalWorkflow.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Workflow not found',
            });
        }
        await prisma_1.default.approvalWorkflow.delete({
            where: { id },
        });
        // Emit audit event
        eventBus_1.eventBus.emit({
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
        logger_1.default.info(`Workflow ${id} deleted by ${userId}`);
        return res.json({
            success: true,
            message: 'Workflow deleted successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Delete workflow error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete workflow',
            error: error.message,
        });
    }
};
exports.deleteWorkflow = deleteWorkflow;
// @desc    Get workflow for a specific document
// @route   GET /api/v1/settings/workflows/for-document
// @access  Private
const getWorkflowForDocument = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { documentType, amount } = req.query;
        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: 'Document type is required',
                errors: { documentType: 'This field is required' },
            });
        }
        // Find matching workflow based on document type and optional amount threshold
        const workflow = await prisma_1.default.approvalWorkflow.findFirst({
            where: {
                companyId,
                documentType: documentType,
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
                workflow: workflow ? {
                    id: workflow.id,
                    name: workflow.name,
                    steps: workflow.steps,
                    thresholdAmount: workflow.thresholdAmount,
                } : null,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get workflow for document error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get workflow for document',
            error: error.message,
        });
    }
};
exports.getWorkflowForDocument = getWorkflowForDocument;
//# sourceMappingURL=workflowsController.js.map