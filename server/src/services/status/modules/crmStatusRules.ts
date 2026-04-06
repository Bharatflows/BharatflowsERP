import { StatusRuleSet, ValidationResult, TransitionContext } from '../types';

/**
 * CRM Lead Status Rules
 * NEW -> CONTACTED -> QUALIFIED -> PROPOSAL -> NEGOTIATION -> WON | LOST
 */
export const crmStatusRules: StatusRuleSet = {

    deriveStatus(entity: any): string {
        // Lead status is primarily user-driven
        return entity.status || 'NEW';
    },

    validateTransition(entity: any, targetStatus: string): ValidationResult {
        const current = entity.status;

        // Terminal states
        if (current === 'WON' || current === 'LOST') {
            return { allowed: false, reason: `Lead is ${current}. Terminal state cannot be changed.` };
        }

        // Valid progression (flexible - allows skipping stages in typical sales)
        const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
        if (!validStatuses.includes(targetStatus)) {
            return { allowed: false, reason: `Invalid status: ${targetStatus}` };
        }

        // WON requires at least QUALIFIED 
        if (targetStatus === 'WON' && !['QUALIFIED', 'PROPOSAL', 'NEGOTIATION'].includes(current)) {
            return { allowed: false, reason: 'Lead must be at least QUALIFIED before marking as WON.' };
        }

        return { allowed: true };
    },

    async onTransition(entity: any, newStatus: string, ctx: TransitionContext): Promise<void> {
        // Side effect: WON -> Create Party (handled in controller or event handler)
    },

    isLocked(entity: any): boolean {
        return ['WON', 'LOST'].includes(entity.status);
    }
};
