import prisma from '../config/prisma';
import * as accountingService from './accountingService';

interface CreateAssetInput {
    name: string;
    purchaseDate: Date;
    grossPurchaseAmount: number;
    categoryId: string;
    companyId: string;
    location?: string;
    custodian?: string;
    department?: string;
    purchaseInvoiceId?: string;
    userId: string;
}

class AssetService {

    async createAsset(input: CreateAssetInput) {
        const { name, purchaseDate, grossPurchaseAmount, categoryId, companyId, location, custodian, department, purchaseInvoiceId, userId } = input;

        // 1. Get Category for Ledger mapping
        const category = await prisma.assetCategory.findUnique({
            where: { id: categoryId }
        });

        if (!category) throw new Error('Asset Category not found');

        // 2. Create Asset
        const asset = await prisma.asset.create({
            data: {
                name,
                purchaseDate,
                grossPurchaseAmount,
                categoryId,
                companyId,
                location,
                custodian,
                department,
                purchaseInvoiceId,
                status: 'DRAFT'
            }
        });

        // 3. Post Capitalization Entry (if linked to Purchase Invoice, this might be handled there. 
        // If not, we debit Asset Account and credit "Asset Clearing" or similar.
        // For simplicity in Phase 1, we assume Purchase Invoice handles the Vendor Liability, 
        // and we just ensure the Debit went to the right Asset Account.
        // If this is a standalone entry (opening balance or direct purchase entry):
        if (!purchaseInvoiceId) {
            // Create Voucher: Dr Asset Account, Cr Cash/Bank (Simplification) or Opening Balance Equity
            // User should ideally select the Credit Account.
        }

        return asset;
    }

    async generateDepreciationSchedule(assetId: string, companyId: string) {
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
            include: { category: true }
        });

        if (!asset) throw new Error('Asset not found');
        if (asset.companyId !== companyId) throw new Error('Unauthorized');

        const { depreciationMethod, totalNumberOfDepreciations, frequencyOfDepreciation } = asset.category;

        // Straight Line SImplified
        if (depreciationMethod === 'STRAIGHT_LINE') {
            const amountPerPeriod = Number(asset.grossPurchaseAmount) / totalNumberOfDepreciations;

            const schedules = [];
            let currentDate = new Date(asset.purchaseDate);

            // Generate monthly schedules
            for (let i = 0; i < totalNumberOfDepreciations; i++) {
                currentDate.setMonth(currentDate.getMonth() + 1); // Next month

                schedules.push({
                    assetId: asset.id,
                    scheduleDate: new Date(currentDate),
                    depreciationAmount: amountPerPeriod,
                    accumulatedDepreciationAmount: amountPerPeriod * (i + 1),
                    status: 'SCHEDULED'
                });
            }

            // Save to DB
            await prisma.assetDepreciationSchedule.createMany({
                data: schedules
            });

            await prisma.asset.update({
                where: { id: assetId },
                data: { status: 'DEPRECIATING' }
            });
        }

        return prisma.assetDepreciationSchedule.findMany({ where: { assetId } });
    }

    async postDepreciation(scheduleId: string, companyId: string, userId: string) {
        const schedule = await prisma.assetDepreciationSchedule.findUnique({
            where: { id: scheduleId },
            include: { asset: { include: { category: true } } }
        });

        if (!schedule) throw new Error('Schedule not found');
        if (schedule.status === 'POSTED') throw new Error('Already posted');

        const asset = schedule.asset;
        const category = asset.category;

        // Post Voucher
        // Dr Depreciation Expense
        // Cr Accumulated Depreciation

        const voucher = await accountingService.createVoucher({
            companyId,
            date: schedule.scheduleDate,
            type: 'JOURNAL',
            referenceType: 'ASSET_DEPRECIATION',
            referenceId: schedule.id,
            narration: `Depreciation for ${asset.name}`,
            postings: [
                {
                    ledgerId: category.depreciationExpenseAccountId,
                    amount: Number(schedule.depreciationAmount),
                    type: 'DEBIT',
                    narration: 'Depreciation Expense'
                },
                {
                    ledgerId: category.accumulatedDepreciationAccountId,
                    amount: Number(schedule.depreciationAmount),
                    type: 'CREDIT',
                    narration: 'Accumulated Depreciation'
                }
            ],
            createdById: userId,
            status: 'POSTED',
            voucherNumber: undefined // Auto-generate
        });

        // Update Schedule
        await prisma.assetDepreciationSchedule.update({
            where: { id: scheduleId },
            data: {
                status: 'POSTED',
                journalEntryId: voucher.id
            }
        });

        return voucher;
    }
}

export const assetService = new AssetService();
