import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from './auth';
import logger from '../config/logger';

/**
 * Ensure Ownership Middleware
 * 
 * Verifies that a referenced entity belongs to the user's company.
 * Use for cross-tenant security checks on mutations that reference other entities.
 * 
 * Usage:
 *   router.post('/orders', ensureOwnership('Party', 'customerId'), controller.create)
 * 
 * The middleware reads the field from req.body and checks if the entity exists AND
 * belongs to the user's companyId. Returns 403 if not owned.
 */
export const ensureOwnership = (
    model: 'Party' | 'Product' | 'Ledger' | 'SalesOrder' | 'Invoice',
    fieldName: string
) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const entityId = req.body[fieldName];
        const companyId = req.user?.companyId;

        if (!entityId) {
            // Field is optional or not provided, skip check
            return next();
        }

        if (!companyId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - company context missing',
            });
        }

        try {
            let entity: { companyId: string } | null = null;

            // Type-safe model lookup
            switch (model) {
                case 'Party':
                    entity = await prisma.party.findUnique({
                        where: { id: entityId },
                        select: { companyId: true },
                    });
                    break;
                case 'Product':
                    entity = await prisma.product.findUnique({
                        where: { id: entityId },
                        select: { companyId: true },
                    });
                    break;
                case 'Ledger':
                    entity = await prisma.ledger.findUnique({
                        where: { id: entityId },
                        select: { companyId: true },
                    });
                    break;
                case 'SalesOrder':
                    entity = await prisma.salesOrder.findUnique({
                        where: { id: entityId },
                        select: { companyId: true },
                    });
                    break;
                case 'Invoice':
                    entity = await prisma.invoice.findUnique({
                        where: { id: entityId },
                        select: { companyId: true },
                    });
                    break;
            }

            if (!entity) {
                return res.status(404).json({
                    success: false,
                    message: `${model} not found`,
                });
            }

            if (entity.companyId !== companyId) {
                logger.warn(`Cross-tenant access attempt: User ${req.user?.id} tried to access ${model} ${entityId} belonging to company ${entity.companyId}`);
                return res.status(403).json({
                    success: false,
                    message: `Access denied - ${model.toLowerCase()} does not belong to your company`,
                });
            }

            next();
        } catch (error) {
            logger.error(`Error in ensureOwnership middleware:`, error);
            return res.status(500).json({
                success: false,
                message: 'Internal error during ownership verification',
            });
        }
    };
};

export default ensureOwnership;
