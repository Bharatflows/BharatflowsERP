
import { eventBus, EventTypes } from '../services/eventBus';
import prisma from '../config/prisma';
import logger from '../config/logger';

/**
 * Approval Subscriber
 * 
 * Listens for approval events and updates the status of the related entities.
 */

const handleApprovalGranted = async (event: any) => {
    const { companyId, aggregateType, aggregateId } = event;
    logger.info(`[ApprovalSubscriber] Processing APPROVAL_GRANTED for ${aggregateType}:${aggregateId}`);

    try {
        if (aggregateType === 'PurchaseOrder') {
            await prisma.purchaseOrder.update({
                where: { id: aggregateId },
                data: { status: 'APPROVED' } // Or 'SENT'? Let's stick to APPROVED for now as the intermediate state.
            });
            logger.info(`[ApprovalSubscriber] Updated PurchaseOrder ${aggregateId} to APPROVED`);
        }
        else if (aggregateType === 'Invoice') {
            await prisma.invoice.update({
                where: { id: aggregateId },
                data: { status: 'APPROVED' }
            });
            logger.info(`[ApprovalSubscriber] Updated Invoice ${aggregateId} to APPROVED`);
        }
    } catch (error) {
        logger.error(`[ApprovalSubscriber] Error handling APPROVAL_GRANTED:`, error);
    }
};

const handleApprovalRejected = async (event: any) => {
    const { aggregateType, aggregateId } = event;
    logger.info(`[ApprovalSubscriber] Processing APPROVAL_REJECTED for ${aggregateType}:${aggregateId}`);

    try {
        if (aggregateType === 'PurchaseOrder') {
            await prisma.purchaseOrder.update({
                where: { id: aggregateId },
                data: { status: 'REJECTED' }
            });
            logger.info(`[ApprovalSubscriber] Updated PurchaseOrder ${aggregateId} to REJECTED`);
        }
        else if (aggregateType === 'Invoice') {
            await prisma.invoice.update({
                where: { id: aggregateId },
                data: { status: 'REJECTED' }
            });
            logger.info(`[ApprovalSubscriber] Updated Invoice ${aggregateId} to REJECTED`);
        }
    } catch (error) {
        logger.error(`[ApprovalSubscriber] Error handling APPROVAL_REJECTED:`, error);
    }
};

// Register subscriptions
export const initApprovalSubscriber = () => {
    eventBus.subscribe(EventTypes.APPROVAL_GRANTED, handleApprovalGranted);
    eventBus.subscribe(EventTypes.APPROVAL_REJECTED, handleApprovalRejected);
    logger.info('✅ Approval Subscriber initialized');
};
