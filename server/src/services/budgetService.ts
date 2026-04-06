import prisma from '../config/prisma';
import logger from '../config/logger';

interface CreateBudgetInput {
  name: string;
  description?: string;
  fiscalYearId?: string;
  startDate: Date;
  endDate: Date;
  type?: 'EXPENSE' | 'REVENUE' | 'CAPITAL';
  allowOverBudget?: boolean;
  warningThreshold?: number;
  items?: BudgetItemInput[];
}

interface UpdateBudgetInput {
  name?: string;
  description?: string;
  allowOverBudget?: boolean;
  warningThreshold?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
}

interface BudgetItemInput {
  costCenterId?: string;
  ledgerId?: string;
  projectId?: string;
  budgetAmount: number;
  monthlyAmounts?: Record<string, number>;
  notes?: string;
}

interface UpdateBudgetItemInput {
  budgetAmount?: number;
  monthlyAmounts?: Record<string, number>;
  notes?: string;
}

/**
 * Get all budgets for a company
 */
export const getBudgets = async (
  companyId: string,
  params?: {
    status?: string;
    type?: string;
    fiscalYearId?: string;
    page?: number;
    limit?: number;
  }
) => {
  const { status, type, fiscalYearId, page = 1, limit = 20 } = params || {};
  const skip = (page - 1) * limit;

  const where: any = { companyId };
  if (status) where.status = status;
  if (type) where.type = type;
  if (fiscalYearId) where.fiscalYearId = fiscalYearId;

  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: {
        fiscalYear: {
          select: { name: true, startDate: true, endDate: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.budget.count({ where }),
  ]);

  return {
    budgets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single budget by ID
 */
export const getBudgetById = async (id: string, companyId: string) => {
  return await prisma.budget.findFirst({
    where: { id, companyId },
    include: {
      fiscalYear: true,
      items: {
        include: {
          costCenter: { select: { id: true, name: true, code: true } },
          ledger: { select: { id: true, name: true, code: true } },
          project: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });
};

/**
 * Create a new budget
 */
export const createBudget = async (companyId: string, data: CreateBudgetInput, createdBy?: string) => {
  if (data.startDate >= data.endDate) {
    throw new Error('Start date must be before end date');
  }

  if (data.fiscalYearId) {
    const fy = await prisma.financialYear.findFirst({
      where: { id: data.fiscalYearId, companyId },
    });
    if (!fy) {
      throw new Error('Invalid fiscal year');
    }
  }

  const existing = await prisma.budget.findFirst({
    where: {
      companyId,
      name: data.name,
      startDate: data.startDate,
    },
  });

  if (existing) {
    throw new Error('A budget with this name already exists for this period');
  }

  const totalBudget = data.items?.reduce((sum, item) => sum + item.budgetAmount, 0) || 0;

  const budget = await prisma.budget.create({
    data: {
      companyId,
      name: data.name,
      description: data.description,
      fiscalYearId: data.fiscalYearId,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type || 'EXPENSE',
      allowOverBudget: data.allowOverBudget ?? false,
      warningThreshold: data.warningThreshold ?? 80,
      totalBudget,
      createdBy,
      items: data.items
        ? {
            create: data.items.map((item) => ({
              costCenterId: item.costCenterId,
              ledgerId: item.ledgerId,
              projectId: item.projectId,
              budgetAmount: item.budgetAmount,
              monthlyAmounts: item.monthlyAmounts ? JSON.stringify(item.monthlyAmounts) : null,
              notes: item.notes,
            })),
          }
        : undefined,
    },
    include: { items: true },
  });

  logger.info(`Budget created: ${budget.name} for company ${companyId}`);
  return budget;
};

/**
 * Update a budget
 */
export const updateBudget = async (id: string, companyId: string, data: UpdateBudgetInput) => {
  const budget = await prisma.budget.findFirst({
    where: { id, companyId },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  if (budget.status === 'CLOSED' && data.status !== 'ACTIVE') {
    throw new Error('Cannot update a closed budget');
  }

  return await prisma.budget.update({
    where: { id },
    data,
    include: { items: true },
  });
};

/**
 * Delete a budget
 */
export const deleteBudget = async (id: string, companyId: string) => {
  const budget = await prisma.budget.findFirst({
    where: { id, companyId },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  if (budget.status === 'ACTIVE') {
    throw new Error('Cannot delete an active budget. Please close it first.');
  }

  await prisma.budget.delete({ where: { id } });

  logger.info(`Budget deleted: ${budget.name} for company ${companyId}`);
  return { success: true };
};

/**
 * Add item to budget
 */
export const addBudgetItem = async (budgetId: string, companyId: string, data: BudgetItemInput) => {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, companyId },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  if (budget.status === 'CLOSED') {
    throw new Error('Cannot add items to a closed budget');
  }

  if (!data.costCenterId && !data.ledgerId && !data.projectId) {
    throw new Error('At least one dimension (cost center, ledger, or project) is required');
  }

  const item = await prisma.budgetItem.create({
    data: {
      budgetId,
      costCenterId: data.costCenterId,
      ledgerId: data.ledgerId,
      projectId: data.projectId,
      budgetAmount: data.budgetAmount,
      monthlyAmounts: data.monthlyAmounts ? JSON.stringify(data.monthlyAmounts) : null,
      notes: data.notes,
    },
    include: {
      costCenter: { select: { id: true, name: true, code: true } },
      ledger: { select: { id: true, name: true, code: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await recalculateBudgetTotals(budgetId);
  return item;
};

/**
 * Update a budget item
 */
export const updateBudgetItem = async (itemId: string, companyId: string, data: UpdateBudgetItemInput) => {
  const item = await prisma.budgetItem.findFirst({
    where: { id: itemId },
    include: { budget: { select: { companyId: true, status: true } } },
  });

  if (!item || item.budget.companyId !== companyId) {
    throw new Error('Budget item not found');
  }

  if (item.budget.status === 'CLOSED') {
    throw new Error('Cannot update items in a closed budget');
  }

  const updated = await prisma.budgetItem.update({
    where: { id: itemId },
    data: {
      budgetAmount: data.budgetAmount,
      monthlyAmounts: data.monthlyAmounts ? JSON.stringify(data.monthlyAmounts) : undefined,
      notes: data.notes,
    },
    include: {
      costCenter: { select: { id: true, name: true, code: true } },
      ledger: { select: { id: true, name: true, code: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await recalculateBudgetTotals(item.budgetId);
  return updated;
};

/**
 * Delete a budget item
 */
export const deleteBudgetItem = async (itemId: string, companyId: string) => {
  const item = await prisma.budgetItem.findFirst({
    where: { id: itemId },
    include: { budget: { select: { id: true, companyId: true, status: true } } },
  });

  if (!item || item.budget.companyId !== companyId) {
    throw new Error('Budget item not found');
  }

  if (item.budget.status === 'CLOSED') {
    throw new Error('Cannot delete items from a closed budget');
  }

  await prisma.budgetItem.delete({ where: { id: itemId } });
  await recalculateBudgetTotals(item.budget.id);
  return { success: true };
};

/**
 * Recalculate budget totals
 */
const recalculateBudgetTotals = async (budgetId: string) => {
  const items = await prisma.budgetItem.findMany({ where: { budgetId } });

  const totalBudget = items.reduce((sum, item) => sum + Number(item.budgetAmount), 0);
  const totalActual = items.reduce((sum, item) => sum + Number(item.actualAmount), 0);
  const totalVariance = totalBudget - totalActual;

  await prisma.budget.update({
    where: { id: budgetId },
    data: { totalBudget, totalActual, totalVariance },
  });
};

/**
 * Update actual amounts for budget items based on ledger postings
 */
export const updateActualsFromPostings = async (budgetId: string) => {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { items: true },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  for (const item of budget.items) {
    const whereClause: any = {
      companyId: budget.companyId,
      voucher: {
        date: { gte: budget.startDate, lte: budget.endDate },
      },
    };

    if (item.costCenterId) whereClause.costCenterId = item.costCenterId;
    if (item.ledgerId) whereClause.ledgerId = item.ledgerId;
    if (item.projectId) whereClause.projectId = item.projectId;

    const postings = await prisma.ledgerPosting.aggregate({
      where: whereClause,
      _sum: { amount: true },
    });

    const actual = Number(postings._sum.amount || 0);
    const variance = Number(item.budgetAmount) - actual;
    const variancePercent = Number(item.budgetAmount) > 0
      ? (variance / Number(item.budgetAmount)) * 100
      : 0;

    await prisma.budgetItem.update({
      where: { id: item.id },
      data: { actualAmount: actual, varianceAmount: variance, variancePercent },
    });
  }

  await recalculateBudgetTotals(budgetId);
  return await getBudgetById(budgetId, budget.companyId);
};

/**
 * Get budget variance report
 */
export const getBudgetVarianceReport = async (budgetId: string, companyId: string) => {
  await updateActualsFromPostings(budgetId);

  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, companyId },
    include: {
      items: {
        include: {
          costCenter: { select: { id: true, name: true, code: true } },
          ledger: { select: { id: true, name: true, code: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  const items = budget.items.map((item) => {
    let dimension = '';
    let dimensionType: 'COST_CENTER' | 'LEDGER' | 'PROJECT' = 'COST_CENTER';

    if (item.costCenter) {
      dimension = item.costCenter.name;
      dimensionType = 'COST_CENTER';
    } else if (item.ledger) {
      dimension = item.ledger.name;
      dimensionType = 'LEDGER';
    } else if (item.project) {
      dimension = item.project.name;
      dimensionType = 'PROJECT';
    }

    const budgetAmount = Number(item.budgetAmount);
    const actualAmount = Number(item.actualAmount);
    const varianceAmount = Number(item.varianceAmount);
    const variancePercent = Number(item.variancePercent);
    const usedPercent = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

    let status: 'UNDER_BUDGET' | 'WARNING' | 'OVER_BUDGET' = 'UNDER_BUDGET';
    if (usedPercent > 100) {
      status = 'OVER_BUDGET';
    } else if (usedPercent >= Number(budget.warningThreshold)) {
      status = 'WARNING';
    }

    return { id: item.id, dimension, dimensionType, budgetAmount, actualAmount, varianceAmount, variancePercent, status };
  });

  const totalBudget = Number(budget.totalBudget);
  const totalActual = Number(budget.totalActual);
  const totalVariance = Number(budget.totalVariance);
  const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

  return {
    budgetId: budget.id,
    budgetName: budget.name,
    period: { startDate: budget.startDate, endDate: budget.endDate },
    totalBudget,
    totalActual,
    totalVariance,
    variancePercent,
    items,
  };
};

/**
 * Check budget availability for a transaction
 */
export const checkBudgetAvailability = async (
  companyId: string,
  costCenterId: string | null,
  ledgerId: string | null,
  projectId: string | null,
  amount: number,
  transactionDate: Date
) => {
  const budgets = await prisma.budget.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      startDate: { lte: transactionDate },
      endDate: { gte: transactionDate },
    },
    include: {
      items: {
        where: {
          OR: [
            { costCenterId: costCenterId || undefined },
            { ledgerId: ledgerId || undefined },
            { projectId: projectId || undefined },
          ],
        },
      },
    },
  });

  for (const budget of budgets) {
    for (const item of budget.items) {
      const budgetAmount = Number(item.budgetAmount);
      const actualAmount = Number(item.actualAmount);
      const remaining = budgetAmount - actualAmount;
      const newUsedPercent = budgetAmount > 0 ? ((actualAmount + amount) / budgetAmount) * 100 : 0;

      if (newUsedPercent > 100) {
        if (!budget.allowOverBudget) {
          return {
            available: false,
            warning: false,
            message: `Budget exceeded. Budget: ${budgetAmount.toFixed(2)}, Used: ${actualAmount.toFixed(2)}, Remaining: ${remaining.toFixed(2)}`,
            budgetRemaining: remaining,
          };
        }
        return {
          available: true,
          warning: true,
          message: `This transaction will exceed the budget. Remaining budget: ${remaining.toFixed(2)}`,
          budgetRemaining: remaining,
        };
      }

      if (newUsedPercent >= Number(budget.warningThreshold)) {
        return {
          available: true,
          warning: true,
          message: `Warning: ${newUsedPercent.toFixed(1)}% of budget will be used after this transaction`,
          budgetRemaining: remaining - amount,
        };
      }
    }
  }

  return { available: true, warning: false, message: 'Within budget' };
};

/**
 * Get budget summary
 */
export const getBudgetSummary = async (companyId: string, fiscalYearId?: string) => {
  const where: any = { companyId, status: 'ACTIVE' };
  if (fiscalYearId) where.fiscalYearId = fiscalYearId;

  const budgets = await prisma.budget.findMany({ where });

  const summary = {
    totalBudgets: budgets.length,
    totalBudgetAmount: 0,
    totalActualAmount: 0,
    totalVariance: 0,
    byType: {
      EXPENSE: { budget: 0, actual: 0, variance: 0, count: 0 },
      REVENUE: { budget: 0, actual: 0, variance: 0, count: 0 },
      CAPITAL: { budget: 0, actual: 0, variance: 0, count: 0 },
    } as Record<string, { budget: number; actual: number; variance: number; count: number }>,
    overBudgetCount: 0,
    warningCount: 0,
  };

  for (const budget of budgets) {
    const totalBudget = Number(budget.totalBudget);
    const totalActual = Number(budget.totalActual);
    const variance = totalBudget - totalActual;
    const usedPercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    summary.totalBudgetAmount += totalBudget;
    summary.totalActualAmount += totalActual;
    summary.totalVariance += variance;

    if (summary.byType[budget.type]) {
      summary.byType[budget.type].budget += totalBudget;
      summary.byType[budget.type].actual += totalActual;
      summary.byType[budget.type].variance += variance;
      summary.byType[budget.type].count += 1;
    }

    if (usedPercent > 100) {
      summary.overBudgetCount += 1;
    } else if (usedPercent >= Number(budget.warningThreshold)) {
      summary.warningCount += 1;
    }
  }

  return summary;
};

/**
 * Get budget vs actual for a period (compatibility method for reports)
 */
export const getBudgetVsActual = async (companyId: string, period: string) => {
  // Parse period (YYYY-MM format)
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Find budgets that overlap with this period
  const budgets = await prisma.budget.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    include: {
      items: {
        include: {
          costCenter: { select: { id: true, name: true, code: true } },
          ledger: { select: { id: true, name: true, code: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  const lines = [];
  for (const budget of budgets) {
    for (const item of budget.items) {
      const dimension = item.costCenter?.name || item.ledger?.name || item.project?.name || 'Unknown';
      const budgetAmount = Number(item.budgetAmount);
      const actualAmount = Number(item.actualAmount);

      lines.push({
        category: dimension,
        budgeted: budgetAmount,
        actual: actualAmount,
        variance: budgetAmount - actualAmount,
        variancePercent: budgetAmount > 0 ? ((budgetAmount - actualAmount) / budgetAmount) * 100 : 0,
      });
    }
  }

  return {
    period,
    lines,
    summary: {
      totalBudgeted: lines.reduce((sum, l) => sum + l.budgeted, 0),
      totalActual: lines.reduce((sum, l) => sum + l.actual, 0),
      totalVariance: lines.reduce((sum, l) => sum + l.variance, 0),
    },
  };
};

/**
 * Save budget (compatibility method for reports)
 */
export const saveBudget = async (
  companyId: string,
  period: string,
  lines: Array<{ category: string; budgeted: number }>
) => {
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Create or update budget for this period
  let budget = await prisma.budget.findFirst({
    where: {
      companyId,
      name: `Monthly Budget ${period}`,
    },
  });

  if (!budget) {
    budget = await prisma.budget.create({
      data: {
        companyId,
        name: `Monthly Budget ${period}`,
        startDate,
        endDate,
        type: 'EXPENSE',
        status: 'ACTIVE',
      },
    });
  }

  // Update or create items
  for (const line of lines) {
    // Try to find a matching cost center
    const costCenter = await prisma.costCenter.findFirst({
      where: { companyId, name: line.category },
    });

    if (costCenter) {
      const existingItem = await prisma.budgetItem.findFirst({
        where: { budgetId: budget.id, costCenterId: costCenter.id },
      });

      if (existingItem) {
        await prisma.budgetItem.update({
          where: { id: existingItem.id },
          data: { budgetAmount: line.budgeted },
        });
      } else {
        await prisma.budgetItem.create({
          data: {
            budgetId: budget.id,
            costCenterId: costCenter.id,
            budgetAmount: line.budgeted,
          },
        });
      }
    }
  }

  await recalculateBudgetTotals(budget.id);
  return budget;
};

/**
 * Get budget alerts (compatibility method for reports)
 */
export const getBudgetAlerts = async (companyId: string, period: string) => {
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const budgets = await prisma.budget.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    include: {
      items: {
        include: {
          costCenter: { select: { name: true } },
          ledger: { select: { name: true } },
          project: { select: { name: true } },
        },
      },
    },
  });

  const alerts = [];
  for (const budget of budgets) {
    for (const item of budget.items) {
      const budgetAmount = Number(item.budgetAmount);
      const actualAmount = Number(item.actualAmount);
      const usedPercent = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;
      const dimension = item.costCenter?.name || item.ledger?.name || item.project?.name || 'Unknown';

      if (usedPercent > 100) {
        alerts.push({
          type: 'OVER_BUDGET',
          severity: 'HIGH',
          category: dimension,
          message: `${dimension} has exceeded budget by ${(usedPercent - 100).toFixed(1)}%`,
          budgeted: budgetAmount,
          actual: actualAmount,
        });
      } else if (usedPercent >= Number(budget.warningThreshold)) {
        alerts.push({
          type: 'WARNING',
          severity: 'MEDIUM',
          category: dimension,
          message: `${dimension} has used ${usedPercent.toFixed(1)}% of budget`,
          budgeted: budgetAmount,
          actual: actualAmount,
        });
      }
    }
  }

  return alerts;
};

const budgetService = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  updateActualsFromPostings,
  getBudgetVarianceReport,
  checkBudgetAvailability,
  getBudgetSummary,
  // Compatibility methods
  getBudgetVsActual,
  saveBudget,
  getBudgetAlerts,
};

export default budgetService;
