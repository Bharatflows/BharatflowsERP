/**
 * useSocket Hook
 * Real-time Socket.IO connection for messaging
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    sender: { id: string; name: string };
    content: string;
    type: string;
    status: string;
    createdAt: string;
}

interface TypingEvent {
    userId: string;
    userName: string;
    conversationId: string;
}

interface UseSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    sendMessage: (conversationId: string, content: string, replyToId?: string) => Promise<Message | null>;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
    markAsRead: (conversationId: string, messageIds?: string[]) => void;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    onNewMessage: (callback: (message: Message) => void) => () => void;
    onTypingStart: (callback: (event: TypingEvent) => void) => () => void;
    onTypingStop: (callback: (event: TypingEvent) => void) => () => void;
    onUserOnline: (callback: (data: { userId: string }) => void) => () => void;
    onUserOffline: (callback: (data: { userId: string }) => void) => () => void;
    onMessagesRead: (callback: (data: { conversationId: string; readBy: string; messageIds: string[] }) => void) => () => void;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5001';

export function useSocket(): UseSocketReturn {
    const { isAuthenticated } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // Get token from localStorage (same source as apiService)
    const token = localStorage.getItem('authToken');

    // Initialize socket connection
    useEffect(() => {
        if (!isAuthenticated || !token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Create socket connection
        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [isAuthenticated, token]);

    // Send message via socket
    const sendMessage = useCallback(
        (conversationId: string, content: string, replyToId?: string): Promise<Message | null> => {
            return new Promise((resolve) => {
                if (!socketRef.current?.connected) {
                    resolve(null);
                    return;
                }

                socketRef.current.emit(
                    'message:send',
                    { conversationId, content, type: 'TEXT', replyToId },
                    (response: { success?: boolean; data?: Message; error?: string }) => {
                        if (response.success && response.data) {
                            resolve(response.data);
                        } else {
                            console.error('Failed to send message:', response.error);
                            resolve(null);
                        }
                    }
                );
            });
        },
        []
    );

    // Typing indicators
    const startTyping = useCallback((conversationId: string) => {
        socketRef.current?.emit('typing:start', { conversationId });
    }, []);

    const stopTyping = useCallback((conversationId: string) => {
        socketRef.current?.emit('typing:stop', { conversationId });
    }, []);

    // Mark messages as read
    const markAsRead = useCallback((conversationId: string, messageIds?: string[]) => {
        socketRef.current?.emit('messages:read', { conversationId, messageIds });
    }, []);

    // Join/leave conversation rooms
    const joinConversation = useCallback((conversationId: string) => {
        socketRef.current?.emit('conversation:join', { conversationId });
    }, []);

    const leaveConversation = useCallback((conversationId: string) => {
        socketRef.current?.emit('conversation:leave', { conversationId });
    }, []);

    // Event listeners with cleanup
    const onNewMessage = useCallback((callback: (message: Message) => void) => {
        socketRef.current?.on('message:new', callback);
        return () => {
            socketRef.current?.off('message:new', callback);
        };
    }, []);

    const onTypingStart = useCallback((callback: (event: TypingEvent) => void) => {
        socketRef.current?.on('typing:start', callback);
        return () => {
            socketRef.current?.off('typing:start', callback);
        };
    }, []);

    const onTypingStop = useCallback((callback: (event: TypingEvent) => void) => {
        socketRef.current?.on('typing:stop', callback);
        return () => {
            socketRef.current?.off('typing:stop', callback);
        };
    }, []);

    const onUserOnline = useCallback((callback: (data: { userId: string }) => void) => {
        socketRef.current?.on('user:online', callback);
        return () => {
            socketRef.current?.off('user:online', callback);
        };
    }, []);

    const onUserOffline = useCallback((callback: (data: { userId: string }) => void) => {
        socketRef.current?.on('user:offline', callback);
        return () => {
            socketRef.current?.off('user:offline', callback);
        };
    }, []);

    const onMessagesRead = useCallback(
        (callback: (data: { conversationId: string; readBy: string; messageIds: string[] }) => void) => {
            socketRef.current?.on('messages:read', callback);
            return () => {
                socketRef.current?.off('messages:read', callback);
            };
        },
        []
    );

    return {
        socket: socketRef.current,
        isConnected,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        joinConversation,
        leaveConversation,
        onNewMessage,
        onTypingStart,
        onTypingStop,
        onUserOnline,
        onUserOffline,
        onMessagesRead,
    };
}

export default useSocket;
