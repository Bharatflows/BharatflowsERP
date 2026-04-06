/**
 * Support Controller
 * Handles support issues/tickets and helpdesk operations
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Get all support issues for a company
 */
export const getIssues = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { status, priority, assignedTo, customerId, type, page = '1', limit = '20' } = req.query;

    const where: any = { companyId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (customerId) where.customerId = customerId;
    if (type) where.type = type;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          sla: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        skip,
        take,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      success: true,
      data: issues,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching issues:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single issue by ID
 */
export const getIssue = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const issue = await prisma.issue.findFirst({
      where: { id, companyId },
      include: {
        sla: true,
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    return res.json({ success: true, data: issue });
  } catch (error: any) {
    logger.error('Error fetching issue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new support issue
 */
export const createIssue = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const {
      subject,
      description,
      priority,
      type,
      category,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      assignedTo,
      slaId,
      relatedInvoiceId,
      relatedProductId,
    } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required',
      });
    }

    // Generate issue number
    const issueCount = await prisma.issue.count({ where: { companyId } });
    const issueNumber = `ISS-${(issueCount + 1).toString().padStart(6, '0')}`;

    // Get default SLA if none specified
    let resolvedSlaId = slaId;
    if (!resolvedSlaId) {
      const defaultSla = await prisma.sLA.findFirst({
        where: { companyId, isDefault: true, isActive: true },
      });
      resolvedSlaId = defaultSla?.id || null;
    }

    // Calculate SLA due dates if SLA is set
    let slaFirstResponseDue: Date | null = null;
    let slaResolutionDue: Date | null = null;

    if (resolvedSlaId) {
      const sla = await prisma.sLA.findUnique({ where: { id: resolvedSlaId } });
      if (sla) {
        const now = new Date();
        slaFirstResponseDue = new Date(now.getTime() + sla.firstResponseTime * 60 * 60 * 1000);
        slaResolutionDue = new Date(now.getTime() + sla.resolutionTime * 60 * 60 * 1000);
      }
    }

    const issue = await prisma.issue.create({
      data: {
        companyId,
        issueNumber,
        subject,
        description: description || null,
        priority: priority || 'MEDIUM',
        type: type || 'SUPPORT',
        category: category || null,
        status: 'OPEN',
        customerId: customerId || null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        assignedTo: assignedTo || null,
        assignedAt: assignedTo ? new Date() : null,
        slaId: resolvedSlaId,
        slaFirstResponseDue,
        slaResolutionDue,
        relatedInvoiceId: relatedInvoiceId || null,
        relatedProductId: relatedProductId || null,
        createdBy: userId,
      },
      include: {
        sla: { select: { id: true, name: true } },
      },
    });

    logger.info(`Support issue ${issue.issueNumber} created by user ${userId}`);
    return res.status(201).json({ success: true, data: issue });
  } catch (error: any) {
    logger.error('Error creating issue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a support issue
 */
export const updateIssue = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const {
      subject,
      description,
      priority,
      type,
      category,
      status,
      assignedTo,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;

    const existing = await prisma.issue.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Track status change timestamps
    const updateData: any = {
      subject,
      description,
      priority,
      type,
      category,
      status,
      customerName,
      customerEmail,
      customerPhone,
    };

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
      if (assignedTo && !existing.assignedTo) {
        updateData.assignedAt = new Date();
      }
    }

    if (status === 'CLOSED' && existing.status !== 'CLOSED') {
      updateData.closedAt = new Date();
    }
    if (status === 'RESOLVED' && existing.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        sla: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, data: issue });
  } catch (error: any) {
    logger.error('Error updating issue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a support issue
 */
export const deleteIssue = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const issue = await prisma.issue.findFirst({
      where: { id, companyId },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    await prisma.issue.delete({ where: { id } });

    return res.json({ success: true, message: 'Issue deleted' });
  } catch (error: any) {
    logger.error('Error deleting issue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add a comment to an issue
 */
export const addComment = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;
    const { content, isInternal, type } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const issue = await prisma.issue.findFirst({
      where: { id, companyId },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const comment = await prisma.issueComment.create({
      data: {
        issueId: id,
        content,
        isInternal: isInternal ?? false,
        type: type || 'COMMENT',
        createdBy: userId,
        createdByName: req.user!.email,
      },
    });

    // Update first response time if this is the first response
    if (!issue.firstRespondedAt) {
      const now = new Date();
      const updateData: any = { firstRespondedAt: now };

      // Check if SLA first response was breached
      if (issue.slaFirstResponseDue && now > issue.slaFirstResponseDue) {
        updateData.slaFirstResponseBreached = true;
      }

      await prisma.issue.update({
        where: { id },
        data: updateData,
      });
    }

    return res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    logger.error('Error adding comment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Assign issue to user
 */
export const assignIssue = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { assignedTo } = req.body;

    const issue = await prisma.issue.findFirst({
      where: { id, companyId },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        assignedTo,
        assignedAt: new Date(),
        status: issue.status === 'OPEN' ? 'IN_PROGRESS' : issue.status,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error assigning issue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Resolve an issue
 */
export const resolveIssue = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const issue = await prisma.issue.findFirst({
      where: { id, companyId },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const now = new Date();
    const updateData: any = {
      status: 'RESOLVED',
      resolvedAt: now,
    };

    // Check if SLA resolution was breached
    if (issue.slaResolutionDue && now > issue.slaResolutionDue) {
      updateData.slaResolutionBreached = true;
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: updateData,
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error resolving issue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Close an issue
 */
export const closeIssue = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const issue = await prisma.issue.findFirst({
      where: { id, companyId },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error closing issue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reopen an issue
 */
export const reopenIssue = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const issue = await prisma.issue.findFirst({
      where: { id, companyId },
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        status: 'OPEN',
        closedAt: null,
        resolvedAt: null,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error reopening issue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get issue statistics
 */
export const getIssueStats = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;

    const [total, byStatus, byPriority, slaBreaches] = await Promise.all([
      prisma.issue.count({ where: { companyId } }),
      prisma.issue.groupBy({
        by: ['status'],
        where: { companyId },
        _count: true,
      }),
      prisma.issue.groupBy({
        by: ['priority'],
        where: { companyId },
        _count: true,
      }),
      prisma.issue.count({
        where: {
          companyId,
          OR: [
            { slaFirstResponseBreached: true },
            { slaResolutionBreached: true },
          ],
        },
      }),
    ]);

    const stats = {
      total,
      byStatus: byStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc: any, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {}),
      openIssues: byStatus.find((s) => s.status === 'OPEN')?._count || 0,
      inProgressIssues: byStatus.find((s) => s.status === 'IN_PROGRESS')?._count || 0,
      slaBreaches,
    };

    return res.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('Error fetching issue stats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get my assigned issues
 */
export const getMyIssues = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { status, page = '1', limit = '20' } = req.query;

    const where: any = { companyId, assignedTo: userId };
    if (status) where.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          _count: { select: { comments: true } },
        },
        skip,
        take,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      success: true,
      data: issues,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching my issues:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get SLA definitions
 */
export const getSLAs = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;

    const slas = await prisma.sLA.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: slas });
  } catch (error: any) {
    logger.error('Error fetching SLAs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create SLA definition
 */
export const createSLA = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const {
      name,
      description,
      firstResponseTime,
      resolutionTime,
      priorityTargets,
      workingHoursOnly,
      workingHoursStart,
      workingHoursEnd,
      workingDays,
      isDefault,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'SLA name is required',
      });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.sLA.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const sla = await prisma.sLA.create({
      data: {
        companyId,
        name,
        description: description || null,
        firstResponseTime: firstResponseTime ?? 4,
        resolutionTime: resolutionTime ?? 24,
        priorityTargets: priorityTargets || null,
        workingHoursOnly: workingHoursOnly ?? true,
        workingHoursStart: workingHoursStart || '09:00',
        workingHoursEnd: workingHoursEnd || '18:00',
        workingDays: workingDays || '[1,2,3,4,5]',
        isDefault: isDefault ?? false,
        isActive: true,
      },
    });

    return res.status(201).json({ success: true, data: sla });
  } catch (error: any) {
    logger.error('Error creating SLA:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  addComment,
  assignIssue,
  resolveIssue,
  closeIssue,
  reopenIssue,
  getIssueStats,
  getMyIssues,
  getSLAs,
  createSLA,
};
