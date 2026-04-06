/**
 * Subscription Controller
 * 
 * API endpoints for subscription management
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import subscriptionService from '../services/subscriptionService';
import logger from '../config/logger';
import { SubscriptionPlan as Plan } from '../types/enums';

// @desc    Get all available plans
// @route   GET /api/v1/subscriptions/plans
// @access  Public
export const getPlans = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const plans = subscriptionService.getPlans();
        return res.json({ success: true, data: plans });
    } catch (error: any) {
        logger.error('[SubscriptionController] Get plans error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get current subscription for company
// @route   GET /api/v1/subscriptions/current
// @access  Private
export const getCurrentSubscription = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        const subscription = await subscriptionService.getCurrentSubscription(companyId);
        return res.json({ success: true, data: subscription });
    } catch (error: any) {
        logger.error('[SubscriptionController] Get current subscription error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get subscription history
// @route   GET /api/v1/subscriptions/history
// @access  Private
export const getSubscriptionHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        const history = await subscriptionService.getSubscriptionHistory(companyId);
        return res.json({ success: true, data: history });
    } catch (error: any) {
        logger.error('[SubscriptionController] Get subscription history error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Check if subscription is active
// @route   GET /api/v1/subscriptions/check
// @access  Private
export const checkSubscription = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        const hasActive = await subscriptionService.hasActiveSubscription(companyId);
        const current = await subscriptionService.getCurrentSubscription(companyId);

        return res.json({
            success: true,
            data: {
                hasActiveSubscription: hasActive,
                currentPlan: current.plan,
                planDetails: current.planDetails,
                endDate: current.endDate,
            },
        });
    } catch (error: any) {
        logger.error('[SubscriptionController] Check subscription error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Check feature access
// @route   GET /api/v1/subscriptions/features/:feature
// @access  Private
export const checkFeature = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;
        const { feature } = req.params;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        const hasAccess = await subscriptionService.hasFeature(companyId, feature);

        return res.json({
            success: true,
            data: {
                feature,
                hasAccess,
            },
        });
    } catch (error: any) {
        logger.error('[SubscriptionController] Check feature error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Check usage limit
// @route   GET /api/v1/subscriptions/limits/:limitKey
// @access  Private
export const checkUsageLimit = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;
        const { limitKey } = req.params;
        const currentCount = parseInt(req.query.current as string) || 0;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        const validKeys = ['maxInvoices', 'maxUsers', 'maxProducts', 'maxBranches'];
        if (!validKeys.includes(limitKey)) {
            return res.status(400).json({ success: false, error: 'Invalid limit key' });
        }

        const result = await subscriptionService.checkUsageLimit(
            companyId,
            limitKey as 'maxInvoices' | 'maxUsers' | 'maxProducts' | 'maxBranches',
            currentCount
        );

        return res.json({ success: true, data: result });
    } catch (error: any) {
        logger.error('[SubscriptionController] Check usage limit error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Initiate subscription (create payment order)
// @route   POST /api/v1/subscriptions
// @access  Private (Admin only)
export const initiateSubscription = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;
        const { plan, billingCycle } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        if (!plan || !['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].includes(plan)) {
            return res.status(400).json({ success: false, error: 'Valid plan is required' });
        }

        if (!billingCycle || !['MONTHLY', 'YEARLY'].includes(billingCycle)) {
            return res.status(400).json({ success: false, error: 'Valid billing cycle is required' });
        }

        const result = await subscriptionService.initiateSubscriptionPayment(
            companyId,
            plan as Plan,
            billingCycle as 'MONTHLY' | 'YEARLY'
        );

        return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        logger.error('[SubscriptionController] Initiate subscription error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Complete subscription (verify payment)
// @route   POST /api/v1/subscriptions/verify
// @access  Private
export const verifySubscriptionPayment = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { subscriptionId, paymentId, orderId, signature } = req.body;

        if (!subscriptionId || !paymentId || !orderId) {
            return res.status(400).json({ success: false, error: 'Missing required payment details' });
        }

        const subscription = await subscriptionService.completeSubscription(
            subscriptionId,
            paymentId,
            orderId,
            signature || ''
        );

        return res.json({ success: true, data: subscription, message: 'Subscription activated successfully' });
    } catch (error: any) {
        logger.error('[SubscriptionController] Verify payment error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Cancel subscription
// @route   POST /api/v1/subscriptions/cancel
// @access  Private (Admin only)
export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const companyId = req.headers['x-company-id'] as string || req.user?.companyId;
        const { reason } = req.body;

        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID is required' });
        }

        const subscription = await subscriptionService.cancelSubscription(companyId, reason);

        return res.json({
            success: true,
            data: subscription,
            message: 'Subscription cancelled. You will retain access until the end of your billing period.'
        });
    } catch (error: any) {
        logger.error('[SubscriptionController] Cancel subscription error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Webhook handler for payment gateway callbacks
// @route   POST /api/v1/subscriptions/webhook/:provider
// @access  Public (verified by signature)
export const handleWebhook = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { provider } = req.params;
        const payload = req.body;

        logger.info(`[SubscriptionController] Received webhook from ${provider}:`, JSON.stringify(payload));

        // TODO: Implement webhook handling for each provider
        // This should verify the webhook signature and process payment events

        return res.json({ success: true, message: 'Webhook received' });
    } catch (error: any) {
        logger.error('[SubscriptionController] Webhook error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    getPlans,
    getCurrentSubscription,
    getSubscriptionHistory,
    checkSubscription,
    checkFeature,
    checkUsageLimit,
    initiateSubscription,
    verifySubscriptionPayment,
    cancelSubscription,
    handleWebhook,
};
