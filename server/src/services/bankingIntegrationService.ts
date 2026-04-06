import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

export interface ExternalTransaction {
    externalId: string;
    date: Date;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    reference?: string;
    category?: string;
}

export class BankingIntegrationService {
    /**
     * Sync transactions from an external provider (Mocked for now)
     */
    static async syncTransactions(accountId: string, companyId: string) {
        try {
            const account = await prisma.bankAccount.findUnique({
                where: { id: accountId, companyId }
            });

            if (!account || !account.provider) {
                throw new Error('Bank account not configured for integration');
            }

            logger.info(`Starting sync for account: ${account.name} (Provider: ${account.provider})`);

            // 1. Fetch data from Provider (Mocked)
            const externalData = await this.fetchFromProvider(account.provider, account.providerAccountId!);

            // 2. Process and Deduplicate
            let newTransactionsCount = 0;
            let totalAmountChange = 0;

            await prisma.$transaction(async (tx) => {
                for (const extTx of externalData) {
                    // Check if transaction already exists
                    const existing = await tx.transaction.findUnique({
                        where: { externalId: extTx.externalId }
                    });

                    if (!existing) {
                        await tx.transaction.create({
                            data: {
                                companyId,
                                accountId,
                                date: extTx.date,
                                description: extTx.description,
                                amount: extTx.amount,
                                type: extTx.type,
                                externalId: extTx.externalId,
                                reference: extTx.reference,
                                category: extTx.category || 'General',
                                status: 'CLEARED'
                            }
                        });

                        newTransactionsCount++;
                        totalAmountChange += extTx.type === 'credit' ? extTx.amount : -extTx.amount;
                    }
                }

                // 3. Update Account Balance
                if (newTransactionsCount > 0) {
                    await tx.bankAccount.update({
                        where: { id: accountId },
                        data: {
                            balance: { increment: totalAmountChange },
                            lastSyncAt: new Date()
                        }
                    });
                } else {
                    await tx.bankAccount.update({
                        where: { id: accountId },
                        data: { lastSyncAt: new Date() }
                    });
                }
            });

            return {
                success: true,
                newTransactions: newTransactionsCount,
                message: `Sync complete. Found ${newTransactionsCount} new transactions.`
            };

        } catch (error: any) {
            logger.error('Banking sync error:', error);
            throw error;
        }
    }

    /**
     * Record an internal transaction (e.g. from Receipt or Payment)
     * Updates Bank Account Balance and creates Transaction record.
     * MUST run inside a transaction.
     */
    static async recordInternalTransaction(
        companyId: string,
        accountId: string,
        amount: number,
        type: 'credit' | 'debit',
        date: Date,
        description: string,
        reference: string,
        category: string,
        prismaTx: any // Accept transaction client
    ) {
        // Validation
        const account = await prismaTx.bankAccount.findUnique({
            where: { id: accountId }
        });
        if (!account) throw new Error('Bank Account not found for ID: ' + accountId);

        // Update Balance
        const balanceChange = type === 'credit' ? amount : -amount;

        await prismaTx.bankAccount.update({
            where: { id: accountId },
            data: { balance: { increment: balanceChange } }
        });

        // Create Transaction
        return prismaTx.transaction.create({
            data: {
                companyId,
                accountId,
                date,
                amount,
                type,
                description,
                reference,
                category,
                status: 'CLEARED'
            }
        });
    }

    /**
     * Mock provider API call
     */
    private static async fetchFromProvider(provider: string, externalAccountId: string): Promise<ExternalTransaction[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return some dummy data based on date
        const today = new Date();
        return [
            {
                externalId: `tx_${provider}_${Date.now()}_1`,
                date: today,
                description: `MOCK: ${provider} Deposit`,
                amount: 5000,
                type: 'credit',
                reference: 'REF-BANK-001',
                category: 'Sales'
            },
            {
                externalId: `tx_${provider}_${Date.now()}_2`,
                date: today,
                description: `MOCK: ${provider} Service Charge`,
                amount: 15.50,
                type: 'debit',
                reference: 'FEES-01',
                category: 'Bank Charges'
            }
        ];
    }
}
