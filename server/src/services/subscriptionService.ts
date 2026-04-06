/**
 * Subscription Service
 * 
 * Handles subscription management including:
 * - Plan pricing and features
 * - Subscription creation and upgrades
 * - Subscription status checks
 * - Renewal and cancellation
 */

import prisma from '../config/prisma';
import logger from '../config/logger';
import { SubscriptionPlan as Plan, SubscriptionStatus } from '../types/enums';
import { createPaymentOrder, verifyPayment } from './paymentGatewayService';

// Plan pricing and features configuration
export const PLAN_CONFIG = {
    FREE: {
        name: 'Free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: {
            maxInvoices: 50,
            maxUsers: 1,
            maxProducts: 100,
            maxBranches: 1,
            gstReports: false,
            eInvoicing: false,
            eWaybill: false,
            apiAccess: false,
            prioritySupport: false,
            customReports: false,
            multiCurrency: false,
            advancedAnalytics: false,
        },
        description: 'Perfect for getting started',
    },
    BASIC: {
        name: 'Basic',
        monthlyPrice: 499,
        yearlyPrice: 4999,
        features: {
            maxInvoices: -1, // Unlimited
            maxUsers: 3,
            maxProducts: 500,
            maxBranches: 2,
            gstReports: true,
            eInvoicing: false,
            eWaybill: false,
            apiAccess: false,
            prioritySupport: false,
            customReports: true,
            multiCurrency: false,
            advancedAnalytics: false,
        },
        description: 'For growing businesses',
    },
    PRO: {
        name: 'Professional',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        features: {
            maxInvoices: -1,
            maxUsers: 10,
            maxProducts: -1, // Unlimited
            maxBranches: 5,
            gstReports: true,
            eInvoicing: true,
            eWaybill: true,
            apiAccess: false,
            prioritySupport: true,
            customReports: true,
            multiCurrency: true,
            advancedAnalytics: true,
        },
        description: 'Everything you need to scale',
    },
    ENTERPRISE: {
        name: 'Enterprise',
        monthlyPrice: 2999,
        yearlyPrice: 29999,
        features: {
            maxInvoices: -1,
            maxUsers: -1, // Unlimited
            maxProducts: -1,
            maxBranches: -1,
            gstReports: true,
            eInvoicing: true,
            eWaybill: true,
            apiAccess: true,
            prioritySupport: true,
            customReports: true,
            multiCurrency: true,
            advancedAnalytics: true,
        },
        description: 'For large organizations',
    },
} as const;

// Get all plans with pricing
export function getPlans() {
    return Object.entries(PLAN_CONFIG).map(([key, config]) => ({
        id: key,
        ...config,
        yearlyDiscount: config.monthlyPrice > 0
            ? Math.round(((config.monthlyPrice * 12 - config.yearlyPrice) / (config.monthlyPrice * 12)) * 100)
            : 0,
    }));
}

// Get plan details
export function getPlanDetails(plan: Plan) {
    return PLAN_CONFIG[plan] || PLAN_CONFIG.FREE;
}

// Get current active subscription for a company
export async function getCurrentSubscription(companyId: string) {
    const subscription = await prisma.subscription.findFirst({
        where: {
            companyId,
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
        // Return default FREE subscription info
        return {
            id: null,
            plan: Plan.FREE,
            status: SubscriptionStatus.ACTIVE,
            startDate: null,
            endDate: null,
            billingCycle: 'MONTHLY',
            amount: 0,
            autoRenew: false,
            nextBillingDate: null,
            planDetails: PLAN_CONFIG.FREE,
        };
    }

    return {
        ...subscription,
        planDetails: PLAN_CONFIG[subscription.plan as Plan],
    };
}

// Get subscription history
export async function getSubscriptionHistory(companyId: string) {
    return prisma.subscription.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
    });
}

// Check if company has active paid subscription
export async function hasActiveSubscription(companyId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
        where: {
            companyId,
            status: SubscriptionStatus.ACTIVE,
            plan: { not: Plan.FREE },
            OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
            ],
        },
    });

    return !!subscription;
}

// Check if feature is available for company's plan
export async function hasFeature(companyId: string, featureKey: string): Promise<boolean> {
    const subscription = await getCurrentSubscription(companyId);
    const features = subscription.planDetails?.features || PLAN_CONFIG.FREE.features;
    const featureValue = features[featureKey as keyof typeof features];

    if (typeof featureValue === 'boolean') {
        return featureValue;
    }

    if (typeof featureValue === 'number') {
        return (featureValue as number) !== 0;
    }

    return false;
}

// Check usage limit
export async function checkUsageLimit(
    companyId: string,
    limitKey: 'maxInvoices' | 'maxUsers' | 'maxProducts' | 'maxBranches',
    currentCount: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
    const subscription = await getCurrentSubscription(companyId);
    const limit = subscription.planDetails?.features[limitKey] ?? 0;

    // -1 means unlimited
    if (limit === -1) {
        return { allowed: true, limit: -1, current: currentCount };
    }

    return {
        allowed: currentCount < limit,
        limit,
        current: currentCount,
    };
}

