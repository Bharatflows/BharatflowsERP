import { StatusRuleSet, ValidationResult, TransitionContext } from '../types';

/**
 * HR Status Rules
 * Covers: Leave (PENDING -> APPROVED | REJECTED)
 *         Payroll (GENERATED -> PAID)
 */
export const hrStatusRules: StatusRuleSet = {

    deriveStatus(entity: any): string {
        // HR statuses are mostly user-driven workflows
        return entity.status || 'PENDING';
    },

    validateTransition(entity: any, targetStatus: string): ValidationResult {
        const current = entity.status;
        const entityType = entity._entityType; // Caller should set this

        // Leave transitions
        if (entityType === 'LEAVE') {
            if (current === 'APPROVED' || current === 'REJECTED') {
                return { allowed: false, reason: `Leave request is already ${current}.` };
            }
            if (!['PENDING', 'APPROVED', 'REJECTED'].includes(targetStatus)) {
                return { allowed: false, reason: `Invalid leave status: ${targetStatus}` };
            }
        }

        // Payroll transitions
        if (entityType === 'PAYROLL') {
            if (current === 'PAID') {
                return { allowed: false, reason: 'Payroll is already PAID. Cannot modify.' };
            }
            if (targetStatus === 'PAID' && current !== 'GENERATED') {
                return { allowed: false, reason: 'Only GENERATED payroll can be marked PAID.' };
            }
        }

        return { allowed: true };
    },

    async onTransition(entity: any, newStatus: string, ctx: TransitionContext): Promise<void> {
        // Side effects: APPROVED leave -> Update leave balance, etc.
    },

    isLocked(entity: any): boolean {
        const entityType = entity._entityType;
        if (entityType === 'LEAVE') {
            return ['APPROVED', 'REJECTED'].includes(entity.status);
        }
        if (entityType === 'PAYROLL') {
            return entity.status === 'PAID';
        }
        return false;
    }
};
