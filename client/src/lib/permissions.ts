import { User, Company } from '../types';

export enum Plan {
    FREE = 'FREE',
    BASIC = 'BASIC',
    PRO = 'PRO',
    ENTERPRISE = 'ENTERPRISE',
}

export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    ACCOUNTANT = 'ACCOUNTANT',
    USER = 'USER',
    SALES = 'SALES',
    INVENTORY = 'INVENTORY',
}

// Feature flags
export const FEATURES = {
    // Core Modules
    SALES: 'sales',
    PURCHASE: 'purchase',
    INVENTORY: 'inventory',
    BANKING: 'banking',
    EXPENSES: 'expenses',
    HR: 'hr',
    REPORTS: 'reports',

    // Specific Features
    ESTIMATES: 'estimates',
    SALES_ORDERS: 'sales_orders',
    DELIVERY_CHALLANS: 'delivery_challans',
    GST_REPORTS: 'gst_reports',
    PAYROLL: 'payroll',
    MULTI_USER: 'multi_user',
};

// Plan capabilities
const PLAN_FEATURES: Record<Plan, string[]> = {
    [Plan.FREE]: [
        FEATURES.SALES,
        FEATURES.EXPENSES,
        FEATURES.BANKING,
        FEATURES.REPORTS, // Basic reports
    ],
    [Plan.BASIC]: [
        FEATURES.SALES,
        FEATURES.PURCHASE,
        FEATURES.EXPENSES,
        FEATURES.BANKING,
        FEATURES.REPORTS,
        FEATURES.ESTIMATES,
        FEATURES.GST_REPORTS,
    ],
    [Plan.PRO]: [
        FEATURES.SALES,
        FEATURES.PURCHASE,
        FEATURES.INVENTORY,
        FEATURES.EXPENSES,
        FEATURES.BANKING,
        FEATURES.HR,
        FEATURES.REPORTS,
        FEATURES.ESTIMATES,
        FEATURES.SALES_ORDERS,
        FEATURES.DELIVERY_CHALLANS,
        FEATURES.GST_REPORTS,
        FEATURES.MULTI_USER,
    ],
    [Plan.ENTERPRISE]: Object.values(FEATURES),
};

// Role permissions (which modules can they access?)
const ROLE_PERMISSIONS: Record<Role, string[]> = {
    [Role.ADMIN]: Object.values(FEATURES),
    [Role.MANAGER]: Object.values(FEATURES),
    [Role.ACCOUNTANT]: [
        FEATURES.SALES,
        FEATURES.PURCHASE,
        FEATURES.EXPENSES,
        FEATURES.BANKING,
        FEATURES.REPORTS,
        FEATURES.GST_REPORTS,
    ],
    [Role.SALES]: [
        FEATURES.SALES,
        FEATURES.ESTIMATES,
        FEATURES.SALES_ORDERS,
        FEATURES.DELIVERY_CHALLANS,
    ],
    [Role.INVENTORY]: [
        FEATURES.INVENTORY,
        FEATURES.PURCHASE,
        FEATURES.DELIVERY_CHALLANS,
    ],
    [Role.USER]: [
        FEATURES.SALES, // Basic access
    ],
};

export function hasPermission(user: User, feature: string): boolean {
    // For development/demo, allow everything
    return true;

    if (!user || !user.company) return false;

    // 1. Check Plan Limits
    // Default to FREE if plan is missing (shouldn't happen with correct DB defaults)
    const plan = (user.company.plan as Plan) || Plan.FREE;
    const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES[Plan.FREE];

    if (!planFeatures.includes(feature)) {
        return false;
    }

    // 2. Check Role Permissions
    // Default to USER if role is missing
    const role = (user.role as Role) || Role.USER;
    const rolePermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[Role.USER];

    return rolePermissions.includes(feature);
}

export function isFeatureEnabled(plan: Plan, feature: string): boolean {
    const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES[Plan.FREE];
    return planFeatures.includes(feature);
}
