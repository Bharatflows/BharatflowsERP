"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowForDocument = exports.deleteWorkflow = exports.toggleWorkflow = exports.updateWorkflow = exports.createWorkflow = exports.getWorkflow = exports.getWorkflows = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
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
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma_1.default.approvalWorkflow.count({ where }),
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
            data: workflow,
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
// @access  Private
const createWorkflow = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { name, documentType, description, thresholdAmount, steps, priority, } = req.body;
        if (!name || !documentType) {
            return res.status(400).json({
                success: false,
                message: 'Name and document type are required',
            });
        }
        // Check for existing workflow with same document type
        const existingWorkflow = await prisma_1.default.approvalWorkflow.findFirst({
            where: {
                companyId,
                documentType,
                active: true,
            },
        });
        if (existingWorkflow) {
            logger_1.default.warn('Active workflow already exists for document type:', documentType);
        }
        const workflow = await prisma_1.default.approvalWorkflow.create({
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
// @access  Private
const updateWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { name, description, documentType, thresholdAmount, steps, priority, active, } = req.body;
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
// @access  Private
const toggleWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
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
// @access  Private
const deleteWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
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
            });
        }
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
                workflow: workflow || null,
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