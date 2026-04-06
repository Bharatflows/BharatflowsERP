/**
 * Branch Controller
 * 
 * P0-2: Multi-Branch/Multi-GSTIN Support
 * 
 * Endpoints:
 * - GET    /api/v1/branches      - List all branches for current company
 * - GET    /api/v1/branches/:id  - Get a single branch
 * - POST   /api/v1/branches      - Create a new branch
 * - PUT    /api/v1/branches/:id  - Update a branch
 * - DELETE /api/v1/branches/:id  - Delete a branch (soft)
 * - POST   /api/v1/branches/:id/set-primary - Set as primary branch
 */

import { Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import eventBus, { EventTypes } from '../services/eventBus';

// ============ LIST BRANCHES ============

/**
 * @desc    Get all branches for current company
 * @route   GET /api/v1/branches
 * @access  Private
 */
export const getBranches = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const branches = await prisma.branch.findMany({
      where: { companyId, isActive: true },
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' }
      ]
    });

    return res.status(200).json({
      success: true,
      data: branches,
      count: branches.length
    });
  } catch (error: any) {
    logger.error('Error fetching branches:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============ GET SINGLE BRANCH ============

/**
 * @desc    Get a single branch by ID
 * @route   GET /api/v1/branches/:id
 * @access  Private
 */
export const getBranch = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;

    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const branch = await prisma.branch.findFirst({
      where: { id, companyId }
    });

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    return res.status(200).json({ success: true, data: branch });
  } catch (error: any) {
    logger.error('Error fetching branch:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============ CREATE BRANCH ============

/**
 * @desc    Create a new branch
 * @route   POST /api/v1/branches
 * @access  Private (ADMIN+)
 */
export const createBranch = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;

    if (!companyId || !userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      name,
      code,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country = 'India',
      gstin,
      isGstRegistered = false,
      isPrimary = false
    } = req.body;

    // Validate required fields
    if (!name || !code || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, city, state, and pincode are required'
      });
    }

    // Check for duplicate code
    const existingBranch = await prisma.branch.findFirst({
      where: { companyId, code: code.toUpperCase() }
    });

    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: `Branch with code '${code}' already exists`
      });
    }

    // If this is the first branch or marked as primary, handle primary flag
    const branchCount = await prisma.branch.count({ where: { companyId } });
    const shouldBePrimary = branchCount === 0 || isPrimary;

    // If setting as primary, unset other primary branches
    if (shouldBePrimary) {
      await prisma.branch.updateMany({
        where: { companyId, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    const branch = await prisma.branch.create({
      data: {
        companyId,
        name,
        code: code.toUpperCase(),
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country,
        gstin: gstin || null,
        isGstRegistered: !!gstin || isGstRegistered,
        isPrimary: shouldBePrimary,
        isActive: true
      }
    });

    // Emit domain event
    await eventBus.emit({
      companyId,
      eventType: EventTypes.BRANCH_CREATED,
      aggregateType: 'Branch',
      aggregateId: branch.id,
      payload: {
        branchId: branch.id,
        name: branch.name,
        code: branch.code,
        gstin: branch.gstin,
        state: branch.state
      },
      metadata: { userId, source: 'api' }
    });

    return res.status(201).json({ success: true, data: branch });
  } catch (error: any) {
    logger.error('Error creating branch:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============ UPDATE BRANCH ============

/**
 * @desc    Update a branch
 * @route   PUT /api/v1/branches/:id
 * @access  Private (ADMIN+)
 */
export const updateBranch = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    const { id } = req.params;

    if (!companyId || !userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if branch exists
    const existingBranch = await prisma.branch.findFirst({
      where: { id, companyId }
    });

    if (!existingBranch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      gstin,
      isGstRegistered
    } = req.body;

    const branch = await prisma.branch.update({
      where: { id , companyId: req.user.companyId },
      data: {
        ...(name && { name }),
        ...(addressLine1 !== undefined && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(country && { country }),
        ...(gstin !== undefined && { gstin }),
        ...(isGstRegistered !== undefined && { isGstRegistered })
      }
    });

    return res.status(200).json({ success: true, data: branch });
  } catch (error: any) {
    logger.error('Error updating branch:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============ DELETE BRANCH ============

/**
 * @desc    Soft delete a branch
 * @route   DELETE /api/v1/branches/:id
 * @access  Private (ADMIN+)
 */
export const deleteBranch = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;

    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const branch = await prisma.branch.findFirst({
      where: { id, companyId }
    });

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Cannot delete primary branch
    if (branch.isPrimary) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete primary branch. Set another branch as primary first.'
      });
    }

    // Soft delete
    await prisma.branch.update({
      where: { id , companyId: req.user.companyId },
      data: { isActive: false }
    });

    return res.status(200).json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting branch:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============ SET PRIMARY BRANCH ============

/**
 * @desc    Set a branch as primary
 * @route   POST /api/v1/branches/:id/set-primary
 * @access  Private (ADMIN+)
 */
export const setPrimaryBranch = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;

    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const branch = await prisma.branch.findFirst({
      where: { id, companyId, isActive: true }
    });

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Unset current primary and set new primary
    await prisma.$transaction([
      prisma.branch.updateMany({
        where: { companyId, isPrimary: true },
        data: { isPrimary: false }
      }),
      prisma.branch.update({
        where: { id , companyId: req.user.companyId },
        data: { isPrimary: true }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: `${branch.name} is now the primary branch`
    });
  } catch (error: any) {
    logger.error('Error setting primary branch:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
