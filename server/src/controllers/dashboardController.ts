
import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

export const dashboardController = {
    async getStats(req: Request, res: Response) {
        try {
            const companyId = req.params.companyId || req.query.companyId as string || 'default-company-id';
            const data = await dashboardService.getStats(companyId);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getCashFlow(req: Request, res: Response) {
        try {
            // Assuming user attached to req by middleware, otherwise defaults needed
            // const companyId = req.user?.companyId; 
            // For now, hardcode or fetch from query if multi-tenant logic isn't strictly enforced yet
            // But adhering to our previous patterns:
            const companyId = req.params.companyId || 'default-company-id'; // Fallback for MVP

            const data = await dashboardService.getCashFlow(companyId);
            res.json(data);
        } catch (error: any) {
            console.error('Error fetching cash flow:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async getTickerData(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string || 'default-company-id';
            const data = await dashboardService.getTickerData(companyId);
            res.json(data);
        } catch (error: any) {
            console.error('Error fetching ticker data:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async getKPIs(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string || 'default-company-id';
            const data = await dashboardService.getKPIs(companyId);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching KPIs:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getTopCustomers(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string || 'default-company-id';
            const limit = parseInt(req.query.limit as string) || 10;
            const data = await dashboardService.getTopCustomers(companyId, limit);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching top customers:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getPaymentAging(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string || 'default-company-id';
            const data = await dashboardService.getPaymentAging(companyId);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching payment aging:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getRevenueTrend(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string || 'default-company-id';
            const data = await dashboardService.getRevenueTrend(companyId);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching revenue trend:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async getGSTBreakdown(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string || 'default-company-id';
            const data = await dashboardService.getGSTBreakdown(companyId);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('Error fetching GST breakdown:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
};
