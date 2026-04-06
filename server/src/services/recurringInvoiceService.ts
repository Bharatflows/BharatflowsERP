import prisma from '../config/prisma';
import { Job } from 'bullmq';
import logger from '../config/logger';

export class RecurringInvoiceService {
    /**
     * Creates a new recurring profile
     */
    static async createProfile(data: {
        companyId: string;
        profileName: string;
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        startDate: Date;
        endDate?: Date;
        customerId: string;
        items: any[];
        terms?: string;
        notes?: string;
    }) {
        return prisma.recurringInvoiceProfile.create({
            data: {
                ...data,
                items: JSON.stringify(data.items),
                nextRunDate: new Date(data.startDate), // First run is start date
            }
        });
    }

    /**
     * Processes all profiles due for generation
     */
    static async processDueProfiles() {
        const now = new Date();

        // Find active profiles where nextRunDate <= now
        const dueProfiles = await prisma.recurringInvoiceProfile.findMany({
            where: {
                isActive: true,
                nextRunDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            }
        });

        logger.info(`Found ${dueProfiles.length} recurring profiles due for generation`);

        const results = [];

        for (const profile of dueProfiles) {
            try {
                // Generate Invoice
                const invoice = await this.generateInvoiceFromProfile(profile);

                // Update next run date
                const nextDate = this.calculateNextRunDate(profile.nextRunDate, profile.frequency);

                await prisma.recurringInvoiceProfile.update({
                    where: { id: profile.id },
                    data: {
                        lastRunDate: now,
                        nextRunDate: nextDate
                    }
                });

                results.push({ profileId: profile.id, invoiceId: invoice.id, status: 'SUCCESS' });
            } catch (error: any) {
                logger.error(`Failed to process recurring profile ${profile.id}:`, error);
                results.push({ profileId: profile.id, error: error.message, status: 'FAILED' });
            }
        }

        return results;
    }

    private static async generateInvoiceFromProfile(profile: any) {
        // Create Invoice Logic
        // In a real implementation, we would call invoiceController.createInvoice or similar service logic
        // For now, doing a direct prisma create

        // Get next invoice number (sequence logic omitted for brevity, using timestamp)
        const invoiceNumber = `INV-${Date.now()}`;

        return prisma.invoice.create({
            data: {
                companyId: profile.companyId,
                customerId: profile.customerId,
                invoiceNumber,
                invoiceDate: new Date(),
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days
                status: 'DRAFT', // Always create as draft first
                userId: 'SYSTEM', // System user
                items: {
                    create: (profile.items as any[]).map((item: any) => ({
                        productId: item.productId,
                        productName: item.productName || 'Product',
                        quantity: item.quantity,
                        rate: item.rate,
                        taxRate: item.taxRate,
                        taxAmount: (item.quantity * item.rate * item.taxRate / 100),
                        total: (item.quantity * item.rate * (1 + item.taxRate / 100))
                    }))
                },
                subtotal: 0, // Should calculate
                totalTax: 0,
                totalAmount: 0,
                balanceAmount: 0, // Should be total
                recurringProfileId: profile.id,
                notes: profile.notes || 'Auto-generated recurring invoice',
            }
        });
    }

    private static calculateNextRunDate(current: Date, frequency: string): Date {
        const date = new Date(current);
        switch (frequency) {
            case 'DAILY': date.setDate(date.getDate() + 1); break;
            case 'WEEKLY': date.setDate(date.getDate() + 7); break;
            case 'MONTHLY': date.setMonth(date.getMonth() + 1); break;
            case 'QUARTERLY': date.setMonth(date.getMonth() + 3); break;
            case 'YEARLY': date.setFullYear(date.getFullYear() + 1); break;
        }
        return date;
    }
}
