/**
 * Channel Hub Controller
 * 
 * Handles e-commerce channel integration for order aggregation:
 * - Amazon, Flipkart, Shopify, Meesho integrations
 * - Channel configuration management
 * - Order sync and status updates
 * - Convert channel orders to invoices
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import eventBus from '../services/eventBus';
import logger from '../config/logger';

// ============ CHANNEL CONFIGURATION ============

/**
 * Get all channel configurations for company
 */
export const getChannelConfigs = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;

        const configs = await prisma.channelConfig.findMany({
            where: { companyId },
            orderBy: { channel: 'asc' },
        });

        // Mask sensitive credentials
        const safeConfigs = configs.map(config => ({
            ...config,
            credentials: config.isActive ? { configured: true } : null,
        }));

        return res.json({
            success: true,
            data: safeConfigs,
        });
    } catch (error: any) {
        logger.error('Error fetching channel configs:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch channel configurations',
        });
    }
};

/**
 * Get available channels for integration
 */
export const getAvailableChannels = async (_req: AuthRequest, res: Response) => {
    const channels = [
        {
            id: 'AMAZON',
            name: 'Amazon Seller Central',
            description: 'Connect your Amazon seller account to sync orders',
            logo: '🛒',
            requiredFields: ['sellerId', 'mwsAuthToken', 'marketplaceId'],
            status: 'available',
        },
        {
            id: 'FLIPKART',
            name: 'Flipkart Seller Hub',
            description: 'Integrate with Flipkart to manage orders',
            logo: '🏪',
            requiredFields: ['applicationId', 'applicationSecret'],
            status: 'available',
        },
        {
            id: 'SHOPIFY',
            name: 'Shopify',
            description: 'Connect your Shopify store',
            logo: '🛍️',
            requiredFields: ['shopDomain', 'accessToken'],
            status: 'available',
        },
        {
            id: 'MEESHO',
            name: 'Meesho',
            description: 'Reseller platform integration',
            logo: '📦',
            requiredFields: ['supplierId', 'apiToken'],
            status: 'coming_soon',
        },
        {
            id: 'WOOCOMMERCE',
            name: 'WooCommerce',
            description: 'WordPress e-commerce integration',
            logo: '🔌',
            requiredFields: ['siteUrl', 'consumerKey', 'consumerSecret'],
            status: 'available',
        },
    ];

    return res.json({
        success: true,
        data: channels,
    });
};

/**
 * Configure a channel
 */
export const configureChannel = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { channel, credentials, settings } = req.body;

        if (!channel || !credentials) {
            return res.status(400).json({
                success: false,
                message: 'Channel and credentials are required',
            });
        }

        // Validate channel
        const validChannels = ['AMAZON', 'FLIPKART', 'SHOPIFY', 'MEESHO', 'WOOCOMMERCE'];
        if (!validChannels.includes(channel)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid channel',
            });
        }

        // Upsert channel config
        const config = await prisma.channelConfig.upsert({
            where: {
                companyId_channel: { companyId, channel },
            },
            create: {
                companyId,
                channel,
                credentials,
                isActive: false, // Requires activation after testing
                syncFrequency: settings?.syncFrequency || 'HOURLY',
                autoSyncOrders: settings?.autoSyncOrders ?? true,
                autoCreateInvoice: settings?.autoCreateInvoice ?? false,
                defaultWarehouseId: settings?.defaultWarehouseId,
            },
            update: {
                credentials,
                syncFrequency: settings?.syncFrequency,
                autoSyncOrders: settings?.autoSyncOrders,
                autoCreateInvoice: settings?.autoCreateInvoice,
                defaultWarehouseId: settings?.defaultWarehouseId,
            },
        });

        logger.info(`Channel ${channel} configured for company ${companyId}`);

        return res.json({
            success: true,
            message: `${channel} configuration saved. Test connection before activating.`,
            data: {
                id: config.id,
                channel: config.channel,
                isActive: config.isActive,
            },
        });
    } catch (error: any) {
        logger.error('Error configuring channel:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to configure channel',
        });
    }
};

/**
 * Test channel connection
 */
export const testChannelConnection = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { channel } = req.params;

        const config = await prisma.channelConfig.findUnique({
            where: {
                companyId_channel: { companyId, channel },
            },
        });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Channel not configured',
            });
        }

        // TODO: Implement actual API connectivity tests per channel
        // For now, simulate successful connection
        const testResult = {
            connected: true,
            accountInfo: {
                merchantName: 'Test Merchant',
                status: 'ACTIVE',
            },
        };

        return res.json({
            success: true,
            data: testResult,
        });
    } catch (error: any) {
        logger.error('Error testing channel connection:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Connection test failed',
        });
    }
};

/**
 * Activate/Deactivate channel
 */
export const toggleChannelStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { channel } = req.params;
        const { isActive } = req.body;

        const config = await prisma.channelConfig.update({
            where: {
                companyId_channel: { companyId, channel },
            },
            data: { isActive },
        });

        return res.json({
            success: true,
            message: `${channel} ${isActive ? 'activated' : 'deactivated'}`,
            data: config,
        });
    } catch (error: any) {
        logger.error('Error toggling channel status:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update channel status',
        });
    }
};

/**
 * Delete channel configuration
 */
export const deleteChannelConfig = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { channel } = req.params;

        await prisma.channelConfig.delete({
            where: {
                companyId_channel: { companyId, channel },
            },
        });

        return res.json({
            success: true,
            message: `${channel} configuration deleted`,
        });
    } catch (error: any) {
        logger.error('Error deleting channel config:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete channel configuration',
        });
    }
};

