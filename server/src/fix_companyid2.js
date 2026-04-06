const fs = require('fs');
const path = require('path');

const directoryPath = 'c:\\Users\\Deepak\\msmeantigravity\\server\\src\\controllers';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('__tests__') && !file.includes('syncController')) { // skip tests and sync for now
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(directoryPath);
const tenantModels = [
    'ExpenseCategory', 'Notification', 'Product', 'Party', 'Invoice', 'Receipt',
    'CreditNote', 'DebitNote', 'Expense', 'PurchaseOrder', 'Employee', 'BankAccount',
    'Transaction', 'PaymentReminder', 'Estimate', 'SalesOrder', 'Subscription',
    'PaymentGatewayConfig', 'SettingsAuditLog', 'SettingsApprovalRequest',
    'WastageLog', 'ChannelConfig', 'ChannelOrder', 'DeliveryChallan',
    'GoodsReceivedNote', 'Quotation', 'EInvoice', 'EWaybill', 'StockMovement',
    'StockBatch', 'StockAdjustment', 'BillOfMaterial', 'WorkOrder', 'ProductionPlan',
    'QualityInspection', 'MaintenanceSchedule', 'PostDatedCheque', 'FinancialYear',
    'FinancialPeriod', 'LedgerGroup', 'Ledger', 'Voucher', 'POSSession', 'RecurringInvoiceProfile',
    'PurchaseBill', 'Branch', 'Warehouse', 'CustomRole'
];

let fixedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    for (const model of tenantModels) {
        const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);

        // Match `prisma.model.findUnique({ where: { id: ... } })`
        // We look for where: { ... } without companyId
        const regex = new RegExp(`(prisma\\.${lowerModel}\\.(?:findUnique|findFirst|update|delete)\\s*\\(\\s*\\{[\\s\\S]*?where\\s*:\\s*\\{)([^}]*?)(\\})`, 'g');

        content = content.replace(regex, (match, before, inner, after) => {
            if (!inner.includes('companyId')) {
                // Determine what variable to use for companyId
                let companyIdVar = 'req.user.companyId';

                // If the file uses `companyId` as a local variable, let's just use `companyId`
                // Quick heuristic: If `req.user.companyId` doesn't seem to be the primary way or if we see `companyId` in the function scope
                // We'll just default to `companyId: req.user.companyId` unless its a webhook/service, but these are controllers.
                // Let's check if the inner content has ids
                if (inner.trim() === '') return match; // empty where

                fixedCount++;
                const newInner = inner.trim().endsWith(',')
                    ? `${inner} companyId: req.user.companyId `
                    : `${inner}, companyId: req.user.companyId `;
                return `${before}${newInner}${after}`;
            }
            return match;
        });
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
}

console.log(`Fixed ${fixedCount} violations`);
