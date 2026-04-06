import { Response } from 'express';
import { assetService } from '../services/assetService';
import { AuthRequest } from '../middleware/auth';
import logger from '../config/logger';

export const createAsset = async (req: AuthRequest, res: Response) => {
    try {
        const result = await assetService.createAsset({
            ...req.body,
            companyId: req.user.companyId,
            userId: req.user.id
        });
        return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Create asset error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const generateSchedules = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const result = await assetService.generateDepreciationSchedule(id, req.user.companyId);
        return res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Generate schedules error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const postDepreciation = async (req: AuthRequest, res: Response) => {
    try {
        const { scheduleId } = req.body;
        const result = await assetService.postDepreciation(scheduleId, req.user.companyId, req.user.id);
        return res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('Post depreciation error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
