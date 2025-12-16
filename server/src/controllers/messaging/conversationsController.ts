/**
 * Conversations Controller
 * Handles CRUD operations for chat conversations (direct & group)
 */

import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../config/logger';

// @desc    Get all conversations for current user
// @route   GET /api/v1/messaging/conversations
// @access  Private
export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        const { type, limit } = req.query;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                companyId,
                ...(type ? { type: type as any } : {}),
                participants: {
                    some: {
                        userId,
                        leftAt: null, // Not left the conversation
                    },
                },
            },
            take: limit ? parseInt(limit as string) : undefined,
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                        party: {
                            select: { id: true, name: true, type: true },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: { id: true, name: true },
                        },
                    },
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                readBy: {
                                    none: { userId },
                                },
                                senderId: { not: userId },
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Transform to include unread count
        const conversationsWithUnread = conversations.map((conv) => ({
            ...conv,
            unreadCount: conv._count.messages,
            lastMessage: conv.messages[0] || null,
        }));

        return res.json({
            success: true,
            data: conversationsWithUnread,
        });
    } catch (error: any) {
        logger.error('Get conversations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations',
            error: error.message,
        });
    }
};

// @desc    Get single conversation with messages
// @route   GET /api/v1/messaging/conversations/:id
// @access  Private
export const getConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                companyId,
                participants: {
                    some: { userId, leftAt: null },
                },
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        party: { select: { id: true, name: true, type: true } },
                    },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found',
            });
        }

        return res.json({ success: true, data: conversation });
    } catch (error: any) {
        logger.error('Get conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch conversation',
            error: error.message,
        });
    }
};

// @desc    Create new conversation (direct or group)
// @route   POST /api/v1/messaging/conversations
// @access  Private
export const createConversation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { type = 'DIRECT', name, description, participantIds, partyIds, participantPartyIds } = req.body;
        const effectivePartyIds = participantPartyIds || partyIds || [];

        // For direct conversations, check if one already exists
        if (type === 'DIRECT' && participantIds?.length === 1) {
            const existingConversation = await prisma.conversation.findFirst({
                where: {
                    companyId,
                    type: 'DIRECT',
                    AND: [
                        { participants: { some: { userId } } },
                        { participants: { some: { userId: participantIds[0] } } },
                    ],
                },
                include: {
                    participants: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                        },
                    },
                },
            });

            if (existingConversation) {
                return res.json({ success: true, data: existingConversation, existing: true });
            }
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                type: type as any,
                name: type === 'GROUP' ? name : null,
                description: type === 'GROUP' ? description : null,
                companyId,
                participants: {
                    create: [
                        // Add creator as admin
                        { userId, isAdmin: true, role: 'ADMIN' },
                        // Add other participants
                        ...(participantIds || []).map((uid: string) => ({
                            userId: uid,
                            isAdmin: false,
                            role: 'MEMBER' as const,
                        })),
                        // Add external parties (customers/suppliers)
                        ...effectivePartyIds.map((pid: string) => ({
                            partyId: pid,
                            isAdmin: false,
                            role: 'MEMBER' as const,
                        })),
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        party: { select: { id: true, name: true, type: true } },
                    },
                },
            },
        });

        return res.status(201).json({ success: true, data: conversation });
    } catch (error: any) {
        logger.error('Create conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create conversation',
            error: error.message,
        });
    }
};

// @desc    Update conversation (group name, description)
// @route   PUT /api/v1/messaging/conversations/:id
// @access  Private (Admin only)
export const updateConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { name, description, avatar } = req.body;

        // Check if user is admin of this conversation
        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId: id, userId, isAdmin: true },
        });

        if (!participant) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update conversation',
            });
        }

        const conversation = await prisma.conversation.update({
            where: { id },
            data: { name, description, avatar },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        party: { select: { id: true, name: true, type: true } },
                    },
                },
            },
        });

        return res.json({ success: true, data: conversation });
    } catch (error: any) {
        logger.error('Update conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update conversation',
            error: error.message,
        });
    }
};

// @desc    Add participants to group
// @route   POST /api/v1/messaging/conversations/:id/participants
// @access  Private (Admin only)
export const addParticipants = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { userIds = [], partyIds = [] } = req.body;

        // Check if user is admin
        const isAdmin = await prisma.conversationParticipant.findFirst({
            where: { conversationId: id, userId, isAdmin: true },
        });

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can add participants',
            });
        }

        // Add new participants
        const newParticipants = await prisma.conversationParticipant.createMany({
            data: [
                ...userIds.map((uid: string) => ({
                    conversationId: id,
                    userId: uid,
                    role: 'MEMBER' as const,
                })),
                ...partyIds.map((pid: string) => ({
                    conversationId: id,
                    partyId: pid,
                    role: 'MEMBER' as const,
                })),
            ],
            skipDuplicates: true,
        });

        return res.json({
            success: true,
            message: `Added ${newParticipants.count} participants`,
        });
    } catch (error: any) {
        logger.error('Add participants error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add participants',
            error: error.message,
        });
    }
};

