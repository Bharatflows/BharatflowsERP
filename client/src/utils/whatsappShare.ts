/**
 * WhatsApp Share Utility
 * Provides functions for sharing content via WhatsApp
 */

interface ShareData {
    phone?: string;
    text: string;
}

/**
 * Generate WhatsApp deep link URL
 * @param data Share data containing optional phone and text message
 * @returns WhatsApp URL that opens the app or web
 */
export function getWhatsAppUrl(data: ShareData): string {
    const encodedText = encodeURIComponent(data.text);

    if (data.phone) {
        // Clean phone number (remove spaces, dashes, etc)
        const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
        // If Indian number without country code, add +91
        const phoneWithCode = cleanPhone.startsWith('+')
            ? cleanPhone
            : cleanPhone.startsWith('91')
                ? `+${cleanPhone}`
                : `+91${cleanPhone}`;

        return `https://wa.me/${phoneWithCode.replace('+', '')}?text=${encodedText}`;
    }

    // Without phone number - opens WhatsApp with message ready to share
    return `https://wa.me/?text=${encodedText}`;
}

/**
 * Share via WhatsApp
 * @param data Share data containing optional phone and text message
 */
export function shareViaWhatsApp(data: ShareData): void {
    const url = getWhatsAppUrl(data);
    window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Generate invoice share message
 */
export function generateInvoiceShareMessage(invoice: {
    invoiceNumber: string;
    partyName: string;
    totalAmount: number;
    dueDate?: string;
    viewUrl?: string;
}): string {
    const lines = [
        `📄 *Invoice ${invoice.invoiceNumber}*`,
        '',
        `Dear ${invoice.partyName},`,
        '',
        `Please find your invoice details below:`,
        `• Invoice No: ${invoice.invoiceNumber}`,
        `• Amount: ₹${invoice.totalAmount.toLocaleString('en-IN')}`,
    ];

    if (invoice.dueDate) {
        lines.push(`• Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`);
    }

    if (invoice.viewUrl) {
        lines.push('', `🔗 View Invoice: ${invoice.viewUrl}`);
    }

    lines.push('', 'Thank you for your business!');

    return lines.join('\n');
}

/**
 * Generate quotation share message
 */
export function generateQuotationShareMessage(quotation: {
    quotationNumber: string;
    partyName: string;
    totalAmount: number;
    validUntil?: string;
    viewUrl?: string;
}): string {
    const lines = [
        `📋 *Quotation ${quotation.quotationNumber}*`,
        '',
        `Dear ${quotation.partyName},`,
        '',
        `Thank you for your interest! Here are the quotation details:`,
        `• Quotation No: ${quotation.quotationNumber}`,
        `• Amount: ₹${quotation.totalAmount.toLocaleString('en-IN')}`,
    ];

    if (quotation.validUntil) {
        lines.push(`• Valid Until: ${new Date(quotation.validUntil).toLocaleDateString('en-IN')}`);
    }

    if (quotation.viewUrl) {
        lines.push('', `🔗 View Quotation: ${quotation.viewUrl}`);
    }

    lines.push('', 'Looking forward to your response!');

    return lines.join('\n');
}

export default {
    getWhatsAppUrl,
    shareViaWhatsApp,
    generateInvoiceShareMessage,
    generateQuotationShareMessage,
};
