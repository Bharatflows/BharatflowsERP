/**
 * Ageing Reports Controller
 * 
 * P0: Outstanding ageing analysis for receivables and payables
 * Critical for collections and payment tracking
 */

import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';
import * as accountingService from '../services/accountingService';
import { Prisma } from '@prisma/client';

interface AuthRequest extends Request {
    user?: { id: string; companyId: string };
}

interface AgeingBucket {
    label: string;
    minDays: number;
    maxDays: number | null;
    amount: number;
    count: number;
    parties: Array<{
        id: string;
        name: string;
        amount: number;
        invoices: Array<{
            id: string;
            number: string;
            date: Date;
            dueDate: Date | null;
            amount: number;
            daysOverdue: number;
            referenceType?: string;
        }>;
    }>;
}

/**
 * @desc    Get Receivables Ageing Report (Customer Outstanding)
 * @route   GET /api/v1/reports/ageing/receivables
 * @access  Private
 */
export const getReceivablesAgeing = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { asOfDate } = req.query;

        const referenceDate = asOfDate ? new Date(asOfDate as string) : new Date();

        // 1. Get Open Items from Ledger (Single Source of Truth)
        // This includes Invoices AND manual Journal Vouchers (Debit Notes, Adjustments, etc.)
        const { openItems, unallocated } = await accountingService.getOpenItems(
            companyId,
            'SUNDRY_DEBTORS',
            referenceDate
        );

        // 2. Fetch Metadata (Party Details & Due Dates)
        // We need to resolve referenceIds (Invoice IDs) to get Due Dates
        const invoiceIds = openItems
            .filter(i => i.referenceType === 'INVOICE' && i.referenceId)
            .map(i => i.referenceId);

        const invoices = await prisma.invoice.findMany({
            where: { id: { in: invoiceIds } },
            select: { id: true, invoiceNumber: true, dueDate: true, customerId: true }
        });

        const invoiceMap = new Map(invoices.map(i => [i.id, i]));

        // Get Party details from Ledgers involved
        // We extract distinct ledgerIds from openItems and unallocated
        const ledgerIds = new Set([
            ...openItems.map(i => i.ledgerId),
            ...unallocated.keys()
        ]);

        const ledgers = await prisma.ledger.findMany({
            where: { id: { in: Array.from(ledgerIds) } },
            include: { party: { select: { id: true, name: true, msmeType: true } } }
        });

        const ledgerPartyMap = new Map(ledgers.map(l => [l.id, l.party]));

        // 3. Bucket Logic
        const buckets: AgeingBucket[] = [
            { label: 'Current (0-30 days)', minDays: 0, maxDays: 30, amount: 0, count: 0, parties: [] },
            { label: '31-60 days', minDays: 31, maxDays: 60, amount: 0, count: 0, parties: [] },
            { label: '61-90 days', minDays: 61, maxDays: 90, amount: 0, count: 0, parties: [] },
            { label: 'Over 90 days', minDays: 91, maxDays: null, amount: 0, count: 0, parties: [] }
        ];

        const partyMap = new Map<string, any>();

        // Process Open Items (Allocated references)
        for (const item of openItems) {
            const invoice = invoiceMap.get(item.referenceId);
            const party = ledgerPartyMap.get(item.ledgerId);

            if (!party) continue; // Skip if orphan ledger (should not happen for Debtors)

            // Determine Due Date: Prefer Invoice Due Date, fallback to Posting Date
            const dueDate = invoice?.dueDate || item.date;

            const daysOverdue = Math.floor(
                (referenceDate.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            const amount = item.totalAmount; // Positive for Debtors

            // Find Bucket
            const bucket = buckets.find(b =>
                daysOverdue >= b.minDays && (b.maxDays === null || daysOverdue <= b.maxDays)
            );

            // Add to Bucket
            if (bucket) {
                bucket.amount += amount;
                bucket.count += 1;
            }

            // Add to Party Breakdown
            if (!partyMap.has(party.id)) {
                partyMap.set(party.id, {
                    id: party.id,
                    name: party.name,
                    msmeType: party.msmeType,
                    totalAmount: 0,
                    invoices: [],
                    unallocated: 0
                });
            }
            const p = partyMap.get(party.id)!;
            p.totalAmount += amount;
            p.invoices.push({
                id: item.referenceId,
                number: invoice?.invoiceNumber || 'JV/Ref',
                date: item.date,
                dueDate: dueDate,
                amount,
                daysOverdue: Math.max(0, daysOverdue),
                referenceType: item.referenceType
            });
        }

        // Process Unallocated Amounts (On Account Payments, Advances)
        for (const [ledgerId, amount] of unallocated.entries()) {
            const party = ledgerPartyMap.get(ledgerId);
            if (!party) continue;

            // Unallocated for Debtors: Usually Credit (Negative).
            // We add it to the total amount (reducing the debt)
            // But we don't put it in a specific time bucket unless we assume "Current"
            // Convention: Apply to "Current" or keep separate. 
            // We'll add to "Current" bucket to keep totals consistent, or treat as 0 overdue.

            // Note: amount from getOpenItems for Debtors: Debit (+), Credit (-)

            // Logic: Add to 0-30 bucket
            buckets[0].amount += amount;

            if (!partyMap.has(party.id)) {
                partyMap.set(party.id, {
                    id: party.id,
                    name: party.name,
                    msmeType: party.msmeType,
                    totalAmount: 0,
                    invoices: [],
                    unallocated: 0
                });
            }
            const p = partyMap.get(party.id)!;
            p.totalAmount += amount; // Reduces balance
            p.unallocated += amount;
        }

        // Calculate final summaries
        const totalOutstanding = buckets.reduce((sum, b) => sum + b.amount, 0);
        const totalInvoices = buckets.reduce((sum, b) => sum + b.count, 0); // Count of line items

        const topDebtors = Array.from(partyMap.values())
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                asOfDate: referenceDate,
                summary: {
                    totalOutstanding,
                    totalInvoices,
                    totalParties: partyMap.size
                },
                buckets: buckets.map(b => ({
                    label: b.label,
                    amount: b.amount, // Can be negative effectively if advances > debt
                    count: b.count,
                    percentage: totalOutstanding > 0
                        ? ((b.amount / totalOutstanding) * 100).toFixed(1)
                        : 0
                })),
                topDebtors,
                allParties: Array.from(partyMap.values())
            }
        });
    } catch (error: any) {
        logger.error('Receivables ageing error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating receivables ageing report'
        });
    }
};