// @desc    Leave conversation
// @route   DELETE /api/v1/messaging/conversations/:id/leave
// @access  Private
export const leaveConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await prisma.conversationParticipant.updateMany({
            where: { conversationId: id, userId },
            data: { leftAt: new Date() },
        });

        return res.json({ success: true, message: 'Left conversation' });
    } catch (error: any) {
        logger.error('Leave conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to leave conversation',
            error: error.message,
        });
    }
};

// @desc    Delete conversation (admin only)
// @route   DELETE /api/v1/messaging/conversations/:id
// @access  Private (Admin only)
export const deleteConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Check if user is admin
        const isAdmin = await prisma.conversationParticipant.findFirst({
            where: { conversationId: id, userId, isAdmin: true },
        });

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete conversations',
            });
        }

        // Delete conversation and all related data
        await prisma.$transaction([
            prisma.messageRead.deleteMany({ where: { message: { conversationId: id } } }),
            prisma.messageAttachment.deleteMany({ where: { message: { conversationId: id } } }),
            prisma.message.deleteMany({ where: { conversationId: id } }),
            prisma.conversationParticipant.deleteMany({ where: { conversationId: id } }),
            prisma.conversation.delete({ where: { id } }),
        ]);

        return res.json({ success: true, message: 'Conversation deleted' });
    } catch (error: any) {
        logger.error('Delete conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete conversation',
            error: error.message,
        });
    }
};

// @desc    Remove participant from conversation
// @route   DELETE /api/v1/messaging/conversations/:id/participants/:participantId
// @access  Private (Admin only)
export const removeParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const { id, participantId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Check if user is admin
        const isAdmin = await prisma.conversationParticipant.findFirst({
            where: { conversationId: id, userId, isAdmin: true },
        });

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove participants',
            });
        }

        await prisma.conversationParticipant.updateMany({
            where: { conversationId: id, userId: participantId },
            data: { leftAt: new Date() },
        });

        return res.json({ success: true, message: 'Participant removed' });
    } catch (error: any) {
        logger.error('Remove participant error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove participant',
            error: error.message,
        });
    }
};

// @desc    Invite party to connect
// @route   POST /api/v1/messaging/invite
// @access  Private
export const inviteParty = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { partyId, email, message } = req.body;

        if (!partyId && !email) {
            return res.status(400).json({ success: false, message: 'Party ID or Email is required' });
        }

        let recipientName = 'Friend';
        let recipientEmail = email;

        // If partyId is provided, fetch details
        if (partyId) {
            const party = await prisma.party.findFirst({
                where: { id: partyId, companyId },
            });

            if (!party) {
                return res.status(404).json({ success: false, message: 'Party not found' });
            }

            recipientName = party.name;
            recipientEmail = party.email || email;
        }

        if (!recipientEmail) {
            return res.status(400).json({ success: false, message: 'Recipient email is required' });
        }

        // Get company details for the email
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { businessName: true },
        });

        // Send invite email
        // In a real app, this link would point to a registration page with a token
        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?invite=${Buffer.from(recipientEmail).toString('base64')}`;

        // Dynamic import to avoid circular dependency issues if any
        const { sendEmail, generateInviteEmailHTML } = await import('../../services/emailService');

        await sendEmail({
            to: recipientEmail,
            subject: `Invitation to connect from ${company?.businessName || 'BharatFlow User'}`,
            html: generateInviteEmailHTML({
                companyName: company?.businessName || 'BharatFlow User',
                recipientName,
                inviteLink,
                message,
            }),
            senderEmail: req.user?.email, // Optional: User's email as reply-to
            senderName: company?.businessName,    // Optional: Company name as sender name
        });

        return res.json({ success: true, message: `Invitation sent to ${recipientEmail}` });
    } catch (error: any) {
        logger.error('Invite party error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send invitation',
            error: error.message,
        });
    }
};

export default {
    getConversations,
    getConversation,
    createConversation,
    updateConversation,
    addParticipants,
    leaveConversation,
    deleteConversation,
    removeParticipant,
    inviteParty,
};
