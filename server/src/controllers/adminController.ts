/**
 * Admin Controller
 * Handles user management, audit logs, and system configuration
 */
import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import bcrypt from 'bcryptjs';

export const adminController = {
    /**
     * List all users with search, role filter, pagination
     */
    async listUsers(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string;
            const search = req.query.search as string;
            const role = req.query.role as string;
            const status = req.query.status as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const where: any = {};
            if (companyId) where.companyId = companyId;
            if (role) where.role = role;
            if (status) where.status = status;
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        status: true,
                        lastLogin: true,
                        lastActive: true,
                        createdAt: true,
                        emailVerified: true,
                        twoFactorEnabled: true,
                        companyId: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.user.count({ where }),
            ]);

            res.json({
                success: true,
                data: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error: any) {
            logger.error('Admin: Error listing users:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Get single user details
     */
    async getUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    lastLogin: true,
                    lastActive: true,
                    createdAt: true,
                    emailVerified: true,
                    twoFactorEnabled: true,
                    companyId: true,
                    designation: true,
                    moduleAccess: true,
                },
            });

            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            res.json({ success: true, data: user });
        } catch (error: any) {
            logger.error('Admin: Error getting user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Create a new user
     */
    async createUser(req: Request, res: Response) {
        try {
            const { name, email, phone, role, companyId, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
            }

            // Check if email already exists
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return res.status(409).json({ success: false, error: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    phone,
                    role: role || 'STAFF',
                    companyId,
                    password: hashedPassword,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            });

            logger.info(`Admin: Created user ${user.email} with role ${user.role}`);
            res.status(201).json({ success: true, data: user });
        } catch (error: any) {
            logger.error('Admin: Error creating user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Update user details / role
     */
    async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, phone, role, status, moduleAccess, designation } = req.body;

            const updateData: any = {};
            if (name !== undefined) updateData.name = name;
            if (phone !== undefined) updateData.phone = phone;
            if (role !== undefined) updateData.role = role;
            if (status !== undefined) updateData.status = status;
            if (moduleAccess !== undefined) updateData.moduleAccess = moduleAccess;
            if (designation !== undefined) updateData.designation = designation;

            const user = await prisma.user.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    designation: true,
                    updatedAt: true,
                },
            });

            logger.info(`Admin: Updated user ${user.email}`);
            res.json({ success: true, data: user });
        } catch (error: any) {
            logger.error('Admin: Error updating user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Deactivate user (soft delete)
     */
    async deactivateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const user = await prisma.user.update({
                where: { id },
                data: { status: 'INACTIVE' },
                select: { id: true, email: true, status: true },
            });

            logger.info(`Admin: Deactivated user ${user.email}`);
            res.json({ success: true, data: user, message: 'User deactivated' });
        } catch (error: any) {
            logger.error('Admin: Error deactivating user:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * List audit logs with pagination and filtering
     */
    async listAuditLogs(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string;
            const userId = req.query.userId as string;
            const action = req.query.action as string;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

            const where: any = {};
            if (companyId) where.companyId = companyId;
            if (userId) where.userId = userId;
            if (action) where.action = { contains: action, mode: 'insensitive' };
            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate) where.timestamp.gte = new Date(startDate);
                if (endDate) where.timestamp.lte = new Date(endDate);
            }

            const [logs, total] = await Promise.all([
                prisma.settingsAuditLog.findMany({
                    where,
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { timestamp: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.settingsAuditLog.count({ where }),
            ]);

            res.json({
                success: true,
                data: logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error: any) {
            logger.error('Admin: Error listing audit logs:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Get system stats overview
     */
    async getSystemStats(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string;
            const where = companyId ? { companyId } : {};

            const [userCount, invoiceCount, productCount, partyCount] = await Promise.all([
                prisma.user.count({ where: companyId ? { companyId } : {} }),
                prisma.invoice.count({ where }),
                prisma.product.count({ where }),
                prisma.party.count({ where }),
            ]);

            res.json({
                success: true,
                data: {
                    users: userCount,
                    invoices: invoiceCount,
                    products: productCount,
                    parties: partyCount,
                    serverUptime: process.uptime(),
                    nodeVersion: process.version,
                    memoryUsage: process.memoryUsage(),
                },
            });
        } catch (error: any) {
            logger.error('Admin: Error getting system stats:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
};
