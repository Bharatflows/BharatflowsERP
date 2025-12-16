"use strict";
/**
 * Conversations Controller
 * Handles CRUD operations for chat conversations (direct & group)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteParty = exports.removeParticipant = exports.deleteConversation = exports.leaveConversation = exports.addParticipants = exports.updateConversation = exports.createConversation = exports.getConversation = exports.getConversations = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
// @desc    Get all conversations for current user
// @route   GET /api/v1/messaging/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        const { type, limit } = req.query;
        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const conversations = await prisma_1.default.conversation.findMany({
            where: {
                companyId,
                ...(type ? { type: type } : {}),
                participants: {
                    some: {
                        userId,
                        leftAt: null, // Not left the conversation
                    },
                },
            },
            take: limit ? parseInt(limit) : undefined,
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
    }
    catch (error) {
        logger_1.default.error('Get conversations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations',
            error: error.message,
        });
    }
};
exports.getConversations = getConversations;
// @desc    Get single conversation with messages
// @route   GET /api/v1/messaging/conversations/:id
// @access  Private
const getConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const conversation = await prisma_1.default.conversation.findFirst({
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
    }
    catch (error) {
        logger_1.default.error('Get conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch conversation',
            error: error.message,
        });
    }
};
exports.getConversation = getConversation;
// @desc    Create new conversation (direct or group)
// @route   POST /api/v1/messaging/conversations
// @access  Private
const createConversation = async (req, res) => {
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
            const existingConversation = await prisma_1.default.conversation.findFirst({
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
        const conversation = await prisma_1.default.conversation.create({
            data: {
                type: type,
                name: type === 'GROUP' ? name : null,
                description: type === 'GROUP' ? description : null,
                companyId,
                participants: {
                    create: [
                        // Add creator as admin
                        { userId, isAdmin: true, role: 'ADMIN' },
                        // Add other participants
                        ...(participantIds || []).map((uid) => ({
                            userId: uid,
                            isAdmin: false,
                            role: 'MEMBER',
                        })),
                        // Add external parties (customers/suppliers)
                        ...effectivePartyIds.map((pid) => ({
                            partyId: pid,
                            isAdmin: false,
                            role: 'MEMBER',
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
    }
    catch (error) {
        logger_1.default.error('Create conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create conversation',
            error: error.message,
        });
    }
};
exports.createConversation = createConversation;
// @desc    Update conversation (group name, description)
// @route   PUT /api/v1/messaging/conversations/:id
// @access  Private (Admin only)
const updateConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { name, description, avatar } = req.body;
        // Check if user is admin of this conversation
        const participant = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId: id, userId, isAdmin: true },
        });
        if (!participant) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update conversation',
            });
        }
        const conversation = await prisma_1.default.conversation.update({
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
    }
    catch (error) {
        logger_1.default.error('Update conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update conversation',
            error: error.message,
        });
    }
};
exports.updateConversation = updateConversation;
// @desc    Add participants to group
// @route   POST /api/v1/messaging/conversations/:id/participants
// @access  Private (Admin only)
const addParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { userIds = [], partyIds = [] } = req.body;
        // Check if user is admin
        const isAdmin = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId: id, userId, isAdmin: true },
        });
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can add participants',
            });
        }
        // Add new participants
        const newParticipants = await prisma_1.default.conversationParticipant.createMany({
            data: [
                ...userIds.map((uid) => ({
                    conversationId: id,
                    userId: uid,
                    role: 'MEMBER',
                })),
                ...partyIds.map((pid) => ({
                    conversationId: id,
                    partyId: pid,
                    role: 'MEMBER',
                })),
            ],
            skipDuplicates: true,
        });
        return res.json({
            success: true,
            message: `Added ${newParticipants.count} participants`,
        });
    }
    catch (error) {
        logger_1.default.error('Add participants error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add participants',
            error: error.message,
        });
    }
};
exports.addParticipants = addParticipants;
// @desc    Leave conversation
// @route   DELETE /api/v1/messaging/conversations/:id/leave
// @access  Private
const leaveConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        await prisma_1.default.conversationParticipant.updateMany({
            where: { conversationId: id, userId },
            data: { leftAt: new Date() },
        });
        return res.json({ success: true, message: 'Left conversation' });
    }
    catch (error) {
        logger_1.default.error('Leave conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to leave conversation',
            error: error.message,
        });
    }
};
exports.leaveConversation = leaveConversation;
// @desc    Delete conversation (admin only)
// @route   DELETE /api/v1/messaging/conversations/:id
// @access  Private (Admin only)
const deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        if (!userId || !companyId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // Check if user is admin
        const isAdmin = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId: id, userId, isAdmin: true },
        });
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete conversations',
            });
        }
        // Delete conversation and all related data
        await prisma_1.default.$transaction([
            prisma_1.default.messageRead.deleteMany({ where: { message: { conversationId: id } } }),
            prisma_1.default.messageAttachment.deleteMany({ where: { message: { conversationId: id } } }),
            prisma_1.default.message.deleteMany({ where: { conversationId: id } }),
            prisma_1.default.conversationParticipant.deleteMany({ where: { conversationId: id } }),
            prisma_1.default.conversation.delete({ where: { id } }),
        ]);
        return res.json({ success: true, message: 'Conversation deleted' });
    }
    catch (error) {
        logger_1.default.error('Delete conversation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete conversation',
            error: error.message,
        });
    }
};
exports.deleteConversation = deleteConversation;
// @desc    Remove participant from conversation
// @route   DELETE /api/v1/messaging/conversations/:id/participants/:participantId
// @access  Private (Admin only)
const removeParticipant = async (req, res) => {
    try {
        const { id, participantId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // Check if user is admin
        const isAdmin = await prisma_1.default.conversationParticipant.findFirst({
            where: { conversationId: id, userId, isAdmin: true },
        });
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove participants',
            });
        }
        await prisma_1.default.conversationParticipant.updateMany({
            where: { conversationId: id, userId: participantId },
            data: { leftAt: new Date() },
        });
        return res.json({ success: true, message: 'Participant removed' });
    }
    catch (error) {
        logger_1.default.error('Remove participant error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove participant',
            error: error.message,
        });
    }
};
exports.removeParticipant = removeParticipant;
// @desc    Invite party to connect
// @route   POST /api/v1/messaging/invite
// @access  Private
const inviteParty = async (req, res) => {
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
            const party = await prisma_1.default.party.findFirst({
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
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            select: { businessName: true },
        });
        // Send invite email
        // In a real app, this link would point to a registration page with a token
        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/register?invite=${Buffer.from(recipientEmail).toString('base64')}`;
        // Dynamic import to avoid circular dependency issues if any
        const { sendEmail, generateInviteEmailHTML } = await Promise.resolve().then(() => __importStar(require('../../services/emailService')));
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
            senderName: company?.businessName, // Optional: Company name as sender name
        });
        return res.json({ success: true, message: `Invitation sent to ${recipientEmail}` });
    }
    catch (error) {
        logger_1.default.error('Invite party error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send invitation',
            error: error.message,
        });
    }
};
exports.inviteParty = inviteParty;
exports.default = {
    getConversations: exports.getConversations,
    getConversation: exports.getConversation,
    createConversation: exports.createConversation,
    updateConversation: exports.updateConversation,
    addParticipants: exports.addParticipants,
    leaveConversation: exports.leaveConversation,
    deleteConversation: exports.deleteConversation,
    removeParticipant: exports.removeParticipant,
    inviteParty: exports.inviteParty,
};
//# sourceMappingURL=conversationsController.js.map