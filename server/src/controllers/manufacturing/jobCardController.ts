import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';

/**
 * Generate a unique job card number
 */
async function generateJobCardNumber(companyId: string): Promise<string> {
  const count = await prisma.jobCard.count({ where: { companyId } });
  const nextNumber = count + 1;
  const year = new Date().getFullYear();
  return `JC-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Get Job Cards
 */
export const getJobCards = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { workOrderId, status, workstation, page = '1', limit = '20' } = req.query;

    const where: any = { companyId };
    if (workOrderId) where.workOrderId = workOrderId;
    if (status) where.status = status;
    if (workstation) where.workstation = workstation;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [jobCards, total] = await Promise.all([
      prisma.jobCard.findMany({
        where,
        include: {
          workOrder: {
            select: {
              id: true,
              orderNumber: true,
              bom: {
                select: {
                  name: true,
                  finishedProduct: { select: { name: true } },
                },
              },
            },
          },
          _count: { select: { timeLogs: true } },
        },
        skip,
        take,
        orderBy: [{ workOrderId: 'desc' }, { operationSequence: 'asc' }],
      }),
      prisma.jobCard.count({ where }),
    ]);

    res.json({
      success: true,
      data: jobCards,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching job cards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single Job Card
 */
export const getJobCard = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
      include: {
        workOrder: {
          include: {
            bom: {
              include: {
                finishedProduct: true,
              },
            },
          },
        },
        timeLogs: {
          orderBy: { fromTime: 'desc' },
        },
      },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    return res.json({ success: true, data: jobCard });
  } catch (error: any) {
    logger.error('Error fetching job card:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a Job Card
 */
export const createJobCard = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const {
      workOrderId,
      operationSequence,
      operationName,
      workstation,
      employeeId,
      employeeName,
      forQuantity,
      plannedStartTime,
      plannedEndTime,
      qualityParams,
      remarks,
    } = req.body;

    if (!workOrderId || !operationName) {
      return res.status(400).json({
        success: false,
        message: 'Work Order and operation name are required',
      });
    }

    // Verify work order exists
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId , companyId: req.user.companyId },
      include: { bom: { include: { finishedProduct: true } } },
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work Order not found' });
    }

    // Get next sequence if not provided
    let seq = operationSequence;
    if (!seq) {
      const lastCard = await prisma.jobCard.findFirst({
        where: { workOrderId },
        orderBy: { operationSequence: 'desc' },
      });
      seq = (lastCard?.operationSequence || 0) + 1;
    }

    // Generate job card number
    const jobCardNumber = await generateJobCardNumber(companyId);

    const jobCard = await prisma.jobCard.create({
      data: {
        companyId,
        jobCardNumber,
        workOrderId,
        operationSequence: seq,
        operationName,
        workstation: workstation || null,
        employeeId: employeeId || null,
        employeeName: employeeName || null,
        forQuantity: forQuantity || workOrder.plannedQty,
        completedQty: 0,
        rejectedQty: 0,
        status: 'PENDING',
        plannedStartTime: plannedStartTime ? new Date(plannedStartTime) : null,
        plannedEndTime: plannedEndTime ? new Date(plannedEndTime) : null,
        qualityParams: qualityParams || null,
        remarks: remarks || null,
      },
      include: {
        workOrder: { select: { orderNumber: true } },
      },
    });

    logger.info(`Job Card ${jobCardNumber} created for Work Order ${workOrder.orderNumber}`);
    return res.status(201).json({ success: true, data: jobCard });
  } catch (error: any) {
    logger.error('Error creating job card:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a Job Card
 */
export const updateJobCard = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const {
      operationName,
      workstation,
      employeeId,
      employeeName,
      forQuantity,
      plannedStartTime,
      plannedEndTime,
      qualityParams,
      remarks,
    } = req.body;

    const existing = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    const updateData: any = {};
    if (operationName !== undefined) updateData.operationName = operationName;
    if (workstation !== undefined) updateData.workstation = workstation;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (employeeName !== undefined) updateData.employeeName = employeeName;
    if (forQuantity !== undefined) updateData.forQuantity = forQuantity;
    if (plannedStartTime !== undefined) updateData.plannedStartTime = plannedStartTime ? new Date(plannedStartTime) : null;
    if (plannedEndTime !== undefined) updateData.plannedEndTime = plannedEndTime ? new Date(plannedEndTime) : null;
    if (qualityParams !== undefined) updateData.qualityParams = qualityParams;
    if (remarks !== undefined) updateData.remarks = remarks;

    const jobCard = await prisma.jobCard.update({
      where: { id },
      data: updateData,
      include: {
        workOrder: { select: { orderNumber: true } },
      },
    });

    return res.json({ success: true, data: jobCard });
  } catch (error: any) {
    logger.error('Error updating job card:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Start a Job Card
 */
export const startJobCard = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { employeeId, employeeName } = req.body;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    if (!['PENDING', 'ON_HOLD'].includes(jobCard.status)) {
      return res.status(400).json({
        success: false,
        message: 'Job Card cannot be started from current status',
      });
    }

    const now = new Date();

    // Create time log entry
    await prisma.jobCardTimeLog.create({
      data: {
        jobCardId: id,
        fromTime: now,
        toTime: null,
        duration: null,
        employeeId: employeeId || jobCard.employeeId || null,
        employeeName: employeeName || jobCard.employeeName || null,
        activity: 'Started work',
      },
    });

    const updated = await prisma.jobCard.update({
      where: { id },
      data: {
        status: 'WORK_IN_PROGRESS',
        actualStartTime: jobCard.actualStartTime || now,
        employeeId: employeeId || jobCard.employeeId,
        employeeName: employeeName || jobCard.employeeName,
      },
      include: {
        timeLogs: true,
      },
    });

    logger.info(`Job Card ${id} started`);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error starting job card:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Pause/Hold a Job Card
 */
export const pauseJobCard = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { reason } = req.body;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    if (jobCard.status !== 'WORK_IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Job Card is not in progress',
      });
    }

    const now = new Date();

    // Find the open time log (toTime is null) and close it
    const openLog = await prisma.jobCardTimeLog.findFirst({
      where: { jobCardId: id, toTime: null },
      orderBy: { fromTime: 'desc' },
    });

    if (openLog) {
      const duration = Math.round((now.getTime() - openLog.fromTime.getTime()) / (1000 * 60));

      await prisma.jobCardTimeLog.update({
        where: { id: openLog.id },
        data: {
          toTime: now,
          duration,
          activity: reason ? `Paused: ${reason}` : 'Paused',
        },
      });
    }

    const updated = await prisma.jobCard.update({
      where: { id },
      data: {
        status: 'ON_HOLD',
        remarks: reason ? `${jobCard.remarks || ''}\nPaused: ${reason}`.trim() : jobCard.remarks,
      },
    });

    logger.info(`Job Card ${id} paused`);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error pausing job card:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Complete a Job Card
 */
export const completeJobCard = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { completedQty, rejectedQty, remarks, qualityParams } = req.body;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    if (!['WORK_IN_PROGRESS', 'ON_HOLD'].includes(jobCard.status)) {
      return res.status(400).json({
        success: false,
        message: 'Job Card cannot be completed from current status',
      });
    }

    const now = new Date();

    // Close any open time log
    const openLog = await prisma.jobCardTimeLog.findFirst({
      where: { jobCardId: id, toTime: null },
      orderBy: { fromTime: 'desc' },
    });

    if (openLog) {
      const duration = Math.round((now.getTime() - openLog.fromTime.getTime()) / (1000 * 60));

      await prisma.jobCardTimeLog.update({
        where: { id: openLog.id },
        data: {
          toTime: now,
          duration,
          activity: 'Completed',
        },
      });
    }

    const updated = await prisma.jobCard.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndTime: now,
        completedQty: completedQty ?? jobCard.completedQty,
        rejectedQty: rejectedQty ?? jobCard.rejectedQty,
        remarks: remarks !== undefined ? remarks : jobCard.remarks,
        qualityParams: qualityParams !== undefined ? qualityParams : jobCard.qualityParams,
      },
      include: {
        workOrder: { select: { orderNumber: true } },
        timeLogs: true,
      },
    });

    logger.info(`Job Card ${id} completed`);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error completing job card:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Log time for a Job Card
 */
export const logTime = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { employeeId, employeeName, fromTime, toTime, duration, activity } = req.body;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    if (!fromTime) {
      return res.status(400).json({
        success: false,
        message: 'fromTime is required',
      });
    }

    let calculatedDuration = duration;
    if (!calculatedDuration && fromTime && toTime) {
      calculatedDuration = Math.round((new Date(toTime).getTime() - new Date(fromTime).getTime()) / (1000 * 60));
    }

    const timeLog = await prisma.jobCardTimeLog.create({
      data: {
        jobCardId: id,
        employeeId: employeeId || null,
        employeeName: employeeName || null,
        fromTime: new Date(fromTime),
        toTime: toTime ? new Date(toTime) : null,
        duration: calculatedDuration || null,
        activity: activity || null,
      },
    });

    return res.status(201).json({ success: true, data: timeLog });
  } catch (error: any) {
    logger.error('Error logging time:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Record rejected quantity for a Job Card
 */
export const recordRejection = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { rejectedQty, reason } = req.body;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    if (rejectedQty === undefined || rejectedQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid rejectedQty is required',
      });
    }

    const currentRejected = Number(jobCard.rejectedQty || 0);
    const currentRemarks = jobCard.remarks || '';

    const updated = await prisma.jobCard.update({
      where: { id },
      data: {
        rejectedQty: currentRejected + rejectedQty,
        remarks: reason
          ? `${currentRemarks}\nRejection recorded: ${rejectedQty} - ${reason}`.trim()
          : currentRemarks,
      },
    });

    logger.info(`Rejection recorded for Job Card ${id}: ${rejectedQty}`);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error recording rejection:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update completed quantity for a Job Card
 */
export const updateCompletedQty = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { completedQty } = req.body;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    if (completedQty === undefined || completedQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid completedQty is required',
      });
    }

    const updated = await prisma.jobCard.update({
      where: { id },
      data: { completedQty },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error updating completed quantity:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a Job Card
 */
export const deleteJobCard = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    // Only allow deletion of PENDING job cards
    if (jobCard.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only PENDING job cards can be deleted',
      });
    }

    // Delete time logs first (cascades will handle this, but being explicit)
    await prisma.jobCardTimeLog.deleteMany({
      where: { jobCardId: id },
    });

    await prisma.jobCard.delete({
      where: { id },
    });

    logger.info(`Job Card ${id} deleted`);
    return res.json({ success: true, message: 'Job Card deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting job card:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get time logs for a Job Card
 */
export const getTimeLogs = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const jobCard = await prisma.jobCard.findFirst({
      where: { id, companyId },
    });

    if (!jobCard) {
      return res.status(404).json({ success: false, message: 'Job Card not found' });
    }

    const timeLogs = await prisma.jobCardTimeLog.findMany({
      where: { jobCardId: id },
      orderBy: { fromTime: 'desc' },
    });

    // Calculate total time
    const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    return res.json({
      success: true,
      data: {
        timeLogs,
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching time logs:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getJobCards,
  getJobCard,
  createJobCard,
  updateJobCard,
  startJobCard,
  pauseJobCard,
  completeJobCard,
  logTime,
  recordRejection,
  updateCompletedQty,
  deleteJobCard,
  getTimeLogs,
};
