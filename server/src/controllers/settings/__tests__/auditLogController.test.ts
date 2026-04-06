/**
 * Audit Log Controller Tests
 * 
 * Tests for viewing settings audit logs
 * 
 * Run with: npx jest auditLogController.test.ts
 */

import request from 'supertest';
import prisma from '../../../config/prisma';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock audit service
jest.mock('../../../services/settingsAuditService', () => ({
    getAuditLogs: jest.fn(() => Promise.resolve({
        logs: [{ id: 'log1', action: 'UPDATE', settingType: 'PROFILE' }],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 }
    })),
    getAuditLogDetail: jest.fn((id) => {
        if (id === 'log1') return Promise.resolve({ id: 'log1', action: 'UPDATE' });
        return Promise.resolve(null);
    }),
    getAuditLogStats: jest.fn(() => Promise.resolve({ totalEvents: 100 }))
}));

// Mock authentication
jest.mock('../../../middleware/auth', () => ({
    protect: jest.fn((req: any, res: any, next: any) => next()),
    authenticate: jest.fn((req: any, res: any, next: any) => next()),
    authorize: jest.fn(() => (req: any, res: any, next: any) => next())
}));

import { protect } from '../../../middleware/auth';
import app from '../../../server';

const MOCK_ADMIN_ID = 'audit-admin-id';
let mockCompanyId: string;

describe('Audit Log Controller Tests', () => {

    beforeAll(async () => {
        // Create company
        const company = await prisma.company.create({
            data: {
                businessName: 'Audit Test Co',
                email: `audit-${Date.now()}@test.com`,
                phone: '6666666666',
                state: 'Kerala'
            }
        });
        mockCompanyId = company.id;

        // Configure auth mock
        (protect as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
            req.user = { id: MOCK_ADMIN_ID, role: 'ADMIN', companyId: mockCompanyId };
            next();
        });
    });

    afterAll(async () => {
        if (mockCompanyId) {
            await prisma.company.delete({ where: { id: mockCompanyId } }).catch(() => { });
        }
        await prisma.$disconnect();
    });

    describe('GET /api/v1/settings/audit-logs', () => {
        it('should return audit logs list', async () => {
            const response = await request(app)
                .get('/api/v1/settings/audit-logs');

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe('log1');
        });
    });

    describe('GET /api/v1/settings/audit-logs/:id', () => {
        it('should return audit log detail', async () => {
            const response = await request(app)
                .get('/api/v1/settings/audit-logs/log1');

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe('log1');
        });

        it('should return 404 for non-existent log', async () => {
            const response = await request(app)
                .get('/api/v1/settings/audit-logs/nonexistent');

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/v1/settings/audit-logs/stats', () => {
        it('should return audit stats', async () => {
            const response = await request(app)
                .get('/api/v1/settings/audit-logs/stats');

            expect(response.status).toBe(200);
            expect(response.body.data.totalEvents).toBe(100);
        });
    });
});
