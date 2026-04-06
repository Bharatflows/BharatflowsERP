/**
 * Quality Controller
 * Handles quality inspections and quality control operations
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Get all quality inspections for a company
 */
export const getInspections = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { status, productId, workOrderId, page = '1', limit = '20' } = req.query;

    const where: any = { companyId };
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (workOrderId) where.workOrderId = workOrderId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [inspections, total] = await Promise.all([
      prisma.qualityInspection.findMany({
        where,
        include: {
          product: { select: { id: true, name: true } },
          workOrder: { select: { id: true, orderNumber: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.qualityInspection.count({ where }),
    ]);

    res.json({
      success: true,
      data: inspections,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching inspections:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single inspection by ID
 */
export const getInspection = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const inspection = await prisma.qualityInspection.findFirst({
      where: { id, companyId },
      include: {
        product: true,
        workOrder: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found' });
    }

    return res.json({ success: true, data: inspection });
  } catch (error: any) {
    logger.error('Error fetching inspection:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new quality inspection
 */
export const createInspection = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const {
      inspectionNumber,
      productId,
      workOrderId,
      batchNumber,
      totalQty,
      passedQty,
      failedQty,
      inspectorName,
      checkpoints,
      notes,
    } = req.body;

    if (!productId || !totalQty) {
      return res.status(400).json({
        success: false,
        message: 'Product and total quantity are required',
      });
    }

    // Generate inspection number if not provided
    const generatedNumber = inspectionNumber || `QI-${Date.now()}`;

    const inspection = await prisma.qualityInspection.create({
      data: {
        companyId,
        inspectionNumber: generatedNumber,
        productId,
        workOrderId: workOrderId || null,
        batchNumber: batchNumber || null,
        totalQty: parseInt(totalQty),
        passedQty: passedQty ?? 0,
        failedQty: failedQty ?? 0,
        status: 'PENDING',
        inspectorName: inspectorName || req.user!.email || 'Unknown',
        checkpoints: checkpoints || null,
        notes: notes || null,
      },
      include: {
        product: true,
        workOrder: { select: { id: true, orderNumber: true } },
      },
    });

    logger.info(`Quality inspection ${inspection.id} created by user ${userId}`);
    return res.status(201).json({ success: true, data: inspection });
  } catch (error: any) {
    logger.error('Error creating inspection:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a quality inspection
 */
export const updateInspection = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const {
      batchNumber,
      totalQty,
      passedQty,
      failedQty,
      inspectorName,
      checkpoints,
      notes,
      status,
    } = req.body;

    const existing = await prisma.qualityInspection.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Inspection not found' });
    }

    const inspection = await prisma.qualityInspection.update({
      where: { id , companyId: req.user.companyId },
      data: {
        batchNumber,
        totalQty,
        passedQty,
        failedQty,
        inspectorName,
        checkpoints,
        notes,
        status,
      },
      include: {
        product: true,
        workOrder: { select: { id: true, orderNumber: true } },
      },
    });

    return res.json({ success: true, data: inspection });
  } catch (error: any) {
    logger.error('Error updating inspection:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a quality inspection
 */
export const deleteInspection = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const inspection = await prisma.qualityInspection.findFirst({
      where: { id, companyId },
    });

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found' });
    }

    if (inspection.status === 'PASSED' || inspection.status === 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a completed inspection',
      });
    }

    await prisma.qualityInspection.delete({ where: { id , companyId: req.user.companyId } });

    return res.json({ success: true, message: 'Inspection deleted' });
  } catch (error: any) {
    logger.error('Error deleting inspection:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Complete an inspection
 */
export const completeInspection = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { passedQty, failedQty, notes } = req.body;

    const inspection = await prisma.qualityInspection.findFirst({
      where: { id, companyId },
    });

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found' });
    }

    // Determine status based on passed/failed quantities
    const passed = passedQty ?? inspection.passedQty;
    const failed = failedQty ?? inspection.failedQty;
    let status: string;

    if (failed === 0) {
      status = 'PASSED';
    } else if (passed === 0) {
      status = 'FAILED';
    } else {
      status = 'PARTIAL';
    }

    const updated = await prisma.qualityInspection.update({
      where: { id , companyId: req.user.companyId },
      data: {
        status,
        passedQty: passed,
        failedQty: failed,
        notes: notes || inspection.notes,
      },
      include: {
        product: true,
        workOrder: { select: { id: true, orderNumber: true } },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error completing inspection:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get inspection statistics
 */
export const getInspectionStats = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;

    const where: any = { companyId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const inspections = await prisma.qualityInspection.findMany({
      where,
      select: {
        id: true,
        status: true,
        passedQty: true,
        failedQty: true,
        totalQty: true,
      },
    });

    const stats = {
      total: inspections.length,
      byStatus: {
        pending: inspections.filter((i) => i.status === 'PENDING').length,
        passed: inspections.filter((i) => i.status === 'PASSED').length,
        failed: inspections.filter((i) => i.status === 'FAILED').length,
        partial: inspections.filter((i) => i.status === 'PARTIAL').length,
      },
      totalQtyInspected: inspections.reduce((sum, i) => sum + i.totalQty, 0),
      totalQtyPassed: inspections.reduce((sum, i) => sum + i.passedQty, 0),
      totalQtyFailed: inspections.reduce((sum, i) => sum + i.failedQty, 0),
      passRate: 0,
    };

    if (stats.totalQtyInspected > 0) {
      stats.passRate = (stats.totalQtyPassed / stats.totalQtyInspected) * 100;
    }

    return res.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('Error fetching inspection stats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get inspections by work order
 */
export const getInspectionsByWorkOrder = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { workOrderId } = req.params;

    const inspections = await prisma.qualityInspection.findMany({
      where: { companyId, workOrderId },
      include: {
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: inspections });
  } catch (error: any) {
    logger.error('Error fetching inspections by work order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get inspections by product
 */
export const getInspectionsByProduct = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { productId } = req.params;

    const inspections = await prisma.qualityInspection.findMany({
      where: { companyId, productId },
      include: {
        workOrder: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: inspections });
  } catch (error: any) {
    logger.error('Error fetching inspections by product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getInspections,
  getInspection,
  createInspection,
  updateInspection,
  deleteInspection,
  completeInspection,
  getInspectionStats,
  getInspectionsByWorkOrder,
  getInspectionsByProduct,
};
