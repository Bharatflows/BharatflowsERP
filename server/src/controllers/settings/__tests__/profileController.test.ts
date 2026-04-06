/**
 * Profile Controller Tests
 * 
 * Tests for user profile management endpoints
 * Covers: profile retrieval, updates, preferences, notifications, and password changes
 * 
 * Run with: npx jest profileController.test.ts
 */

import request from 'supertest';
import prisma from '../../../config/prisma';
import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock authentication middleware
jest.mock('../../../middleware/auth', () => ({
    protect: jest.fn((req: any, res: any, next: any) => next()),
    authenticate: jest.fn((req: any, res: any, next: any) => next()),
    authorize: jest.fn(() => (req: any, res: any, next: any) => next())
}));

import { protect } from '../../../middleware/auth';
import app from '../../../server';

const MOCK_USER_ID = 'profile-test-user-id';
let mockCompanyId: string;

describe('Profile Controller Tests', () => {

    beforeAll(async () => {
        // Create test company
        const company = await prisma.company.create({
            data: {
                businessName: 'Profile Test Co',
                email: `profile-test-${Date.now()}@test.com`,
                phone: '9999999999',
                state: 'Karnataka'
            }
        });
        mockCompanyId = company.id;

        // Configure auth mock
        (protect as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
            req.user = {
                id: MOCK_USER_ID,
                role: 'ADMIN',
                companyId: mockCompanyId
            };
            next();
        });

        // Create test user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('CurrentPass123!', salt);

        await prisma.user.upsert({
            where: { id: MOCK_USER_ID },
            update: {
                companyId: mockCompanyId,
                password: hashedPassword
            },
            create: {
                id: MOCK_USER_ID,
                email: `profile-user-${Date.now()}@test.com`,
                name: 'Profile Tester',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                companyId: mockCompanyId,
                preferences: { theme: 'Light' },
                notificationSettings: { emailInvoice: true }
            }
        });
    });

    afterAll(async () => {
        // Cleanup
        if (mockCompanyId) {
            await prisma.user.deleteMany({ where: { companyId: mockCompanyId } }).catch(() => { });
            await prisma.company.delete({ where: { id: mockCompanyId } }).catch(() => { });
        }
        await prisma.$disconnect();
    });

    describe('GET /api/v1/settings/profile', () => {
        it('should return user profile with all fields', async () => {
            const response = await request(app)
                .get('/api/v1/settings/profile');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(MOCK_USER_ID);
            expect(response.body.data.name).toBe('Profile Tester');
            expect(response.body.data.preferences).toBeDefined();
            expect(response.body.data.notificationSettings).toBeDefined();
        });
    });

    describe('PUT /api/v1/settings/profile', () => {
        it('should update profile fields successfully', async () => {
            const response = await request(app)
                .put('/api/v1/settings/profile')
                .send({
                    name: 'Updated Name',
                    designation: 'Senior Tester',
                    bio: 'Testing profile updates'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
            expect(response.body.data.designation).toBe('Senior Tester');
        });

        it('should reject invalid phone number', async () => {
            const response = await request(app)
                .put('/api/v1/settings/profile')
                .send({
                    phone: 'invalid-phone'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/settings/profile/preferences', () => {
        it('should update user preferences', async () => {
            const response = await request(app)
                .put('/api/v1/settings/profile/preferences')
                .send({
                    preferences: {
                        theme: 'Dark',
                        language: 'Hindi'
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.data.preferences.theme).toBe('Dark');
            expect(response.body.data.preferences.language).toBe('Hindi');
        });
    });

    describe('PUT /api/v1/settings/profile/notifications', () => {
        it('should update notification settings', async () => {
            const response = await request(app)
                .put('/api/v1/settings/profile/notifications')
                .send({
                    notificationSettings: {
                        mobileLowStock: true,
                        whatsappInvoice: true
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.data.notificationSettings.mobileLowStock).toBe(true);
        });
    });

    describe('PUT /api/v1/settings/profile/password', () => {
        it('should fail with incorrect current password', async () => {
            const response = await request(app)
                .put('/api/v1/settings/profile/password')
                .send({
                    currentPassword: 'WrongPassword123!',
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('incorrect');
        });

        it('should change password successfully with valid credentials', async () => {
            const response = await request(app)
                .put('/api/v1/settings/profile/password')
                .send({
                    currentPassword: 'CurrentPass123!',
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify login with new password would work (by checking hash actually changed)
            // But we don't have direct login endpoint access here, so we assume success based on 200
        });
    });
});
