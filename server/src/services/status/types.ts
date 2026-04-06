export type ModuleType =
    | 'SALES'
    | 'PURCHASE'
    | 'CRM'
    | 'HR'
    | 'PRODUCTION'
    | 'BANKING';

export interface ValidationResult {
    allowed: boolean;
    reason?: string;
}

export interface TransitionContext {
    companyId: string;
    userId: string;
    role?: string;
    ip?: string;
    userAgent?: string;
    reason?: string;
}

export interface TransitionResult {
    success: boolean;
    newStatus: string;
    message?: string;
    entity?: any;
}

export interface StatusRuleSet {
    deriveStatus(entity: any): string;
    validateTransition(entity: any, targetStatus: string): ValidationResult;
    onTransition?(entity: any, newStatus: string, ctx: TransitionContext): Promise<void>;
    isLocked(entity: any): boolean;
}
