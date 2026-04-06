/**
 * Payment Gateway Controller
 * 
 * API endpoints for payment gateway configuration
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import paymentGatewayService from '../services/paymentGatewayService';
import logger from '../config/logger';
import { PaymentGatewayProvider } from '../types/enums';

// List of supported providers with display info
const SUPPORTED_PROVIDERS = [
    {
        id: 'RAZORPAY',
        name: 'Razorpay',
        description: 'India\'s leading payment gateway with UPI, cards, and netbanking support',
        logo: '/images/gateways/razorpay.png',
        website: 'https://razorpay.com',
        requiredFields: ['apiKey', 'apiSecret'],
        optionalFields: ['webhookSecret'],
    },
    {
        id: 'STRIPE',
        name: 'Stripe',
        description: 'Global payment platform supporting cards and international payments',
        logo: '/images/gateways/stripe.png',
        website: 'https://stripe.com',
        requiredFields: ['apiKey', 'apiSecret'],
        optionalFields: ['webhookSecret'],
    },
    {
        id: 'PAYU',
        name: 'PayU',
        description: 'Reliable payment gateway with EMI and wallet support',
        logo: '/images/gateways/payu.png',
        website: 'https://payu.in',
        requiredFields: ['apiKey', 'apiSecret', 'merchantId'],
        optionalFields: ['webhookSecret'],
    },
    {
        id: 'CASHFREE',
        name: 'Cashfree',
        description: 'Modern payment gateway with instant settlements',
        logo: '/images/gateways/cashfree.png',
        website: 'https://cashfree.com',
        requiredFields: ['apiKey', 'apiSecret'],
        optionalFields: ['webhookSecret'],
    },
    {
        id: 'MANUAL',
        name: 'Manual / Bank Transfer',
        description: 'Accept payments via bank transfer with manual verification',
        logo: '/images/gateways/bank.png',
        website: null,
        requiredFields: [],
        optionalFields: [],
    },
];

// @desc    Get list of supported payment gateways
// @route   GET /api/v1/payment-gateways/providers
// @access  Private
export const getSupportedProviders = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        return res.json({ success: true, data: SUPPORTED_PROVIDERS });
    } catch (error: any) {
        logger.error('[PaymentGatewayController] Get providers error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get configured gateways for company
// @route   GET /api/v1/payment-gateways
// @access  Private (Admin only)
export const getGatewayConfigs = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        const configs = await paymentGatewayService.getGatewayConfigs(companyId);

        // Merge with provider info
        const enrichedConfigs = configs.map(config => ({
            ...config,
            providerInfo: SUPPORTED_PROVIDERS.find(p => p.id === config.provider),
        }));

        return res.json({ success: true, data: enrichedConfigs });
    } catch (error: any) {
        logger.error('[PaymentGatewayController] Get configs error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get active gateway
// @route   GET /api/v1/payment-gateways/active
// @access  Private
export const getActiveGateway = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        const result = await paymentGatewayService.getActiveGateway(companyId);

        if (!result) {
            return res.json({
                success: true,
                data: null,
                message: 'No active payment gateway configured'
            });
        }

        return res.json({
            success: true,
            data: {
                provider: result.config.provider,
                isTestMode: result.config.isTestMode,
                providerInfo: SUPPORTED_PROVIDERS.find(p => p.id === result.config.provider),
            }
        });
    } catch (error: any) {
        logger.error('[PaymentGatewayController] Get active gateway error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Save/update gateway configuration
// @route   POST /api/v1/payment-gateways
// @access  Private (Admin only)
export const saveGatewayConfig = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;
        const { provider, apiKey, apiSecret, merchantId, webhookSecret, isTestMode, isActive, settings } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        if (!provider || !['RAZORPAY', 'STRIPE', 'PAYU', 'CASHFREE', 'MANUAL'].includes(provider)) {
            return res.status(400).json({ success: false, error: 'Valid provider is required' });
        }

        // Validate required fields based on provider
        const providerInfo = SUPPORTED_PROVIDERS.find(p => p.id === provider);
        if (providerInfo) {
            for (const field of providerInfo.requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ success: false, error: `${field} is required for ${provider}` });
                }
            }
        }

        const config = await paymentGatewayService.saveGatewayConfig(
            companyId,
            provider as PaymentGatewayProvider,
            apiKey || '',
            apiSecret || '',
            {
                merchantId,
                webhookSecret,
                isTestMode: isTestMode ?? true,
                isActive: isActive ?? false,
                settings,
            }
        );

        logger.info(`[PaymentGatewayController] Saved ${provider} config for company ${companyId}`);

        return res.json({
            success: true,
            data: {
                id: config.id,
                provider: config.provider,
                isActive: config.isActive,
                isTestMode: config.isTestMode,
            },
            message: `${provider} configuration saved successfully`
        });
    } catch (error: any) {
        logger.error('[PaymentGatewayController] Save config error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Set active gateway
// @route   PUT /api/v1/payment-gateways/:provider/activate
// @access  Private (Admin only)
export const setActiveGateway = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;
        const { provider } = req.params;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        if (!['RAZORPAY', 'STRIPE', 'PAYU', 'CASHFREE', 'MANUAL'].includes(provider)) {
            return res.status(400).json({ success: false, error: 'Valid provider is required' });
        }

        const config = await paymentGatewayService.setActiveGateway(
            companyId,
            provider as PaymentGatewayProvider
        );

        logger.info(`[PaymentGatewayController] Set ${provider} as active for company ${companyId}`);

        return res.json({
            success: true,
            data: config,
            message: `${provider} is now your active payment gateway`
        });
    } catch (error: any) {
        logger.error('[PaymentGatewayController] Set active error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete gateway configuration
// @route   DELETE /api/v1/payment-gateways/:provider
// @access  Private (Admin only)
export const deleteGatewayConfig = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;
        const { provider } = req.params;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        if (!['RAZORPAY', 'STRIPE', 'PAYU', 'CASHFREE', 'MANUAL'].includes(provider)) {
            return res.status(400).json({ success: false, error: 'Valid provider is required' });
        }

        await paymentGatewayService.deleteGatewayConfig(
            companyId,
            provider as PaymentGatewayProvider
        );

        logger.info(`[PaymentGatewayController] Deleted ${provider} config for company ${companyId}`);

        return res.json({
            success: true,
            message: `${provider} configuration deleted`
        });
    } catch (error: any) {
        logger.error('[PaymentGatewayController] Delete config error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Test gateway connection
// @route   POST /api/v1/payment-gateways/:provider/test
// @access  Private (Admin only)
export const testGatewayConnection = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;
        const { provider } = req.params;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        // Try to create a small test order
        try {
            const testOrder = await paymentGatewayService.createPaymentOrder(
                companyId,
                1, // 1 rupee test
                'INR',
                { test: true }
            );

            return res.json({
                success: true,
                data: { connected: true, testOrderId: testOrder.orderId },
                message: 'Gateway connection successful'
            });
        } catch {
            return res.json({
                success: true,
                data: { connected: false },
                message: 'Gateway connection failed - please check your credentials'
            });
        }
    } catch (error: any) {
        logger.error('[PaymentGatewayController] Test connection error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    getSupportedProviders,
    getGatewayConfigs,
    getActiveGateway,
    saveGatewayConfig,
    setActiveGateway,
    deleteGatewayConfig,
    testGatewayConnection,
};
