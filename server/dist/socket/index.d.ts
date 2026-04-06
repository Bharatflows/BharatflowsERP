/**
 * Socket.IO Server Setup
 * Real-time WebSocket server for messaging
 */
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
/**
 * Initialize Socket.IO server
 */
export declare function initializeSocket(httpServer: HttpServer): SocketIOServer;
/**
 * Get online status for users
 */
export declare function isUserOnline(userId: string): boolean;
/**
 * Get all online users in a company
 */
export declare function getOnlineUsersInCompany(userIds: string[]): string[];
export declare function setIOInstance(io: SocketIOServer): void;
export declare function sendNotificationToUser(userId: string, notification: any): void;
declare const _default: {
    initializeSocket: typeof initializeSocket;
    isUserOnline: typeof isUserOnline;
    getOnlineUsersInCompany: typeof getOnlineUsersInCompany;
    sendNotificationToUser: typeof sendNotificationToUser;
};
export default _default;
//# sourceMappingURL=index.d.ts.map