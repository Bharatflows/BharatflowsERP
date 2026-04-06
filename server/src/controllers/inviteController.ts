/**
 * Invite Controller
 * Handles employee and party invitations
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { AuthRequest } from '../middleware/auth';
import { sendEmail, generateInviteEmailHTML } from '../services/emailService';

// Generate secure invite token
const generateInviteToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// @desc    Create employee invite
// @route   POST /api/v1/invite/employee
// @access  Private (Admin/Manager only)
export const createEmployeeInvite = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        const userRole = req.user?.role;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Only ADMIN and MANAGER can invite employees
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
            return res.status(403).json({ success: false, message: 'Only Admins and Managers can invite employees' });
        }

        const { email, role = 'USER', moduleAccess, message } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Check if pending invite exists
        const existingInvite = await prisma.invite.findFirst({
            where: { email, companyId, status: 'PENDING' },
        });
        if (existingInvite) {
            return res.status(400).json({ success: false, message: 'Pending invite already exists for this email' });
        }

        const token = generateInviteToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invite = await prisma.invite.create({
            data: {
                email,
                type: 'EMPLOYEE',
                token,
                role: role as any,
                moduleAccess: moduleAccess || {},
                message,
                expiresAt,
                invitedById: userId,
                companyId,
            },
        });

        // Get company details for email
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { businessName: true },
        });

        // Send invite email
        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/employee/${token}`;

        try {
            await sendEmail({
                to: email,
                subject: `Invitation to join ${company?.businessName || 'BharatFlows'}`,
                html: generateInviteEmailHTML({
                    companyName: company?.businessName || 'BharatFlows',
                    recipientName: 'Team Member',
                    inviteLink,
                    message: message || `You've been invited to join ${company?.businessName} as a ${role.toLowerCase()}.`,
                }),
                senderName: company?.businessName,
            });
        } catch (emailError: any) {
            logger.warn('Failed to send invite email:', emailError.message);
        }

        return res.status(201).json({
            success: true,
            message: `Invite sent to ${email}`,
            data: { id: invite.id, email, role, expiresAt, inviteLink },
        });
    } catch (error: any) {
        logger.error('Create employee invite error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create invite', error: error.message });
    }
};

// @desc    Create party invite (customer/supplier)
// @route   POST /api/v1/invite/party
// @access  Private
export const createPartyInvite = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { partyId, email, message } = req.body;

        if (!email && !partyId) {
            return res.status(400).json({ success: false, message: 'Email or Party ID is required' });
        }

        let recipientEmail = email;
        let recipientName = 'Business Partner';

        // If partyId provided, get party details
        if (partyId) {
            const party = await prisma.party.findFirst({
                where: { id: partyId, companyId },
            });
            if (!party) {
                return res.status(404).json({ success: false, message: 'Party not found' });
            }
            recipientEmail = party.email || email;
            recipientName = party.name;
        }

        if (!recipientEmail) {
            return res.status(400).json({ success: false, message: 'Recipient email is required' });
        }

        // Check if pending invite exists
        const existingInvite = await prisma.invite.findFirst({
            where: { email: recipientEmail, status: 'PENDING', type: 'PARTY' },
        });
        if (existingInvite) {
            return res.status(400).json({ success: false, message: 'Pending invite already exists for this email' });
        }

        const token = generateInviteToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const invite = await prisma.invite.create({
            data: {
                email: recipientEmail,
                type: 'PARTY',
                token,
                partyId,
                message,
                expiresAt,
                invitedById: userId,
                companyId,
            },
        });

        // Get company details for email
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { businessName: true },
        });

        // Send invite email
        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/party/${token}`;

        try {
            await sendEmail({
                to: recipientEmail,
                subject: `Invitation to connect with ${company?.businessName || 'BharatFlows'}`,
                html: generateInviteEmailHTML({
                    companyName: company?.businessName || 'BharatFlows',
                    recipientName,
                    inviteLink,
                    message: message || `${company?.businessName} has invited you to join BharatFlows for seamless business communication.`,
                }),
                senderEmail: req.user?.email,
                senderName: company?.businessName,
            });
        } catch (emailError: any) {
            logger.warn('Failed to send invite email:', emailError.message);
        }

        return res.status(201).json({
            success: true,
            message: `Invite sent to ${recipientEmail}`,
            data: { id: invite.id, email: recipientEmail, expiresAt, inviteLink },
        });
    } catch (error: any) {
        logger.error('Create party invite error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create invite', error: error.message });
    }
};

// @desc    Get all invites for company
// @route   GET /api/v1/invite
// @access  Private
export const getInvites = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { status, type } = req.query;

        if (!companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const where: any = { companyId };
        if (status) where.status = status;
        if (type) where.type = type;

        const invites = await prisma.invite.findMany({
            where,
            include: {
                invitedBy: { select: { id: true, name: true, email: true } },
                party: { select: { id: true, name: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Add invite links to each invite
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const invitesWithLinks = invites.map((inv) => ({
            ...inv,
            inviteLink: `${clientUrl}/invite/${inv.type.toLowerCase()}/${inv.token}`,
        }));

        return res.json({ success: true, data: invitesWithLinks });
    } catch (error: any) {
        logger.error('Get invites error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch invites', error: error.message });
    }
};

// @desc    Cancel invite
// @route   DELETE /api/v1/invite/:id
// @access  Private
export const cancelInvite = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const invite = await prisma.invite.findFirst({
            where: { id, companyId, status: 'PENDING' },
        });

        if (!invite) {
            return res.status(404).json({ success: false, message: 'Invite not found' });
        }

        await prisma.invite.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        return res.json({ success: true, message: 'Invite cancelled' });
    } catch (error: any) {
        logger.error('Cancel invite error:', error);
        return res.status(500).json({ success: false, message: 'Failed to cancel invite', error: error.message });
    }
};

// @desc    Resend invite
// @route   POST /api/v1/invite/:id/resend
// @access  Private
export const resendInvite = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;

        if (!companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const invite = await prisma.invite.findFirst({
            where: { id, companyId, status: 'PENDING' },
        });

        if (!invite) {
            return res.status(404).json({ success: false, message: 'Invite not found' });
        }

        // Generate new token and extend expiry
        const newToken = generateInviteToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.invite.update({
            where: { id },
            data: { token: newToken, expiresAt },
        });

        // Get company details for email
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { businessName: true },
        });

        // Resend email
        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${invite.type.toLowerCase()}/${newToken}`;

        try {
            await sendEmail({
                to: invite.email,
                subject: `Reminder: Invitation to join ${company?.businessName || 'BharatFlows'}`,
                html: generateInviteEmailHTML({
                    companyName: company?.businessName || 'BharatFlows',
                    recipientName: 'User',
                    inviteLink,
                    message: invite.message || undefined,
                }),
                senderName: company?.businessName,
            });
        } catch (emailError: any) {
            logger.warn('Failed to resend invite email:', emailError.message);
        }

        return res.json({ success: true, message: 'Invite resent', data: { inviteLink } });
    } catch (error: any) {
        logger.error('Resend invite error:', error);
        return res.status(500).json({ success: false, message: 'Failed to resend invite', error: error.message });
    }
};

// @desc    Verify invite token (public)
// @route   GET /api/v1/invite/verify/:token
// @access  Public
export const verifyInviteToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const invite = await prisma.invite.findUnique({
            where: { token },
            include: {
                company: { select: { id: true, businessName: true, logo: true } },
                party: { select: { id: true, name: true, type: true } },
            },
        });

        if (!invite) {
            return res.status(404).json({ success: false, message: 'Invalid invite link' });
        }

        if (invite.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: `Invite has been ${invite.status.toLowerCase()}` });
        }

        if (new Date() > invite.expiresAt) {
            await prisma.invite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
            return res.status(400).json({ success: false, message: 'Invite has expired' });
        }

        return res.json({
            success: true,
            data: {
                id: invite.id,
                email: invite.email,
                type: invite.type,
                role: invite.role,
                moduleAccess: invite.moduleAccess,
                company: invite.company,
                party: invite.party,
                message: invite.message,
            },
        });
    } catch (error: any) {
        logger.error('Verify invite token error:', error);
        return res.status(500).json({ success: false, message: 'Failed to verify invite', error: error.message });
    }
};

// @desc    Accept employee invite (user joins company)
// @route   POST /api/v1/invite/accept/employee
// @access  Public
export const acceptEmployeeInvite = async (req: Request, res: Response) => {
    try {
        const { token, name, phone, password } = req.body;

        if (!token || !name || !password) {
            return res.status(400).json({ success: false, message: 'Token, name, and password are required' });
        }

        const invite = await prisma.invite.findUnique({
            where: { token },
            include: { company: true },
        });

        if (!invite || invite.type !== 'EMPLOYEE') {
            return res.status(404).json({ success: false, message: 'Invalid invite' });
        }

        if (invite.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: `Invite has been ${invite.status.toLowerCase()}` });
        }

        if (new Date() > invite.expiresAt) {
            await prisma.invite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
            return res.status(400).json({ success: false, message: 'Invite has expired' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in transaction
        const [user] = await prisma.$transaction([
            prisma.user.create({
                data: {
                    email: invite.email,
                    name,
                    phone,
                    password: hashedPassword,
                    role: invite.role || 'USER',
                    moduleAccess: invite.moduleAccess as any,
                    companyId: invite.companyId,
                    emailVerified: true, // Verified via invite
                },
            }),
            prisma.invite.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED', acceptedAt: new Date() },
            }),
        ]);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! You can now log in.',
            data: { email: user.email },
        });
    } catch (error: any) {
        logger.error('Accept employee invite error:', error);
        return res.status(500).json({ success: false, message: 'Failed to accept invite', error: error.message });
    }
};

// @desc    Accept party invite (creates new company account)
// @route   POST /api/v1/invite/accept/party
// @access  Public
export const acceptPartyInvite = async (req: Request, res: Response) => {
    try {
        const { token, name, email, phone, password, businessName, gstin } = req.body;

        if (!token || !name || !password || !businessName) {
            return res.status(400).json({ success: false, message: 'Token, name, password, and business name are required' });
        }

        const invite = await prisma.invite.findUnique({
            where: { token },
            include: { company: true },
        });

        if (!invite || invite.type !== 'PARTY') {
            return res.status(404).json({ success: false, message: 'Invalid invite' });
        }

        if (invite.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: `Invite has been ${invite.status.toLowerCase()}` });
        }

        if (new Date() > invite.expiresAt) {
            await prisma.invite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
            return res.status(400).json({ success: false, message: 'Invite has expired' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email: email || invite.email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create company and user in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create new company
            const newCompany = await tx.company.create({
                data: {
                    businessName,
                    gstin,
                    email: email || invite.email,
                    phone,
                },
            });

            // Create admin user
            const newUser = await tx.user.create({
                data: {
                    email: email || invite.email,
                    name,
                    phone,
                    password: hashedPassword,
                    role: 'ADMIN',
                    companyId: newCompany.id,
                    emailVerified: true,
                },
            });

            // Mark invite as accepted
            await tx.invite.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED', acceptedAt: new Date() },
            });

            return { company: newCompany, user: newUser };
        });

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! You can now log in.',
            data: { email: result.user.email, companyName: result.company.businessName },
        });
    } catch (error: any) {
        logger.error('Accept party invite error:', error);
        return res.status(500).json({ success: false, message: 'Failed to accept invite', error: error.message });
    }
};

export default {
    createEmployeeInvite,
    createPartyInvite,
    getInvites,
    cancelInvite,
    resendInvite,
    verifyInviteToken,
    acceptEmployeeInvite,
    acceptPartyInvite,
};
