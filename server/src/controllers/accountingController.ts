/**
 * Accounting Controller
 * Handles Chart of Accounts, Vouchers, and Financial Reports
 */

import { Request, Response } from 'express';
import accountingService from '../services/accountingService';
import { VoucherType, PostingType } from '@prisma/client';

// ==================== LEDGER GROUPS ====================

export const getLedgerGroups = async (req: Request, res: Response) => {
    try {
        const companyId = (req as any).user.companyId;
        const groups = await accountingService.getLedgerGroups(companyId);
        res.json({ success: true, data: groups });
    } catch (error: any) {
        console.error('Error fetching ledger groups:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createLedgerGroup = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const companyId = (req as any).user.companyId;
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
        console.error('Error creating ledger group:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const seedDefaultGroups = async (req: Request, res: Response) => {
    try {
        const companyId = (req as any).user.companyId;
        await accountingService.seedDefaultLedgerGroups(companyId);
        res.json({ success: true, message: 'Default ledger groups seeded successfully' });
    } catch (error: any) {
        console.error('Error seeding ledger groups:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== LEDGERS ====================

export const getLedgers = async (req: Request, res: Response) => {
    try {
        const companyId = (req as any).user.companyId;
        const ledgers = await accountingService.getLedgers(companyId);
        res.json({ success: true, data: ledgers });
    } catch (error: any) {
        console.error('Error fetching ledgers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLedger = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const { id } = req.params;
        const ledger = await accountingService.getLedger(id);

        if (!ledger) {
            return res.status(404).json({ success: false, message: 'Ledger not found' });
        }

        return res.json({ success: true, data: ledger });
    } catch (error: any) {
        console.error('Error fetching ledger:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createLedger = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const companyId = (req as any).user.companyId;
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
        console.error('Error creating ledger:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getLedgerBalance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { asOfDate } = req.query;

        const balance = await accountingService.getLedgerBalance(
            id,
            asOfDate ? new Date(asOfDate as string) : undefined
        );

        res.json({ success: true, data: balance });
    } catch (error: any) {
        console.error('Error fetching ledger balance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== VOUCHERS ====================

export const getVouchers = async (req: Request, res: Response) => {
    try {
        const companyId = (req as any).user.companyId;
        const { type, from, to } = req.query;

        const vouchers = await accountingService.getVouchers(companyId, {
            type: type as VoucherType | undefined,
            from: from ? new Date(from as string) : undefined,
            to: to ? new Date(to as string) : undefined
        });

        res.json({ success: true, data: vouchers });
    } catch (error: any) {
        console.error('Error fetching vouchers:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getVoucher = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const { id } = req.params;
        const voucher = await accountingService.getVoucher(id);

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        return res.json({ success: true, data: voucher });
    } catch (error: any) {
        console.error('Error fetching voucher:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createVoucher = async (req: Request, res: Response): Promise<void | Response> => {
    try {
        const companyId = (req as any).user.companyId;
        const userId = (req as any).user.id;
        const { date, type, narration, postings } = req.body;

        if (!date || !type || !postings || postings.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Date, type, and at least 2 postings are required'
            });
        }

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
            }))
        });

        return res.status(201).json({ success: true, data: voucher });
    } catch (error: any) {
        console.error('Error creating voucher:', error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ==================== REPORTS ====================

export const getTrialBalance = async (req: Request, res: Response) => {
    try {
        const companyId = (req as any).user.companyId;
        const { asOfDate } = req.query;

        const trialBalance = await accountingService.getTrialBalance(
            companyId,
            asOfDate ? new Date(asOfDate as string) : undefined
        );

        res.json({ success: true, data: trialBalance });
    } catch (error: any) {
        console.error('Error generating trial balance:', error);
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
    getLedgerBalance,
    getVouchers,
    getVoucher,
    createVoucher,
    getTrialBalance
};
