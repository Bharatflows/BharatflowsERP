import { StatusRuleSet, ValidationResult, TransitionContext } from '../types';

/**
 * Production Status Rules
 * WorkOrder: DRAFT -> PENDING -> IN_PROGRESS -> COMPLETED | CANCELLED
 */
export const productionStatusRules: StatusRuleSet = {

    deriveStatus(entity: any): string {
        // Production status is mostly user-driven with some automation
        return entity.status || 'DRAFT';
    },

    validateTransition(entity: any, targetStatus: string): ValidationResult {
        const current = entity.status;

        // Terminal states
        if (current === 'COMPLETED' || current === 'CANCELLED') {
            return { allowed: false, reason: `Work Order is ${current}. Cannot modify.` };
        }

        // Valid transitions
        const transitions: Record<string, string[]> = {
            'DRAFT': ['PENDING', 'CANCELLED'],
            'PENDING': ['IN_PROGRESS', 'CANCELLED'],
            'IN_PROGRESS': ['COMPLETED', 'CANCELLED']
        };

        const allowed = transitions[current] || [];
        if (!allowed.includes(targetStatus)) {
            return { allowed: false, reason: `Cannot transition from ${current} to ${targetStatus}.` };
        }

        return { allowed: true };
    },

    async onTransition(entity: any, newStatus: string, ctx: TransitionContext): Promise<void> {
        // Side effects:
        // COMPLETED -> Consume raw materials, create FG stock
        // These should be handled via event handlers or dedicated service
    },

    isLocked(entity: any): boolean {
        return ['COMPLETED', 'CANCELLED'].includes(entity.status);
    }
};
