import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import accountingService, { getProfitAndLoss as fetchProfitAndLoss, getBalanceSheet as fetchBalanceSheet } from '../services/accountingService';
// Type definitions for SQLite (no enums)
type VoucherType = 'PAYMENT' | 'RECEIPT' | 'CONTRA' | 'JOURNAL' | 'SALES' | 'PURCHASE' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
type PostingType = 'DEBIT' | 'CREDIT';
import logger from '../config/logger';
import { requireUnlockedPeriod } from '../services/periodLockService';

// ==================== LEDGER GROUPS ====================

export const getLedgerGroups = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const groups = await accountingService.getLedgerGroups(companyId);
        res.json({ success: true, data: groups });
    } catch (error: any) {
        logger.error('Error fetching ledger groups:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createLedgerGroup = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const companyId = req.user!.companyId;
        const { name, code, type, description, parentId } = req.body;

        if (!name || !code || !type) {
            return res.status(400).json({ success: false, message: 'Name, code, and type are required' });
        }

        const group = await accountingService.createLedgerGroup({
            name,
            code,
            type,
            description,
            parentId,
            companyId
        });

        return res.status(201).json({ success: true, data: group });
    } catch (error: any) {
        logger.error('Error creating ledger group:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const seedDefaultGroups = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        await accountingService.seedDefaultLedgerGroups(companyId);
        res.json({ success: true, message: 'Default ledger groups seeded successfully' });
    } catch (error: any) {
        logger.error('Error seeding ledger groups:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== LEDGERS ====================

export const getLedgers = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const ledgers = await accountingService.getLedgers(companyId);
        res.json({ success: true, data: ledgers });
    } catch (error: any) {
        logger.error('Error fetching ledgers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLedger = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const { id } = req.params;
        const ledger = await accountingService.getLedger(id);

        if (!ledger) {
            return res.status(404).json({ success: false, message: 'Ledger not found' });
        }

        return res.json({ success: true, data: ledger });
    } catch (error: any) {
        logger.error('Error fetching ledger:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createLedger = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const companyId = req.user!.companyId;
        const { name, code, groupId, description, openingBalance, openingType, partyId, bankAccountId } = req.body;

        if (!name || !code || !groupId) {
            return res.status(400).json({ success: false, message: 'Name, code, and groupId are required' });
        }

        const ledger = await accountingService.createLedger({
            name,
            code,
            groupId,
            description,
            openingBalance,
            openingType,
            partyId,
            bankAccountId,
            companyId
        });

        return res.status(201).json({ success: true, data: ledger });
    } catch (error: any) {
        logger.error('Error creating ledger:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


export const updateLedger = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const { id } = req.params;
        const { name, code, groupId, description, openingBalance, openingType, isActive } = req.body;

        const ledger = await accountingService.updateLedger(id, {
            name,
            code,
            groupId,
            description,
            openingBalance,
            openingType,
            isActive
        });

        return res.json({ success: true, data: ledger });
    } catch (error: any) {
        logger.error('Error updating ledger:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getLedgerBalance = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { asOfDate } = req.query;

        const balance = await accountingService.getLedgerBalance(
            id,
            asOfDate ? new Date(asOfDate as string) : undefined
        );

        res.json({ success: true, data: balance });
    } catch (error: any) {
        logger.error('Error fetching ledger balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== VOUCHERS ====================

export const getVouchers = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { type, from, to } = req.query;

        const vouchers = await accountingService.getVouchers(companyId, {
            type: type as VoucherType | undefined,
            from: from ? new Date(from as string) : undefined,
            to: to ? new Date(to as string) : undefined
        });

        res.json({ success: true, data: vouchers });
    } catch (error: any) {
        logger.error('Error fetching vouchers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getVoucher = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const { id } = req.params;
        const voucher = await accountingService.getVoucher(id);

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        return res.json({ success: true, data: voucher });
    } catch (error: any) {
        logger.error('Error fetching voucher:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createVoucher = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const { date, type, narration, postings } = req.body;

        if (!date || !type || !postings || postings.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Date, type, and at least 2 postings are required'
            });
        }

        // Phase 8: Check period lock before creating voucher
        await requireUnlockedPeriod(
            companyId,
            new Date(date),
            'voucher creation'
        );

        // Generate voucher number
        const voucherNumber = await accountingService.getNextVoucherNumber(companyId, type);

        const voucher = await accountingService.createVoucher({
            voucherNumber,
            date: new Date(date),
            type,
            narration,
            companyId,
            createdById: userId,
            postings: postings.map((p: any) => ({
                ledgerId: p.ledgerId,
                amount: Number(p.amount),
                type: p.type as PostingType,
                narration: p.narration
            })),
            referenceType: 'MANUAL',
            referenceId: voucherNumber
        });

        return res.status(201).json({ success: true, data: voucher });
    } catch (error: any) {
        logger.error('Error creating voucher:', error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * B5: Cancel/Reverse a Voucher
 * - DRAFT vouchers: Mark as CANCELLED directly
 * - POSTED vouchers: Create reversal entry and mark original as REVERSED
 * POST /api/v1/accounting/vouchers/:id/cancel
 */
export const cancelVoucher = async (req: AuthRequest, res: Response): Promise<void | Response> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const companyId = req.user!.companyId;
        const userId = req.user!.id;

        // Fetch voucher with postings
        const voucher = await accountingService.getVoucher(id);

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        // Verify company ownership
        if (voucher.companyId !== companyId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Check: Already cancelled or reversed
        if (voucher.status === 'CANCELLED' || voucher.status === 'REVERSED') {
            return res.status(400).json({
                success: false,
                message: `Voucher already ${voucher.status}`,
                code: 'VOUCHER_ALREADY_CANCELLED'
            });
        }

        // Phase 8: Check period lock before modifying/reversing voucher
        // Ensure the ORIGINAL voucher's date is not in a locked period (if cancelling)
        // AND ensuring the REVERSAL date (today) is not locked (if reversing)

        // 1. Check if we can modify the original voucher (for straight cancellation)
        // If it's a DRAFT, we might allow cancellation even if period is locked? 
        // Strict accounting says NO changes to locked periods period.
        await requireUnlockedPeriod(
            companyId,
            new Date(voucher.date),
            'voucher modification (cancel/reverse)'
        );

        // 2. If creating a reversal entry (today), ensure today is unlocked
        if (voucher.status === 'POSTED') {
            await requireUnlockedPeriod(
                companyId,
                new Date(),
                'reversal entry creation'
            );
        }

        // If voucher has postings (is POSTED), create reversal
        if (voucher.postings && voucher.postings.length > 0 && voucher.status === 'POSTED') {
            // Generate reversal voucher number
            const reversalNumber = await accountingService.getNextVoucherNumber(companyId, voucher.type as VoucherType);

            // Create reversal voucher with opposite postings
            const reversalNarration = `Reversal of ${voucher.voucherNumber}: ${reason || 'No reason provided'}`;

            const reversalVoucher = await accountingService.createVoucher({
                voucherNumber: reversalNumber,
                date: new Date(),
                type: voucher.type as VoucherType,
                narration: reversalNarration,
                companyId,
                createdById: userId,
                referenceType: 'REVERSAL',
                referenceId: voucher.id,
                postings: voucher.postings.map((p: any) => ({
                    ledgerId: p.ledgerId,
                    amount: Number(p.amount),
                    type: p.type === 'DEBIT' ? 'CREDIT' : 'DEBIT', // REVERSE THE TYPE
                    narration: `Reversal: ${p.narration || ''}`
                }))
            });

            // Mark original voucher as REVERSED
            await accountingService.updateVoucherStatus(id, 'REVERSED');

            logger.info(`[B5] Voucher ${voucher.voucherNumber} reversed. Reversal: ${reversalVoucher.voucherNumber}`);

            return res.json({
                success: true,
                message: 'Voucher reversed successfully',
                data: {
                    originalVoucher: { id: voucher.id, status: 'REVERSED' },
                    reversalVoucher: reversalVoucher
                }
            });
        } else {
            // DRAFT voucher - just cancel
            await accountingService.updateVoucherStatus(id, 'CANCELLED');

            logger.info(`[B5] Voucher ${voucher.voucherNumber} cancelled`);

            return res.json({
                success: true,
                message: 'Voucher cancelled successfully',
                data: { id: voucher.id, status: 'CANCELLED' }
            });
        }
    } catch (error: any) {
        logger.error('Error cancelling voucher:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== REPORTS ====================

export const getTrialBalance = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { asOfDate } = req.query;

        const trialBalance = await accountingService.getTrialBalance(
            companyId,
            asOfDate ? new Date(asOfDate as string) : undefined
        );

        res.json({ success: true, data: trialBalance });
    } catch (error: any) {
        logger.error('Error generating trial balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProfitLoss = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        const report = await fetchProfitAndLoss(companyId, start, end);
        res.json({ success: true, data: report });
    } catch (error: any) {
        logger.error('Error generating P&L:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { asOfDate } = req.query;

        const date = asOfDate ? new Date(asOfDate as string) : new Date();

        const report = await fetchBalanceSheet(companyId, date);
        res.json({ success: true, data: report });
    } catch (error: any) {
        logger.error('Error generating Balance Sheet:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    getLedgerGroups,
    createLedgerGroup,
    seedDefaultGroups,
    getLedgers,
    getLedger,
    createLedger,
    updateLedger,
    getLedgerBalance,
    getVouchers,
    getVoucher,
    createVoucher,
    getTrialBalance,
    getProfitLoss,
    getBalanceSheet
};
