import { Request, Response, NextFunction } from 'express';
export declare const validate: (req: Request, res: Response, next: NextFunction) => void | Response;
export declare const registerValidation: (((req: Request, res: Response, next: NextFunction) => void | Response) | import("express-validator").ValidationChain)[];
export declare const loginValidation: (((req: Request, res: Response, next: NextFunction) => void | Response) | import("express-validator").ValidationChain)[];
export declare const invoiceValidation: (((req: Request, res: Response, next: NextFunction) => void | Response) | import("express-validator").ValidationChain)[];
export declare const productValidation: (((req: Request, res: Response, next: NextFunction) => void | Response) | import("express-validator").ValidationChain)[];
export declare const partyValidation: (((req: Request, res: Response, next: NextFunction) => void | Response) | import("express-validator").ValidationChain)[];
export declare const expenseValidation: (((req: Request, res: Response, next: NextFunction) => void | Response) | import("express-validator").ValidationChain)[];
export declare const employeeValidation: (((req: Request, res: Response, next: NextFunction) => void | Response) | import("express-validator").ValidationChain)[];
export declare const gstinValidation: (gstin: string) => boolean;
export declare const panValidation: (pan: string) => boolean;
export declare const phoneValidation: (phone: string) => boolean;
//# sourceMappingURL=validator.d.ts.map