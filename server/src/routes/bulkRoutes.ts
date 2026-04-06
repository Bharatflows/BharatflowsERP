import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { protect, authorize } from '../middleware/auth';
import { importProducts, bulkUpdateInvoiceStatus } from '../controllers/bulkActionsController';
import { BulkInvoiceService } from '../services/bulkInvoiceService';

const router = Router();

// Configure Multer
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename/keep extension
        cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// H2: Bulk Operations Routes
router.post('/products/import', protect, authorize('inventory', 'create'), upload.single('file'), importProducts);
router.post('/invoices/status', protect, authorize('sales', 'edit'), bulkUpdateInvoiceStatus);

// Bulk Invoice Upload: Validate (preview before commit)
router.post('/invoices/validate', protect, async (req: Request, res: Response) => {
    try {
        const { rows } = req.body;
        const companyId = req.headers['x-company-id'] as string || (req as any).user?.companyId;
        if (!rows || !Array.isArray(rows)) {
            return res.status(400).json({ success: false, error: 'Request body must include "rows" array' });
        }
        const result = await BulkInvoiceService.validateBulk(rows, companyId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Bulk Invoice Upload: Commit validated invoices
router.post('/invoices/commit', protect, async (req: Request, res: Response) => {
    try {
        const { invoices } = req.body;
        const companyId = req.headers['x-company-id'] as string || (req as any).user?.companyId;
        const userId = (req as any).user?.id;
        if (!invoices || !Array.isArray(invoices)) {
            return res.status(400).json({ success: false, error: 'Request body must include "invoices" array' });
        }
        const result = await BulkInvoiceService.commitBulk(invoices, companyId, userId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

