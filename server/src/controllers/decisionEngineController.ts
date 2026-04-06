/**
 * Decision Engine Controller
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import decisionEngineService from '../services/decisionEngineService';
import logger from '../config/logger';

export const getDecisionInsights = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ success: false, message: 'Company ID is required' });

        const insights = {
            profitHeatmap: await decisionEngineService.getProfitHeatmap(companyId),
            leakageAlerts: await decisionEngineService.getCashLeakageAlerts(companyId),
            weeklySummary: await decisionEngineService.getWeeklySummary(companyId),
        };

        res.status(200).json({
            success: true,
            data: insights
        });
    } catch (error: any) {
        logger.error('Failed to get decision insights:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProfitHeatmap = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { startDate, endDate } = req.query;

        const heatmap = await decisionEngineService.getProfitHeatmap(
            companyId!,
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined
        );

        res.status(200).json({
            success: true,
            data: heatmap
        });
    } catch (error: any) {
        logger.error('Failed to get profit heatmap:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCashLeakageAlerts = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const alerts = await decisionEngineService.getCashLeakageAlerts(companyId!);

        res.status(200).json({
            success: true,
            data: alerts
        });
    } catch (error: any) {
        logger.error('Failed to get cash leakage alerts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