/**
 * @desc    Get Payables Ageing Report (Supplier Outstanding)
 * @route   GET /api/v1/reports/ageing/payables
 * @access  Private
 */
export const getPayablesAgeing = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user!.companyId;
        const { asOfDate } = req.query;

        const referenceDate = asOfDate ? new Date(asOfDate as string) : new Date();

        // 1. Get Open Items from Ledger (Payables)
        // Group Code: SUNDRY_CREDITORS
        const { openItems, unallocated } = await accountingService.getOpenItems(
            companyId,
            'SUNDRY_CREDITORS',
            referenceDate
        );

        // 2. Fetch Metadata
        const billIds = openItems
            .filter(i => (i.referenceType === 'PURCHASE_BILL' || i.referenceType === 'BILL') && i.referenceId)
            .map(i => i.referenceId);

        const bills = await prisma.purchaseBill.findMany({
            where: { id: { in: billIds } },
            select: { id: true, billNumber: true, dueDate: true, supplierId: true }
        });

        const billMap = new Map(bills.map(b => [b.id, b]));

        const ledgerIds = new Set([
            ...openItems.map(i => i.ledgerId),
            ...unallocated.keys()
        ]);

        const ledgers = await prisma.ledger.findMany({
            where: { id: { in: Array.from(ledgerIds) } },
            include: { party: { select: { id: true, name: true, msmeType: true, udyamNumber: true } } }
        });

        const ledgerPartyMap = new Map(ledgers.map(l => [l.id, l.party]));

        // 3. Bucket Logic
        const buckets: AgeingBucket[] = [
            { label: 'Current (0-30 days)', minDays: 0, maxDays: 30, amount: 0, count: 0, parties: [] },
            { label: '31-45 days (MSME Warning)', minDays: 31, maxDays: 45, amount: 0, count: 0, parties: [] },
            { label: '46-60 days (MSME Critical)', minDays: 46, maxDays: 60, amount: 0, count: 0, parties: [] },
            { label: 'Over 60 days', minDays: 61, maxDays: null, amount: 0, count: 0, parties: [] }
        ];

        const partyMap = new Map<string, any>();
        let msmeViolations = 0;
        let msmeAtRisk = 0;

        // Process Open Items
        for (const item of openItems) {
            const bill = billMap.get(item.referenceId);
            const party = ledgerPartyMap.get(item.ledgerId);

            if (!party) continue;

            // Determine Due Date
            const dueDate = bill?.dueDate || item.date;

            const daysOverdue = Math.floor(
                (referenceDate.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            // Amount for Creditors: Credit (+), Debit (-)
            const amount = item.totalAmount;

            // Find Bucket
            const bucket = buckets.find(b =>
                daysOverdue >= b.minDays && (b.maxDays === null || daysOverdue <= b.maxDays)
            );
            if (bucket) {
                bucket.amount += amount;
                bucket.count += 1;
            }

            // MSME Compliance Check
            const isMSME = !!party.msmeType || !!party.udyamNumber;
            // NOTE: Valid on actual Bills only, not manual JVs usually, but standard is conservative
            if (isMSME && daysOverdue > 45) msmeViolations++;
            else if (isMSME && daysOverdue > 30) msmeAtRisk++;

            // Party Map
            if (!partyMap.has(party.id)) {
                partyMap.set(party.id, {
                    id: party.id,
                    name: party.name,
                    isMSME,
                    msmeType: party.msmeType,
                    totalAmount: 0,
                    bills: [],
                    unallocated: 0
                });
            }
            const p = partyMap.get(party.id)!;
            p.totalAmount += amount;
            p.bills.push({
                id: item.referenceId,
                number: bill?.billNumber || 'JV/Ref',
                date: item.date,
                dueDate: dueDate,
                amount,
                daysOverdue: Math.max(0, daysOverdue),
                isViolation: isMSME && daysOverdue > 45
            });
        }

        // Process Unallocated (Debits reducing liability)
        for (const [ledgerId, amount] of unallocated.entries()) {
            // Amount is signed: Credit (+), Debit (-)
            // Unallocated Payments are Debit (Negative)

            const party = ledgerPartyMap.get(ledgerId);
            if (!party) continue;

            // Add to Current bucket
            buckets[0].amount += amount;

            if (!partyMap.has(party.id)) {
                partyMap.set(party.id, {
                    id: party.id,
                    name: party.name,
                    isMSME: !!party.msmeType || !!party.udyamNumber,
                    totalAmount: 0,
                    bills: [],
                    unallocated: 0
                });
            }
            const p = partyMap.get(party.id)!;
            p.totalAmount += amount;
            p.unallocated += amount;
        }

        // Summaries
        const totalPayable = buckets.reduce((sum, b) => sum + b.amount, 0);
        const totalBills = buckets.reduce((sum, b) => sum + b.count, 0);

        const topCreditors = Array.from(partyMap.values())
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                asOfDate: referenceDate,
                summary: {
                    totalPayable,
                    totalBills,
                    totalParties: partyMap.size
                },
                msmeCompliance: {
                    violations: msmeViolations,
                    atRisk: msmeAtRisk,
                    message: msmeViolations > 0
                        ? `⚠️ ${msmeViolations} MSME payments exceed the limit - Section 43B(h) violation!`
                        : msmeAtRisk > 0
                            ? `⚡ ${msmeAtRisk} MSME payments approaching 45-day limit`
                            : '✅ All MSME payments within compliance'
                },
                buckets: buckets.map(b => ({
                    label: b.label,
                    amount: b.amount,
                    count: b.count,
                    percentage: totalPayable > 0
                        ? ((b.amount / totalPayable) * 100).toFixed(1)
                        : 0
                })),
                topCreditors,
                allParties: Array.from(partyMap.values())
            }
        });

    } catch (error: any) {
        logger.error('Payables ageing error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating payables ageing report'
        });
    }
};

