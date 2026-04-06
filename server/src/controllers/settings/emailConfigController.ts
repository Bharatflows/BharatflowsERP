import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {
  getCompanyEmailConfig,
  saveCompanyEmailConfig,
  testCompanyEmailConfig,
  EMAIL_PROVIDER_PRESETS,
} from '../../services/companyEmailService';
import logger from '../../config/logger';

// GET /api/v1/settings/email-config
export const getEmailConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = await getCompanyEmailConfig(req.user!.companyId);
    // Never return the password
    if (config) {
      const { smtpPass, ...safeConfig } = config as any;
      return res.json({ success: true, data: { ...safeConfig, hasPassword: !!smtpPass } });
    }
    return res.json({ success: true, data: null });
  } catch (err: any) {
    logger.error('[EmailConfig] getEmailConfig error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/settings/email-config
export const saveEmailConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { provider, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, fromName } = req.body;
    if (!provider) return res.status(400).json({ success: false, message: 'Provider is required' });
    if (!smtpUser) return res.status(400).json({ success: false, message: 'Email address is required' });

    const config = await saveCompanyEmailConfig(req.user!.companyId, {
      provider, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, fromName,
    });
    return res.json({
      success: true,
      message: 'Email config saved. Please test the connection.',
      data: { provider: config.provider, smtpUser: config.smtpUser, fromName: config.fromName },
    });
  } catch (err: any) {
    logger.error('[EmailConfig] saveEmailConfig error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/settings/email-config/test
export const testEmailConfig = async (req: AuthRequest, res: Response) => {
  try {
    const result = await testCompanyEmailConfig(req.user!.companyId);
    if (result.success) {
      return res.json({ success: true, message: 'Connection successful! Your email is ready to send.' });
    }
    return res.status(400).json({ success: false, message: `Connection failed: ${result.error}` });
  } catch (err: any) {
    logger.error('[EmailConfig] testEmailConfig error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/settings/email-config/providers
export const getProviderPresets = async (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: Object.entries(EMAIL_PROVIDER_PRESETS).map(([key, preset]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      ...preset,
    })),
  });
};
