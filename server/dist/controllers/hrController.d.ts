import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getEmployees: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getEmployee: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createEmployee: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateEmployee: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteEmployee: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markAttendance: (req: AuthRequest, res: Response) => Promise<void>;
export declare const applyLeave: (req: AuthRequest, res: Response) => Promise<void>;
export declare const generatePayroll: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDashboardStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAttendance: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDailyAttendance: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getLeaves: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateLeaveStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPayrollRuns: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=hrController.d.ts.map