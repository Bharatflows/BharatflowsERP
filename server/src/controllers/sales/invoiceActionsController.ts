/**
 * Invoice Actions Controller
 * 
 * Handles invoice actions: payments, status updates, PDF download, email sending.
 * Split from salesController.ts for better maintainability.
 */

import { Response } from 'express';
import prisma from '../../config/prisma';
import logger from '../../config/logger';
import { AuthRequest } from '../../middleware/auth';

// @desc    Record payment against invoice
// @route   POST /api/v1/sales/invoices/:id/payment
// @access  Private
export const recordPayment = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { amount, paymentDate, paymentMethod, reference, bankAccountId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid payment amount is required'
            });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id , companyId: req.user.companyId },
            include: { customer: true }
        });

        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const paymentAmount = Number(amount);
        const currentBalance = Number(invoice.balanceAmount);

        if (paymentAmount > currentBalance) {
            return res.status(400).json({
                success: false,
                message: `Payment amount (${paymentAmount}) exceeds balance (${currentBalance})`
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const newPaidAmount = Number(invoice.amountPaid) + paymentAmount;
            const newBalanceAmount = currentBalance - paymentAmount;

            let newStatus = invoice.status;
            if (newBalanceAmount === 0) {
                newStatus = 'PAID';
            } else if (newPaidAmount > 0) {
                newStatus = 'PARTIAL';
            }

            const updatedInvoice = await tx.invoice.update({
                where: { id },
                data: {
                    amountPaid: newPaidAmount,
                    balanceAmount: newBalanceAmount,
                    status: newStatus
                },
                include: { customer: true, items: true }
            });

            await tx.party.update({
                where: { id: invoice.customerId },
                data: {
                    currentBalance: {
                        decrement: paymentAmount
                    }
                }
            });

            if (bankAccountId) {
                const bank = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
                if (bank) {
                    await tx.transaction.create({
                        data: {
                            companyId: req.user.companyId,
                            accountId: bankAccountId,
                            date: new Date(paymentDate || new Date()),
                            description: `Payment received for ${invoice.invoiceNumber}`,
                            category: 'Sales Receipt',
                            amount: paymentAmount,
                            type: 'credit',
                            reference: reference || invoice.invoiceNumber,
                            status: 'CLEARED'
                        }
                    });

                    await tx.bankAccount.update({
                        where: { id: bankAccountId },
                        data: {
                            balance: {
                                increment: paymentAmount
                            }
                        }
                    });
                }
            }

            return updatedInvoice;
        });

        logger.info(`Payment recorded: ${amount} for ${invoice.invoiceNumber} by ${req.user.email}`);

        return res.status(200).json({
            success: true,
            message: 'Payment recorded successfully',
            data: { invoice: result }
        });
    } catch (error: any) {
        logger.error('Record payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error recording payment',
            error: error.message
        });
    }
};

