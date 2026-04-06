import prisma from '../config/prisma';
import logger from '../config/logger';
import { Decimal } from '@prisma/client/runtime/library';

interface PostingEntry {
  ledgerId: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  narration?: string;
  costCenterId?: string;
  projectId?: string;
}

interface CreateVoucherInput {
  companyId: string;
  date: Date;
  type: string;
  referenceType?: string;
  referenceId?: string;
  narration?: string;
  postings: PostingEntry[];
  createdById: string;
}

/**
 * Validate double-entry: debits must equal credits
 */
export const validateDoubleEntry = (postings: PostingEntry[]): { valid: boolean; difference: number } => {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const posting of postings) {
    if (posting.type === 'DEBIT') {
      totalDebit += posting.amount;
    } else {
      totalCredit += posting.amount;
    }
  }

  const difference = Math.abs(totalDebit - totalCredit);
  const valid = difference < 0.01; // Allow for rounding errors

  return { valid, difference };
};

/**
 * Check if a date falls within an open financial period
 */
export const isDateInOpenPeriod = async (companyId: string, date: Date): Promise<boolean> => {
  const period = await prisma.financialPeriod.findFirst({
    where: {
      companyId,
      startDate: { lte: date },
      endDate: { gte: date },
      isLocked: false,
    },
  });

  return !!period;
};

/**
 * Close a financial period
 */
export const closePeriod = async (
  periodId: string,
  companyId: string,
  userId: string
): Promise<any> => {
  const period = await prisma.financialPeriod.findFirst({
    where: { id: periodId, companyId },
  });

  if (!period) {
    throw new Error('Financial period not found');
  }

  if (period.isLocked) {
    throw new Error('Period is already closed');
  }

  // Check for unposted vouchers in this period
  const unpostedVouchers = await prisma.voucher.count({
    where: {
      companyId,
      date: {
        gte: period.startDate,
        lte: period.endDate,
      },
      status: 'DRAFT',
    },
  });

  if (unpostedVouchers > 0) {
    throw new Error(`Cannot close period: ${unpostedVouchers} unposted vouchers exist`);
  }

  const updatedPeriod = await prisma.financialPeriod.update({
    where: { id: periodId },
    data: {
      isLocked: true,
      lockedAt: new Date(),
      lockedBy: userId,
    },
  });

  logger.info(`Period ${periodId} closed by user ${userId}`);
  return updatedPeriod;
};

/**
 * Reopen a closed financial period
 */
export const reopenPeriod = async (
  periodId: string,
  companyId: string,
  userId: string
): Promise<any> => {
  const period = await prisma.financialPeriod.findFirst({
    where: { id: periodId, companyId },
  });

  if (!period) {
    throw new Error('Financial period not found');
  }

  if (!period.isLocked) {
    throw new Error('Period is not closed');
  }

  // Check if subsequent periods are closed
  const subsequentClosedPeriod = await prisma.financialPeriod.findFirst({
    where: {
      companyId,
      startDate: { gt: period.endDate },
      isLocked: true,
    },
  });

  if (subsequentClosedPeriod) {
    throw new Error('Cannot reopen: Subsequent periods are already closed');
  }

  const updatedPeriod = await prisma.financialPeriod.update({
    where: { id: periodId },
    data: {
      isLocked: false,
      lockedAt: null,
      lockedBy: null,
    },
  });

  logger.info(`Period ${periodId} reopened by user ${userId}`);
  return updatedPeriod;
};

/**
 * Create opening balances for a new financial year
 */
