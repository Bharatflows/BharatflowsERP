/**
 * Messages Controller
 * Handles message CRUD, read receipts, and attachments
 */

import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { AuthRequest } from '../../middleware/auth';
import logger from '../../config/logger';
import { encrypt, decrypt } from '../../utils/encryption';

// @desc    Get messages for a conversation
// @route   GET /api/v1/messaging/conversations/:conversationId/messages
// @access  Private
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        const { page = 1, limit = 50, before } = req.query;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Verify user is participant
        const isParticipant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId, leftAt: null },
        });

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not a participant of this conversation',
            });
        }

        const skip = (Number(page) - 1) * Number(limit);

        const whereClause: any = {
            conversationId,
            deletedAt: null,
        };

        if (before) {
            whereClause.createdAt = { lt: new Date(before as string) };
        }

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where: whereClause,
                include: {
                    sender: { select: { id: true, name: true, email: true } },
                    attachments: true,
                    replyTo: {
                        select: {
                            id: true,
                            content: true,
                            sender: { select: { name: true } },
                        },
                    },
                    readBy: {
                        select: {
                            userId: true,
                            readAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.message.count({ where: whereClause }),
        ]);

        // Decrypt message content
        const decryptedMessages = messages.map((msg) => ({
            ...msg,
            content: decrypt(msg.content),
        }));

        return res.json({
            success: true,
            data: {
                items: decryptedMessages.reverse(), // Return in chronological order
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
        });
    } catch (error: any) {
        logger.error('Get messages error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message,
        });
    }
};

// @desc    Send a message
// @route   POST /api/v1/messaging/conversations/:conversationId/messages
// @access  Private
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { content, type = 'TEXT', replyToId, metadata } = req.body;

        if (!content && type === 'TEXT') {
            return res.status(400).json({
                success: false,
                message: 'Message content is required',
            });
        }

        // Verify user is participant
        const isParticipant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId, leftAt: null },
        });

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not a participant of this conversation',
            });
        }

        // Encrypt message content
        const encryptedContent = encrypt(content);

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: userId,
                content: encryptedContent,
                type: type as any,
                status: 'SENT',
                replyToId,
                metadata,
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
                attachments: true,
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { name: true } },
                    },
                },
            },
        });

        // Update conversation's updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        // Return with decrypted content
        const responseMessage = {
            ...message,
            content,
            replyTo: message.replyTo
                ? { ...message.replyTo, content: decrypt(message.replyTo.content) }
                : null,
        };

        return res.status(201).json({ success: true, data: responseMessage });
    } catch (error: any) {
        logger.error('Send message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send message',
            error: error.message,
        });
    }
};

// @desc    Edit a message
// @route   PUT /api/v1/messaging/messages/:id
// @access  Private (Own message only)
export const editMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { content } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Verify ownership
        const message = await prisma.message.findFirst({
            where: { id, senderId: userId, deletedAt: null },
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or not yours',
            });
        }

        const encryptedContent = encrypt(content);

        const updatedMessage = await prisma.message.update({
            where: { id },
            data: {
                content: encryptedContent,
                editedAt: new Date(),
            },
            include: {
                sender: { select: { id: true, name: true, email: true } },
            },
        });

        return res.json({
            success: true,
            data: { ...updatedMessage, content },
        });
    } catch (error: any) {
        logger.error('Edit message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to edit message',
            error: error.message,
        });
    }
};

// @desc    Delete a message (soft delete)
// @route   DELETE /api/v1/messaging/messages/:id
// @access  Private (Own message only)
export const deleteMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Verify ownership
        const message = await prisma.message.findFirst({
            where: { id, senderId: userId, deletedAt: null },
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found or not yours',
            });
        }

        await prisma.message.update({
            where: { id },
            data: { deletedAt: new Date(), content: '[Message deleted]' },
        });

        return res.json({ success: true, message: 'Message deleted' });
    } catch (error: any) {
        logger.error('Delete message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message,
        });
    }
};

// @desc    Mark messages as read
// @route   POST /api/v1/messaging/conversations/:conversationId/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        const { messageIds } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get unread messages in this conversation not sent by user
        const messagesToMark = messageIds
            ? { id: { in: messageIds } }
            : {
                conversationId,
                senderId: { not: userId },
                readBy: { none: { userId } },
            };

        const messages = await prisma.message.findMany({
            where: messagesToMark,
            select: { id: true },
        });

        if (messages.length > 0) {
            await prisma.messageRead.createMany({
                data: messages.map((msg) => ({
                    messageId: msg.id,
                    userId,
                })),
                skipDuplicates: true,
            });

            // Update message status to READ
            await prisma.message.updateMany({
                where: { id: { in: messages.map((m) => m.id) } },
                data: { status: 'READ' },
            });
        }

        return res.json({
            success: true,
            message: `Marked ${messages.length} messages as read`,
        });
    } catch (error: any) {
        logger.error('Mark as read error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read',
            error: error.message,
        });
    }
};

// @desc    Get conversation summary/stats
// @route   GET /api/v1/messaging/summary
// @access  Private
export const getMessagingSummary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const [totalConversations, totalMessages, unreadCount] = await Promise.all([
            prisma.conversation.count({
                where: {
                    companyId,
                    participants: { some: { userId, leftAt: null } },
                },
            }),
            prisma.message.count({
                where: {
                    conversation: {
                        companyId,
                        participants: { some: { userId, leftAt: null } },
                    },
                },
            }),
            prisma.message.count({
                where: {
                    conversation: {
                        companyId,
                        participants: { some: { userId, leftAt: null } },
                    },
                    senderId: { not: userId },
                    readBy: { none: { userId } },
                },
            }),
        ]);

        return res.json({
            success: true,
            data: {
                totalConversations,
                totalMessages,
                unreadCount,
            },
        });
    } catch (error: any) {
        logger.error('Get messaging summary error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch messaging summary',
            error: error.message,
        });
    }
};

export default {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    getMessagingSummary,
};
