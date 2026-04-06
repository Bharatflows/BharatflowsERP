/// <reference types="jest" />
import { postSalesInvoice } from '../postingService';
import accountingService from '../accountingService';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock dependencies
jest.mock('../accountingService');
jest.mock('../config/logger');

// Mock Prisma
const prismaMock = mockDeep<PrismaClient>();
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock),
    PostingType: { DEBIT: 'DEBIT', CREDIT: 'CREDIT' },
    VoucherType: { SALES: 'SALES', PURCHASE: 'PURCHASE' }
}));

describe('Posting Service - Sales Invoice', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should post sales invoice correctly (Intra-State)', async () => {
        const invoiceData = {
            id: 'inv-123',
            invoiceNumber: 'INV-001',
            invoiceDate: new Date(),
            customerId: 'cust-1',
            subtotal: 1000,
            totalTax: 180,
            totalAmount: 1180,
            companyId: 'comp-1',
            items: []
        };

        // Mock ledger resolutions
        (accountingService.getOrCreatePartyLedger as jest.Mock).mockResolvedValue('ledger-cust-1');
        (accountingService.getSystemLedgerByCode as jest.Mock).mockImplementation((compId, code) => {
            if (code === 'SALES_GOODS' || code === 'SALES') return Promise.resolve('ledger-sales');
            if (code === 'GST_PAYABLE') return Promise.resolve('ledger-gst-out');
            return Promise.resolve(`ledger-${code}`);
        });

        await postSalesInvoice(invoiceData, prismaMock);

        // Verify accountingService.createVoucher call
        expect(accountingService.createVoucher).toHaveBeenCalledTimes(1);
        const callArgs = (accountingService.createVoucher as jest.Mock).mock.calls[0][0];

        expect(callArgs.type).toBe('SALES');
        expect(callArgs.referenceId).toBe('inv-123');
        expect(callArgs.postings).toHaveLength(3); // Customer, Sales, GST

        // Verify Postings
        const customerPosting = callArgs.postings.find((p: any) => p.ledgerId === 'ledger-cust-1');
        const salesPosting = callArgs.postings.find((p: any) => p.ledgerId === 'ledger-sales');
        const gstPosting = callArgs.postings.find((p: any) => p.ledgerId === 'ledger-gst-out');

        expect(customerPosting.amount).toBe(1180);
        expect(customerPosting.type).toBe('DEBIT');

        expect(salesPosting.amount).toBe(1000);
        expect(salesPosting.type).toBe('CREDIT');

        expect(gstPosting.amount).toBe(180);
        expect(gstPosting.type).toBe('CREDIT');
    });

    it('should fallback to Sales ledger if GST output ledger is missing', async () => {
        const invoiceData = {
            id: 'inv-123',
            invoiceNumber: 'INV-001',
            invoiceDate: new Date(),
            customerId: 'cust-1',
            subtotal: 1000,
            totalTax: 180,
            totalAmount: 1180,
            companyId: 'comp-1'
        };

        // Mock ledger resolutions
        (accountingService.getOrCreatePartyLedger as jest.Mock).mockResolvedValue('ledger-cust-1');
        (accountingService.getSystemLedgerByCode as jest.Mock).mockImplementation((compId, code) => {
            if (code === 'SALES_GOODS') return Promise.resolve('ledger-sales');
            if (code === 'GST_PAYABLE') return Promise.reject(new Error('Missing'));
            return Promise.resolve('ledger-misc');
        });

        await postSalesInvoice(invoiceData, prismaMock);

        const callArgs = (accountingService.createVoucher as jest.Mock).mock.calls[0][0];

        // Should only have 2 postings (Customer, Sales+Tax)
        expect(callArgs.postings).toHaveLength(2);

        const salesPosting = callArgs.postings.find((p: any) => p.ledgerId === 'ledger-sales');
        expect(salesPosting.amount).toBe(1180); // 1000 + 180
    });
});
