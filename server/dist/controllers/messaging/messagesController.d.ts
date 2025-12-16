/**
 * Messages Controller
 * Handles message CRUD, read receipts, and attachments
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getMessages: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const editMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markAsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMessagingSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getMessages: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    sendMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    editMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    markAsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getMessagingSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
//# sourceMappingURL=messagesController.d.ts.map