interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: {
        filename: string;
        content: Buffer;
        contentType?: string;
    }[];
    senderEmail?: string;
    senderName?: string;
}
export declare function sendEmail(options: EmailOptions): Promise<boolean>;
export declare function generateInvoiceEmailHTML(data: {
    companyName: string;
    customerName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    customMessage?: string;
}): string;
export declare function generateInviteEmailHTML(data: {
    companyName: string;
    recipientName: string;
    inviteLink: string;
    message?: string;
}): string;
export {};
//# sourceMappingURL=emailService.d.ts.map