
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../config/logger';
import { InvoiceOCRService } from '../../services/invoiceOCRService';

const ocrService = new InvoiceOCRService();

/**
 * @desc    Process uploaded invoice file (OCR)
 * @route   POST /api/v1/sales/invoices/ocr
 * @access  Private
 */
export const scanInvoice = async (req: AuthRequest, res: Response) => {
    try {
        // We assume 'multer' or similar middleware processes the file and puts it in req.file
        // For MVP, if we don't have multer set up globally yet, we might receive base64 or a URL in body.
        // Let's support both file upload (req.file) and URL (req.body.fileUrl) for flexibility.

        let fileUrl = req.body.fileUrl;

        if (req.file) {
            // If file is uploaded, use its path or buffer
            // For Tesseract.js, buffer or path works.
            // If we are using standard multer diskStorage:
            fileUrl = req.file.path;
        }

        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'No file provided. Please upload a file or provide fileUrl.'
            });
        }

        const extractedData = await ocrService.processInvoiceDocument(fileUrl);

        return res.status(200).json({
            success: true,
            message: 'Invoice processed successfully',
            data: extractedData
        });

    } catch (error: any) {
        logger.error('OCR Processing error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing invoice document',
            error: error.message
        });
    }
};
