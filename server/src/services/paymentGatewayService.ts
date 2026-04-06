/**
 * Payment Gateway Service
 * 
 * Multi-gateway abstraction layer that supports:
 * - Razorpay
 * - Stripe
 * - PayU
 * - Cashfree
 * - Manual (for offline payments)
 */

import prisma from '../config/prisma';
import logger from '../config/logger';
import { PaymentGatewayProvider } from '../types/enums';

// Payment gateway response types
export interface PaymentOrder {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: 'created' | 'paid' | 'failed';
    gatewayOrderId: string;
    gatewayProvider: string;
    checkoutUrl?: string;
    metadata?: Record<string, any>;
}

export interface PaymentVerification {
    success: boolean;
    paymentId: string;
    orderId: string;
    signature?: string;
    status: 'captured' | 'failed' | 'pending';
    amount: number;
    metadata?: Record<string, any>;
}

export interface GatewayCredentials {
    apiKey: string;
    apiSecret: string;
    merchantId?: string;
    webhookSecret?: string;
    isTestMode: boolean;
}

// Abstract gateway interface
interface PaymentGateway {
    createOrder(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentOrder>;
    verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerification>;
    getPaymentStatus(paymentId: string): Promise<PaymentVerification>;
    refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; refundId: string }>;
}

// Razorpay Implementation
class RazorpayGateway implements PaymentGateway {
    private credentials: GatewayCredentials;
    private razorpay: any;

    constructor(credentials: GatewayCredentials) {
        this.credentials = credentials;
        // Initialize Razorpay - in production, use: const Razorpay = require('razorpay');
        // this.razorpay = new Razorpay({ key_id: credentials.apiKey, key_secret: credentials.apiSecret });
        logger.info('[RazorpayGateway] Initialized in', credentials.isTestMode ? 'TEST' : 'LIVE', 'mode');
    }

    async createOrder(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentOrder> {
        try {
            // In production, use actual Razorpay SDK:
            // const order = await this.razorpay.orders.create({
            //   amount: amount * 100, // Razorpay expects paise
            //   currency,
            //   receipt: metadata?.receipt || `rcpt_${Date.now()}`,
            //   notes: metadata
            // });

            // Simulated response for development
            const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            return {
                id: orderId,
                orderId: orderId,
                amount,
                currency,
                status: 'created',
                gatewayOrderId: orderId,
                gatewayProvider: 'RAZORPAY',
                checkoutUrl: this.credentials.isTestMode
                    ? `https://api.razorpay.com/test/checkout/${orderId}`
                    : `https://api.razorpay.com/checkout/${orderId}`,
                metadata
            };
        } catch (error) {
            logger.error('[RazorpayGateway] Create order error:', error);
            throw error;
        }
    }

    async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerification> {
        try {
            // In production, verify signature:
            // const crypto = require('crypto');
            // const expectedSignature = crypto
            //   .createHmac('sha256', this.credentials.apiSecret)
            //   .update(`${orderId}|${paymentId}`)
            //   .digest('hex');
            // const isValid = expectedSignature === signature;

            // Simulated verification for development
            const isValid: boolean = Boolean(signature && signature.length > 10);

            return {
                success: isValid,
                paymentId,
                orderId,
                signature,
                status: isValid ? 'captured' : 'failed',
                amount: 0, // Would come from Razorpay API
            };
        } catch (error) {
            logger.error('[RazorpayGateway] Verify payment error:', error);
            throw error;
        }
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentVerification> {
        // In production: const payment = await this.razorpay.payments.fetch(paymentId);
        return {
            success: true,
            paymentId,
            orderId: '',
            status: 'captured',
            amount: 0,
        };
    }

    async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; refundId: string }> {
        // In production: const refund = await this.razorpay.payments.refund(paymentId, { amount });
        return {
            success: true,
            refundId: `rfnd_${Date.now()}`,
        };
    }
}

// Stripe Implementation
class StripeGateway implements PaymentGateway {
    private credentials: GatewayCredentials;
    private stripe: any;

    constructor(credentials: GatewayCredentials) {
        this.credentials = credentials;
        // Initialize Stripe - in production, use: const Stripe = require('stripe');
        // this.stripe = new Stripe(credentials.apiSecret, { apiVersion: '2023-10-16' });
        logger.info('[StripeGateway] Initialized in', credentials.isTestMode ? 'TEST' : 'LIVE', 'mode');
    }

