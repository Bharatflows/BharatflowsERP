
import prisma from '../config/prisma';
import { eventBus } from './eventBus';
import logger from '../config/logger';
import { workflowService } from './workflowService';

export interface ApprovalRequestInput {
    companyId: string;
    entityType: string;
    entityId: string;
    requestedById: string;
    amount?: number;
    approverRole?: string;
}

class ApprovalService {

    /**
     * Create an approval request for a transaction
     */
    async requestApproval(input: ApprovalRequestInput) {
        // Delegate to workflow engine
        const result = await workflowService.initiateApproval(
            input.companyId,
            input.entityType,
            input.entityId,
            input.requestedById,
            { amount: input.amount }
        );

        if (result?.status === 'AUTO_APPROVED') {
            logger.info(`[Approval] Auto-approved ${input.entityType}:${input.entityId}`);
            return { status: 'APPROVED', autoApproved: true };
        }

        if (!result || !result.requestId) {
            // Fallback if no workflow logic captured it but initiateApproval returned null/undefined (shouldn't happen with current logic but for safety)
            // If initiateApproval returns null, it means no workflow required.
            return { status: 'APPROVED', autoApproved: true };
        }

        // Notify admins/approvers (via Event Bus later)
        logger.info(`[Approval] Created request ${result.requestId} for ${input.entityType}:${input.entityId}`);

        return { status: 'PENDING', request: result };
    }

    /**
     * Approve a request
     * Triggers side effects via Event Bus
     */
    async approve(requestId: string, approverId: string, comments?: string) {
        // Delegate state transition to workflow engine
        const result = await workflowService.processApproval(requestId, 'APPROVED', approverId, comments);

        // Fetch request details for event emission
        // workflowService returns the updated request in result.request
        const request = result.request as any; // Cast to avoid strict type issues if interface generic

        if (result.status === 'APPROVED') {
            // Emit Approval Event
            await eventBus.emit({
                companyId: request.companyId,
                eventType: 'APPROVAL_GRANTED',
                aggregateType: request.entityType,
                aggregateId: request.entityId,
                payload: { requestId, entityId: request.entityId },
                metadata: { userId: approverId, source: 'approvalService' }
            });
            logger.info(`[Approval] Request ${requestId} fully approved`);
        } else if (result.status === 'PENDING_NEXT_STEP') {
            logger.info(`[Approval] Request ${requestId} advanced to step ${result.nextStep}`);
            // Could emit APPROVAL_STEP_COMPLETED if needed
        }

        return result;
    }

    /**
     * Reject a request
     */
    async reject(requestId: string, rejectorId: string, reason: string) {
        // Delegate state transition
        const result = await workflowService.processApproval(requestId, 'REJECTED', rejectorId, reason);
        const request = result.request as any;

        // Emit Rejection Event
        await eventBus.emit({
            companyId: request.companyId,
            eventType: 'APPROVAL_REJECTED',
            aggregateType: request.entityType,
            aggregateId: request.entityId,
            payload: { requestId, entityId: request.entityId, reason },
            metadata: { userId: rejectorId, source: 'approvalService' }
        });

        logger.info(`[Approval] Request ${requestId} rejected`);

        return result;
    }

    /**
     * Get pending approvals for user's company
     */
    async getPendingApprovals(companyId: string) {
        return workflowService.getPendingRequests('user-id-placeholder', companyId);
    }
}

export const approvalService = new ApprovalService();
