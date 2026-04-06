/**
 * Messaging Routes
 * Routes for conversations and messages
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
    getConversations,
    getConversation,
    createConversation,
    updateConversation,
    addParticipants,
    leaveConversation,
    deleteConversation,
    removeParticipant,
    inviteParty,
} from '../controllers/messaging/conversationsController';
import {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    getMessagingSummary,
} from '../controllers/messaging/messagesController';

const router = Router();

// All routes require authentication
router.use(protect);

// Summary
router.get('/summary', getMessagingSummary);

// Conversation routes
router.post('/invite', inviteParty);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);
router.delete('/conversations/:id/leave', leaveConversation);
router.post('/conversations/:id/participants', addParticipants);
router.delete('/conversations/:id/participants/:participantId', removeParticipant);

// Message routes
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.post('/conversations/:conversationId/read', markAsRead);

// Individual message operations
router.put('/messages/:id', editMessage);
router.delete('/messages/:id', deleteMessage);

export default router;