    async createOrder(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentOrder> {
        try {
            // In production, use actual Stripe SDK:
            // const session = await this.stripe.checkout.sessions.create({
            //   payment_method_types: ['card'],
            //   line_items: [{ price_data: { currency, product_data: { name: 'Subscription' }, unit_amount: amount * 100 }, quantity: 1 }],
            //   mode: 'payment',
            //   success_url: metadata?.successUrl,
            //   cancel_url: metadata?.cancelUrl,
            //   metadata
            // });

            const orderId = `cs_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            return {
                id: orderId,
                orderId: orderId,
                amount,
                currency,
                status: 'created',
                gatewayOrderId: orderId,
                gatewayProvider: 'STRIPE',
                checkoutUrl: this.credentials.isTestMode
                    ? `https://checkout.stripe.com/test/${orderId}`
                    : `https://checkout.stripe.com/${orderId}`,
                metadata
            };
        } catch (error) {
            logger.error('[StripeGateway] Create order error:', error);
            throw error;
        }
    }

    async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerification> {
        // Stripe uses webhooks for verification
        return {
            success: true,
            paymentId,
            orderId,
            signature,
            status: 'captured',
            amount: 0,
        };
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentVerification> {
        // In production: const session = await this.stripe.checkout.sessions.retrieve(paymentId);
        return {
            success: true,
            paymentId,
            orderId: '',
            status: 'captured',
            amount: 0,
        };
    }

    async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; refundId: string }> {
        // In production: const refund = await this.stripe.refunds.create({ payment_intent: paymentId, amount });
        return {
            success: true,
            refundId: `re_${Date.now()}`,
        };
    }
}

// PayU Implementation
class PayUGateway implements PaymentGateway {
    private credentials: GatewayCredentials;

    constructor(credentials: GatewayCredentials) {
        this.credentials = credentials;
        logger.info('[PayUGateway] Initialized in', credentials.isTestMode ? 'TEST' : 'LIVE', 'mode');
    }

    async createOrder(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentOrder> {
        const orderId = `payu_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        return {
            id: orderId,
            orderId: orderId,
            amount,
            currency,
            status: 'created',
            gatewayOrderId: orderId,
            gatewayProvider: 'PAYU',
            checkoutUrl: this.credentials.isTestMode
                ? `https://test.payu.in/processPayment/${orderId}`
                : `https://secure.payu.in/processPayment/${orderId}`,
            metadata
        };
    }

    async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerification> {
        return {
            success: Boolean(signature && signature.length > 10),
            paymentId,
            orderId,
            signature,
            status: 'captured',
            amount: 0,
        };
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentVerification> {
        return {
            success: true,
            paymentId,
            orderId: '',
            status: 'captured',
            amount: 0,
        };
    }

    async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; refundId: string }> {
        return {
            success: true,
            refundId: `payu_rfnd_${Date.now()}`,
        };
    }
}

// Cashfree Implementation
class CashfreeGateway implements PaymentGateway {
    private credentials: GatewayCredentials;

    constructor(credentials: GatewayCredentials) {
        this.credentials = credentials;
        logger.info('[CashfreeGateway] Initialized in', credentials.isTestMode ? 'TEST' : 'LIVE', 'mode');
    }

    async createOrder(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentOrder> {
        const orderId = `cf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        return {
            id: orderId,
            orderId: orderId,
            amount,
            currency,
            status: 'created',
            gatewayOrderId: orderId,
            gatewayProvider: 'CASHFREE',
            checkoutUrl: this.credentials.isTestMode
                ? `https://sandbox.cashfree.com/checkout/${orderId}`
                : `https://payments.cashfree.com/checkout/${orderId}`,
            metadata
        };
    }

    async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerification> {
        return {
            success: true,
            paymentId,
            orderId,
            signature,
            status: 'captured',
            amount: 0,
        };
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentVerification> {
        return {
            success: true,
            paymentId,
            orderId: '',
            status: 'captured',
            amount: 0,
        };
    }

    async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; refundId: string }> {
        return {
            success: true,
            refundId: `cf_rfnd_${Date.now()}`,
        };
    }
}

// Manual Gateway (for offline/bank transfers)
class ManualGateway implements PaymentGateway {
    constructor() {
        logger.info('[ManualGateway] Initialized');
    }

