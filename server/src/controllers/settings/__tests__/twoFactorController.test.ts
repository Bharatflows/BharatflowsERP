/**
 * Two-Factor Authentication Controller Tests
 * 
 * Tests for 2FA setup, verification, and management
 * 
 * Run with: npx jest twoFactorController.test.ts
 */

import request from 'supertest';
import prisma from '../../../config/prisma';
import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock dependencies
jest.mock('speakeasy', () => ({
    generateSecret: jest.fn(() => ({
        otpauth_url: 'otpauth://totp/Test?secret=TESTSECRET',
        base32: 'TESTSECRET'
    })),
    totp: {
        verify: jest.fn(() => true)
    }
}));

jest.mock('qrcode', () => ({
    toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,TESTQRCODE'))
}));

// Mock authentication
jest.mock('../../../middleware/auth', () => ({
    protect: jest.fn((req: any, res: any, next: any) => next()),
    authenticate: jest.fn((req: any, res: any, next: any) => next()),
    authorize: jest.fn(() => (req: any, res: any, next: any) => next())
}));

import { protect } from '../../../middleware/auth';
import app from '../../../server';

const MOCK_USER_ID = '2fa-test-user-id';
let mockCompanyId: string;

describe('Two-Factor Auth Controller Tests', () => {

    beforeAll(async () => {
        // Create test company
        const company = await prisma.company.create({
            data: {
                businessName: '2FA Test Co',
                email: `2fa-test-${Date.now()}@test.com`,
                phone: '8888888888',
                state: 'Delhi'
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
        const hashedPassword = await bcrypt.hash('Password123!', salt);

        await prisma.user.upsert({
            where: { id: MOCK_USER_ID },
            update: {
                companyId: mockCompanyId,
                password: hashedPassword,
                twoFactorEnabled: false,
                twoFactorSecret: null
            },
            create: {
                id: MOCK_USER_ID,
                email: `2fa-user-${Date.now()}@test.com`,
                name: '2FA Tester',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                companyId: mockCompanyId
            }
        });
    });

    afterAll(async () => {
        if (mockCompanyId) {
            await prisma.user.deleteMany({ where: { companyId: mockCompanyId } }).catch(() => { });
            await prisma.company.delete({ where: { id: mockCompanyId } }).catch(() => { });
        }
        await prisma.$disconnect();
    });

    describe('POST /api/v1/auth/2fa/setup', () => {
        it('should generate secret and QR code', async () => {
            const response = await request(app)
                .post('/api/v1/auth/2fa/setup');

            expect(response.status).toBe(200);
            expect(response.body.data.secret).toBe('TESTSECRET');
            expect(response.body.data.qrCode).toContain('data:image/png');
        });
    });

    describe('POST /api/v1/auth/2fa/verify-setup', () => {
        it('should verify code and enable 2FA', async () => {
            const response = await request(app)
                .post('/api/v1/auth/2fa/verify-setup')
                .send({ code: '123456' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.backupCodes).toHaveLength(10);

            // Verify DB update
            const user = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
            expect(user?.twoFactorEnabled).toBe(true);
        });

        it('should reject invalid code length', async () => {
            const response = await request(app)
                .post('/api/v1/auth/2fa/verify-setup')
                .send({ code: '123' });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/auth/2fa/status', () => {
        it('should return correct status', async () => {
            const response = await request(app)
                .get('/api/v1/auth/2fa/status');

            expect(response.status).toBe(200);
            expect(response.body.data.enabled).toBe(true);
            expect(response.body.data.backupCodesRemaining).toBe(10);
        });
    });

    describe('POST /api/v1/auth/2fa/disable', () => {
        it('should disable 2FA with correct password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/2fa/disable')
                .send({ password: 'Password123!' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify DB update
            const user = await prisma.user.findUnique({ where: { id: MOCK_USER_ID } });
            expect(user?.twoFactorEnabled).toBe(false);
        });

        it('should fail with incorrect password', async () => {
            // Re-enable first (manually in DB for test speed)
            await prisma.user.update({
                where: { id: MOCK_USER_ID },
                data: { twoFactorEnabled: true }
            });

            const response = await request(app)
                .post('/api/v1/auth/2fa/disable')
                .send({ password: 'WrongPassword' });

            expect(response.status).toBe(401);
        });
    });
});
