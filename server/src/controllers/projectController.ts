/**
 * Project Controller
 * Handles project management operations
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Get all projects for a company
 */
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { status, customerId, page = '1', limit = '20' } = req.query;

    const where: any = { companyId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { tasks: true, timesheetEntries: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single project by ID
 */
export const getProject = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        tasks: true,
        timesheetEntries: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    return res.json({ success: true, data: project });
  } catch (error: any) {
    logger.error('Error fetching project:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new project
 */
export const createProject = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const {
      name,
      customerId,
      startDate,
      endDate,
      estimatedCost,
      status,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    const project = await prisma.project.create({
      data: {
        companyId,
        name,
        customerId: customerId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        estimatedCost: estimatedCost ?? 0,
        status: status || 'ACTIVE',
      },
      include: {
        customer: true,
      },
    });

    logger.info(`Project ${project.id} created`);
    return res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    logger.error('Error creating project:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a project
 */
export const updateProject = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const {
      name,
      customerId,
      startDate,
      endDate,
      estimatedCost,
      actualCost,
      status,
    } = req.body;

    const existing = await prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        customerId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        estimatedCost,
        actualCost,
        status,
      },
      include: {
        customer: true,
      },
    });

    return res.json({ success: true, data: project });
  } catch (error: any) {
    logger.error('Error updating project:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
      include: { _count: { select: { timesheetEntries: true } } },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project._count.timesheetEntries > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete project with existing timesheet entries',
      });
    }

    await prisma.project.delete({ where: { id } });

    return res.json({ success: true, message: 'Project deleted' });
  } catch (error: any) {
    logger.error('Error deleting project:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get project tasks
 */
export const getProjectTasks = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: tasks });
  } catch (error: any) {
    logger.error('Error fetching project tasks:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a project task
 */
export const createProjectTask = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { title, description, assignedTo, estimatedHours, dueDate, status, priority } = req.body;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const task = await prisma.task.create({
      data: {
        projectId: id,
        title,
        description: description || null,
        assignedTo: assignedTo || null,
        estimatedHours: estimatedHours ?? 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'OPEN',
        priority: priority || 'MEDIUM',
      },
    });

    return res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    logger.error('Error creating project task:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a project task
 */
export const updateProjectTask = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { taskId } = req.params;
    const { title, description, assignedTo, estimatedHours, actualHours, dueDate, status, priority } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task || task.project.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        assignedTo,
        estimatedHours,
        actualHours,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        priority,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error updating project task:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a project task
 */
export const deleteProjectTask = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task || task.project.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return res.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    logger.error('Error deleting project task:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get project summary/dashboard
 */
export const getProjectSummary = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
      include: {
        tasks: true,
        timesheetEntries: true,
        customer: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Calculate summary metrics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
    const totalHoursLogged = project.timesheetEntries.reduce((sum, ts) => sum + Number(ts.hours || 0), 0);
    const totalEstimatedHours = project.tasks.reduce((sum, t) => sum + Number(t.estimatedHours || 0), 0);

    return res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          estimatedCost: project.estimatedCost,
          actualCost: project.actualCost,
        },
        customer: project.customer,
        metrics: {
          totalTasks,
          completedTasks,
          taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
          totalHoursLogged,
          totalEstimatedHours,
          hoursVariance: totalEstimatedHours - totalHoursLogged,
        },
      },
    });
  } catch (error: any) {
    logger.error('Error fetching project summary:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProjectSummary,
};
