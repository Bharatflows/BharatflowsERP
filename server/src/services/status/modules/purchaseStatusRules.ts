import { StatusRuleSet, ValidationResult, TransitionContext } from '../types';

export const purchaseStatusRules: StatusRuleSet = {

    deriveStatus(entity: any): string {
        if (!entity) return 'UNKNOWN';

        const currentStatus = entity.status;

        // Terminal: CANCELLED
        if (currentStatus === 'CANCELLED') return 'CANCELLED';

        const total = Number(entity.totalAmount || 0);
        const paid = Number(entity.amountPaid || 0);
        const balance = Number(entity.balanceAmount || 0);

        // PAID fully
        if (balance <= 0.1 && total > 0) return 'PAID';

        // Overdue
        if (entity.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(entity.dueDate);
            if (today > due && balance > 0) return 'OVERDUE';
        }

        // Partial
        if (paid > 0 && paid < total) return 'PARTIAL';

        // Open (bill finalized)
        if (currentStatus === 'OPEN' || currentStatus === 'DRAFT') {
            return currentStatus;
        }

        return 'OPEN';
    },

    validateTransition(entity: any, targetStatus: string): ValidationResult {
        const current = entity.status;

        // CANCELLED is terminal
        if (current === 'CANCELLED') {
            return { allowed: false, reason: 'Purchase Bill is CANCELLED and cannot be modified.' };
        }

        // PAID is locked
        if (current === 'PAID') {
            if (targetStatus === 'PAID') return { allowed: true };
            return { allowed: false, reason: 'Purchase Bill is PAID. Use Debit Note to reverse.' };
        }

        // CANCEL rules
        if (targetStatus === 'CANCELLED') {
            if (Number(entity.amountPaid) > 0) {
                return { allowed: false, reason: 'Cannot cancel Bill with recorded payments. Delete payments first.' };
            }
        }

        return { allowed: true };
    },

    async onTransition(entity: any, newStatus: string, ctx: TransitionContext): Promise<void> {
        // Reserved for side effects (e.g., reverse stock on CANCEL)
    },

    isLocked(entity: any): boolean {
        return ['PAID', 'CANCELLED', 'PARTIAL'].includes(entity.status);
    }
};
