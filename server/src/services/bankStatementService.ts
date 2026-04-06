/**
 * Bank Statement Import Service
 * Parse CSV, OFX, and store as transactions using SettingsAuditLog for persistence
 * (BankTransaction model to be added in future migration — using audit log as interim store)
 */
import prisma from '../config/prisma';
import logger from '../config/logger';

interface ParsedTransaction {
    date: Date;
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    reference?: string;
    balance?: number;
}

export class BankStatementImportService {
    /**
     * Parse CSV bank statement
     * Supports common Indian bank formats (SBI, HDFC, ICICI, Axis)
     */
    static parseCSV(csvContent: string): ParsedTransaction[] {
        const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) throw new Error('CSV must have header + at least one row');

        const header = lines[0].toLowerCase();
        const transactions: ParsedTransaction[] = [];
        const isIndianFormat = header.includes('debit') && header.includes('credit');

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            if (cols.length < 3) continue;

            try {
                if (isIndianFormat) {
                    const date = this.parseDate(cols[0]);
                    const desc = cols[1];
                    const debit = parseFloat(cols[2]) || 0;
                    const credit = parseFloat(cols[3]) || 0;
                    const balance = cols[4] ? parseFloat(cols[4]) : undefined;
                    const amount = credit > 0 ? credit : debit;
                    const type = credit > 0 ? 'CREDIT' as const : 'DEBIT' as const;
                    transactions.push({ date, description: desc, amount, type, balance, reference: cols[5] || undefined });
                } else {
                    const date = this.parseDate(cols[0]);
                    const desc = cols[1];
                    const rawAmt = parseFloat(cols[2]);
                    transactions.push({ date, description: desc, amount: Math.abs(rawAmt), type: rawAmt >= 0 ? 'CREDIT' : 'DEBIT' });
                }
            } catch { continue; }
        }
        return transactions;
    }

    /**
     * Parse OFX format
     */
    static parseOFX(content: string): ParsedTransaction[] {
        const transactions: ParsedTransaction[] = [];
        const txnBlocks = content.split('<STMTTRN>').slice(1);

        for (const block of txnBlocks) {
            const getTag = (tag: string) => {
                const match = block.match(new RegExp(`<${tag}>([^<\\n]+)`));
                return match ? match[1].trim() : '';
            };
            const dateStr = getTag('DTPOSTED');
            const amount = parseFloat(getTag('TRNAMT'));
            const name = getTag('NAME') || getTag('MEMO');
            const fitid = getTag('FITID');

            if (dateStr && !isNaN(amount)) {
                const date = new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`);
                transactions.push({ date, description: name, amount: Math.abs(amount), type: amount >= 0 ? 'CREDIT' : 'DEBIT', reference: fitid });
            }
        }
        return transactions;
    }

    /**
     * Import parsed transactions — stores via Transaction model linked to BankAccount
     */
    static async importTransactions(companyId: string, bankAccountId: string, transactions: ParsedTransaction[]) {
        let imported = 0;
        let duplicates = 0;

        for (const txn of transactions) {
            // Check for duplicate via existing Transaction records
            const existing = await prisma.transaction.findFirst({
                where: {
                    accountId: bankAccountId,
                    date: txn.date,
                    amount: txn.amount,
                    ...(txn.reference ? { reference: txn.reference } : {}),
                } ,
            });
            if (existing) { duplicates++; continue; }

            await prisma.transaction.create({
                data: {
                    companyId,
                    accountId: bankAccountId,
                    date: txn.date,
                    description: txn.description,
                    category: 'Uncategorized',
                    amount: txn.amount,
                    type: txn.type,
                    reference: txn.reference || null,
                    status: 'PENDING',
                } ,
            });
            imported++;
        }

        logger.info(`[BankImport] Imported ${imported}, skipped ${duplicates} duplicates`);
        return { imported, duplicates, total: transactions.length };
    }

    private static parseDate(s: string): Date {
        const parts = s.split(/[\/\-]/);
        if (parts.length === 3 && parts[0].length <= 2) {
            return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
        }
        return new Date(s);
    }
}

/**
 * Bank Reconciliation Service
 * Auto-match bank transactions to invoices/payments
 */
export class BankReconciliationService {
    /**
     * Auto-match unmatched bank transactions against invoices
     */
    static async autoReconcile(companyId: string, bankAccountId: string) {
        const unmatched = await prisma.transaction.findMany({
            where: { accountId: bankAccountId, status: 'PENDING' } ,
        });

        let matched = 0;
        let suggested = 0;

        for (const txn of unmatched) {
            if (txn.type === 'CREDIT') {
                const invoice = await prisma.invoice.findFirst({
                    where: {
                        companyId,
                        deletedAt: null,
                        totalAmount: txn.amount,
                        status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
                    },
                    orderBy: { dueDate: 'asc' },
                });

                if (invoice) {
                    await prisma.transaction.update({
                        where: { id: txn.id },
                        data: { status: 'SUGGESTED', reference: invoice.id },
                    });
                    suggested++;
                }
            }
        }

        logger.info(`[Reconcile] Processed ${unmatched.length}: ${matched} matched, ${suggested} suggested`);
        return { processed: unmatched.length, matched, suggested, remaining: unmatched.length - matched - suggested };
    }

    /**
     * Get reconciliation status summary
     */
    static async getStatus(companyId: string, bankAccountId: string) {
        const [pending, suggested, matched, total] = await Promise.all([
            prisma.transaction.count({ where: { accountId: bankAccountId, status: 'PENDING' } }),
            prisma.transaction.count({ where: { accountId: bankAccountId, status: 'SUGGESTED' } }),
            prisma.transaction.count({ where: { accountId: bankAccountId, status: 'MATCHED' } }),
            prisma.transaction.count({ where: { accountId: bankAccountId } }),
        ]);
        return { total, pending, suggested, matched, reconciliationRate: total > 0 ? Math.round((matched / total) * 100) : 0 };
    }
}