export const createOpeningBalances = async (
  fromYearId: string,
  toYearId: string,
  companyId: string,
  userId: string
): Promise<any> => {
  const fromYear = await prisma.financialYear.findFirst({
    where: { id: fromYearId, companyId },
  });

  const toYear = await prisma.financialYear.findFirst({
    where: { id: toYearId, companyId },
  });

  if (!fromYear || !toYear) {
    throw new Error('Financial year not found');
  }

  // Get all balance sheet accounts (Assets, Liabilities, Equity)
  const balanceSheetGroups = await prisma.ledgerGroup.findMany({
    where: {
      companyId,
      type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
    },
  });

  const groupIds = balanceSheetGroups.map(g => g.id);

  // Get closing balances for all ledgers
  const ledgers = await prisma.ledger.findMany({
    where: {
      companyId,
      groupId: { in: groupIds },
    },
  });

  const postings: PostingEntry[] = [];

  for (const ledger of ledgers) {
    // Calculate closing balance
    const ledgerPostings = await prisma.ledgerPosting.findMany({
      where: {
        ledgerId: ledger.id,
        voucher: {
          date: { lte: fromYear.endDate },
          status: 'POSTED',
        },
      },
    });

    let balance = Number(ledger.openingBalance || 0);
    for (const posting of ledgerPostings) {
      if (posting.type === 'DEBIT') {
        balance += Number(posting.amount);
      } else {
        balance -= Number(posting.amount);
      }
    }

    if (Math.abs(balance) > 0.01) {
      postings.push({
        ledgerId: ledger.id,
        amount: Math.abs(balance),
        type: balance > 0 ? 'DEBIT' : 'CREDIT',
        narration: `Opening balance from FY ${fromYear.name}`,
      });
    }
  }

  // Handle Profit & Loss carry forward to Retained Earnings
  const plGroups = await prisma.ledgerGroup.findMany({
    where: {
      companyId,
      type: { in: ['INCOME', 'EXPENSE'] },
    },
  });

  const plGroupIds = plGroups.map(g => g.id);
  const plLedgers = await prisma.ledger.findMany({
    where: {
      companyId,
      groupId: { in: plGroupIds },
    },
  });

  let netProfitLoss = 0;
  for (const ledger of plLedgers) {
    const ledgerPostings = await prisma.ledgerPosting.findMany({
      where: {
        ledgerId: ledger.id,
        voucher: {
          date: {
            gte: fromYear.startDate,
            lte: fromYear.endDate,
          },
          status: 'POSTED',
        },
      },
    });

    for (const posting of ledgerPostings) {
      const amount = Number(posting.amount);
      const group = plGroups.find(g => g.id === ledger.groupId);
      if (group?.type === 'INCOME') {
        netProfitLoss += posting.type === 'CREDIT' ? amount : -amount;
      } else {
        netProfitLoss -= posting.type === 'DEBIT' ? amount : -amount;
      }
    }
  }

  // Find or create Retained Earnings ledger
  let retainedEarningsLedger = await prisma.ledger.findFirst({
    where: {
      companyId,
      name: { contains: 'Retained Earnings' },
    },
  });

  if (!retainedEarningsLedger) {
    const equityGroup = await prisma.ledgerGroup.findFirst({
      where: { companyId, type: 'EQUITY' },
    });

    if (equityGroup) {
      retainedEarningsLedger = await prisma.ledger.create({
        data: {
          companyId,
          name: 'Retained Earnings',
          code: 'RE-' + Date.now().toString(),
          groupId: equityGroup.id,
          openingBalance: 0,
        },
      });
    }
  }

  if (retainedEarningsLedger && Math.abs(netProfitLoss) > 0.01) {
    postings.push({
      ledgerId: retainedEarningsLedger.id,
      amount: Math.abs(netProfitLoss),
      type: netProfitLoss > 0 ? 'CREDIT' : 'DEBIT',
      narration: `Profit/Loss carried forward from FY ${fromYear.name}`,
    });
  }

  // Create opening balance voucher if there are postings
  if (postings.length > 0) {
    const voucher = await prisma.voucher.create({
      data: {
        companyId,
        voucherNumber: `OB-${toYear.name}`,
        date: toYear.startDate,
        type: 'JOURNAL',
        narration: `Opening balances for FY ${toYear.name}`,
        status: 'POSTED',
        createdById: userId,
        postings: {
          create: postings.map(p => ({
            companyId,
            ledgerId: p.ledgerId,
            amount: p.amount,
            type: p.type,
            narration: p.narration,
          })),
        },
      },
      include: { postings: true },
    });

    logger.info(`Opening balances created for FY ${toYear.name}`);
    return voucher;
  }

  return { message: 'No balances to carry forward' };
};

/**
 * Reverse a posted voucher
 */
