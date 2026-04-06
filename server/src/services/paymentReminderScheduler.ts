/**
 * Payment Reminder Scheduler
 * Sends automated reminders for overdue invoices via email
 */
import prisma from '../config/prisma';
import logger from '../config/logger';
import { sendCompanyEmail } from './companyEmailService';
import { emailTemplates } from './emailTemplateService';

interface ReminderSchedule {
    daysAfterDue: number;
    channel: 'email' | 'sms' | 'whatsapp';
}

const DEFAULT_SCHEDULE: ReminderSchedule[] = [
    { daysAfterDue: 3, channel: 'email' },
    { daysAfterDue: 7, channel: 'email' },
    { daysAfterDue: 14, channel: 'email' },
    { daysAfterDue: 30, channel: 'email' },
    { daysAfterDue: 60, channel: 'email' },
];

export class PaymentReminderScheduler {
    /**
     * Process all overdue invoices and send reminders
     * Call this from a cron job (e.g., daily at 9 AM)
     */
    static async processReminders(companyId: string) {
        const now = new Date();
        const results = { sent: 0, skipped: 0, errors: 0 };

        // Find overdue invoices with balance
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                companyId,
                deletedAt: null,
                dueDate: { lt: now },
                balanceAmount: { gt: 0 },
                status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
            },
            include: {
                customer: { select: { name: true, email: true, phone: true } },
                company: { select: { legalName: true, businessName: true } },
            },
        });

        for (const inv of overdueInvoices) {
            const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate!).getTime()) / 86400000);

            // Find the right schedule tier
            const tier = [...DEFAULT_SCHEDULE].reverse().find(s => daysOverdue >= s.daysAfterDue);
            if (!tier) continue;

            // Check if we already sent a reminder at this tier
            const alreadySent = await prisma.settingsAuditLog.findFirst({
                where: {
                    companyId,
                    action: 'PAYMENT_REMINDER',
                    fieldName: inv.id,
                    oldValue: String(tier.daysAfterDue),
                },
            });

            if (alreadySent) { results.skipped++; continue; }

            // Send reminder
            try {
                if (tier.channel === 'email' && inv.customer?.email) {
                    const html = emailTemplates.paymentReminder({
                        customerName: inv.customer.name || 'Customer',
                        invoiceNumber: inv.invoiceNumber,
                        amount: Number(inv.balanceAmount),
                        dueDate: new Date(inv.dueDate!).toLocaleDateString('en-IN'),
                        daysOverdue,
                    });
                    await sendCompanyEmail({
                        companyId,
                        to: inv.customer.email,
                        subject: `Payment Reminder: Invoice #${inv.invoiceNumber} — ${daysOverdue} days overdue`,
                        html,
                    });
                }

                // Record that we sent this tier
                await prisma.settingsAuditLog.create({
                    data: {
                        companyId,
                        userId: 'system',
                        action: 'PAYMENT_REMINDER',
                        settingType: 'reminders',
                        fieldName: inv.id,
                        oldValue: String(tier.daysAfterDue),
                        newValue: tier.channel,
                    },
                });

                results.sent++;
                logger.info(`[Reminder] Sent ${tier.channel} for invoice ${inv.invoiceNumber} (${daysOverdue}d overdue)`);
            } catch (err: any) {
                results.errors++;
                logger.error(`[Reminder] Failed for ${inv.invoiceNumber}: ${err.message}`);
            }
        }

        logger.info(`[Reminder] Run complete: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`);
        return results;
    }

    /**
     * Get reminder history for an invoice
     */
    static async getReminderHistory(invoiceId: string, companyId: string) {
        const logs = await prisma.settingsAuditLog.findMany({
            where: { companyId, action: 'PAYMENT_REMINDER', fieldName: invoiceId },
            orderBy: { timestamp: 'desc' },
        });
        return logs.map(l => ({
            daysAfterDue: parseInt(l.oldValue || '0'),
            channel: l.newValue,
            sentAt: l.timestamp,
        }));
    }

    /**
     * Snooze reminders for a specific invoice
     */
    static async snoozeReminder(invoiceId: string, companyId: string, snoozeDays: number) {
        await prisma.settingsAuditLog.create({
            data: {
                companyId,
                userId: 'system',
                action: 'PAYMENT_REMINDER',
                settingType: 'snooze',
                fieldName: invoiceId,
                oldValue: 'SNOOZED',
                newValue: String(snoozeDays),
            },
        });
        return { snoozed: true, until: new Date(Date.now() + snoozeDays * 86400000) };
    }
}
