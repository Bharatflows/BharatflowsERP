import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../config/logger';

/**
 * Zod Validation Middleware
 * 
 * Usage:
 *   router.post('/orders', validate(createSalesOrderSchema), controller.create)
 * 
 * Returns 400 Bad Request with field-level errors if validation fails.
 */
export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Parse and replace req.body with validated data
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const fieldErrors = error.issues.map((issue) => ({
                    field: issue.path.map(String).join('.'),
                    message: issue.message,
                    code: issue.code,
                }));

                logger.warn('Validation failed:', { errors: fieldErrors });

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: fieldErrors,
                });
            }

            // Unexpected error - rethrow
            logger.error('Unexpected validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal validation error',
            });
        }
    };
};

export default validate;
