import { Response } from 'express';
// Force update
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import * as accountingService from '../../services/accountingService';
import { PostingType } from '@prisma/client';

// @desc    Create a payment receipt (Customer Payment)
// @route   POST /api/v1/accounting/receipts
// @access  Private
export const createReceipt = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            date,
            partyId,
            amount,
            mode, // 'CASH' or 'BANK' or 'UPI'
            reference,
            notes,
            bankAccountId // Optional, required if mode is NOT Cash
        } = req.body;

        const companyId = req.user.companyId;

        if (!partyId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Party and Valid Amount are required'
            });
        }

        // 1. Get Party Ledger
        const partyLedgerId = await accountingService.getOrCreatePartyLedger(companyId, partyId);
        if (!partyLedgerId) {
            throw new Error('Could not find or create ledger for party');
        }

        // 2. Get Safe/Bank Ledger (Asset)
        let assetLedgerId: string;

        if (mode === 'CASH') {
            assetLedgerId = await accountingService.getSystemLedgerByCode(companyId, 'CASH');
        } else {
            // If Bank/UPI, expect bankAccountId or try to find a default Bank Ledger
            if (bankAccountId) {
                // Find ledger for this bank account
                const bankLedger = await prisma.ledger.findFirst({
                    where: { companyId, bankAccountId }
                });
                if (!bankLedger) throw new Error('Ledger not found for selected Bank Account');
                assetLedgerId = bankLedger.id;
            } else {
                // Fallback or Error? 
                // If no bank specified, maybe try to find ANY bank ledger or Error.
                // For now, let's require bankAccountId if not CASH, or fallback to CASH if mode is ambiguous but shouldn't happen.
                return res.status(400).json({
                    success: false,
                    message: 'Bank Account is required for non-cash payments'
                });
            }
        }

        const voucherNumber = await accountingService.getNextVoucherNumber(companyId, 'RECEIPT');

        // 3. Create Voucher
        // Dr Asset (Cash/Bank) - Increase Asset
        // Cr Customer (Debtor) - Decrease Asset (Credit reduces Debit balance)
        // OR Cr Supplier (Creditor) if receiving refund? Default assume receipt from customer.
        // If Party is Customer (Asset), Credit decreases balance.

        const result = await prisma.$transaction(async (tx) => {
            // Create Voucher
            const voucher = await accountingService.createVoucher({
                companyId,
                voucherNumber,
                date: new Date(date),
                type: 'RECEIPT',
                referenceType: 'MANUAL_RECEIPT',
                referenceId: reference,
                narration: notes || `Receipt from ${mode} - Ref: ${reference || ''}`,
                postings: [
                    {
                        ledgerId: assetLedgerId,
                        amount: Number(amount),
                        type: 'DEBIT',
                        narration: 'Receipt Amount'
                    },
                    {
                        ledgerId: partyLedgerId,
                        amount: Number(amount),
                        type: 'CREDIT',
                        narration: `Received from Party`
                    }
                ]
            });

            // Update Party Balance
            // Receipt (Credit to Party) DECREASES balance (if Debit balance)
            // Party.currentBalance tracks "Net Receivable" usually? 
            // If currentBalance is positive (Receivable), doing a receipt should decrement it.
            await tx.party.update({
                where: { id: partyId },
                data: {
                    currentBalance: { decrement: Number(amount) }
                }
            });

            return voucher;
        });

        return res.status(201).json({
            success: true,
            message: 'Receipt created successfully',
            data: { voucher: result }
        });

    } catch (error: any) {
        logger.error('Create receipt error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating receipt',
            error: error.message
        });
    }
};

// @desc    Get receipts
// @route   GET /api/v1/accounting/receipts
// @access  Private
// Uses Voucher list filtered by TYPE=RECEIPT
export const getReceipts = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const receipts = await prisma.voucher.findMany({
            where: {
                companyId: req.user.companyId,
                type: 'RECEIPT'
            },
            include: {
                postings: {
                    include: { ledger: true }
                }
            },
            orderBy: { date: 'desc' },
            take: 100 // Limit for now
        });

        // Transform to friendly format?
        // Identify Party from postings (Credit entry usually)
        const formatted = receipts.map(r => {
            const creditEntry = r.postings.find(p => p.type === 'CREDIT');
            const debitEntry = r.postings.find(p => p.type === 'DEBIT');

            return {
                id: r.id,
                voucherNumber: r.voucherNumber,
                date: r.date,
                amount: debitEntry?.amount || 0,
                partyName: creditEntry?.ledger.name || 'Unknown',
                mode: debitEntry?.ledger.name || 'Cash', // Simple heuristic
                narration: r.narration
            };
        });

        return res.status(200).json({
            success: true,
            data: { receipts: formatted }
        });

    } catch (error: any) {
        logger.error('Get receipts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching receipts',
            error: error.message
        });
    }
};
