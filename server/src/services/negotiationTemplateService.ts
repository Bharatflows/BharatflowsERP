/**
 * Negotiation Templates — Pre-built email/message templates for payment negotiation
 */
import prisma from '../config/prisma';

interface NegotiationTemplate {
    id: string;
    name: string;
    category: 'EARLY_PAYMENT' | 'DISCOUNT' | 'EXTENSION' | 'BULK_ORDER' | 'DISPUTE_RESOLUTION';
    subject: string;
    body: string;
    variables: string[];
}

const TEMPLATES: NegotiationTemplate[] = [
    {
        id: 'early-pay-2',
        name: 'Early Payment Discount Offer',
        category: 'EARLY_PAYMENT',
        subject: 'Early Payment Discount Available — Invoice #{invoiceNumber}',
        body: `Dear {supplierName},

We are pleased to offer a {discountPercent}% early payment discount on Invoice #{invoiceNumber} (₹{amount}).

If we process payment within {earlyDays} days (by {earlyDate}), the payable amount would be ₹{discountedAmount}.

Original Terms: Net {netDays} days
Early Payment: {earlyDays} days with {discountPercent}% discount

Please confirm if you'd like us to proceed with the early payment.

Best regards,
{senderName}
{companyName}`,
        variables: ['supplierName', 'invoiceNumber', 'amount', 'discountPercent', 'earlyDays', 'earlyDate', 'discountedAmount', 'netDays', 'senderName', 'companyName'],
    },
    {
        id: 'term-extension',
        name: 'Payment Term Extension Request',
        category: 'EXTENSION',
        subject: 'Payment Term Extension Request — Invoice #{invoiceNumber}',
        body: `Dear {supplierName},

We are writing regarding Invoice #{invoiceNumber} (₹{amount}), currently due on {dueDate}.

Due to {reason}, we kindly request an extension of {extensionDays} days, making the new due date {newDueDate}.

We value our partnership and assure you of prompt payment by the revised date.

Please let us know if this is acceptable.

Regards,
{senderName}
{companyName}`,
        variables: ['supplierName', 'invoiceNumber', 'amount', 'dueDate', 'reason', 'extensionDays', 'newDueDate', 'senderName', 'companyName'],
    },
    {
        id: 'bulk-discount',
        name: 'Bulk Order Discount Proposal',
        category: 'BULK_ORDER',
        subject: 'Bulk Order Discount Proposal — {itemName}',
        body: `Dear {supplierName},

We're planning to increase our order volume for {itemName} to {quantity} units per {period}.

Current pricing: ₹{currentPrice}/unit
Proposed pricing: ₹{proposedPrice}/unit ({discountPercent}% volume discount)
Estimated monthly volume: {quantity} units

This represents a significant increase from our current {currentQuantity} units and we believe a volume-based pricing adjustment would be mutually beneficial.

Please share your thoughts on this proposal.

Best regards,
{senderName}
{companyName}`,
        variables: ['supplierName', 'itemName', 'quantity', 'period', 'currentPrice', 'proposedPrice', 'discountPercent', 'currentQuantity', 'senderName', 'companyName'],
    },
    {
        id: 'dispute-resolve',
        name: 'Dispute Resolution Proposal',
        category: 'DISPUTE_RESOLUTION',
        subject: 'Resolution Proposal — Invoice #{invoiceNumber}',
        body: `Dear {supplierName},

Regarding the dispute on Invoice #{invoiceNumber}, we propose the following resolution:

Issue: {issueDescription}
Proposed Resolution: {resolution}
Adjusted Amount: ₹{adjustedAmount} (original: ₹{originalAmount})

We believe this is fair for both parties and would like to resolve this amicably.

Please respond with your acceptance or counter-proposal by {responseDate}.

Regards,
{senderName}
{companyName}`,
        variables: ['supplierName', 'invoiceNumber', 'issueDescription', 'resolution', 'adjustedAmount', 'originalAmount', 'responseDate', 'senderName', 'companyName'],
    },
];

export class NegotiationTemplateService {
    static getTemplates() { return TEMPLATES; }

    static getByCategory(category: string) {
        return TEMPLATES.filter(t => t.category === category);
    }

    static getById(id: string) {
        return TEMPLATES.find(t => t.id === id) || null;
    }

    static render(templateId: string, variables: Record<string, string>): { subject: string; body: string } | null {
        const template = this.getById(templateId);
        if (!template) return null;
        let subject = template.subject;
        let body = template.body;
        for (const [key, value] of Object.entries(variables)) {
            const re = new RegExp(`\\{${key}\\}`, 'g');
            subject = subject.replace(re, value);
            body = body.replace(re, value);
        }
        return { subject, body };
    }

    /**
     * Save custom template
     */
    static async saveCustomTemplate(companyId: string, userId: string, template: Omit<NegotiationTemplate, 'id'>) {
        const saved = await prisma.settingsAuditLog.create({
            data: {
                companyId, userId,
                action: 'NEGOTIATION_TEMPLATE',
                settingType: 'templates',
                fieldName: template.name,
                oldValue: JSON.stringify(template),
                newValue: template.category,
            },
        });
        return { id: saved.id, ...template };
    }
}
