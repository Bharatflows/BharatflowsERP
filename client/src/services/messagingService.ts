/**
 * Messaging Service
 * API methods for conversations and messages
 */

import { apiService, ApiResponse } from './api';

export interface Conversation {
    id: string;
    type: 'DIRECT' | 'GROUP';
    name?: string;
    description?: string;
    avatar?: string;
    participants: ConversationParticipant[];
    lastMessage?: Message;
    unreadCount?: number;
    messageCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationParticipant {
    id: string;
    userId?: string;
    user?: { id: string; name: string; email: string };
    partyId?: string;
    party?: { id: string; name: string; type: string };
    role: 'ADMIN' | 'MEMBER';
    isAdmin: boolean;
    joinedAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    sender: { id: string; name: string; email?: string };
    content: string;
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'DOCUMENT' | 'VOICE' | 'SYSTEM';
    status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    attachments?: MessageAttachment[];
    replyTo?: { id: string; content: string; sender: { name: string } };
    readBy?: { userId: string; readAt: string }[];
    createdAt: string;
    editedAt?: string;
}

export interface MessageAttachment {
    id: string;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    thumbnailUrl?: string;
}

export interface MessagingSummary {
    totalConversations: number;
    totalMessages: number;
    unreadCount: number;
}

export const messagingService = {
    // Summary
    getSummary: () =>
        apiService.get<ApiResponse<MessagingSummary>>('/messaging/summary'),

    // Conversations
    getConversations: (params?: { type?: 'DIRECT' | 'GROUP'; limit?: number }) => {
        const query = params
            ? `?${new URLSearchParams(params as Record<string, string>)}`
            : '';
        return apiService.get<ApiResponse<Conversation[]>>(`/messaging/conversations${query}`);
    },

    getConversation: (id: string) =>
        apiService.get<ApiResponse<Conversation>>(`/messaging/conversations/${id}`),

    createConversation: (data: {
        type?: 'DIRECT' | 'GROUP';
        name?: string;
        description?: string;
        participantIds?: string[];
        participantPartyIds?: string[];
    }) => apiService.post<ApiResponse<Conversation>>('/messaging/conversations', data),

    updateConversation: (
        id: string,
        data: { name?: string; description?: string; avatar?: string }
    ) => apiService.put<ApiResponse<Conversation>>(`/messaging/conversations/${id}`, data),

    deleteConversation: (id: string) =>
        apiService.delete<ApiResponse<void>>(`/messaging/conversations/${id}`),

    leaveConversation: (id: string) =>
        apiService.delete<ApiResponse<void>>(`/messaging/conversations/${id}/leave`),

    addParticipants: (id: string, data: { userIds?: string[]; partyIds?: string[] }) =>
        apiService.post<ApiResponse<{ message: string }>>(
            `/messaging/conversations/${id}/participants`,
            data
        ),

    removeParticipant: (conversationId: string, participantId: string) =>
        apiService.delete<ApiResponse<void>>(
            `/messaging/conversations/${conversationId}/participants/${participantId}`
        ),

    inviteParty: (data: { partyId?: string; email?: string; message?: string }) =>
        apiService.post<ApiResponse<{ message: string }>>('/messaging/invite', data),

    // Messages
    getMessages: (
        conversationId: string,
        params?: { page?: number; limit?: number; before?: string }
    ) => {
        const query = params
            ? `?${new URLSearchParams(params as Record<string, string>)}`
            : '';
        return apiService.get<
            ApiResponse<{ items: Message[]; pagination: any }>
        >(`/messaging/conversations/${conversationId}/messages${query}`);
    },

    sendMessage: (
        conversationId: string,
        data: {
            content: string;
            type?: 'TEXT' | 'IMAGE' | 'FILE' | 'DOCUMENT';
            replyToId?: string;
            metadata?: any;
        }
    ) =>
        apiService.post<ApiResponse<Message>>(
            `/messaging/conversations/${conversationId}/messages`,
            data
        ),

    editMessage: (messageId: string, content: string) =>
        apiService.put<ApiResponse<Message>>(`/messaging/messages/${messageId}`, {
            content,
        }),

    deleteMessage: (messageId: string) =>
        apiService.delete<ApiResponse<void>>(`/messaging/messages/${messageId}`),

    markAsRead: (conversationId: string, messageIds?: string[]) =>
        apiService.post<ApiResponse<{ message: string }>>(
            `/messaging/conversations/${conversationId}/read`,
            { messageIds }
        ),
};

export default messagingService;
