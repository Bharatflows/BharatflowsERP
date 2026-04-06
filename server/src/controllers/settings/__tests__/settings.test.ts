/**
 * Settings Controllers - Unit Tests
 * 
 * Tests for settings module controllers including:
 * - App Configuration
 * - Security Summary
 * - Integrity Check
 * 
 * Run with: npx jest settings.test.ts
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../../../middleware/auth';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
jest.mock('../../../config/prisma', () => ({
    __esModule: true,
    default: {
        company: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        device: {
            count: jest.fn(),
        },
        iPWhitelist: {
            count: jest.fn(),
        },
        domainEvent: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        integrityCheckResult: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        product: {
            findMany: jest.fn(),
        },
        ledger: {
            findMany: jest.fn(),
        },
    },
}));

import prisma from '../../../config/prisma';

describe('Settings Controllers', () => {
    let mockReq: Partial<AuthRequest>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockReq = {
            user: {
                id: 'test-user-id',
                companyId: 'test-company-id',
                role: 'ADMIN',
            },
        };
        mockRes = {
            status: mockStatus,
            json: mockJson,
        };
        jest.clearAllMocks();
    });

    describe('App Configuration Controller', () => {
        const { getAppConfig, updateAppConfig } = require('../appConfigController');

        describe('getAppConfig', () => {
            it('should return company configuration', async () => {
                const mockCompany = {
                    id: 'test-company-id',
                    businessName: 'Test Company',
                    gstRegistered: true,
                    tdsEnabled: false,
                    valuationMethod: 'FIFO',
                    fiscalYearStart: 'APR',
                    timezone: 'Asia/Kolkata',
                };

                (prisma.company.findUnique as jest.Mock).mockResolvedValue(mockCompany);

                await getAppConfig(mockReq as AuthRequest, mockRes as Response);

                expect(prisma.company.findUnique).toHaveBeenCalledWith({
                    where: { id: 'test-company-id' },
                });
                expect(mockStatus).toHaveBeenCalledWith(200);
            });

            it('should return 404 if company not found', async () => {
                (prisma.company.findUnique as jest.Mock).mockResolvedValue(null);

                await getAppConfig(mockReq as AuthRequest, mockRes as Response);

                expect(mockStatus).toHaveBeenCalledWith(404);
            });
        });

        describe('updateAppConfig', () => {
            it('should update company configuration', async () => {
                mockReq.body = {
                    valuationMethod: 'WEIGHTED_AVERAGE',
                    tdsEnabled: true,
                };

                const updatedCompany = {
                    id: 'test-company-id',
                    valuationMethod: 'WEIGHTED_AVERAGE',
                    tdsEnabled: true,
                };

                (prisma.company.update as jest.Mock).mockResolvedValue(updatedCompany);

                await updateAppConfig(mockReq as AuthRequest, mockRes as Response);

                expect(prisma.company.update).toHaveBeenCalled();
                expect(mockStatus).toHaveBeenCalledWith(200);
            });
        });
    });

    describe('Security Summary Controller', () => {
        const { getSecuritySummary } = require('../securitySummaryController');

        it('should return security summary with score', async () => {
            (prisma.domainEvent.count as jest.Mock).mockResolvedValue(3);
            (prisma.device.count as jest.Mock)
                .mockResolvedValueOnce(5) // trusted
                .mockResolvedValueOnce(10); // total
            (prisma.iPWhitelist.count as jest.Mock).mockResolvedValue(2);
            (prisma.domainEvent.findMany as jest.Mock).mockResolvedValue([]);

            await getSecuritySummary(mockReq as AuthRequest, mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        securityScore: expect.any(Number),
                        failedLogins: expect.any(Number),
                        devices: expect.any(Object),
                    }),
                })
            );
        });

        it('should calculate security score correctly', async () => {
            // High failed logins should reduce score
            (prisma.domainEvent.count as jest.Mock).mockResolvedValue(15);
            (prisma.device.count as jest.Mock)
                .mockResolvedValueOnce(2) // trusted
                .mockResolvedValueOnce(10); // total (less than 50% trusted)
            (prisma.iPWhitelist.count as jest.Mock).mockResolvedValue(0); // no IP whitelist

            await getSecuritySummary(mockReq as AuthRequest, mockRes as Response);

            const response = mockJson.mock.calls[0][0];
            // Score should be reduced: 100 - 20 (failed) - 15 (no IP) - 10 (low trust) = 55
            expect(response.data.securityScore).toBeLessThan(60);
        });
    });

    describe('Integrity Check Controller', () => {
        const { runIntegrityCheck, getIntegrityHistory, getIntegrityCheckDetails } = require('../integrityCheckController');

        describe('runIntegrityCheck', () => {
            it('should run integrity checks and return results', async () => {
                (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
                (prisma.ledger.findMany as jest.Mock).mockResolvedValue([]);
                (prisma.integrityCheckResult.create as jest.Mock).mockResolvedValue({
                    id: 'check-1',
                    status: 'SUCCESS',
                    totalChecks: 3,
                    issuesFound: 0,
                    criticalIssues: 0,
                });

                await runIntegrityCheck(mockReq as AuthRequest, mockRes as Response);

                expect(prisma.integrityCheckResult.create).toHaveBeenCalled();
                expect(mockStatus).toHaveBeenCalledWith(200);
            });

            it('should detect negative stock issues', async () => {
                (prisma.product.findMany as jest.Mock).mockResolvedValue([
                    { id: 'prod-1', name: 'Product 1', stockQuantity: -5 },
                ]);
                (prisma.ledger.findMany as jest.Mock).mockResolvedValue([]);
                (prisma.integrityCheckResult.create as jest.Mock).mockImplementation((data) => ({
                    id: 'check-1',
                    ...data.data,
                }));

                await runIntegrityCheck(mockReq as AuthRequest, mockRes as Response);

                const createCall = (prisma.integrityCheckResult.create as jest.Mock).mock.calls[0][0];
                expect(createCall.data.issuesFound).toBeGreaterThan(0);
            });
        });

        describe('getIntegrityHistory', () => {
            it('should return paginated history', async () => {
                mockReq.query = { limit: '5', offset: '0' };

                (prisma.integrityCheckResult.findMany as jest.Mock).mockResolvedValue([
                    { id: 'check-1', status: 'SUCCESS', runAt: new Date() },
                    { id: 'check-2', status: 'WARNING', runAt: new Date() },
                ]);

                await getIntegrityHistory(mockReq as AuthRequest, mockRes as Response);

                expect(prisma.integrityCheckResult.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        take: 5,
                        skip: 0,
                    })
                );
                expect(mockStatus).toHaveBeenCalledWith(200);
            });
        });

        describe('getIntegrityCheckDetails', () => {
            it('should return specific check details', async () => {
                mockReq.params = { id: 'check-1' };

                (prisma.integrityCheckResult.findUnique as jest.Mock).mockResolvedValue({
                    id: 'check-1',
                    status: 'SUCCESS',
                    issues: [],
                });

                await getIntegrityCheckDetails(mockReq as AuthRequest, mockRes as Response);

                expect(prisma.integrityCheckResult.findUnique).toHaveBeenCalledWith({
                    where: { id: 'check-1' },
                });
                expect(mockStatus).toHaveBeenCalledWith(200);
            });

            it('should return 404 if check not found', async () => {
                mockReq.params = { id: 'nonexistent' };

                (prisma.integrityCheckResult.findUnique as jest.Mock).mockResolvedValue(null);

                await getIntegrityCheckDetails(mockReq as AuthRequest, mockRes as Response);

                expect(mockStatus).toHaveBeenCalledWith(404);
            });
        });
    });
});