export const reverseVoucher = async (
  voucherId: string,
  reversalDate: Date,
  narration: string,
  userId: string
): Promise<any> => {
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: { postings: true },
  });

  if (!voucher) {
    throw new Error('Voucher not found');
  }

  if (voucher.status !== 'POSTED') {
    throw new Error('Can only reverse posted vouchers');
  }

  // Check if reversal date is in open period
  const isOpen = await isDateInOpenPeriod(voucher.companyId, reversalDate);
  if (!isOpen) {
    throw new Error('Reversal date is not in an open period');
  }

  // Create reversal voucher with opposite entries
  const reversalPostings = voucher.postings.map(p => ({
    companyId: p.companyId,
    ledgerId: p.ledgerId,
    amount: Number(p.amount),
    type: p.type === 'DEBIT' ? 'CREDIT' : 'DEBIT' as 'DEBIT' | 'CREDIT',
    narration: `Reversal: ${p.narration || ''}`,
    costCenterId: p.costCenterId,
    projectId: p.projectId,
  }));

  const reversalVoucher = await prisma.voucher.create({
    data: {
      companyId: voucher.companyId,
      voucherNumber: `REV-${voucher.voucherNumber}`,
      date: reversalDate,
      type: 'JOURNAL',
      narration: narration || `Reversal of ${voucher.voucherNumber}`,
      referenceType: 'VOUCHER_REVERSAL',
      referenceId: voucherId,
      status: 'POSTED',
      createdById: userId,
      postings: {
        create: reversalPostings,
      },
    },
    include: { postings: true },
  });

  // Mark original voucher as reversed
  await prisma.voucher.update({
    where: { id: voucherId },
    data: {
      status: 'REVERSED',
    },
  });

  logger.info(`Voucher ${voucherId} reversed with ${reversalVoucher.id}`);
  return reversalVoucher;
};

/**
 * Get account balance for a date range
 */
export const getAccountBalance = async (
  ledgerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ openingBalance: number; debits: number; credits: number; closingBalance: number }> => {
  const ledger = await prisma.ledger.findUnique({
    where: { id: ledgerId },
  });

  if (!ledger) {
    throw new Error('Ledger not found');
  }

  // Get opening balance (all postings before startDate)
  let openingBalance = Number(ledger.openingBalance || 0);

  if (startDate) {
    const priorPostings = await prisma.ledgerPosting.findMany({
      where: {
        ledgerId,
        voucher: {
          date: { lt: startDate },
          status: 'POSTED',
        },
      },
    });

    for (const posting of priorPostings) {
      if (posting.type === 'DEBIT') {
        openingBalance += Number(posting.amount);
      } else {
        openingBalance -= Number(posting.amount);
      }
    }
  }

  // Get period postings
  const whereClause: any = {
    ledgerId,
    voucher: { status: 'POSTED' },
  };

  if (startDate || endDate) {
    whereClause.voucher.date = {};
    if (startDate) whereClause.voucher.date.gte = startDate;
    if (endDate) whereClause.voucher.date.lte = endDate;
  }

  const periodPostings = await prisma.ledgerPosting.findMany({
    where: whereClause,
  });

  let debits = 0;
  let credits = 0;

  for (const posting of periodPostings) {
    if (posting.type === 'DEBIT') {
      debits += Number(posting.amount);
    } else {
      credits += Number(posting.amount);
    }
  }

  const closingBalance = openingBalance + debits - credits;

  return { openingBalance, debits, credits, closingBalance };
};

/**
 * Generate trial balance
 */
export const generateTrialBalance = async (
  companyId: string,
  asOfDate: Date
): Promise<{
  accounts: Array<{
    ledgerId: string;
    ledgerName: string;
    groupName: string;
    debit: number;
    credit: number;
  }>;
  totalDebit: number;
  totalCredit: number;
}> => {
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: { group: true },
  });

  const accounts: Array<{
    ledgerId: string;
    ledgerName: string;
    groupName: string;
    debit: number;
    credit: number;
  }> = [];

  let totalDebit = 0;
  let totalCredit = 0;

  for (const ledger of ledgers) {
    const balance = await getAccountBalance(ledger.id, undefined, asOfDate);

    if (Math.abs(balance.closingBalance) > 0.01) {
      const isDebit = balance.closingBalance > 0;
      const amount = Math.abs(balance.closingBalance);

      accounts.push({
        ledgerId: ledger.id,
        ledgerName: ledger.name,
        groupName: ledger.group?.name || 'Unknown',
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
      });

      if (isDebit) {
        totalDebit += amount;
      } else {
        totalCredit += amount;
      }
    }
  }

  return {
    accounts: accounts.sort((a, b) => a.groupName.localeCompare(b.groupName)),
    totalDebit,
    totalCredit,
  };
};

const glService = {
  validateDoubleEntry,
  isDateInOpenPeriod,
  closePeriod,
  reopenPeriod,
  createOpeningBalances,
  reverseVoucher,
  getAccountBalance,
  generateTrialBalance,
};

export default glService;