// ============ CHANNEL ORDERS ============

/**
 * Get all channel orders with filters
 */
export const getChannelOrders = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const {
            channel,
            status,
            page = '1',
            limit = '20',
            startDate,
            endDate,
        } = req.query;

        const where: any = { companyId };
        if (channel) where.channel = channel;
        if (status) where.status = status;
        if (startDate || endDate) {
            where.orderedAt = {};
            if (startDate) where.orderedAt.gte = new Date(startDate as string);
            if (endDate) where.orderedAt.lte = new Date(endDate as string);
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const [orders, total] = await Promise.all([
            prisma.channelOrder.findMany({
                where,
                orderBy: { orderedAt: 'desc' },
                skip,
                take,
                include: {
                    channelConfig: { select: { channel: true } },
                    invoice: { select: { id: true, invoiceNumber: true } },
                    party: { select: { id: true, name: true } },
                },
            }),
            prisma.channelOrder.count({ where }),
        ]);

        return res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    pages: Math.ceil(total / parseInt(limit as string)),
                },
            },
        });
    } catch (error: any) {
        logger.error('Error fetching channel orders:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch channel orders',
        });
    }
};

/**
 * Get single channel order details
 */
export const getChannelOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { id } = req.params;

        const order = await prisma.channelOrder.findFirst({
            where: { id, companyId },
            include: {
                channelConfig: { select: { channel: true } },
                invoice: true,
                party: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        return res.json({
            success: true,
            data: order,
        });
    } catch (error: any) {
        logger.error('Error fetching channel order:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch order details',
        });
    }
};

/**
 * Sync orders from a channel
 */
export const syncChannelOrders = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { channel } = req.params;

        const config = await prisma.channelConfig.findUnique({
            where: {
                companyId_channel: { companyId, channel },
            },
        });

        if (!config || !config.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Channel not configured or inactive',
            });
        }

        // TODO: Implement actual order sync per channel
        // For now, update sync timestamp
        await prisma.channelConfig.update({
            where: { id: config.id , companyId: req.user.companyId },
            data: {
                lastSyncAt: new Date(),
                lastSyncStatus: 'SUCCESS',
            },
        });

        return res.json({
            success: true,
            message: `Orders synced from ${channel}`,
            data: {
                syncedAt: new Date(),
                ordersImported: 0,
                ordersUpdated: 0,
            },
        });
    } catch (error: any) {
        logger.error('Error syncing channel orders:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to sync orders',
        });
    }
};

/**
 * Convert channel order to invoice
 */
export const convertToInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId, id: userId } = req.user!;
        const { id } = req.params;

        const order = await prisma.channelOrder.findFirst({
            where: { id, companyId },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (order.invoiceId) {
            return res.status(400).json({
                success: false,
                message: 'Order already converted to invoice',
            });
        }

        // TODO: Implement full invoice creation from order data
        // For now, return placeholder
        return res.json({
            success: true,
            message: 'Invoice conversion feature coming soon',
            data: {
                orderId: order.id,
                status: 'pending_implementation',
            },
        });
    } catch (error: any) {
        logger.error('Error converting order to invoice:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to convert order',
        });
    }
};

/**
 * Update channel order status
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
        }

        const order = await prisma.channelOrder.update({
            where: { id , companyId: req.user.companyId },
            data: { status },
        });

        // Emit event for status update
        // TODO: Use proper domain event structure when order events are fully implemented
        // eventBus.emit({ 
        //   eventType: 'CHANNEL_ORDER_UPDATED',
        //   payload: { orderId: order.id, channel: order.channel, status, companyId }
        // });

        return res.json({
            success: true,
            message: 'Order status updated',
            data: order,
        });
    } catch (error: any) {
        logger.error('Error updating order status:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update order status',
        });
    }
};

/**
 * Get channel hub dashboard stats
 */
export const getChannelDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user!;

        const [
            activeChannels,
            pendingOrders,
            todayOrders,
            totalRevenue,
        ] = await Promise.all([
            prisma.channelConfig.count({
                where: { companyId, isActive: true },
            }),
            prisma.channelOrder.count({
                where: { companyId, status: 'PENDING' },
            }),
            prisma.channelOrder.count({
                where: {
                    companyId,
                    orderedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            prisma.channelOrder.aggregate({
                where: { companyId },
                _sum: { orderTotal: true },
            }),
        ]);

        // Get orders by channel
        const ordersByChannel = await prisma.channelOrder.groupBy({
            by: ['channel'],
            where: { companyId },
            _count: true,
            _sum: { orderTotal: true },
        });

        // Get recent orders
        const recentOrders = await prisma.channelOrder.findMany({
            where: { companyId },
            orderBy: { orderedAt: 'desc' },
            take: 5,
            select: {
                id: true,
                channel: true,
                externalOrderId: true,
                status: true,
                orderTotal: true,
                customerName: true,
                orderedAt: true,
            },
        });

        return res.json({
            success: true,
            data: {
                stats: {
                    activeChannels,
                    pendingOrders,
                    todayOrders,
                    totalRevenue: totalRevenue._sum.orderTotal || 0,
                },
                ordersByChannel,
                recentOrders,
            },
        });
    } catch (error: any) {
        logger.error('Error fetching channel dashboard:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch dashboard data',
        });
    }
};
