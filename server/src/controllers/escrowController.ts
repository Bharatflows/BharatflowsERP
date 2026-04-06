
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';
import { EscrowService } from '../services/escrowService';
import prisma from '../config/prisma';

/**
 * @desc    Create Escrow Transaction
 * @route   POST /api/v1/escrow
 */
export const createEscrow = async (req: AuthRequest, res: Response) => {
    try {
        const { payerId, payeeId, amount, description, invoiceId } = req.body;
        const companyId = req.user.companyId;

        const transaction = await EscrowService.createEscrow({
            companyId,
            payerId,
            payeeId,
            amount: Number(amount),
            invoiceId,
            conditions: description,
        });

        return res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (error: any) {
        logger.error('Create Escrow error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    Release Escrow
 * @route   POST /api/v1/escrow/:id/release
 */
export const releaseEscrow = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const result = await EscrowService.releaseEscrow(id, companyId);

        return res.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        logger.error('Release Escrow error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * @desc    List Escrow Transactions
 * @route   GET /api/v1/escrow
 */
export const listEscrowTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user.companyId;
        const transactions = await prisma.escrowTransaction.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });

        return res.json({
            success: true,
            data: transactions
        });
    } catch (error: any) {
        logger.error('List Escrow error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
