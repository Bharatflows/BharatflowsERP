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
            if (!file.includes('__tests__')) {
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

let totalViolations = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;

    // Naive regex to find prisma.Model.findUnique({ where: { id: XYZ } })
    // and see if companyId is missing.
    // We'll just locate them first and log them.
    for (const model of tenantModels) {
        const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);

        // Match prisma.model.findUnique or findFirst
        const regex = new RegExp(`prisma\\.${lowerModel}\\.(findUnique|findFirst|update|delete)\\s*\\(\\s*\\{\\s*where\\s*:\\s*\\{([^{}]*)\\}`, 'g');

        let match;
        while ((match = regex.exec(content)) !== null) {
            const operation = match[1];
            const whereClause = match[2];

            if (!whereClause.includes('companyId')) {
                console.log(`Violation in ${file}:${match.index} - prisma.${lowerModel}.${operation}({ where: {${whereClause}} })`);
                totalViolations++;
            }
        }
    }
}

console.log(`Total violations found: ${totalViolations}`);
