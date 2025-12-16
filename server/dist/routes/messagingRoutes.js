"use strict";
/**
 * Messaging Routes
 * Routes for conversations and messages
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const conversationsController_1 = require("../controllers/messaging/conversationsController");
const messagesController_1 = require("../controllers/messaging/messagesController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.protect);
// Summary
router.get('/summary', messagesController_1.getMessagingSummary);
// Conversation routes
router.post('/invite', conversationsController_1.inviteParty);
router.get('/conversations', conversationsController_1.getConversations);
router.post('/conversations', conversationsController_1.createConversation);
router.get('/conversations/:id', conversationsController_1.getConversation);
router.put('/conversations/:id', conversationsController_1.updateConversation);
router.delete('/conversations/:id', conversationsController_1.deleteConversation);
router.delete('/conversations/:id/leave', conversationsController_1.leaveConversation);
router.post('/conversations/:id/participants', conversationsController_1.addParticipants);
router.delete('/conversations/:id/participants/:participantId', conversationsController_1.removeParticipant);
// Message routes
router.get('/conversations/:conversationId/messages', messagesController_1.getMessages);
router.post('/conversations/:conversationId/messages', messagesController_1.sendMessage);
router.post('/conversations/:conversationId/read', messagesController_1.markAsRead);
// Individual message operations
router.put('/messages/:id', messagesController_1.editMessage);
router.delete('/messages/:id', messagesController_1.deleteMessage);
exports.default = router;
//# sourceMappingURL=messagingRoutes.js.map