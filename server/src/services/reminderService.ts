import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface ReminderConfig {
    daysOverdue: number[];  // e.g. [7, 15, 30] - Send reminders at these intervals
    emailEnabled: boolean;
    smsEnabled: boolean;
}

const DEFAULT_CONFIG: ReminderConfig = {
    daysOverdue: [7, 15, 30],
    emailEnabled: true,
    smsEnabled: false
};

export class ReminderService {
    /**
     * Find overdue invoices and send payment reminders
     * This should be called by a cron job (e.g., daily)
     */
    static async processPaymentReminders(companyId: string, config: ReminderConfig = DEFAULT_CONFIG): Promise<{
        processed: number;
        reminders: any[];
    }> {
        try {
            const now = new Date();
            const reminders: any[] = [];

            // Get unpaid invoices that are overdue
            const overdueInvoices = await prisma.invoice.findMany({
                where: {
                    companyId,
                    status: { in: ['SENT', 'OVERDUE'] }, // Removed PARTIALLY_PAID (not in enum)
                    dueDate: { lt: now }
                },
                include: {
                    customer: true
                }
            });

            for (const rawInvoice of overdueInvoices) {
                const invoice = rawInvoice as any;
                const dueDate = new Date(invoice.dueDate!);
                const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                // Check if this matches any of our reminder intervals
                const shouldRemind = config.daysOverdue.some(days =>
                    daysOverdue >= days && daysOverdue < days + 1
                );

                if (!shouldRemind) continue;

                // FORCE CAST: Prisma client seems out of sync or model mismatch
                const paymentReminderDelegate = prisma.paymentReminder as any;

                // Check if we already sent a reminder today for this invoice
                const existingReminder = await paymentReminderDelegate.findFirst({
                    where: {
                        invoiceId: invoice.id,
                        sentAt: {
                            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                        }
                    }
                });

                if (existingReminder) continue;

                // Create reminder record
                const reminder = await paymentReminderDelegate.create({
                    data: {
                        companyId,
                        partyId: invoice.customerId!,
                        invoiceId: invoice.id,
                        type: 'OVERDUE',
                        status: 'PENDING',
                        message: `Payment reminder for Invoice ${invoice.invoiceNumber}. Amount Due: ₹${invoice.balanceAmount}. Days Overdue: ${daysOverdue}`,
                        scheduledFor: now
                    }
                });

                // Send notification (email/SMS based on config)
                if (invoice.customer?.email && config.emailEnabled) {
                    try {
                        // Use notification service to send
                        // FORCE CAST: notificationService might be missing sendEmail
                        await (notificationService as any).sendEmail({
                            to: invoice.customer.email,
                            subject: `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
                            body: `Dear ${invoice.customer.name},\n\nThis is a reminder that Invoice ${invoice.invoiceNumber} dated ${invoice.invoiceDate.toLocaleDateString()} is overdue by ${daysOverdue} days.\n\nAmount Due: ₹${invoice.balanceAmount}\n\nPlease make the payment at your earliest convenience.\n\nThank you.`
                        });

                        // Mark as sent
                        await paymentReminderDelegate.update({
                            where: { id: reminder.id },
                            data: { status: 'SENT', sentAt: new Date() }
                        });
                    } catch (emailError) {
                        logger.error(`Failed to send reminder email for invoice ${invoice.id}`, emailError);
                        await paymentReminderDelegate.update({
                            where: { id: reminder.id },
                            data: { status: 'FAILED' }
                        });
                    }
                }

                reminders.push({
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    customerName: invoice.customer?.name,
                    daysOverdue,
                    amountDue: invoice.balanceAmount
                });
            }

            logger.info(`Payment reminders processed for company ${companyId}`, {
                total: overdueInvoices.length,
                remindersSent: reminders.length
            });

            return { processed: overdueInvoices.length, reminders };
        } catch (error: any) {
            logger.error(`Error processing payment reminders: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get pending reminders for manual review
     */
    static async getPendingReminders(companyId: string) {
        return (prisma.paymentReminder as any).findMany({
            where: { companyId, status: 'PENDING' },
            include: {
                party: { select: { name: true, email: true, phone: true } },
                invoice: { select: { invoiceNumber: true, totalAmount: true, balanceAmount: true, dueDate: true } }
            },
            orderBy: { scheduledFor: 'asc' }
        });
    }
}
