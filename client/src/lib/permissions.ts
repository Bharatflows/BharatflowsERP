import { User, Company } from '../types';
import { ROLES, Role } from '../constants/roles';
import { PLANS, Plan } from '../constants/plans';


// Feature flags
export const FEATURES = {
    // Core Modules
    DASHBOARD: 'dashboard',
    SALES: 'sales',
    PURCHASE: 'purchase',
    INVENTORY: 'inventory',
    PARTIES: 'parties',
    BANKING: 'banking',
    EXPENSES: 'expenses',
    ACCOUNTING: 'accounting',
    GST: 'gst',
    HR: 'hr',
    CRM: 'crm',
    PRODUCTION: 'production',
    REPORTS: 'reports',
    SETTINGS: 'settings',

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
    [PLANS.FREE]: [
        FEATURES.DASHBOARD,
        FEATURES.SALES,
        FEATURES.PURCHASE,
        FEATURES.INVENTORY,
        FEATURES.PARTIES,
        FEATURES.EXPENSES,
        FEATURES.BANKING,
        FEATURES.ACCOUNTING,
        FEATURES.GST,
        FEATURES.REPORTS,
        FEATURES.SETTINGS,
    ],
    [PLANS.BASIC]: [
        FEATURES.DASHBOARD,
        FEATURES.SALES,
        FEATURES.PURCHASE,
        FEATURES.INVENTORY,
        FEATURES.PARTIES,
        FEATURES.EXPENSES,
        FEATURES.BANKING,
        FEATURES.ACCOUNTING,
        FEATURES.GST,
        FEATURES.REPORTS,
        FEATURES.SETTINGS,
        FEATURES.ESTIMATES,
        FEATURES.GST_REPORTS,
    ],
    [PLANS.PRO]: Object.values(FEATURES),
    [PLANS.ENTERPRISE]: Object.values(FEATURES),
};

// Role permissions (which modules can they access?)
const ROLE_PERMISSIONS: Record<Role, string[]> = {
    [ROLES.OWNER]: Object.values(FEATURES), // Owner has full access
    [ROLES.ADMIN]: Object.values(FEATURES),
    [ROLES.MANAGER]: Object.values(FEATURES),
    [ROLES.STAFF]: [
        FEATURES.DASHBOARD,
        FEATURES.SALES,
        FEATURES.PURCHASE,
        FEATURES.INVENTORY,
        FEATURES.PARTIES,
        FEATURES.EXPENSES,
        FEATURES.REPORTS,
    ],
    [ROLES.ACCOUNTANT]: [
        FEATURES.DASHBOARD,
        FEATURES.SALES,
        FEATURES.PURCHASE,
        FEATURES.EXPENSES,
        FEATURES.BANKING,
        FEATURES.ACCOUNTING,
        FEATURES.GST,
        FEATURES.REPORTS,
        FEATURES.GST_REPORTS,
    ],
    [ROLES.AUDITOR]: [
        FEATURES.DASHBOARD,
        FEATURES.SALES,
        FEATURES.PURCHASE,
        FEATURES.EXPENSES,
        FEATURES.BANKING,
        FEATURES.ACCOUNTING,
        FEATURES.GST,
        FEATURES.REPORTS,
        FEATURES.GST_REPORTS,
    ],
    [ROLES.SALES]: [
        FEATURES.DASHBOARD,
        FEATURES.SALES,
        FEATURES.PARTIES,
        FEATURES.ESTIMATES,
        FEATURES.SALES_ORDERS,
        FEATURES.DELIVERY_CHALLANS,
    ],
    [ROLES.INVENTORY]: [
        FEATURES.DASHBOARD,
        FEATURES.INVENTORY,
        FEATURES.PURCHASE,
        FEATURES.DELIVERY_CHALLANS,
    ],
    [ROLES.USER]: [
        FEATURES.DASHBOARD,
        FEATURES.SALES,
    ],
};

export function hasPermission(user: User, feature: string): boolean {
    if (!user || !user.company) return false;

    // 0. Global Company Config Check (App Config)
    // If a module is disabled at company level, no one can access it (except Settings/Dashboard)
    if (user.company.enabledModules) {
        const enabledModules = user.company.enabledModules as Record<string, boolean>;
        // Always allow dashboard and settings regardless of config (Settings needed to re-enable!)
        if (feature !== 'dashboard' && feature !== 'settings' && enabledModules[feature] === false) {
            return false;
        }
    }

    // 1. Admin Bypass
    if (user.role === ROLES.ADMIN) return true;

    // 1. Custom Role Permissions (Strict Mode)
    if (user.permissions && Array.isArray(user.permissions)) {
        // Always allow dashboard
        if (feature === 'dashboard') return true;

        const perms: any[] = user.permissions;
        const modulePerm = perms.find(p => p.module.toLowerCase() === feature.toLowerCase());

        // If module is explicitly defined, follow its view permission
        if (modulePerm) {
            return !!modulePerm.view;
        }

        // If strict mode, deny access to undefined modules (unless handled below by fallback?)
        // The user requirement: "view only that module". So we return false here.
        return false;
    }

    // 2. Check Plan Limits (Fallback for standard roles)
    // Default to FREE if plan is missing (shouldn't happen with correct DB defaults)
    const plan = (user.company.plan as Plan) || PLANS.FREE;
    const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES[PLANS.FREE];

    if (!planFeatures.includes(feature)) {
        return false;
    }

    // 3. Check Role Permissions (Standard Roles)
    // Default to USER if role is missing
    const role = (user.role as Role) || ROLES.USER;
    const rolePermissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.USER];

    return rolePermissions.includes(feature);
}

export function isFeatureEnabled(plan: Plan, feature: string): boolean {
    const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES[PLANS.FREE];
    return planFeatures.includes(feature);
}
