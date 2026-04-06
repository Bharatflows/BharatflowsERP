import prisma from '../config/prisma'; // Use the extended prisma client

// Type definitions for SQLite (no enums)
type VoucherType = 'PAYMENT' | 'RECEIPT' | 'CONTRA' | 'JOURNAL' | 'SALES' | 'PURCHASE' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
type PostingType = 'DEBIT' | 'CREDIT';
type VoucherStatus = 'DRAFT' | 'POSTED' | 'CANCELLED' | 'REVERSED';

// Use 'any' for Prisma model types as they vary dynamically
type Voucher = any;
type FinancialYear = any;
type FinancialPeriod = any;
export interface LedgerEntry {
    ledgerId: string;
    amount: number;
    type: PostingType;
    narration?: string;
    costCenterId?: string;
    projectId?: string;
    partyId?: string;
}

export interface VoucherRequest {
    companyId: string;
    date: Date;
    type: VoucherType;
    referenceType: string; // 'INVOICE', 'RECEIPT', etc.
    referenceId: string;
    narration: string;
    postings: LedgerEntry[];
    createdById?: string;
    status?: VoucherStatus;
    voucherNumber?: string; // Optional, auto-generated if missing
}

class AccountingPostingService {

    /**
     * Get Financial Year for a date and ensure it exists.
     */
    async getFinancialYearForDate(companyId: string, date: Date, tx: any = prisma): Promise<FinancialYear> {
        // Find FY covering this date
        const fy = await tx.financialYear.findFirst({
            where: {
                companyId,
                startDate: { lte: date },
                endDate: { gte: date }
            }
        });

        if (!fy) {
            throw new Error(`No Financial Year defined for date ${date.toISOString().split('T')[0]}`);
        }

        if (fy.isLocked) {
            throw new Error(`Financial Year ${fy.name} is LOCKED. Cannot post voucher.`);
        }

        // Check if period is locked
        const period: FinancialPeriod | null = await tx.financialPeriod.findFirst({
            where: {
                companyId,
                startDate: { lte: date },
                endDate: { gte: date }
            }
        });

        if (period && period.isLocked) {
            throw new Error(`Financial Period ${period.name} is LOCKED. Cannot post voucher.`);
        }

        return fy;
    }

    /**
     * Generate next voucher number sequentially
     */
    async generateVoucherNumber(companyId: string, type: VoucherType, fyId: string, fyName: string, tx: any = prisma): Promise<string> {
        // Format: {TYPE}-{FY}-{SEQ}

        // Get count of vouchers of this type in this FY
        const count = await tx.voucher.count({
            where: {
                companyId,
                financialYearId: fyId,
                type
            }
        });

        const seq = (count + 1).toString().padStart(5, '0');
        const cleanFy = fyName.replace(/[^a-zA-Z0-9]/g, '');

        return `${type.substring(0, 3)}-${cleanFy}-${seq}`;
    }

    /**
     * Central method to create a voucher and its ledger postings.
     * Enforces Debit == Credit.
     */
    async createVoucher(request: VoucherRequest, tx: any = prisma): Promise<Voucher> {
        // 1. Validate Balance
        const totalDebit = request.postings
            .filter(p => p.type === 'DEBIT')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        const totalCredit = request.postings
            .filter(p => p.type === 'CREDIT')
            .reduce((sum, p) => sum + Number(p.amount), 0);

        // Strict adherence: Must be equal. Tolerance 0.05.
        if (Math.abs(totalDebit - totalCredit) > 0.05) {
            throw new Error(`Accounting Imbalance: Debit (${totalDebit}) != Credit (${totalCredit}) for Ref ${request.referenceId}`);
        }

        // 2. Check Financial Year & Lock
        const fy = await this.getFinancialYearForDate(request.companyId, request.date, tx);

        // 3. Generate Voucher Number if needed
        let voucherNumber = request.voucherNumber;
        if (!voucherNumber) {
            voucherNumber = await this.generateVoucherNumber(request.companyId, request.type, fy.id, fy.name, tx);
        }

        // 4. Create Voucher and Postings
        const voucher = await tx.voucher.create({
            data: {
                companyId: request.companyId,
                date: request.date,
                type: request.type,
                referenceType: request.referenceType,
                referenceId: request.referenceId,
                voucherNumber: voucherNumber,
                narration: request.narration,
                createdById: request.createdById,
                financialYearId: fy.id,
                status: request.status || 'POSTED',
                postings: {
                    create: request.postings.map(p => ({
                        companyId: request.companyId,
                        ledgerId: p.ledgerId,
                        amount: p.amount,
                        type: p.type,
                        narration: p.narration || request.narration,
                        costCenterId: p.costCenterId,
                        projectId: p.projectId,
                        partyId: p.partyId
                    }))
                }
            },
            include: {
                postings: true
            }
        });
        return voucher;
    }

    /**
     * VOID a voucher (Soft Delete / Reverse).
     * Marks status as CANCELLED.
     */
    async voidVoucher(referenceId: string, referenceType: string, companyId: string, tx: any = prisma): Promise<void> {
        const voucher = await tx.voucher.findFirst({
            where: {
                referenceId,
                referenceType,
                companyId,
                status: { not: 'CANCELLED' }
            }
        });

        if (!voucher) return; // Already void or null or different status

        // Check if period is locked before voiding
        await this.getFinancialYearForDate(companyId, voucher.date, tx);

        await tx.voucher.update({
            where: { id: voucher.id },
            data: { status: 'CANCELLED' }
        });
    }
}

export const accountingPostingService = new AccountingPostingService();