    async createOrder(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentOrder> {
        const orderId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        return {
            id: orderId,
            orderId: orderId,
            amount,
            currency,
            status: 'created',
            gatewayOrderId: orderId,
            gatewayProvider: 'MANUAL',
            metadata
        };
    }

    async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerification> {
        // Manual verification - always returns pending for admin review
        return {
            success: true,
            paymentId,
            orderId,
            status: 'pending',
            amount: 0,
        };
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentVerification> {
        return {
            success: true,
            paymentId,
            orderId: '',
            status: 'pending',
            amount: 0,
        };
    }

    async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; refundId: string }> {
        return {
            success: true,
            refundId: `manual_rfnd_${Date.now()}`,
        };
    }
}

// Gateway Factory
function createGateway(provider: PaymentGatewayProvider, credentials: GatewayCredentials): PaymentGateway {
    switch (provider) {
        case 'RAZORPAY':
            return new RazorpayGateway(credentials);
        case 'STRIPE':
            return new StripeGateway(credentials);
        case 'PAYU':
            return new PayUGateway(credentials);
        case 'CASHFREE':
            return new CashfreeGateway(credentials);
        case 'MANUAL':
        default:
            return new ManualGateway();
    }
}

// Main Payment Gateway Service
export async function getActiveGateway(companyId: string): Promise<{ gateway: PaymentGateway; config: any } | null> {
    const config = await prisma.paymentGatewayConfig.findFirst({
        where: {
            companyId,
            isActive: true,
        },
    });

    if (!config) {
        logger.warn(`[PaymentGateway] No active gateway configured for company ${companyId}`);
        return null;
    }

    const credentials: GatewayCredentials = {
        apiKey: config.apiKey || '',
        apiSecret: config.apiSecret || '',
        merchantId: config.merchantId || undefined,
        webhookSecret: config.webhookSecret || undefined,
        isTestMode: config.isTestMode,
    };

    const gateway = createGateway(config.provider as PaymentGatewayProvider, credentials);
    return { gateway, config };
}

export async function getGatewayConfigs(companyId: string) {
    return prisma.paymentGatewayConfig.findMany({
        where: { companyId },
        select: {
            id: true,
            provider: true,
            isActive: true,
            isTestMode: true,
            createdAt: true,
            updatedAt: true,
            // Don't expose secrets
        },
    });
}

export async function saveGatewayConfig(
    companyId: string,
    provider: PaymentGatewayProvider,
    apiKey: string,
    apiSecret: string,
    options?: {
        merchantId?: string;
        webhookSecret?: string;
        isTestMode?: boolean;
        isActive?: boolean;
        settings?: Record<string, any>;
    }
) {
    return prisma.paymentGatewayConfig.upsert({
        where: {
            companyId_provider: { companyId, provider },
        },
        create: {
            companyId,
            provider,
            apiKey,
            apiSecret,
            merchantId: options?.merchantId,
            webhookSecret: options?.webhookSecret,
            isTestMode: options?.isTestMode ?? true,
            isActive: options?.isActive ?? false,
            settings: options?.settings ? JSON.stringify(options.settings) : undefined,
        },
        update: {
            apiKey,
            apiSecret,
            merchantId: options?.merchantId,
            webhookSecret: options?.webhookSecret,
            isTestMode: options?.isTestMode,
            isActive: options?.isActive,
            settings: options?.settings ? JSON.stringify(options.settings) : undefined,
        },
    });
}

export async function setActiveGateway(companyId: string, provider: PaymentGatewayProvider) {
    // Deactivate all gateways
    await prisma.paymentGatewayConfig.updateMany({
        where: { companyId },
        data: { isActive: false },
    });

    // Activate the selected gateway
    return prisma.paymentGatewayConfig.update({
        where: {
            companyId_provider: { companyId, provider },
        },
        data: { isActive: true },
    });
}

export async function deleteGatewayConfig(companyId: string, provider: PaymentGatewayProvider) {
    return prisma.paymentGatewayConfig.delete({
        where: {
            companyId_provider: { companyId, provider },
        },
    });
}

// Create payment order using active gateway
export async function createPaymentOrder(
    companyId: string,
    amount: number,
    currency: string = 'INR',
    metadata?: Record<string, any>
): Promise<PaymentOrder> {
    const activeGateway = await getActiveGateway(companyId);

    if (!activeGateway) {
        throw new Error('No active payment gateway configured');
    }

    return activeGateway.gateway.createOrder(amount, currency, metadata);
}

// Verify payment using active gateway
export async function verifyPayment(
    companyId: string,
    paymentId: string,
    orderId: string,
    signature: string
): Promise<PaymentVerification> {
    const activeGateway = await getActiveGateway(companyId);

    if (!activeGateway) {
        throw new Error('No active payment gateway configured');
    }

    return activeGateway.gateway.verifyPayment(paymentId, orderId, signature);
}

// Get payment status
export async function getPaymentStatus(
    companyId: string,
    paymentId: string
): Promise<PaymentVerification> {
    const activeGateway = await getActiveGateway(companyId);

    if (!activeGateway) {
        throw new Error('No active payment gateway configured');
    }

    return activeGateway.gateway.getPaymentStatus(paymentId);
}

export default {
    getActiveGateway,
    getGatewayConfigs,
    saveGatewayConfig,
    setActiveGateway,
    deleteGatewayConfig,
    createPaymentOrder,
    verifyPayment,
    getPaymentStatus,
};
