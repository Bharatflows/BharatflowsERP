import { StatusRuleSet, ValidationResult, TransitionContext } from '../types';

/**
 * PDC Status Rules
 * PENDING -> DEPOSITED -> CLEARED or BOUNCED
 */
export const bankingStatusRules: StatusRuleSet = {

    deriveStatus(entity: any): string {
        // PDC status is mostly user-driven, but we can validate
        return entity.status || 'PENDING';
    },

    validateTransition(entity: any, targetStatus: string): ValidationResult {
        const current = entity.status;

        // Valid transitions:
        // PENDING -> DEPOSITED
        // DEPOSITED -> CLEARED | BOUNCED
        // CLEARED and BOUNCED are terminal

        if (current === 'CLEARED' || current === 'BOUNCED') {
            return { allowed: false, reason: `PDC is ${current}. This is a terminal state.` };
        }

        if (current === 'PENDING' && targetStatus !== 'DEPOSITED' && targetStatus !== 'PENDING') {
            return { allowed: false, reason: 'PENDING PDC can only transition to DEPOSITED.' };
        }

        if (current === 'DEPOSITED') {
            if (targetStatus !== 'CLEARED' && targetStatus !== 'BOUNCED') {
                return { allowed: false, reason: 'DEPOSITED PDC can only transition to CLEARED or BOUNCED.' };
            }
        }

        return { allowed: true };
    },

    async onTransition(entity: any, newStatus: string, ctx: TransitionContext): Promise<void> {
        // Side effects handled in pdcController already (CLEARED: bank update, BOUNCED: reverse)
    },

    isLocked(entity: any): boolean {
        return ['CLEARED', 'BOUNCED'].includes(entity.status);
    }
};
