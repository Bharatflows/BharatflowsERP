import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';

/**
 * Get all BOMs for a company
 */
export const getBOMs = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { finishedProductId, isActive, page = '1', limit = '20' } = req.query;

    const where: any = { companyId };
    if (finishedProductId) where.finishedProductId = finishedProductId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [boms, total] = await Promise.all([
      prisma.billOfMaterial.findMany({
        where,
        include: {
          finishedProduct: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, code: true, unit: true } },
            },
          },
          _count: { select: { items: true, workOrders: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.billOfMaterial.count({ where }),
    ]);

    res.json({
      success: true,
      data: boms,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching BOMs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single BOM by ID
 */
export const getBOM = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const bom = await prisma.billOfMaterial.findFirst({
      where: { id, companyId },
      include: {
        finishedProduct: true,
        items: {
          include: {
            product: true,
          },
        },
        workOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    return res.json({ success: true, data: bom });
  } catch (error: any) {
    logger.error('Error fetching BOM:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new BOM
 */
export const createBOM = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const {
      name,
      code,
      finishedProductId,
      outputQuantity,
      isActive,
      laborCost,
      overheadCost,
      notes,
      items,
    } = req.body;

    if (!finishedProductId) {
      return res.status(400).json({
        success: false,
        message: 'Finished product is required',
      });
    }

    // Verify the finished product exists and belongs to the company
    const finishedProduct = await prisma.product.findFirst({
      where: { id: finishedProductId, companyId },
    });

    if (!finishedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Finished product not found',
      });
    }

    const bom = await prisma.billOfMaterial.create({
      data: {
        companyId,
        name: name || `BOM-${Date.now()}`,
        code: code || null,
        finishedProductId,
        outputQuantity: outputQuantity ?? 1,
        isActive: isActive ?? true,
        laborCost: laborCost ?? 0,
        overheadCost: overheadCost ?? 0,
        notes: notes || null,
        items: items ? {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit || null,
            notes: item.notes || null,
          })),
        } : undefined,
      },
      include: {
        finishedProduct: true,
        items: { include: { product: true } },
      },
    });

    logger.info(`BOM ${bom.id} created for product ${finishedProductId}`);
    return res.status(201).json({ success: true, data: bom });
  } catch (error: any) {
    logger.error('Error creating BOM:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a BOM
 */
export const updateBOM = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { name, code, outputQuantity, isActive, laborCost, overheadCost, notes } = req.body;

    const existing = await prisma.billOfMaterial.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const bom = await prisma.billOfMaterial.update({
      where: { id , companyId: req.user.companyId },
      data: {
        name,
        code,
        outputQuantity,
        isActive,
        laborCost,
        overheadCost,
        notes,
      },
      include: {
        finishedProduct: true,
        items: { include: { product: true } },
      },
    });

    return res.json({ success: true, data: bom });
  } catch (error: any) {
    logger.error('Error updating BOM:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a BOM
 */
export const deleteBOM = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const bom = await prisma.billOfMaterial.findFirst({
      where: { id, companyId },
      include: { _count: { select: { workOrders: true } } },
    });

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    if (bom._count.workOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete BOM with existing work orders',
      });
    }

    await prisma.billOfMaterial.delete({ where: { id , companyId: req.user.companyId } });

    return res.json({ success: true, message: 'BOM deleted' });
  } catch (error: any) {
    logger.error('Error deleting BOM:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add item to BOM
 */
export const addBOMItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { productId, quantity, unit, notes } = req.body;

    const bom = await prisma.billOfMaterial.findFirst({
      where: { id, companyId },
    });

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    // Verify the product exists
    const product = await prisma.product.findFirst({
      where: { id: productId, companyId },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const item = await prisma.bOMItem.create({
      data: {
        bomId: id,
        productId,
        quantity,
        unit: unit || null,
        notes: notes || null,
      },
      include: { product: true },
    });

    return res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    logger.error('Error adding BOM item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update BOM item
 */
export const updateBOMItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { itemId } = req.params;
    const { quantity, unit, notes } = req.body;

    const item = await prisma.bOMItem.findUnique({
      where: { id: itemId },
      include: { bom: true },
    });

    if (!item || item.bom.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const updated = await prisma.bOMItem.update({
      where: { id: itemId },
      data: { quantity, unit, notes },
      include: { product: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error updating BOM item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete BOM item
 */
export const deleteBOMItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { itemId } = req.params;

    const item = await prisma.bOMItem.findUnique({
      where: { id: itemId },
      include: { bom: true },
    });

    if (!item || item.bom.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    await prisma.bOMItem.delete({ where: { id: itemId } });

    return res.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    logger.error('Error deleting BOM item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Copy a BOM
 */
export const copyBOM = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { name, finishedProductId } = req.body;

    const original = await prisma.billOfMaterial.findFirst({
      where: { id, companyId },
      include: {
        items: true,
      },
    });

    if (!original) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    // If a new finished product is specified, verify it exists
    if (finishedProductId && finishedProductId !== original.finishedProductId) {
      const product = await prisma.product.findFirst({
        where: { id: finishedProductId, companyId },
      });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Target product not found' });
      }
    }

    const copy = await prisma.billOfMaterial.create({
      data: {
        companyId,
        name: name || `${original.name} (Copy)`,
        code: null, // Don't copy the code - should be unique
        finishedProductId: finishedProductId || original.finishedProductId,
        outputQuantity: original.outputQuantity,
        isActive: true,
        laborCost: original.laborCost,
        overheadCost: original.overheadCost,
        notes: original.notes,
        items: {
          create: original.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
          })),
        },
      },
      include: {
        finishedProduct: true,
        items: { include: { product: true } },
      },
    });

    return res.status(201).json({ success: true, data: copy });
  } catch (error: any) {
    logger.error('Error copying BOM:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Calculate estimated cost for a BOM
 * This calculates raw material cost based on item quantities and product purchase prices
 */
export const calculateBOMCost = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const bom = await prisma.billOfMaterial.findFirst({
      where: { id, companyId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    // Calculate raw material cost from items
    let rawMaterialCost = 0;
    const itemCosts = bom.items.map(item => {
      const unitCost = Number(item.product.purchasePrice || 0);
      const qty = Number(item.quantity);
      const itemCost = unitCost * qty;
      rawMaterialCost += itemCost;

      return {
        productId: item.productId,
        productName: item.product.name,
        quantity: qty,
        unitCost,
        totalCost: itemCost,
      };
    });

    const laborCost = Number(bom.laborCost);
    const overheadCost = Number(bom.overheadCost);
    const totalCost = rawMaterialCost + laborCost + overheadCost;
    const costPerUnit = Number(bom.outputQuantity) > 0
      ? totalCost / Number(bom.outputQuantity)
      : totalCost;

    return res.json({
      success: true,
      data: {
        bomId: bom.id,
        bomName: bom.name,
        outputQuantity: Number(bom.outputQuantity),
        rawMaterialCost,
        laborCost,
        overheadCost,
        totalCost,
        costPerUnit,
        itemCosts,
      },
    });
  } catch (error: any) {
    logger.error('Error calculating BOM cost:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get BOMs for a specific finished product
 */
export const getBOMsByProduct = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { productId } = req.params;

    const boms = await prisma.billOfMaterial.findMany({
      where: {
        companyId,
        finishedProductId: productId,
        isActive: true,
      },
      include: {
        finishedProduct: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true, unit: true } },
          },
        },
        _count: { select: { items: true, workOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: boms });
  } catch (error: any) {
    logger.error('Error fetching BOMs for product:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getBOMs,
  getBOM,
  createBOM,
  updateBOM,
  deleteBOM,
  addBOMItem,
  updateBOMItem,
  deleteBOMItem,
  copyBOM,
  calculateBOMCost,
  getBOMsByProduct,
};
