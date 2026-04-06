import { ModuleType, StatusRuleSet, ValidationResult, TransitionContext, TransitionResult } from './types';
import { salesStatusRules } from './modules/salesStatusRules';
import { purchaseStatusRules } from './modules/purchaseStatusRules';
import { bankingStatusRules } from './modules/bankingStatusRules';
import { crmStatusRules } from './modules/crmStatusRules';
import { hrStatusRules } from './modules/hrStatusRules';
import { productionStatusRules } from './modules/productionStatusRules';
import prisma from '../../config/prisma';
import { AuditService } from '../auditService';
import eventBus from '../eventBus';

export class StatusEngine {

    private rules: Record<ModuleType, StatusRuleSet>;

    constructor() {
        // We will register rules here. 
        // Note: salesStatusRules must be imported. 
        // Since we haven't created it yet, I'll temporarily use 'any' or empty.
        // But for the file write, I will write the code assuming it exists.
        this.rules = {
            'SALES': salesStatusRules,
            'PURCHASE': purchaseStatusRules,
            'CRM': crmStatusRules,
            'HR': hrStatusRules,
            'PRODUCTION': productionStatusRules,
            'BANKING': bankingStatusRules
        };
    }

    /**
     * Derive the correct status based on entity state.
     * Use this when reading an entity or before validating a transition.
     */
    deriveStatus(module: ModuleType, entity: any): string {
        const ruleSet = this.rules[module];
        if (!ruleSet || !ruleSet.deriveStatus) {
            // Default or fallback
            return entity.status || 'UNKNOWN';
        }
        return ruleSet.deriveStatus(entity);
    }

    /**
     * Validate if a transition is allowed.
     */
    validateTransition(module: ModuleType, entity: any, targetStatus: string): ValidationResult {
        const ruleSet = this.rules[module];
        if (!ruleSet || !ruleSet.validateTransition) {
            return { allowed: true }; // Default allow if no rules
        }
        return ruleSet.validateTransition(entity, targetStatus);
    }

    /**
     * Check if entity is locked for editing.
     */
    isLocked(module: ModuleType, entity: any): boolean {
        const ruleSet = this.rules[module];
        if (!ruleSet || !ruleSet.isLocked) return false;
        return ruleSet.isLocked(entity);
    }

    /**
     * Apply a status transition.
     * This orchestrates validation, side effects, DB update, and audit log.
     */
    async applyTransition(
        module: ModuleType,
        entityType: string, // 'INVOICE', 'LEAD'
        entityId: string,
        targetStatus: string,
        ctx: TransitionContext
    ): Promise<TransitionResult> {

        const { companyId, userId } = ctx;

        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Fetch Entity (Generic - might rely on passed entity or fetch here. 
                // We'll assume the caller passes an entity or we need a way to fetch generic.
                // For MVP, StatusEngine might not fetch. Caller should pass latest entity or we fetch by type.)

                // Optimized: We delegate fetch to the specific rule logic if needed, 
                // or we assume standard Prisma model names match entityType (mostly).

                // Let's rely on ruleSet for strictly logic, but we need the DB object.
                // Doing dynamic query: `prisma[model].findUnique`

                // Helper to get model name from entityType (INVOICE -> invoice)
                const modelName = entityType.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase()); // camelCase

                // @ts-ignore
                const entity = await tx[modelName].findUnique({ where: { id: entityId } });

                if (!entity) throw new Error(`${entityType} not found`);

                // 2. Validate
                const validation = this.validateTransition(module, entity, targetStatus);
                if (!validation.allowed) {
                    throw new Error(validation.reason || 'Transition not allowed');
                }

                const oldStatus = entity.status;

                // 3. Update Status
                // @ts-ignore
                const updatedEntity = await tx[modelName].update({
                    where: { id: entityId },
                    data: { status: targetStatus }
                });

                // 4. Run Side Effects (passed in existing transaction `tx`)
                // We need to extend the interface to accept tx. 
                // For now, simpler implementation:
                const ruleSet = this.rules[module];
                if (ruleSet?.onTransition) {
                    // Execute side effects (e.g., stock adjustments, notifications)
                    await ruleSet.onTransition(updatedEntity, targetStatus, ctx);
                }

                // 5. Audit Log (New Model)
                await tx.statusTransitionLog.create({
                    data: {
                        companyId,
                        entityType,
                        entityId,
                        oldStatus,
                        newStatus: targetStatus,
                        triggeredBy: 'USER', // or from ctx
                        userId,
                        reason: ctx.reason,
                    }
                });

                return { success: true, newStatus: targetStatus, entity: updatedEntity };
            });

        } catch (error: any) {
            return {
                success: false,
                newStatus: '',
                message: error.message
            };
        }
    }
}

export const statusEngine = new StatusEngine();
