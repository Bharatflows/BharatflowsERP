import { Request, Response } from 'express';
import * as ExcelJS from 'exceljs';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import logger from '../config/logger';

// Helper to get safe number
const safeNumber = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

// @desc    Import Products from CSV/Excel
// @route   POST /api/v1/bulk/products/import
// @access  Private (Admin/Inventory Manager)
export const importProducts = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const companyId = req.user.companyId;
        const userId = req.user.id;

        const workbook = new ExcelJS.Workbook();

        // Determine format based on mimetype or extension
        if (req.file.mimetype.includes('csv') || req.file.originalname.endsWith('.csv')) {
            await workbook.csv.readFile(filePath);
        } else {
            await workbook.xlsx.readFile(filePath);
        }

        const worksheet = workbook.getWorksheet(1); // First sheet
        if (!worksheet) {
            throw new Error('No worksheet found in file');
        }

        const productsToCreate: any[] = [];
        const errors: any[] = [];
        let rowCount = 0;

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            rowCount++;
            // Assuming columns: Name, Code, Unit, PurchasePrice, SalesPrice, HSN, Stock, MinStock
            // Column indexing is 1-based in ExcelJS
            const name = row.getCell(1).text;
            const code = row.getCell(2).text;
            const unit = row.getCell(3).text;
            const purchasePrice = safeNumber(row.getCell(4).value);
            const salesPrice = safeNumber(row.getCell(5).value);
            const hsnCode = row.getCell(6).text;
            const currentStock = safeNumber(row.getCell(7).value);
            const minStockLevel = safeNumber(row.getCell(8).value);

            if (!name || !unit) {
                errors.push({ row: rowNumber, message: 'Name and Unit are required' });
                return;
            }

            productsToCreate.push({
                name,
                code: code || `PROD-${Date.now()}-${rowNumber}`,
                unit,
                purchasePrice,
                salesPrice,
                hsnCode,
                currentStock,
                minStockLevel,
                companyId,
                description: 'Imported via Bulk API'
            });
        });

        // Batch Create (using transaction)
        // Note: createMany is supported in Postgres
        if (productsToCreate.length > 0) {
            await prisma.product.createMany({
                data: productsToCreate,
                skipDuplicates: true // Skip if code collision, or handle via upsert loop? createMany skipDuplicates avoids error
            });
        }

        // Cleanup file
        fs.unlinkSync(filePath);

        return res.json({
            success: true,
            message: `Processed ${rowCount} rows`,
            imported: productsToCreate.length,
            errors
        });

    } catch (error: any) {
        logger.error('Import Products Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error importing products'
        });
    }
};

// @desc    Bulk Update Invoice Status
// @route   POST /api/v1/bulk/invoices/status
// @access  Private
export const bulkUpdateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const { invoiceIds, status } = req.body;
        const companyId = req.user.companyId;

        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No invoice IDs provided' });
        }

        const ALLOWED_STATUSES = ['DRAFT', 'SENT', 'PAID', 'CANCELLED'];
        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // C1 Check: Cannot change FROM final status (PAID/CANCELLED) unless logic permits?
        // For simplicity, we only allow bulk updates on active invoices?
        // Or we let the updateMany handle filtering?
        // Validating each invoice individually is slow but safer.

        // Strategy: Update where id IN ids AND status NOT IN ('PAID', 'CANCELLED')
        // Unless target is CANCELLED??

        // Pushing responsibility to query filters
        const updateResult = await prisma.invoice.updateMany({
            where: {
                id: { in: invoiceIds },
                companyId,
                status: {
                    notIn: ['PAID', 'CANCELLED'] // Prevent modifying finalized invoices via bulk too (C1 enforcement)
                }
            },
            data: {
                status
            }
        });

        return res.json({
            success: true,
            message: `Updated status to ${status}`,
            count: updateResult.count,
            requested: invoiceIds.length
        });

    } catch (error: any) {
        logger.error('Bulk Update Invoice Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error updating invoices'
        });
    }
};