/**
 * @desc    Get Section 43B(h) MSME Compliance Report
 * @route   GET /api/v1/reports/ageing/msme-compliance
 * @access  Private
 */
export const getMSMEComplianceReport = async (req: AuthRequest, res: Response) => {
    // Note: Reusing getPayablesAgeing logic or keeping it separate?
    // The previous implementation used Purchase Bills directly.
    // For compliance, "Date of Acceptance" is key. 
    // Using Purchase Bills directly is safer for "Compliance Date" tracking than Ledger.
    // However, to be consistent, we should verify balance via Ledger.
    // For now, retaining the Document-based logic for this SPECIFIC compliance report is acceptable 
    // because it relies on Invoice Date / Acceptance Date heavily, 
    // but in a strict system, we'd ensure the Bill isn't fully paid in Ledger.
    // Given the scope, let's keep the existing implementation but ensure it checks 'balanceAmount' which
    // currently is on the PurchaseBill model. 
    // WARNING: If we pay via Journal, 'balanceAmount' on PurchaseBill might not actully update 
    // unless our Accounting Service updates the Bill record too.
    // The Invoice/Bill 'balanceAmount' field IS a denormalization.
    // In a pure ledger system, we ignore it.
    // Ideally, we should fetch open items for MSME creditors.

    // Let's refactor this to be safe: Use getOpenItems for Payables, filter for MSME.

    try {
        const companyId = req.user!.companyId;
        const today = new Date();

        // 1. Get Open Payables
        const { openItems } = await accountingService.getOpenItems(companyId, 'SUNDRY_CREDITORS', today);

        // 2. Filter for MSME Suppliers
        const ledgerIds = new Set(openItems.map(i => i.ledgerId)); // Only care about open bills
        const ledgers = await prisma.ledger.findMany({
            where: { id: { in: Array.from(ledgerIds) } },
            include: { party: true }
        });
        const ledgerPartyMap = new Map(ledgers.map(l => [l.id, l.party]));

        // 3. Resolve Bill Details
        const billIds = openItems
            .filter(i => i.referenceType === 'PURCHASE_BILL' && i.referenceId)
            .map(i => i.referenceId);

        const bills = await prisma.purchaseBill.findMany({
            where: { id: { in: billIds } },
            select: { id: true, billNumber: true, billDate: true, dueDate: true, supplierId: true }
        });
        const billMap = new Map(bills.map(b => [b.id, b]));

        const violations: any[] = [];
        const atRisk: any[] = [];
        const compliant: any[] = [];

        for (const item of openItems) {
            const party = ledgerPartyMap.get(item.ledgerId);
            // Must be MSME
            if (!party || (!party.msmeType && !party.udyamNumber)) continue;

            // Must have positive outstanding (Credit balance)
            if (item.totalAmount <= 0) continue;

            const bill = billMap.get(item.referenceId);
            // If no bill (manual JV), fall back to posting date
            const acceptanceDate = bill?.billDate || item.date;

            const daysElapsed = Math.floor(
                (today.getTime() - new Date(acceptanceDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            const daysRemaining = 45 - daysElapsed;

            const entry = {
                billId: item.referenceId,
                billNumber: bill?.billNumber || 'JV',
                billDate: acceptanceDate,
                dueDate: bill?.dueDate,
                amount: item.totalAmount,
                supplierId: party.id,
                supplierName: party.name,
                msmeType: party.msmeType,
                udyamNumber: party.udyamNumber,
                daysElapsed,
                daysRemaining: Math.max(0, daysRemaining)
            };

            if (daysElapsed > 45) {
                violations.push({ ...entry, status: 'VIOLATION' });
            } else if (daysElapsed > 30) {
                atRisk.push({ ...entry, status: 'AT_RISK' });
            } else {
                compliant.push({ ...entry, status: 'COMPLIANT' });
            }
        }

        const violationAmount = violations.reduce((sum, v) => sum + v.amount, 0);
        const atRiskAmount = atRisk.reduce((sum, v) => sum + v.amount, 0);

        res.json({
            success: true,
            data: {
                asOfDate: today,
                summary: {
                    totalMSMEBills: violations.length + atRisk.length + compliant.length,
                    violationsCount: violations.length,
                    violationsAmount: violationAmount,
                    atRiskCount: atRisk.length,
                    atRiskAmount: atRiskAmount,
                    compliantCount: compliant.length
                },
                complianceStatus: violations.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT',
                message: violations.length > 0
                    ? `🚨 ${violations.length} payments to MSME suppliers have exceeded 45 days.`
                    : '✅ Compliance Check Passed',
                violations,
                atRisk,
                compliant
            }
        });

    } catch (error: any) {
        logger.error('MSME compliance report error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating MSME compliance report'
        });
    }
};
