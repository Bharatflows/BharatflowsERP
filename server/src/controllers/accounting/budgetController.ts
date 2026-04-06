import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import budgetService from '../../services/budgetService';
import logger from '../../config/logger';

/**
 * Get all budgets for a company
 */
export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { status, type, fiscalYearId, page, limit } = req.query;

    const result = await budgetService.getBudgets(companyId, {
      status: status as string,
      type: type as string,
      fiscalYearId: fiscalYearId as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({ success: true, data: result.budgets, pagination: result.pagination });
  } catch (error: any) {
    logger.error('Error fetching budgets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a single budget by ID
 */
export const getBudget = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const budget = await budgetService.getBudgetById(id, companyId);

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    return res.json({ success: true, data: budget });
  } catch (error: any) {
    logger.error('Error fetching budget:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new budget
 */
export const createBudget = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const {
      name,
      description,
      fiscalYearId,
      startDate,
      endDate,
      type,
      allowOverBudget,
      warningThreshold,
      items,
    } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Name, startDate, and endDate are required' });
    }

    const budget = await budgetService.createBudget(
      companyId,
      {
        name,
        description,
        fiscalYearId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        allowOverBudget,
        warningThreshold,
        items,
      },
      userId
    );

    return res.status(201).json({ success: true, data: budget });
  } catch (error: any) {
    logger.error('Error creating budget:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a budget
 */
export const updateBudget = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { name, description, allowOverBudget, warningThreshold, status } = req.body;

    const budget = await budgetService.updateBudget(id, companyId, {
      name,
      description,
      allowOverBudget,
      warningThreshold,
      status,
    });

    return res.json({ success: true, data: budget });
  } catch (error: any) {
    logger.error('Error updating budget:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a budget
 */
export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    await budgetService.deleteBudget(id, companyId);

    return res.json({ success: true, message: 'Budget deleted' });
  } catch (error: any) {
    logger.error('Error deleting budget:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add item to budget
 */
export const addBudgetItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { costCenterId, ledgerId, projectId, budgetAmount, monthlyAmounts, notes } = req.body;

    if (!budgetAmount) {
      return res.status(400).json({ success: false, message: 'Budget amount is required' });
    }

    const item = await budgetService.addBudgetItem(id, companyId, {
      costCenterId,
      ledgerId,
      projectId,
      budgetAmount,
      monthlyAmounts,
      notes,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    logger.error('Error adding budget item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a budget item
 */
export const updateBudgetItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { itemId } = req.params;
    const { budgetAmount, monthlyAmounts, notes } = req.body;

    const item = await budgetService.updateBudgetItem(itemId, companyId, {
      budgetAmount,
      monthlyAmounts,
      notes,
    });

    return res.json({ success: true, data: item });
  } catch (error: any) {
    logger.error('Error updating budget item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a budget item
 */
export const deleteBudgetItem = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { itemId } = req.params;

    await budgetService.deleteBudgetItem(itemId, companyId);

    return res.json({ success: true, message: 'Budget item deleted' });
  } catch (error: any) {
    logger.error('Error deleting budget item:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get budget variance report
 */
export const getBudgetVarianceReport = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const report = await budgetService.getBudgetVarianceReport(id, companyId);

    return res.json({ success: true, data: report });
  } catch (error: any) {
    logger.error('Error fetching budget variance report:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check budget availability for a transaction
 */
export const checkBudgetAvailability = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { costCenterId, ledgerId, projectId, amount, transactionDate } = req.body;

    if (!amount || !transactionDate) {
      return res.status(400).json({ success: false, message: 'Amount and transactionDate are required' });
    }

    const result = await budgetService.checkBudgetAvailability(
      companyId,
      costCenterId || null,
      ledgerId || null,
      projectId || null,
      amount,
      new Date(transactionDate)
    );

    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error checking budget availability:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get budget summary
 */
export const getBudgetSummary = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { fiscalYearId } = req.query;

    const summary = await budgetService.getBudgetSummary(companyId, fiscalYearId as string);

    res.json({ success: true, data: summary });
  } catch (error: any) {
    logger.error('Error fetching budget summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Refresh budget actuals from postings
 */
export const refreshBudgetActuals = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const budget = await budgetService.updateActualsFromPostings(id);

    return res.json({ success: true, data: budget });
  } catch (error: any) {
    logger.error('Error refreshing budget actuals:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  getBudgetVarianceReport,
  checkBudgetAvailability,
  getBudgetSummary,
  refreshBudgetActuals,
};