// @desc    Update invoice status
// @route   PUT /api/v1/sales/invoices/:id/status
// @access  Private
// H1: HYBRID APPROACH - Phase 1: Strict server-side transition validation
export const updateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const invoice = await prisma.invoice.findUnique({ where: { id , companyId: req.user.companyId } });

        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // H1: Define allowed transitions (current status → allowed new statuses)
        const ALLOWED_TRANSITIONS: Record<string, string[]> = {
            'DRAFT': ['SENT', 'CANCELLED'],
            'SENT': ['PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'],
            'PARTIAL': ['PAID', 'CANCELLED'],
            'OVERDUE': ['PAID', 'PARTIAL', 'CANCELLED'],
            'PAID': [], // LOCKED - no transitions allowed
            'CANCELLED': [] // LOCKED - no transitions allowed
        };

        const currentStatus = invoice.status;
        const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];

        // H1: Block transition if not allowed
        if (!allowedNextStatuses.includes(status)) {
            // Same status is a no-op, not an error
            if (currentStatus === status) {
                return res.status(200).json({
                    success: true,
                    message: 'Invoice status unchanged',
                    data: { invoice }
                });
            }

            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${currentStatus} to ${status}. Allowed transitions: ${allowedNextStatuses.join(', ') || 'None (status is locked)'}`,
                code: 'INVALID_STATUS_TRANSITION'
            });
        }

        // H1: Block PAID if balance is outstanding (derived status rule)
        if (status === 'PAID' && Number(invoice.balanceAmount) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot mark as PAID when balance is outstanding. Use payment recording instead.',
                code: 'PAID_REQUIRES_ZERO_BALANCE'
            });
        }

        const updatedInvoice = await prisma.invoice.update({
            where: { id , companyId: req.user.companyId },
            data: { status },
            include: { customer: true, items: true }
        });

        logger.info(`[H1] Invoice status updated: ${invoice.invoiceNumber} from ${currentStatus} to ${status} by ${req.user.email}`);

        return res.status(200).json({
            success: true,
            message: 'Invoice status updated successfully',
            data: { invoice: updatedInvoice }
        });
    } catch (error: any) {
        logger.error('Update invoice status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating invoice status',
            error: error.message
        });
    }
};

// @desc    Download invoice as PDF
// @route   GET /api/v1/sales/invoices/:id/pdf
// @access  Private
export const downloadInvoicePDF = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id , companyId: req.user.companyId },
            include: {
                customer: true,
                items: true
            }
        });

        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const company = await prisma.company.findUnique({
            where: { id: req.user.companyId }
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        const { generatePDFBuffer } = await import('../../services/pdfService');

        const pdfData = {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate || undefined,
            customer: {
                name: invoice.customer?.name || 'Unknown Customer',
                email: invoice.customer?.email || undefined,
                phone: invoice.customer?.phone || undefined,
                gstNumber: invoice.customer?.gstin || undefined,
                address: (invoice.customer as any)?.billingAddress || undefined
            },
            company: {
                businessName: company.businessName,
                legalName: company.legalName || undefined,
                gstin: company.gstin || undefined,
                phone: company.phone || undefined,
                email: company.email || undefined,
                address: company.address
            },
            items: invoice.items.map((item: any) => ({
                productName: item.productName,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                gstRate: Number(item.gstRate || 0),
                amount: Number(item.amount || item.quantity * item.rate)
            })),
            subtotal: Number(invoice.subtotal),
            cgst: Number((invoice as any).cgst || 0),
            sgst: Number((invoice as any).sgst || 0),
            igst: Number((invoice as any).igst || 0),
            totalAmount: Number(invoice.totalAmount),
            amountPaid: Number(invoice.amountPaid || 0),
            balanceAmount: Number(invoice.balanceAmount || invoice.totalAmount),
            notes: invoice.notes || undefined,
            terms: (invoice as any).terms || undefined
        };

        const pdfBuffer = await generatePDFBuffer(pdfData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

        logger.info(`PDF downloaded: ${invoice.invoiceNumber} by ${req.user.email}`);
    } catch (error: any) {
        logger.error('Download PDF error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error generating PDF',
            error: error.message
        });
    }
};

// @desc    Send invoice to customer via email
// @route   POST /api/v1/sales/invoices/:id/send
// @access  Private
export const sendInvoiceEmail = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { email: customEmail, message: customMessage } = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id , companyId: req.user.companyId },
            include: { customer: true, items: true }
        });

        if (!invoice || invoice.companyId !== req.user.companyId) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        const customerEmail = customEmail || invoice.customer?.email;
        if (!customerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Customer email not found. Please provide an email address.'
            });
        }

        const company = await prisma.company.findUnique({
            where: { id: req.user.companyId }
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        const { generatePDFBuffer } = await import('../../services/pdfService');

        const pdfData = {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate || undefined,
            customer: {
                name: invoice.customer?.name || 'Customer',
                email: invoice.customer?.email || undefined,
                phone: invoice.customer?.phone || undefined,
                gstNumber: invoice.customer?.gstin || undefined,
            },
            company: {
                businessName: company.businessName,
                legalName: company.legalName || undefined,
                gstin: company.gstin || undefined,
                phone: company.phone || undefined,
                email: company.email || undefined,
                address: company.address
            },
            items: invoice.items.map((item: any) => ({
                productName: item.productName,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                gstRate: Number(item.gstRate || 0),
                amount: Number(item.amount || item.quantity * item.rate)
            })),
            subtotal: Number(invoice.subtotal),
            totalAmount: Number(invoice.totalAmount),
            amountPaid: Number(invoice.amountPaid || 0),
            balanceAmount: Number(invoice.balanceAmount || invoice.totalAmount),
            notes: invoice.notes || undefined
        };

        const pdfBuffer = await generatePDFBuffer(pdfData);

        const { sendEmail, generateInvoiceEmailHTML } = await import('../../services/emailService');

        const formatDate = (date: Date | null): string => {
            if (!date) return 'N/A';
            return new Date(date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        };

        await sendEmail({
            to: customerEmail,
            subject: `Invoice ${invoice.invoiceNumber} from ${company.businessName}`,
            html: generateInvoiceEmailHTML({
                companyName: company.businessName,
                customerName: invoice.customer?.name || 'Customer',
                invoiceNumber: invoice.invoiceNumber,
                amount: Number(invoice.totalAmount),
                dueDate: formatDate(invoice.dueDate),
                customMessage
            }),
            attachments: [{
                filename: `${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer
            }],
            senderEmail: req.user.email,
            senderName: company.businessName
        });

        if (invoice.status === 'DRAFT') {
            await prisma.invoice.update({
                where: { id , companyId: req.user.companyId },
                data: { status: 'SENT' }
            });
        }

        logger.info(`Invoice ${invoice.invoiceNumber} sent to ${customerEmail} by ${req.user.email}`);

        return res.status(200).json({
            success: true,
            message: `Invoice sent successfully to ${customerEmail}`
        });
    } catch (error: any) {
        logger.error('Send invoice email error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error sending invoice email'
        });
    }
};
