import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
};

declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}

