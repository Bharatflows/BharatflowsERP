/**
 * Socket.IO Server Setup
 * Real-time WebSocket server for messaging
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { encrypt, decrypt } from '../utils/encryption';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    companyId?: string;
    userName?: string;
}

interface MessagePayload {
    conversationId: string;
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'DOCUMENT';
    replyToId?: string;
}

// Store online users: Map<userId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>();

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // JWT Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, name: true, companyId: true, status: true },
            });

            if (!user || user.status !== 'ACTIVE') {
                return next(new Error('User not found or inactive'));
            }

            socket.userId = user.id;
            socket.companyId = user.companyId;
            socket.userName = user.name;

            next();
        } catch (error) {
            logger.error('Socket auth error:', error);
            next(new Error('Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket: AuthenticatedSocket) => {
        const userId = socket.userId!;
        const companyId = socket.companyId!;

        logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

        // Track online status
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId)!.add(socket.id);

        // Notify others that user is online
        socket.to(`company:${companyId}`).emit('user:online', { userId });

        // Join company room
        socket.join(`company:${companyId}`);

        // Join user's personal room for direct messages
        socket.join(`user:${userId}`);

        // Join all conversation rooms user is part of
        joinUserConversations(socket, userId);

        // === EVENT HANDLERS ===

        // Send message
        socket.on('message:send', async (payload: MessagePayload, callback) => {
            try {
                const { conversationId, content, type = 'TEXT', replyToId } = payload;

                // Verify user is participant
                const isParticipant = await prisma.conversationParticipant.findFirst({
                    where: { conversationId, userId, leftAt: null },
                });

                if (!isParticipant) {
                    return callback?.({ error: 'Not a participant' });
                }

                // Encrypt and save message
                const encryptedContent = encrypt(content);

                const message = await prisma.message.create({
                    data: {
                        conversationId,
                        senderId: userId,
                        content: encryptedContent,
                        type: type as any,
                        status: 'SENT',
                        replyToId,
                    },
                    include: {
                        sender: { select: { id: true, name: true } },
                        replyTo: { select: { id: true, content: true, sender: { select: { name: true } } } },
                    },
                });

                // Update conversation timestamp
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { updatedAt: new Date() },
                });

                // Prepare message for broadcast (with decrypted content)
                const messageForBroadcast = {
                    ...message,
                    content, // Send original content
                    replyTo: message.replyTo ? {
                        ...message.replyTo,
                        content: decrypt(message.replyTo.content),
                    } : null,
                };

                // Broadcast to conversation room
                io.to(`conversation:${conversationId}`).emit('message:new', messageForBroadcast);

                callback?.({ success: true, data: messageForBroadcast });
            } catch (error) {
                logger.error('Socket message:send error:', error);
                callback?.({ error: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing:start', ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit('typing:start', {
                userId,
                userName: socket.userName,
                conversationId,
            });
        });

        socket.on('typing:stop', ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`).emit('typing:stop', {
                userId,
                conversationId,
            });
        });

        // Mark messages as read
        socket.on('messages:read', async ({ conversationId, messageIds }) => {
            try {
                const messagesToMark = messageIds?.length
                    ? { id: { in: messageIds } }
                    : {
                        conversationId,
                        senderId: { not: userId },
                        readBy: { none: { userId } },
                    };

                const messages = await prisma.message.findMany({
                    where: messagesToMark,
                    select: { id: true, senderId: true },
                });

                if (messages.length > 0) {
                    await prisma.messageRead.createMany({
                        data: messages.map((msg) => ({
                            messageId: msg.id,
                            userId,
                        })),
                        skipDuplicates: true,
                    });

                    // Notify senders their messages were read
                    const senderIds = [...new Set(messages.map((m) => m.senderId))];
                    senderIds.forEach((senderId) => {
                        io.to(`user:${senderId}`).emit('messages:read', {
                            conversationId,
                            readBy: userId,
                            messageIds: messages.filter((m) => m.senderId === senderId).map((m) => m.id),
                        });
                    });
                }
            } catch (error) {
                logger.error('Socket messages:read error:', error);
            }
        });

        // Join conversation room
        socket.on('conversation:join', ({ conversationId }) => {
            socket.join(`conversation:${conversationId}`);
        });

        // Leave conversation room
        socket.on('conversation:leave', ({ conversationId }) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // Disconnect
        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);

            // Remove from online tracking
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    // Notify others user is offline
                    socket.to(`company:${companyId}`).emit('user:offline', { userId });
                }
            }
        });
    });

    logger.info('✅ Socket.IO server initialized');
    return io;
}

/**
 * Join all conversation rooms for a user
 */
async function joinUserConversations(socket: AuthenticatedSocket, userId: string) {
    try {
        const participations = await prisma.conversationParticipant.findMany({
            where: { userId, leftAt: null },
            select: { conversationId: true },
        });

        participations.forEach(({ conversationId }) => {
            socket.join(`conversation:${conversationId}`);
        });
    } catch (error) {
        logger.error('Error joining user conversations:', error);
    }
}

/**
 * Get online status for users
 */
export function isUserOnline(userId: string): boolean {
    return onlineUsers.has(userId);
}

/**
 * Get all online users in a company
 */
export function getOnlineUsersInCompany(userIds: string[]): string[] {
    return userIds.filter((id) => onlineUsers.has(id));
}

export default { initializeSocket, isUserOnline, getOnlineUsersInCompany };
