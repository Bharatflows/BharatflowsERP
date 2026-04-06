/**
 * Email Template Service — Transactional HTML email templates
 * Covers: invoice, payment receipt, reminder, escrow, welcome, OTP
 */

const BRAND = { color: '#0f62fe', name: 'BharatFlows', gradient: 'linear-gradient(135deg, #0f62fe 0%, #4589ff 100%)' };

function wrap(body: string, preheader = ''): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f5f5}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{background:${BRAND.gradient};padding:28px;text-align:center}
.header h1{color:#fff;margin:0;font-size:22px}
.body{padding:32px 28px}
.footer{background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8}
.btn{display:inline-block;padding:12px 28px;background:${BRAND.color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600}
.amount{font-size:28px;font-weight:700;color:#1a1a1a}
.label{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
.card{background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0}
</style></head>
<body><span style="display:none">${preheader}</span>
<div style="padding:20px"><div class="container">
<div class="header"><h1>${BRAND.name}</h1></div>
<div class="body">${body}</div>
<div class="footer">This email was sent by ${BRAND.name} · <a href="#" style="color:${BRAND.color}">Unsubscribe</a></div>
</div></div></body></html>`;
}

export const emailTemplates = {
    /** New invoice notification */
    invoice(data: { customerName: string; invoiceNumber: string; amount: number; dueDate: string; companyName: string; viewUrl?: string }) {
        return wrap(`
            <h2 style="margin:0 0 8px;font-size:18px">Invoice from ${data.companyName}</h2>
            <p style="color:#6b7280;margin:0 0 24px">Dear ${data.customerName},</p>
            <div class="card" style="text-align:center">
                <div class="label">Amount Due</div>
                <div class="amount">₹${Number(data.amount).toLocaleString('en-IN')}</div>
                <div style="color:#6b7280;font-size:13px;margin-top:4px">Invoice #${data.invoiceNumber} · Due ${data.dueDate}</div>
            </div>
            ${data.viewUrl ? `<div style="text-align:center;margin:24px 0"><a href="${data.viewUrl}" class="btn">View Invoice</a></div>` : ''}
            <p style="color:#6b7280;font-size:13px">Please make the payment by the due date to avoid any late fees.</p>
        `, `Invoice #${data.invoiceNumber} - ₹${data.amount}`);
    },

    /** Payment receipt confirmation */
    paymentReceipt(data: { customerName: string; amount: number; invoiceNumber: string; paymentDate: string; paymentMethod: string; transactionId?: string }) {
        return wrap(`
            <h2 style="margin:0 0 8px;font-size:18px">Payment Received ✓</h2>
            <p style="color:#6b7280;margin:0 0 24px">Dear ${data.customerName},</p>
            <div class="card" style="text-align:center">
                <div class="label">Payment Amount</div>
                <div class="amount" style="color:#10b981">₹${Number(data.amount).toLocaleString('en-IN')}</div>
                <div style="color:#6b7280;font-size:13px;margin-top:8px">
                    Invoice #${data.invoiceNumber}<br>
                    ${data.paymentDate} · ${data.paymentMethod}
                    ${data.transactionId ? `<br>Ref: ${data.transactionId}` : ''}
                </div>
            </div>
            <p style="color:#6b7280;font-size:13px">Thank you for your prompt payment.</p>
        `, `Payment of ₹${data.amount} received`);
    },

    /** Payment reminder */
    paymentReminder(data: { customerName: string; invoiceNumber: string; amount: number; dueDate: string; daysOverdue: number; viewUrl?: string }) {
        const severity = data.daysOverdue > 60 ? '#ef4444' : data.daysOverdue > 30 ? '#f59e0b' : '#6366f1';
        return wrap(`
            <h2 style="margin:0 0 8px;font-size:18px;color:${severity}">Payment Reminder</h2>
            <p style="color:#6b7280;margin:0 0 24px">Dear ${data.customerName},</p>
            <div class="card" style="text-align:center;border-left:4px solid ${severity}">
                <div class="label">Outstanding Amount</div>
                <div class="amount" style="color:${severity}">₹${Number(data.amount).toLocaleString('en-IN')}</div>
                <div style="color:#6b7280;font-size:13px;margin-top:4px">
                    Invoice #${data.invoiceNumber} · Due ${data.dueDate}
                    <br><strong style="color:${severity}">${data.daysOverdue} days overdue</strong>
                </div>
            </div>
            ${data.viewUrl ? `<div style="text-align:center;margin:24px 0"><a href="${data.viewUrl}" class="btn" style="background:${severity}">Pay Now</a></div>` : ''}
        `, `Reminder: Invoice #${data.invoiceNumber} is ${data.daysOverdue} days overdue`);
    },

    /** Escrow milestone update */
    escrowUpdate(data: { recipientName: string; projectName: string; milestoneName: string; status: string; amount: number }) {
        const statusColor = data.status === 'RELEASED' ? '#10b981' : data.status === 'APPROVED' ? '#0f62fe' : '#f59e0b';
        return wrap(`
            <h2 style="margin:0 0 8px;font-size:18px">Escrow Update</h2>
            <p style="color:#6b7280;margin:0 0 24px">Dear ${data.recipientName},</p>
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-weight:600">${data.projectName}</div>
                        <div style="color:#6b7280;font-size:13px">${data.milestoneName}</div>
                    </div>
                    <div style="background:${statusColor}20;color:${statusColor};padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600">${data.status}</div>
                </div>
                <div style="margin-top:12px;font-size:13px;color:#6b7280">Amount: ₹${Number(data.amount).toLocaleString('en-IN')}</div>
            </div>
        `, `Escrow: ${data.milestoneName} is ${data.status}`);
    },

    /** Welcome email for new users */
    welcome(data: { userName: string; companyName: string; loginUrl: string }) {
        return wrap(`
            <h2 style="margin:0 0 8px;font-size:18px">Welcome to ${BRAND.name}! 🎉</h2>
            <p style="color:#333;font-size:15px;line-height:1.6">Hi ${data.userName},</p>
            <p style="color:#333;font-size:15px;line-height:1.6">${data.companyName} is now set up on BharatFlows. Here's what you can do:</p>
            <div class="card">
                <div style="margin-bottom:8px">📄 Create GST-compliant invoices</div>
                <div style="margin-bottom:8px">💰 Track payments & receivables</div>
                <div style="margin-bottom:8px">📊 File GST returns (GSTR-1, GSTR-3B)</div>
                <div>🔒 Use escrow for secure transactions</div>
            </div>
            <div style="text-align:center;margin:24px 0"><a href="${data.loginUrl}" class="btn">Get Started</a></div>
        `, `Welcome to ${BRAND.name}`);
    },

    /** OTP verification */
    otp(data: { userName: string; otp: string; expiryMinutes: number }) {
        return wrap(`
            <h2 style="margin:0 0 8px;font-size:18px">Verification Code</h2>
            <p style="color:#6b7280;margin:0 0 24px">Hi ${data.userName},</p>
            <div style="text-align:center;margin:24px 0">
                <div class="label">Your One-Time Password</div>
                <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:${BRAND.color};margin:12px 0">${data.otp}</div>
                <div style="color:#6b7280;font-size:13px">Expires in ${data.expiryMinutes} minutes</div>
            </div>
            <p style="color:#ef4444;font-size:13px;text-align:center">Do not share this code with anyone.</p>
        `, `Your ${BRAND.name} verification code: ${data.otp}`);
    },
};

export default emailTemplates;
