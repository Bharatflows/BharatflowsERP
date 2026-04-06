export const ROLES = {
    STAFF: 'STAFF',
    USER: 'USER',
    ACCOUNTANT: 'ACCOUNTANT',
    MANAGER: 'MANAGER',
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
    AUDITOR: 'AUDITOR',
} as const;

export type Role = keyof typeof ROLES;

// Role Hierarchy Mapping
export const ROLE_HIERARCHY: Record<Role, number> = {
    [ROLES.STAFF]: 1,
    [ROLES.USER]: 1,
    [ROLES.ACCOUNTANT]: 2,
    [ROLES.MANAGER]: 3,
    [ROLES.ADMIN]: 4,
    [ROLES.OWNER]: 5,
    [ROLES.AUDITOR]: 0,
};
