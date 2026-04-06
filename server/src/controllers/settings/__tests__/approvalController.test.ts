/**
 * Approval Controller Tests - UNIT/INTEGRATION
 * 
 * Tests for sensitive settings change approval workflow
 * 
 * Run with: npx jest approvalController.test.ts
 */

import { prismaMock } from '../../../__tests__/utils/prismaMock';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';

// Mock Audit Service
jest.mock('../../../services/settingsAuditService', () => ({
    logSettingsChange: jest.fn()
}));

// Mock Auth Middleware
jest.mock('../../../middleware/auth', () => ({
    protect: jest.fn((req: any, res: any, next: any) => {
        // Default to ADMIN. Can be overridden in tests.
        req.user = { id: 'admin-id', role: 'ADMIN', companyId: 'company-123' };
        next();
    }),
    authenticate: jest.fn((req: any, res: any, next: any) => next()),
    authorize: jest.fn(() => (req: any, res: any, next: any) => next())
}));

import { protect } from '../../../middleware/auth';
import app from '../../../server';

const MOCK_COMPANY_ID = 'company-123';
const MOCK_ADMIN_ID = 'admin-id';
const MOCK_OWNER_ID = 'owner-id';

describe('Approval Controller Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/settings/approvals/request', () => {
        it('should create an approval request for valid settings', async () => {
            // Mock Create
            prismaMock.settingsApprovalRequest.create.mockResolvedValue({
                id: 'req-1',
                status: 'PENDING',
                settingType: 'GSTIN_CHANGE'
            } as any);

            const response = await request(app)
                .post('/api/v1/settings/approvals/request')
                .send({
                    settingType: 'GSTIN_CHANGE',
                    changeData: { oldValue: 'OLD', newValue: 'NEW' },
                    reason: 'Updating incorrect GSTIN number for compliance'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should fail if reason is too short', async () => {
            const response = await request(app)
                .post('/api/v1/settings/approvals/request')
                .send({
                    settingType: 'FY_UNLOCK',
                    changeData: {},
                    reason: 'Short'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/settings/approvals', () => {
        it('should list pending approvals', async () => {
            prismaMock.settingsApprovalRequest.findMany.mockResolvedValue([
                { id: 'req-1', status: 'PENDING' }
            ] as any);

            // Mock Count if needed by pagination
            prismaMock.settingsApprovalRequest.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/v1/settings/approvals?status=PENDING');

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('POST /api/v1/settings/approvals/:id/approve', () => {

        it('should approve request when called by Owner', async () => {
            // Act as Owner
            (protect as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
                req.user = { id: MOCK_OWNER_ID, role: 'OWNER', companyId: MOCK_COMPANY_ID };
                next();
            });

            // Mock Find Logic
            prismaMock.settingsApprovalRequest.findUnique.mockResolvedValue({
                id: 'req-123',
                status: 'PENDING',
                companyId: MOCK_COMPANY_ID
            } as any);

            // Mock Update Logic
            prismaMock.settingsApprovalRequest.update.mockResolvedValue({
                id: 'req-123',
                status: 'APPROVED',
                approvedById: MOCK_OWNER_ID
            } as any);

            // Mock Transaction
            prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));

            const response = await request(app)
                .post('/api/v1/settings/approvals/req-123/approve');

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('APPROVED');
        });

        it('should reject approval when called by Non-Owner', async () => {
            // Act as Admin
            (protect as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
                req.user = { id: MOCK_ADMIN_ID, role: 'ADMIN', companyId: MOCK_COMPANY_ID };
                next();
            });

            prismaMock.settingsApprovalRequest.findUnique.mockResolvedValue({
                id: 'req-123',
                status: 'PENDING',
                companyId: MOCK_COMPANY_ID
            } as any);

            const response = await request(app)
                .post('/api/v1/settings/approvals/req-123/approve');

            expect(response.status).toBe(403);
        });
    });

    describe('POST /api/v1/settings/approvals/:id/reject', () => {
        it('should reject request when called by Owner', async () => {
            // Act as Owner
            (protect as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
                req.user = { id: MOCK_OWNER_ID, role: 'OWNER', companyId: MOCK_COMPANY_ID };
                next();
            });

            // Mock Find Logic
            prismaMock.settingsApprovalRequest.findUnique.mockResolvedValue({
                id: 'req-123',
                status: 'PENDING',
                companyId: MOCK_COMPANY_ID
            } as any);

            // Mock Update Logic
            prismaMock.settingsApprovalRequest.update.mockResolvedValue({
                id: 'req-123',
                status: 'REJECTED'
            } as any);

            const response = await request(app)
                .post('/api/v1/settings/approvals/req-123/reject')
                .send({ rejectionReason: 'Not approved' });

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('REJECTED');
        });
    });
});