// Create or upgrade subscription
export async function createSubscription(
    companyId: string,
    plan: Plan,
    billingCycle: 'MONTHLY' | 'YEARLY',
    paymentDetails?: {
        paymentId: string;
        orderId: string;
        paymentMethod: string;
        paymentGateway: string;
    }
): Promise<any> {
    const planConfig = PLAN_CONFIG[plan];
    const amount = billingCycle === 'YEARLY' ? planConfig.yearlyPrice : planConfig.monthlyPrice;

    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
        endDate.setMonth(endDate.getMonth() + 1);
    }

    // Cancel any existing active subscription
    await prisma.subscription.updateMany({
        where: {
            companyId,
            status: SubscriptionStatus.ACTIVE,
        },
        data: {
            status: SubscriptionStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: 'Upgraded to new plan',
        },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
        data: {
            companyId,
            plan,
            status: SubscriptionStatus.ACTIVE,
            startDate,
            endDate,
            billingCycle,
            amount,
            currency: 'INR',
            paymentId: paymentDetails?.paymentId,
            orderId: paymentDetails?.orderId,
            paymentMethod: paymentDetails?.paymentMethod,
            paymentGateway: paymentDetails?.paymentGateway,
            lastPaymentDate: paymentDetails ? new Date() : null,
            nextBillingDate: endDate,
            autoRenew: true,
        },
    });

    // Update company plan
    await prisma.company.update({
        where: { id: companyId },
        data: { plan },
    });

    logger.info(`[Subscription] Created ${plan} subscription for company ${companyId}`);

    return subscription;
}

// Initiate subscription payment
export async function initiateSubscriptionPayment(
    companyId: string,
    plan: Plan,
    billingCycle: 'MONTHLY' | 'YEARLY'
): Promise<any> {
    const planConfig = PLAN_CONFIG[plan];
    const amount = billingCycle === 'YEARLY' ? planConfig.yearlyPrice : planConfig.monthlyPrice;

    if (amount === 0) {
        // Free plan - create subscription directly
        return createSubscription(companyId, plan, billingCycle);
    }

    // Create pending subscription
    const subscription = await prisma.subscription.create({
        data: {
            companyId,
            plan,
            status: SubscriptionStatus.PENDING,
            billingCycle,
            amount,
            currency: 'INR',
            autoRenew: true,
        },
    });

    // Create payment order
    const paymentOrder = await createPaymentOrder(companyId, amount, 'INR', {
        subscriptionId: subscription.id,
        plan,
        billingCycle,
    });

    return {
        subscription,
        paymentOrder,
    };
}

// Complete subscription after payment verification
export async function completeSubscription(
    subscriptionId: string,
    paymentId: string,
    orderId: string,
    signature: string
): Promise<any> {
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
    });

    if (!subscription) {
        throw new Error('Subscription not found');
    }

    // Verify payment
    const verification = await verifyPayment(subscription.companyId, paymentId, orderId, signature);

    if (!verification.success) {
        await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.PAYMENT_FAILED },
        });
        throw new Error('Payment verification failed');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (subscription.billingCycle === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
        endDate.setMonth(endDate.getMonth() + 1);
    }

    // Cancel existing active subscriptions
    await prisma.subscription.updateMany({
        where: {
            companyId: subscription.companyId,
            status: SubscriptionStatus.ACTIVE,
            id: { not: subscriptionId },
        },
        data: {
            status: SubscriptionStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: 'Upgraded to new plan',
        },
    });

    // Activate subscription
    const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
            status: SubscriptionStatus.ACTIVE,
            startDate,
            endDate,
            paymentId,
            orderId,
            lastPaymentDate: new Date(),
            nextBillingDate: endDate,
        },
    });

    // Update company plan
    await prisma.company.update({
        where: { id: subscription.companyId },
        data: { plan: subscription.plan },
    });

    logger.info(`[Subscription] Activated ${subscription.plan} for company ${subscription.companyId}`);

    return updatedSubscription;
}

// Cancel subscription
export async function cancelSubscription(
    companyId: string,
    reason?: string
): Promise<any> {
    const subscription = await prisma.subscription.findFirst({
        where: {
            companyId,
            status: SubscriptionStatus.ACTIVE,
        },
    });

    if (!subscription) {
        throw new Error('No active subscription found');
    }

    const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            autoRenew: false,
            cancelledAt: new Date(),
            cancelReason: reason || 'User cancelled',
            // Keep status ACTIVE until endDate - user keeps access until period ends
        },
    });

    logger.info(`[Subscription] Cancelled subscription for company ${companyId}`);

    return updatedSubscription;
}

// Check and update expired subscriptions (to be called by cron job)
export async function processExpiredSubscriptions(): Promise<number> {
    const result = await prisma.subscription.updateMany({
        where: {
            status: SubscriptionStatus.ACTIVE,
            endDate: { lt: new Date() },
            autoRenew: false,
        },
        data: {
            status: SubscriptionStatus.EXPIRED,
        },
    });

    // Downgrade companies with expired subscriptions to FREE plan
    const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
            status: SubscriptionStatus.EXPIRED,
        },
        select: { companyId: true },
    });

    for (const sub of expiredSubscriptions) {
        await prisma.company.update({
            where: { id: sub.companyId },
            data: { plan: Plan.FREE },
        });
    }

    logger.info(`[Subscription] Processed ${result.count} expired subscriptions`);

    return result.count;
}

export default {
    getPlans,
    getPlanDetails,
    getCurrentSubscription,
    getSubscriptionHistory,
    hasActiveSubscription,
    hasFeature,
    checkUsageLimit,
    createSubscription,
    initiateSubscriptionPayment,
    completeSubscription,
    cancelSubscription,
    processExpiredSubscriptions,
    PLAN_CONFIG,
};
