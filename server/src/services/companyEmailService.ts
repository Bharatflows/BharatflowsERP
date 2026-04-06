import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import prisma from '../config/prisma';
import logger from '../config/logger';
import { encrypt, decrypt } from '../utils/encryption';

// Email provider presets
export const EMAIL_PROVIDER_PRESETS: Record<string, { host: string; port: number; secure: boolean }> = {
  gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
  outlook: { host: 'smtp.office365.com', port: 587, secure: false },
  yahoo: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
  zoho: { host: 'smtp.zoho.in', port: 587, secure: false },
  custom: { host: '', port: 587, secure: false },
};

export interface CompanyEmailOptions {
  companyId: string;
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

// Get the company's email config from DB
export async function getCompanyEmailConfig(companyId: string) {
  return prisma.companyEmailConfig.findUnique({ where: { companyId } });
}

// Save / update company email config (encrypts password)
export async function saveCompanyEmailConfig(companyId: string, data: {
  provider: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  fromName?: string;
}) {
  const encryptedPass = data.smtpPass ? encrypt(data.smtpPass) : undefined;

  // Apply preset if provider is known
  const preset = EMAIL_PROVIDER_PRESETS[data.provider];
  const host = data.smtpHost || preset?.host;
  const port = data.smtpPort || preset?.port || 587;
  const secure = data.smtpSecure ?? preset?.secure ?? false;

  return prisma.companyEmailConfig.upsert({
    where: { companyId },
    create: {
      companyId,
      provider: data.provider,
      smtpHost: host,
      smtpPort: port,
      smtpSecure: secure,
      smtpUser: data.smtpUser,
      smtpPass: encryptedPass,
      fromName: data.fromName,
    },
    update: {
      provider: data.provider,
      smtpHost: host,
      smtpPort: port,
      smtpSecure: secure,
      smtpUser: data.smtpUser,
      ...(encryptedPass ? { smtpPass: encryptedPass } : {}),
      fromName: data.fromName,
      isVerified: false, // re-verify after update
    },
  });
}

// Test company SMTP connection
export async function testCompanyEmailConfig(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getCompanyEmailConfig(companyId);
    if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPass) {
      return { success: false, error: 'Email not configured' };
    }
    const decryptedPass = decrypt(config.smtpPass);
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort || 587,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser, pass: decryptedPass },
    });
    await transporter.verify();
    await prisma.companyEmailConfig.update({
      where: { companyId },
      data: { isVerified: true, lastTestedAt: new Date(), lastError: null },
    });
    return { success: true };
  } catch (err: any) {
    await prisma.companyEmailConfig.update({
      where: { companyId },
      data: { isVerified: false, lastError: err.message, lastTestedAt: new Date() },
    }).catch(() => {});
    return { success: false, error: err.message };
  }
}

// Send business email using company's own SMTP config
// Falls back to system Resend/SMTP if company hasn't configured email
export async function sendCompanyEmail(options: CompanyEmailOptions): Promise<boolean> {
  const config = await getCompanyEmailConfig(options.companyId);

  // Use company SMTP if configured and verified
  if (config && config.smtpHost && config.smtpUser && config.smtpPass && config.isVerified) {
    try {
      const decryptedPass = decrypt(config.smtpPass);
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort || 587,
        secure: config.smtpSecure,
        auth: { user: config.smtpUser, pass: decryptedPass },
      });
      await transporter.sendMail({
        from: config.fromName ? `"${config.fromName}" <${config.smtpUser}>` : config.smtpUser,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType || 'application/pdf',
        })),
      });
      logger.info(`[CompanyEmail] Sent via company SMTP (${config.smtpUser}) to ${options.to}`);
      return true;
    } catch (err: any) {
      logger.error(`[CompanyEmail] Company SMTP failed for ${options.companyId}, falling back to system:`, err.message);
      // Fall through to system email
    }
  }

  // Fallback: use system Resend or SMTP with reply-to set to company email
  try {
    // Get company info for display name
    const company = await prisma.company.findUnique({
      where: { id: options.companyId },
      select: { businessName: true, email: true },
    });
    const fromName = config?.fromName || company?.businessName || 'BharatFlows';
    const replyTo = config?.smtpUser || company?.email;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: `${fromName} via BharatFlows <admin@bharatflows.com>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        replyTo: replyTo || undefined,
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: a.content.toString('base64'),
        })),
      });
    } else {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"${fromName} via BharatFlows" <${process.env.SMTP_USER}>`,
        replyTo: replyTo || undefined,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType || 'application/pdf',
        })),
      });
    }
    logger.info(`[CompanyEmail] Sent via system fallback to ${options.to} (reply-to: ${replyTo})`);
    return true;
  } catch (err: any) {
    logger.error('[CompanyEmail] System fallback also failed:', err.message);
    throw err;
  }
}
