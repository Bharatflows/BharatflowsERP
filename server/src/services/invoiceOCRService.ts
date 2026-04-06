import logger from '../config/logger';

/**
 * InvoiceOCRService - Stub implementation
 * 
 * Re-created after domains folder deletion.
 * This is a placeholder for OCR functionality.
 * 
 * TODO: Implement full OCR logic using Tesseract.js or external API.
 */
export class InvoiceOCRService {
    async processInvoiceDocument(filePathOrUrl: string): Promise<{
        invoiceNumber?: string;
        date?: string;
        total?: number;
        vendor?: string;
        items?: { description: string; amount: number }[];
        rawText?: string;
    }> {
        logger.info(`[OCR] Processing document: ${filePathOrUrl}`);

        // Stub implementation - returns empty result
        // Full implementation would use Tesseract.js or external OCR service
        logger.warn('[OCR] Service is a stub. Full implementation pending.');

        return {
            invoiceNumber: undefined,
            date: undefined,
            total: undefined,
            vendor: undefined,
            items: [],
            rawText: 'OCR service not yet implemented.',
        };
    }
}

export default InvoiceOCRService;
