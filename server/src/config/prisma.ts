import { PrismaClient } from '@prisma/client';

const TENANT_MODELS = [
    'ExpenseCategory', 'Notification', 'Product', 'Party', 'Invoice', 'Receipt',
    'CreditNote', 'DebitNote', 'Expense', 'PurchaseOrder', 'Employee', 'BankAccount',
    'Transaction', 'PaymentReminder', 'Estimate', 'SalesOrder', 'Subscription',
    'PaymentGatewayConfig', 'SettingsAuditLog', 'SettingsApprovalRequest',
    'WastageLog', 'ChannelConfig', 'ChannelOrder', 'DeliveryChallan',
    'GoodsReceivedNote', 'Quotation', 'EInvoice', 'EWaybill', 'StockMovement',
    'StockBatch', 'StockAdjustment', 'BillOfMaterial', 'WorkOrder', 'ProductionPlan',
    'QualityInspection', 'MaintenanceSchedule', 'PostDatedCheque', 'FinancialYear',
    'FinancialPeriod', 'LedgerGroup', 'Ledger', 'Voucher', 'POSSession', 'RecurringInvoiceProfile',
    'PurchaseBill', 'Branch', 'Warehouse', 'CustomRole', 'CompanyEmailConfig'
];

const prisma = new PrismaClient().$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                if (TENANT_MODELS.includes(model)) {
                    // Enforce companyId in 'where' clause for relevant operations
                    if (['findUnique', 'findFirst', 'findMany', 'delete', 'update', 'deleteMany', 'updateMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                        const where = (args as any).where || {};

                        // Check if companyId is present in 'where'
                        if (!where.companyId) {
                            // For findUnique, if id is provided but companyId is missing, it's a violation unless checking by compound key
                            // But we can't easily check compound key structure here without DMMF.
                            // Strict rule: MUST provide companyId.
                            // This effectively forces use of findFirst over findUnique if findUnique doesn't support companyId in input.
                            // Or use compound unique constraints if available.
                            throw new Error(`Security Violation: Missing companyId in ${operation} on ${model}. Tenant isolation is strictly enforced.`);
                        }
                    }

                    // Enforce companyId in 'data' for create operations
                    if (['create', 'createMany', 'upsert'].includes(operation)) {
                        // Basic check, though usually type system catches this.
                        // upsert has create/update sections.
                        // This is harder to check generically for 'create' because input type varies (data vs data: []).
                        // Skipping explicit data check for now, trusting types + where check on reads/updates.
                    }
                }
                return query(args);
            }
        }
    }
});

export default prisma;
