/**
 * Role Permissions Matrix Tests (C3) - UNIT
 * 
 * Verifies that getUserPermissions correctly resolves permissions based on User Role or Custom Role.
 * Uses mocked Prisma client.
 * 
 * Run with: npx jest rolePermissions.test.ts
 */

import { prismaMock } from '../../utils/prismaMock';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getUserPermissions } from '../../../middleware/customRoleMiddleware';
import { Role } from '@prisma/client';

// Mock specific ROLES constants if needed, but they are just strings usually.
// If ROLLE is an enum in @prisma/client, we import it.

describe('Role Permissions Matrix Tests (C3)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Helper to mock user find
    const mockUserFound = (role: string, customRoleId: string | null = null) => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-123',
            role: role as Role,
            customRoleId: customRoleId,
            // Add other required fields if strictly typed, though usually partial is ok for mockResolvedValue if typed as any or specific
        } as any);
    };

    // Helper to mock custom role find
    const mockCustomRoleFound = (isActive: boolean, permissions: any) => {
        prismaMock.customRole.findUnique.mockResolvedValue({
            id: 'role-123',
            isActive,
            permissions
        } as any);
    };

    describe('Permission Matrix Validation', () => {
        it('OWNER should have full permissions on all modules', async () => {
            mockUserFound('OWNER');

            const permissions = await getUserPermissions('user-123');

            expect(permissions).not.toBeNull();
            expect(permissions?.sales?.read).toBe(true);
            expect(permissions?.sales?.delete).toBe(true);
            expect(permissions?.settings?.update).toBe(true);
        });

        it('ADMIN should have full permissions on all modules', async () => {
            mockUserFound('ADMIN');

            const permissions = await getUserPermissions('user-123');

            expect(permissions).not.toBeNull();
            expect(permissions?.sales?.delete).toBe(true);
            expect(permissions?.accounting?.approve).toBe(true);
        });

        it('MANAGER should have limited permissions (no delete)', async () => {
            mockUserFound('MANAGER');

            const permissions = await getUserPermissions('user-123');

            expect(permissions).not.toBeNull();
            expect(permissions?.sales?.create).toBe(true);
            expect(permissions?.sales?.delete).toBe(false); // Can't delete
        });

        it('ACCOUNTANT should have accounting focus', async () => {
            mockUserFound('ACCOUNTANT');

            const permissions = await getUserPermissions('user-123');

            expect(permissions).not.toBeNull();
            expect(permissions?.accounting?.create).toBe(true);
            expect(permissions?.sales?.create).toBe(false); // Can't create sales
        });

        it('STAFF should have basic ops permissions', async () => {
            mockUserFound('STAFF');

            const permissions = await getUserPermissions('user-123');

            expect(permissions).not.toBeNull();
            expect(permissions?.sales?.create).toBe(true);
            expect(permissions?.settings?.read).toBe(false);
        });

        it('AUDITOR should have read-only permissions', async () => {
            mockUserFound('AUDITOR');

            const permissions = await getUserPermissions('user-123');

            expect(permissions).not.toBeNull();
            expect(permissions?.sales?.read).toBe(true);
            expect(permissions?.sales?.create).toBeFalsy();
            expect(permissions?.sales?.export).toBe(true);
        });
    });

    describe('Custom Role Override', () => {
        it('should respect custom role permissions over default role', async () => {
            // Setup: User has custom role
            mockUserFound('STAFF', 'role-123');

            // Setup: Custom role exists and is active
            mockCustomRoleFound(true, {
                sales: { read: true, create: true, update: false, delete: false },
                purchase: { read: false, create: false }
            });

            const permissions = await getUserPermissions('user-123');

            // Should use custom role permissions
            expect(permissions?.sales?.read).toBe(true);
            expect(permissions?.sales?.update).toBe(false); // Default STAFF has update=true, but Custom Role has false
            expect(permissions?.purchase?.read).toBe(false);

            // Verify mock calls
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-123' }, select: expect.any(Object) });
            expect(prismaMock.customRole.findUnique).toHaveBeenCalledWith({ where: { id: 'role-123' } });
        });

        it('should fallback to default role if custom role is inactive', async () => {
            mockUserFound('STAFF', 'role-123');

            // Inactive custom role
            mockCustomRoleFound(false, { sales: { read: true } });

            const permissions = await getUserPermissions('user-123');

            // Should fallback to Default STAFF permissions
            // STAFF default: sales.update = true
            expect(permissions?.sales?.update).toBe(true);
        });

        it('should fallback to default role if custom role not found', async () => {
            mockUserFound('STAFF', 'role-123');
            prismaMock.customRole.findUnique.mockResolvedValue(null);

            const permissions = await getUserPermissions('user-123');

            expect(permissions?.sales?.update).toBe(true);
        });
    });
});

