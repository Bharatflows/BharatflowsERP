import nodemailer from 'nodemailer';
import logger from '../config/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
  // Use sender info from user's account
  senderEmail?: string;  // User's email (the email they registered with)
  senderName?: string;   // Company name for display
}

// Create transporter - configure via environment variables
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    logger.warn('SMTP credentials not configured. Email sending will fail.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('Email service not configured. Please set SMTP credentials in environment.');
  }

  try {
    // Build the "from" and "replyTo" addresses
    // Note: Gmail SMTP requires "from" to match the authenticated user
    // We use replyTo so customer can reply directly to the user's email
    const smtpUser = process.env.SMTP_USER || 'noreply@bharatflow.com';
    const senderDisplay = options.senderName
      ? `"${options.senderName}" <${smtpUser}>`
      : smtpUser;

    // If user has their own email, set it as replyTo
    const replyTo = options.senderEmail
      ? `"${options.senderName || 'BharatFlow'}" <${options.senderEmail}>`
      : undefined;

    await transporter.sendMail({
      from: senderDisplay,
      replyTo: replyTo,  // Customer replies go to user's email
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/pdf'
      }))
    });

    logger.info(`Email sent successfully to ${options.to}${replyTo ? ` (reply-to: ${options.senderEmail})` : ''}`);
    return true;
  } catch (error: any) {
    logger.error('Email send error:', error);
    throw error;
  }
}

export function generateInvoiceEmailHTML(data: {
  companyName: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  customMessage?: string;
}): string {
  // ... existing code ...
  return `...`;
}

// ... existing generateQuotationEmailHTML ...

export function generateInviteEmailHTML(data: {
  companyName: string;
  recipientName: string;
  inviteLink: string;
  message?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${data.companyName}</h1>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 20px;">Invitation to Connect</h2>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Dear ${data.recipientName},
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            ${data.companyName} has invited you to connect on BharatFlow for secure messaging and document sharing.
          </p>

          ${data.message ? `<p style="background-color: #f8fafc; padding: 15px; border-radius: 8px; font-style: italic; color: #4b5563; margin-bottom: 25px;">"${data.message}"</p>` : ''}
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${data.inviteLink}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Accept Invitation</a>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br>
            <a href="${data.inviteLink}" style="color: #8b5cf6; word-break: break-all; font-size: 14px;">${data.inviteLink}</a>
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            This email was sent by ${data.companyName} via BharatFlow
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

