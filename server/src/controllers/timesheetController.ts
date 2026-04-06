/**
 * Timesheet Controller
 * Handles timesheet and time tracking operations
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Get all timesheets for a company
 */
export const getTimesheets = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { employeeId, startDate, endDate, status, page = '1', limit = '20' } = req.query;

    const where: any = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate as string);
      if (endDate) where.startDate.lte = new Date(endDate as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        include: {
          entries: {
            include: {
              project: { select: { id: true, name: true } },
              task: { select: { id: true, title: true } },
            },
          },
        },
        skip,
        take,
        orderBy: { startDate: 'desc' },
      }),
      prisma.timesheet.count({ where }),
    ]);

    res.json({
      success: true,
      data: timesheets,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching timesheets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single timesheet by ID
 */
export const getTimesheet = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const timesheet = await prisma.timesheet.findFirst({
      where: { id, companyId },
      include: {
        entries: {
          include: {
            project: true,
            task: true,
          },
        },
      },
    });

    if (!timesheet) {
      return res.status(404).json({ success: false, message: 'Timesheet not found' });
    }

    return res.json({ success: true, data: timesheet });
  } catch (error: any) {
    logger.error('Error fetching timesheet:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new timesheet
 */
export const createTimesheet = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const {
      employeeId,
      startDate,
      endDate,
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        companyId,
        employeeId: employeeId || null,
        userId: userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'DRAFT',
        totalHours: 0,
        billableHours: 0,
      },
    });

    logger.info(`Timesheet ${timesheet.id} created by user ${userId}`);
    return res.status(201).json({ success: true, data: timesheet });
  } catch (error: any) {
    logger.error('Error creating timesheet:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a timesheet
 */
export const updateTimesheet = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const {
      startDate,
      endDate,
    } = req.body;

    const existing = await prisma.timesheet.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Timesheet not found' });
    }

    if (existing.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update an approved timesheet',
      });
    }

    const timesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return res.json({ success: true, data: timesheet });
  } catch (error: any) {
    logger.error('Error updating timesheet:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a timesheet
 */
export const deleteTimesheet = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const timesheet = await prisma.timesheet.findFirst({
      where: { id, companyId },
    });

    if (!timesheet) {
      return res.status(404).json({ success: false, message: 'Timesheet not found' });
    }

    if (timesheet.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an approved timesheet',
      });
    }

    await prisma.timesheet.delete({ where: { id } });

    return res.json({ success: true, message: 'Timesheet deleted' });
  } catch (error: any) {
    logger.error('Error deleting timesheet:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add entry to timesheet
 */
export const addTimesheetEntry = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { date, hours, projectId, taskId, activityType, description, isBillable, billingRate } = req.body;

    const timesheet = await prisma.timesheet.findFirst({
      where: { id, companyId },
    });

    if (!timesheet) {
      return res.status(404).json({ success: false, message: 'Timesheet not found' });
    }

    if (timesheet.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add entries to an approved timesheet',
      });
    }

    const entry = await prisma.timesheetEntry.create({
      data: {
        timesheetId: id,
        date: new Date(date),
        hours: parseFloat(hours),
        projectId: projectId || null,
        taskId: taskId || null,
        activityType: activityType || null,
        description: description || null,
        isBillable: isBillable ?? true,
        billingRate: billingRate ?? null,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // Update timesheet totals
    const entries = await prisma.timesheetEntry.findMany({
      where: { timesheetId: id },
    });
    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
    const billableHours = entries.filter(e => e.isBillable).reduce((sum, e) => sum + Number(e.hours), 0);

    await prisma.timesheet.update({
      where: { id },
      data: { totalHours, billableHours },
    });

    return res.status(201).json({ success: true, data: entry });
  } catch (error: any) {
    logger.error('Error adding timesheet entry:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update timesheet entry
 */
export const updateTimesheetEntry = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { entryId } = req.params;
    const { date, hours, projectId, taskId, activityType, description, isBillable, billingRate } = req.body;

    const entry = await prisma.timesheetEntry.findUnique({
      where: { id: entryId },
      include: { timesheet: true },
    });

    if (!entry || entry.timesheet.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    if (entry.timesheet.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update entries in an approved timesheet',
      });
    }

    const updated = await prisma.timesheetEntry.update({
      where: { id: entryId },
      data: {
        date: date ? new Date(date) : undefined,
        hours: hours ? parseFloat(hours) : undefined,
        projectId,
        taskId,
        activityType,
        description,
        isBillable,
        billingRate,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // Update timesheet totals
    const entries = await prisma.timesheetEntry.findMany({
      where: { timesheetId: entry.timesheetId },
    });
    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
    const billableHours = entries.filter(e => e.isBillable).reduce((sum, e) => sum + Number(e.hours), 0);

    await prisma.timesheet.update({
      where: { id: entry.timesheetId },
      data: { totalHours, billableHours },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error updating timesheet entry:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete timesheet entry
 */
export const deleteTimesheetEntry = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { entryId } = req.params;

    const entry = await prisma.timesheetEntry.findUnique({
      where: { id: entryId },
      include: { timesheet: true },
    });

    if (!entry || entry.timesheet.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    if (entry.timesheet.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete entries from an approved timesheet',
      });
    }

    await prisma.timesheetEntry.delete({ where: { id: entryId } });

    // Update timesheet totals
    const entries = await prisma.timesheetEntry.findMany({
      where: { timesheetId: entry.timesheetId },
    });
    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
    const billableHours = entries.filter(e => e.isBillable).reduce((sum, e) => sum + Number(e.hours), 0);

    await prisma.timesheet.update({
      where: { id: entry.timesheetId },
      data: { totalHours, billableHours },
    });

    return res.json({ success: true, message: 'Entry deleted' });
  } catch (error: any) {
    logger.error('Error deleting timesheet entry:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit timesheets for approval
 */
export const submitTimesheets = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { timesheetIds } = req.body;

    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Timesheet IDs are required',
      });
    }

    const result = await prisma.timesheet.updateMany({
      where: {
        id: { in: timesheetIds },
        companyId,
        status: 'DRAFT',
      },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: `${result.count} timesheet(s) submitted for approval`,
    });
  } catch (error: any) {
    logger.error('Error submitting timesheets:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Approve timesheets
 */
export const approveTimesheets = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { timesheetIds } = req.body;

    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Timesheet IDs are required',
      });
    }

    const result = await prisma.timesheet.updateMany({
      where: {
        id: { in: timesheetIds },
        companyId,
        status: 'SUBMITTED',
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    return res.json({
      success: true,
      message: `${result.count} timesheet(s) approved`,
    });
  } catch (error: any) {
    logger.error('Error approving timesheets:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reject timesheets
 */
export const rejectTimesheets = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { timesheetIds, reason } = req.body;

    if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Timesheet IDs are required',
      });
    }

    const result = await prisma.timesheet.updateMany({
      where: {
        id: { in: timesheetIds },
        companyId,
        status: 'SUBMITTED',
      },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || null,
      },
    });

    return res.json({
      success: true,
      message: `${result.count} timesheet(s) rejected`,
    });
  } catch (error: any) {
    logger.error('Error rejecting timesheets:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get weekly timesheet view
 */
export const getWeeklyTimesheet = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { weekStart, employeeId } = req.query;

    if (!weekStart) {
      return res.status(400).json({
        success: false,
        message: 'Week start date is required',
      });
    }

    const startDate = new Date(weekStart as string);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const entries = await prisma.timesheetEntry.findMany({
      where: {
        timesheet: {
          companyId,
          employeeId: (employeeId as string) || null,
          userId: employeeId ? undefined : userId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Group by project/task for weekly view
    const weeklyData: Record<string, any> = {};
    entries.forEach((entry) => {
      const key = entry.taskId ? `${entry.projectId}-${entry.taskId}` : entry.projectId || 'no-project';
      if (!weeklyData[key]) {
        weeklyData[key] = {
          project: entry.project,
          task: entry.task,
          entries: [],
          totalHours: 0,
        };
      }
      weeklyData[key].entries.push(entry);
      weeklyData[key].totalHours += Number(entry.hours || 0);
    });

    return res.json({
      success: true,
      data: {
        weekStart: startDate,
        weekEnd: endDate,
        rows: Object.values(weeklyData),
        totalHours: entries.reduce((sum, e) => sum + Number(e.hours || 0), 0),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching weekly timesheet:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getTimesheets,
  getTimesheet,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
  addTimesheetEntry,
  updateTimesheetEntry,
  deleteTimesheetEntry,
  submitTimesheets,
  approveTimesheets,
  rejectTimesheets,
  getWeeklyTimesheet,
};
