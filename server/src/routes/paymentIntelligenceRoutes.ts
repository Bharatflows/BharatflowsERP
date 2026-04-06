/**
 * Payment Intelligence Routes
 * Vendor scoring, payment term analysis, and escrow auto-release
 */
import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { VendorScoringService } from '../services/vendorScoringService';
import { PaymentTermAnalyzerService } from '../services/paymentTermAnalyzerService';
import { TallyExportService } from '../services/tallyExportService';
import { EscrowAutoReleaseService } from '../services/escrowAutoReleaseService';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(protect);

// ─── Vendor Scoring ───
router.get('/vendor-score/:partyId', async (req: AuthRequest, res: Response) => {
    try {
        const score = await VendorScoringService.getVendorScore(req.params.partyId, req.user.companyId);
        res.json({ success: true, data: score });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/top-vendors', async (req: AuthRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const vendors = await VendorScoringService.getTopVendors(req.user.companyId, limit);
        res.json({ success: true, data: vendors });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── Payment Term Analysis ───
router.get('/term-analysis', async (req: AuthRequest, res: Response) => {
    try {
        const type = (req.query.type as string || 'SUPPLIER').toUpperCase() as 'CUSTOMER' | 'SUPPLIER';
        const data = await PaymentTermAnalyzerService.analyzePaymentTerms(req.user.companyId, type);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/term-summary', async (req: AuthRequest, res: Response) => {
    try {
        const summary = await PaymentTermAnalyzerService.getSummary(req.user.companyId);
        res.json({ success: true, data: summary });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── Tally Export ───
router.get('/tally-export', requirePermission('invoices', 'export'), async (req: AuthRequest, res: Response) => {
    try {
        const startDate = new Date(req.query.startDate as string || new Date(new Date().getFullYear(), 3, 1).toISOString());
        const endDate = new Date(req.query.endDate as string || new Date().toISOString());
        const type = (req.query.type as string || 'SALES').toUpperCase() as 'SALES' | 'PURCHASE';

        const xml = await TallyExportService.exportInvoices(req.user.companyId, startDate, endDate, type);

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=tally-export-${type.toLowerCase()}-${Date.now()}.xml`);
        res.send(xml);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── Escrow Auto-Release ───
router.get('/auto-release/upcoming', async (req: AuthRequest, res: Response) => {
    try {
        const releases = await EscrowAutoReleaseService.getUpcomingReleases(req.user.companyId);
        res.json({ success: true, data: releases });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/auto-release/process', requirePermission('escrow', 'release'), async (req: AuthRequest, res: Response) => {
    try {
        const result = await EscrowAutoReleaseService.processAutoReleases();
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── RBAC Permissions ───
router.get('/permissions', async (req: AuthRequest, res: Response) => {
    try {
        const { getRolePermissions } = await import('../middleware/rbac');
        const perms = getRolePermissions(req.user.role || 'VIEWER');
        res.json({ success: true, data: { role: req.user.role, permissions: perms } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
