import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// ==================== TDS/TCS MANAGEMENT ====================

export const getTDSTCSEntries = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const entries = await prisma.tDSTCSEntry.findMany({
            where: { companyId },
            orderBy: { transactionDate: 'desc' }
        });
        res.json({ success: true, data: entries });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTDSTCSEntry = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const entry = await prisma.tDSTCSEntry.create({
            data: {
                ...req.body,
                companyId
            }
        });
        res.status(201).json({ success: true, data: entry });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== GSTR-2B RECONCILIATION ====================

export const getGSTR2BRecords = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { returnPeriod, matchStatus } = req.query;

        const where: any = { companyId };
        if (returnPeriod) where.returnPeriod = returnPeriod as string;
        if (matchStatus) where.matchStatus = matchStatus as string;

        const records = await prisma.gSTR2BRecord.findMany({
            where,
            orderBy: { invoiceDate: 'desc' }
        });
        res.json({ success: true, data: records });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const reconcileGSTR2B = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { matchStatus, purchaseBillId, mismatchReason } = req.body;
        const companyId = req.user!.companyId;

        const record = await prisma.gSTR2BRecord.update({
            where: { id, companyId },
            data: {
                matchStatus,
                purchaseBillId,
                mismatchReason,
                actionDate: new Date(),
                actionBy: req.user!.id
            }
        });
        res.json({ success: true, data: record });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const uploadGSTR2B = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { records, returnPeriod } = req.body;

        if (!records || !Array.isArray(records)) {
            res.status(400).json({ success: false, message: 'Invalid records format' });
            return;
        }

        const createdRecords = [];

        for (const record of records) {
            // Simplified matching: look for purchase bills with same invoice number and amount
            const matchingBill = await prisma.purchaseBill.findFirst({
                where: {
                    companyId,
                    billNumber: record.invoiceNumber,
                    totalAmount: record.invoiceValue
                }
            });

            const newRecord = await prisma.gSTR2BRecord.upsert({
                where: {
                    supplierGstin_invoiceNumber_returnPeriod_companyId: {
                        supplierGstin: record.supplierGstin,
                        invoiceNumber: record.invoiceNumber,
                        returnPeriod: returnPeriod,
                        companyId
                    }
                },
                update: {
                    supplierName: record.supplierName,
                    invoiceDate: new Date(record.invoiceDate),
                    invoiceValue: record.invoiceValue,
                    taxableValue: record.taxableValue,
                    cgst: record.cgst || 0,
                    sgst: record.sgst || 0,
                    igst: record.igst || 0,
                    cess: record.cess || 0,
                    matchStatus: matchingBill ? 'MATCHED' : 'UNMATCHED',
                    purchaseBillId: matchingBill?.id || null,
                },
                create: {
                    supplierGstin: record.supplierGstin,
                    supplierName: record.supplierName,
                    invoiceNumber: record.invoiceNumber,
                    invoiceDate: new Date(record.invoiceDate),
                    invoiceValue: record.invoiceValue,
                    taxableValue: record.taxableValue,
                    cgst: record.cgst || 0,
                    sgst: record.sgst || 0,
                    igst: record.igst || 0,
                    cess: record.cess || 0,
                    returnPeriod: returnPeriod,
                    companyId,
                    matchStatus: matchingBill ? 'MATCHED' : 'UNMATCHED',
                    purchaseBillId: matchingBill?.id || null,
                }
            });
            createdRecords.push(newRecord);
        }

        res.json({
            success: true,
            message: `Successfully processed ${createdRecords.length} GSTR-2B records`,
            data: createdRecords
        });
    } catch (error: any) {
        console.error('Upload GSTR-2B error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
