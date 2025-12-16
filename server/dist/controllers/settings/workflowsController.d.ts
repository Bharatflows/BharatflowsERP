import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
export declare const getWorkflows: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWorkflow: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createWorkflow: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateWorkflow: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleWorkflow: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteWorkflow: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWorkflowForDocument: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=workflowsController.d.ts.map