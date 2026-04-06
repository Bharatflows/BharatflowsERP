import { StatusRuleSet, ValidationResult, TransitionContext } from '../types';

export const salesStatusRules: StatusRuleSet = {

    deriveStatus(entity: any): string {
        // Safe check
        if (!entity) return 'UNKNOWN';

        const currentStatus = entity.status;

        // 1. Terminal States check
        if (currentStatus === 'CANCELLED') return 'CANCELLED';

        // 2. Payment Logic
        const total = Number(entity.totalAmount || 0);
        const paid = Number(entity.amountPaid || 0);
        const balance = Number(entity.balanceAmount || 0);

        // PAID fully
        if (balance <= 0.1 && total > 0) return 'PAID'; // 0.1 tolerance for float

        // 3. Overdue Logic (Highest Priority for unpaid/partial)
        if (entity.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(entity.dueDate);
            // If strictly past due date
            if (today > due && balance > 0) {
                return 'OVERDUE';
            }
        }

        // 4. Partial
        if (paid > 0 && paid < total) return 'PARTIAL';

        // 5. Base Statuses
        if (currentStatus === 'SENT' || currentStatus === 'DRAFT') {
            return currentStatus;
        }

        return 'DRAFT';
    },

    validateTransition(entity: any, targetStatus: string): ValidationResult {
        const current = entity.status;

        // 1. Lock: CANCELLED
        if (current === 'CANCELLED') {
            return { allowed: false, reason: 'Invoice is CANCELLED and cannot be modified.' };
        }

        // 2. Lock: PAID
        // Only allow if transitioning to force update? Usually PAID is locked.
        if (current === 'PAID') {
            // System might re-evaluate to PAID (idempotent)
            if (targetStatus === 'PAID') return { allowed: true };
            return { allowed: false, reason: 'Invoice is PAID. Use Credit Note to reverse.' };
        }

        // 3. Prevent Manual "OVERDUE" setting if logic doesn't support it? 
        // We assume this validator checks flow validity.

        // 4. CANCEL rules
        if (targetStatus === 'CANCELLED') {
            if (Number(entity.amountPaid) > 0) {
                return { allowed: false, reason: 'Cannot cancel Invoice with recorded payments. Delete receipts first.' };
            }
        }

        return { allowed: true };
    },

    async onTransition(entity: any, newStatus: string, ctx: TransitionContext): Promise<void> {
        // Reserved for future side-effects (e.g. Email notification on SENT)
        // Stock restoration on CANCEL handled by StatusEngine/SideEffects explicitly if possible, 
        // or here if we had the TX context.
    },

    isLocked(entity: any): boolean {
        return ['PAID', 'CANCELLED', 'PARTIAL'].includes(entity.status);
    }
};
