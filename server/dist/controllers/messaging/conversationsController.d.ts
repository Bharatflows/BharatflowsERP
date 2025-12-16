/**
 * Conversations Controller
 * Handles CRUD operations for chat conversations (direct & group)
 */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getConversations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addParticipants: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const leaveConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeParticipant: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const inviteParty: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getConversations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    createConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    addParticipants: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    leaveConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    removeParticipant: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    inviteParty: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
//# sourceMappingURL=conversationsController.d.ts.map