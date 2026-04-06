-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "legalName" TEXT,
    "legalType" TEXT,
    "yearEstablished" INTEGER,
    "employeesCount" TEXT,
    "businessType" TEXT,
    "city" TEXT,
    "state" TEXT,
    "classificationLockedAt" DATETIME,
    "sector" TEXT,
    "subSector" TEXT,
    "sectorConfig" TEXT,
    "primaryCategoryId" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "bankDetails" TEXT,
    "logo" TEXT,
    "fiscalYear" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "features" TEXT,
    "enabledModules" TEXT DEFAULT '{}',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "valuationMethod" TEXT NOT NULL DEFAULT 'AVERAGE',
    CONSTRAINT "Company_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "BusinessCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budget" DECIMAL NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "maxAmount" DECIMAL,
    "ledgerId" TEXT,
    CONSTRAINT "ExpenseCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExpenseCategory_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastActive" DATETIME,
    "lastLogin" DATETIME,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "otp" TEXT,
    "otpExpiry" DATETIME,
    "refreshToken" TEXT,
    "refreshTokenExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    "moduleAccess" TEXT,
    "designation" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "signature" TEXT,
    "preferences" TEXT,
    "notificationSettings" TEXT,
    "customRoleId" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorBackup" TEXT,
    "twoFactorMethod" TEXT,
    CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "hsnCode" TEXT,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "purchasePrice" DECIMAL NOT NULL DEFAULT 0,
    "sellingPrice" DECIMAL NOT NULL DEFAULT 0,
    "mrp" DECIMAL,
    "gstRate" DECIMAL NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "barcode" TEXT,
    "category" TEXT,
    "location" TEXT,
    "maxStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "sellWithoutStock" BOOLEAN NOT NULL DEFAULT false,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "isBatchTracked" BOOLEAN NOT NULL DEFAULT false,
    "isSerialTracked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gstin" TEXT,
    "pan" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "openingBalance" DECIMAL NOT NULL DEFAULT 0,
    "currentBalance" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "msmeType" TEXT,
    "udyamNumber" TEXT,
    "creditPeriod" INTEGER NOT NULL DEFAULT 0,
    "creditScore" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Party_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "subtotal" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL NOT NULL,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "roundOff" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT,
    "deletedAt" DATETIME,
    "placeOfSupply" TEXT,
    "isReverseCharge" BOOLEAN NOT NULL DEFAULT false,
    "isInterState" BOOLEAN NOT NULL DEFAULT false,
    "cgst" DECIMAL,
    "sgst" DECIMAL,
    "igst" DECIMAL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "recurringProfileId" TEXT,
    CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_recurringProfileId_fkey" FOREIGN KEY ("recurringProfileId") REFERENCES "RecurringInvoiceProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" DECIMAL NOT NULL,
    "unusedAmount" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "voucherId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Receipt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receipt_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReceiptAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    CONSTRAINT "ReceiptAllocation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReceiptAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringInvoiceProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileName" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "nextRunDate" DATETIME NOT NULL,
    "lastRunDate" DATETIME,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customerId" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "terms" TEXT,
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringInvoiceProfile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringInvoiceProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "cgst" DECIMAL DEFAULT 0,
    "sgst" DECIMAL DEFAULT 0,
    "igst" DECIMAL DEFAULT 0,
    "total" DECIMAL NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "batchId" TEXT,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditNoteNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "invoiceId" TEXT,
    "customerId" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RETURN',
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditNoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creditNoteId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "reason" TEXT,
    CONSTRAINT "CreditNoteItem_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "CreditNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreditNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebitNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debitNoteNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "billId" TEXT,
    "supplierId" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RETURN',
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DebitNote_billId_fkey" FOREIGN KEY ("billId") REFERENCES "PurchaseBill" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DebitNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DebitNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebitNoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debitNoteId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "reason" TEXT,
    CONSTRAINT "DebitNoteItem_debitNoteId_fkey" FOREIGN KEY ("debitNoteId") REFERENCES "DebitNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DebitNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseNumber" TEXT,
    "category" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "gstAmount" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "paymentMethod" TEXT,
    "receiptUrl" TEXT,
    "vendor" TEXT,
    "approvedById" TEXT,
    "approvalDate" DATETIME,
    "rejectionReason" TEXT,
    CONSTRAINT "Expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "supplierInvoiceNumber" TEXT,
    "orderDate" DATETIME NOT NULL,
    "billDate" DATETIME,
    "expectedDate" DATETIME,
    "subtotal" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "rfqId" TEXT,
    "quoteId" TEXT,
    CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "SupplierQuote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "joiningDate" DATETIME NOT NULL,
    "dateOfBirth" DATETIME,
    "salary" DECIMAL NOT NULL,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "panNumber" TEXT,
    "aadhaarNumber" TEXT,
    "pfNumber" TEXT,
    "esiNumber" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "emergencyName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastReconciled" DATETIME,
    "provider" TEXT,
    "providerAccountId" TEXT,
    "syncActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "BankAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CLEARED',
    "reference" TEXT,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentReminder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentReminder_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentReminder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    CONSTRAINT "Estimate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Estimate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "estimateId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    CONSTRAINT "EstimateItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EstimateItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL,
    "expectedDate" DATETIME,
    "subtotal" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    CONSTRAINT "SalesOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "shippedQuantity" INTEGER NOT NULL DEFAULT 0,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryChallan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challanNumber" TEXT NOT NULL,
    "challanDate" DATETIME NOT NULL,
    "referenceNumber" TEXT,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    CONSTRAINT "DeliveryChallan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeliveryChallan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryChallanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "challanId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    CONSTRAINT "DeliveryChallanItem_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES "DeliveryChallan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryChallanItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "validUntil" DATETIME NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    CONSTRAINT "Quotation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseBill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "supplierInvoiceNumber" TEXT,
    "billDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "subtotal" DECIMAL NOT NULL,
    "totalTax" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL NOT NULL,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "roundOff" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "branchId" TEXT,
    "deletedAt" DATETIME,
    "cgst" DECIMAL,
    "sgst" DECIMAL,
    "igst" DECIMAL,
    "placeOfSupply" TEXT,
    "isReverseCharge" BOOLEAN NOT NULL DEFAULT false,
    "isInterState" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PurchaseBill_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseBill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseBill_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseBillItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "cgst" DECIMAL DEFAULT 0,
    "sgst" DECIMAL DEFAULT 0,
    "igst" DECIMAL DEFAULT 0,
    "total" DECIMAL NOT NULL,
    "billId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "batchId" TEXT,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    CONSTRAINT "PurchaseBillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "PurchaseBill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseBillItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseBillItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoodsReceivedNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grnNumber" TEXT NOT NULL,
    "grnDate" DATETIME NOT NULL,
    "referenceNumber" TEXT,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    CONSTRAINT "GoodsReceivedNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoodsReceivedNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoodsReceivedNoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "grnId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "batchId" TEXT,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    CONSTRAINT "GoodsReceivedNoteItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivedNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GoodsReceivedNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GoodsReceivedNoteItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reference" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    "batchId" TEXT,
    CONSTRAINT "StockMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "mfgDate" DATETIME,
    "expiryDate" DATETIME,
    "mrp" DECIMAL,
    "costPrice" DECIMAL,
    "sellingPrice" DECIMAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "StockBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adjustmentNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "type" TEXT NOT NULL DEFAULT 'QUANTITY',
    "companyId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockAdjustment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockAdjustmentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockAdjustmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variation" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reason" TEXT,
    "batchId" TEXT,
    CONSTRAINT "StockAdjustmentItem_stockAdjustmentId_fkey" FOREIGN KEY ("stockAdjustmentId") REFERENCES "StockAdjustment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockAdjustmentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockAdjustmentItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Unit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentType" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "format" TEXT,
    "fiscalYear" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Sequence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GSTPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challanNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "period" TEXT NOT NULL,
    "cgst" DECIMAL NOT NULL,
    "sgst" DECIMAL NOT NULL,
    "igst" DECIMAL NOT NULL DEFAULT 0,
    "cess" DECIMAL NOT NULL DEFAULT 0,
    "interest" DECIMAL NOT NULL DEFAULT 0,
    "lateFee" DECIMAL NOT NULL DEFAULT 0,
    "penalty" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMode" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "GSTPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "irn" TEXT,
    "ackNumber" TEXT,
    "ackDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signedQR" TEXT,
    "signedInvoice" TEXT,
    "customerName" TEXT NOT NULL,
    "gstin" TEXT,
    "invoiceValue" DECIMAL NOT NULL,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "jsonPayload" TEXT,
    CONSTRAINT "EInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EWaybill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ewaybillNumber" TEXT,
    "documentNumber" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "generatedDate" DATETIME,
    "validUpto" DATETIME,
    "fromGstin" TEXT NOT NULL,
    "toGstin" TEXT,
    "fromPlace" TEXT NOT NULL,
    "toPlace" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "transporterName" TEXT,
    "transporterId" TEXT,
    "vehicleNumber" TEXT,
    "vehicleType" TEXT,
    "transactionType" TEXT NOT NULL,
    "supplyType" TEXT NOT NULL,
    "subSupplyType" TEXT,
    "value" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "jsonPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT,
    CONSTRAINT "EWaybill_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EWaybill_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT,
    "location" TEXT,
    "ipAddress" TEXT NOT NULL,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrentDevice" BOOLEAN NOT NULL DEFAULT false,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Device_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IPWhitelist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "rangeStart" TEXT,
    "rangeEnd" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "IPWhitelist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "thresholdAmount" DECIMAL,
    "steps" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "ApprovalWorkflow_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'DIRECT',
    "name" TEXT,
    "description" TEXT,
    "avatar" TEXT,
    "encryptionKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Conversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "partyId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "nickname" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    "mutedUntil" DATETIME,
    CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationParticipant_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentIv" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "replyToId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "editedAt" DATETIME,
    "deletedAt" DATETIME,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "encryptedKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "role" TEXT,
    "moduleAccess" TEXT,
    "partyId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedById" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Invite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invite_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "userIp" TEXT,
    "userAgent" TEXT,
    "resourceGroup" TEXT,
    "hash" TEXT,
    "previousHash" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "leadId" TEXT,
    "partyId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "checkIn" DATETIME,
    "checkOut" DATETIME,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Leave_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "basic" DECIMAL NOT NULL,
    "hra" DECIMAL NOT NULL DEFAULT 0,
    "allowances" DECIMAL NOT NULL DEFAULT 0,
    "deductions" DECIMAL NOT NULL DEFAULT 0,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "SalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalaryStructure_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "basic" DECIMAL NOT NULL,
    "additions" DECIMAL NOT NULL,
    "deductions" DECIMAL NOT NULL,
    "netPay" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollRun_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PayrollRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LedgerGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LedgerGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LedgerGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "openingBalance" DECIMAL NOT NULL DEFAULT 0,
    "openingType" TEXT NOT NULL DEFAULT 'DEBIT',
    "groupId" TEXT NOT NULL,
    "partyId" TEXT,
    "bankAccountId" TEXT,
    "companyId" TEXT NOT NULL,
    "isSystemLedger" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "gstApplicable" BOOLEAN NOT NULL DEFAULT false,
    "isSystemLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ledger_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LedgerGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ledger_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ledger_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ledger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "narration" TEXT,
    "companyId" TEXT NOT NULL,
    "financialYearId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Voucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Voucher_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "narration" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerPosting_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LedgerPosting_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "POSSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openingCash" DECIMAL NOT NULL,
    "closingCash" DECIMAL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "POSSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "POSSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "POSOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "total" DECIMAL NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "POSOrder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "POSSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SerialNumber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "purchaseBillId" TEXT,
    "invoiceId" TEXT,
    "warrantyExpiry" DATETIME,
    "companyId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SerialNumber_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillOfMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "finishedProductId" TEXT NOT NULL,
    "outputQuantity" DECIMAL NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "laborCost" DECIMAL NOT NULL DEFAULT 0,
    "overheadCost" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BillOfMaterial_finishedProductId_fkey" FOREIGN KEY ("finishedProductId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillOfMaterial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BOMItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bomId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unit" TEXT,
    "notes" TEXT,
    CONSTRAINT "BOMItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterial" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BOMItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "plannedQty" INTEGER NOT NULL,
    "completedQty" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "assignedTo" TEXT,
    "notes" TEXT,
    "planId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrder_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductionPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RFQ_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RFQItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT,
    CONSTRAINT "RFQItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RFQItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "quoteDate" DATETIME NOT NULL,
    "validUntil" DATETIME,
    "subtotal" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierQuote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierQuote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierQuote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierQuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rate" DECIMAL NOT NULL,
    "taxRate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "deliveryDate" DATETIME,
    CONSTRAINT "SupplierQuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "SupplierQuote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierQuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupBuyIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "targetQuantity" INTEGER NOT NULL,
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" DATETIME NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupBuyIntent_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupBuyParticipation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupBuyId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMMITTED',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupBuyParticipation_groupBuyId_fkey" FOREIGN KEY ("groupBuyId") REFERENCES "GroupBuyIntent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupBuyParticipation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingNumber" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "estimatedDelivery" DATETIME,
    "actualDelivery" DATETIME,
    "cost" DECIMAL,
    "invoiceId" TEXT,
    "purchaseOrderId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Shipment_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Shipment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workOrderId" TEXT,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "inspectorName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failedQty" INTEGER NOT NULL DEFAULT 0,
    "passedQty" INTEGER NOT NULL DEFAULT 0,
    "totalQty" INTEGER NOT NULL,
    "checkpoints" TEXT,
    "notes" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QualityInspection_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityInspection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QualityInspection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GSTR2BRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierGstin" TEXT NOT NULL,
    "supplierName" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "invoiceValue" DECIMAL NOT NULL,
    "taxableValue" DECIMAL NOT NULL,
    "igst" DECIMAL NOT NULL DEFAULT 0,
    "cgst" DECIMAL NOT NULL DEFAULT 0,
    "sgst" DECIMAL NOT NULL DEFAULT 0,
    "cess" DECIMAL NOT NULL DEFAULT 0,
    "returnPeriod" TEXT NOT NULL,
    "matchStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "purchaseBillId" TEXT,
    "mismatchReason" TEXT,
    "action" TEXT,
    "actionDate" DATETIME,
    "actionBy" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UnitConversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromUnit" TEXT NOT NULL,
    "toUnit" TEXT NOT NULL,
    "conversionFactor" DECIMAL NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TDSTCSEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL,
    "partyId" TEXT,
    "partyName" TEXT NOT NULL,
    "partyPan" TEXT,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "baseAmount" DECIMAL NOT NULL,
    "rate" DECIMAL NOT NULL,
    "taxAmount" DECIMAL NOT NULL,
    "transactionDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "challanNumber" TEXT,
    "challanDate" DATETIME,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IntegrityCheckResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issues" TEXT,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "issuesFound" INTEGER NOT NULL DEFAULT 0,
    "criticalIssues" INTEGER NOT NULL DEFAULT 0,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomRole_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HSN" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gstRate" DECIMAL NOT NULL,
    "cgstRate" DECIMAL,
    "sgstRate" DECIMAL,
    "igstRate" DECIMAL,
    "unit" TEXT,
    "category" TEXT,
    "chapter" TEXT,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GSTFiling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "filingYear" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "filedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acknowledgmentNumber" TEXT,
    "outputTax" DECIMAL NOT NULL DEFAULT 0,
    "inputTax" DECIMAL NOT NULL DEFAULT 0,
    "taxPayable" DECIMAL NOT NULL DEFAULT 0,
    "taxPaid" DECIMAL NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "remarks" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "productId" TEXT,
    "companyId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceSchedule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "normalizedName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EscrowTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "escrowNumber" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "payerId" TEXT NOT NULL,
    "payeeId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "dueDate" DATETIME,
    "releasedAt" DATETIME,
    "disputedAt" DATETIME,
    "conditions" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EscrowTransaction_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EscrowTransaction_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EscrowTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EscrowTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessCapability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,
    CONSTRAINT "UserCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "gstin" TEXT,
    "isGstRegistered" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
    "failedAt" DATETIME,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    CONSTRAINT "DomainEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncConflict" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "clientVersion" TEXT NOT NULL,
    "serverVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SyncConflict_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SyncConflict_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostDatedCheque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "chequeNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT,
    "amount" DECIMAL NOT NULL,
    "issuedDate" DATETIME NOT NULL,
    "maturityDate" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "billId" TEXT,
    "voucherId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "depositedAt" DATETIME,
    "clearedAt" DATETIME,
    "bouncedAt" DATETIME,
    "bounceReason" TEXT,
    "reminderDays" INTEGER NOT NULL DEFAULT 3,
    "lastReminderAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "PostDatedCheque_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostDatedCheque_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" DATETIME,
    "lockedBy" TEXT,
    "lockReason" TEXT,
    "overrideCount" INTEGER NOT NULL DEFAULT 0,
    "lastOverrideAt" DATETIME,
    "lastOverrideBy" TEXT,
    "lastOverrideNote" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" DATETIME,
    "lockedBy" TEXT,
    "financialYearId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialPeriod_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FinancialPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatusTransitionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT,
    "metadata" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "merchantId" TEXT,
    "webhookSecret" TEXT,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentGatewayConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentId" TEXT,
    "orderId" TEXT,
    "paymentMethod" TEXT,
    "paymentGateway" TEXT,
    "lastPaymentDate" DATETIME,
    "nextBillingDate" DATETIME,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelledAt" DATETIME,
    "cancelReason" TEXT,
    "invoiceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SettingsAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settingType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SettingsAuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SettingsAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SettingsApprovalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "settingType" TEXT NOT NULL,
    "changeData" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SettingsApprovalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SettingsApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SettingsApprovalRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "amount" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approverRole" TEXT,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApprovalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApprovalRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WastageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "workOrderId" TEXT,
    "unitCost" DECIMAL,
    "totalCost" DECIMAL,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WastageLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WastageLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WastageLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WastageLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChannelConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "credentials" TEXT NOT NULL,
    "syncFrequency" TEXT DEFAULT 'HOURLY',
    "lastSyncAt" DATETIME,
    "lastSyncStatus" TEXT DEFAULT 'PENDING',
    "lastSyncError" TEXT,
    "autoSyncOrders" BOOLEAN NOT NULL DEFAULT true,
    "autoCreateInvoice" BOOLEAN NOT NULL DEFAULT false,
    "defaultWarehouseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChannelConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChannelConfig_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChannelOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "channelConfigId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "externalStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderData" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "shippingAddress" TEXT,
    "orderTotal" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "platformFees" DECIMAL,
    "invoiceId" TEXT,
    "partyId" TEXT,
    "orderedAt" DATETIME NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChannelOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChannelOrder_channelConfigId_fkey" FOREIGN KEY ("channelConfigId") REFERENCES "ChannelConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChannelOrder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChannelOrder_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CompanyToIndustry" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CompanyToIndustry_A_fkey" FOREIGN KEY ("A") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CompanyToIndustry_B_fkey" FOREIGN KEY ("B") REFERENCES "Industry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_BusinessActivityToCompany" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BusinessActivityToCompany_A_fkey" FOREIGN KEY ("A") REFERENCES "BusinessActivity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BusinessActivityToCompany_B_fkey" FOREIGN KEY ("B") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_BusinessProductToCompany" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BusinessProductToCompany_A_fkey" FOREIGN KEY ("A") REFERENCES "BusinessProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BusinessProductToCompany_B_fkey" FOREIGN KEY ("B") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_BusinessCapabilityToCompany" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BusinessCapabilityToCompany_A_fkey" FOREIGN KEY ("A") REFERENCES "BusinessCapability" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BusinessCapabilityToCompany_B_fkey" FOREIGN KEY ("B") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_gstin_key" ON "Company"("gstin");

-- CreateIndex
CREATE INDEX "Company_businessType_idx" ON "Company"("businessType");

-- CreateIndex
CREATE INDEX "Company_city_idx" ON "Company"("city");

-- CreateIndex
CREATE INDEX "Company_state_idx" ON "Company"("state");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_companyId_name_key" ON "ExpenseCategory"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_companyId_createdAt_idx" ON "Notification"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_branchId_idx" ON "Invoice"("branchId");

-- CreateIndex
CREATE INDEX "Invoice_approvalStatus_idx" ON "Invoice"("approvalStatus");

-- CreateIndex
CREATE INDEX "Invoice_companyId_invoiceDate_idx" ON "Invoice"("companyId", "invoiceDate");

-- CreateIndex
CREATE INDEX "Invoice_companyId_status_idx" ON "Invoice"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON "Invoice"("companyId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_voucherId_key" ON "Receipt"("voucherId");

-- CreateIndex
CREATE INDEX "Receipt_companyId_date_idx" ON "Receipt"("companyId", "date");

-- CreateIndex
CREATE INDEX "Receipt_customerId_idx" ON "Receipt"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_companyId_receiptNumber_key" ON "Receipt"("companyId", "receiptNumber");

-- CreateIndex
CREATE INDEX "ReceiptAllocation_invoiceId_idx" ON "ReceiptAllocation"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptAllocation_receiptId_invoiceId_key" ON "ReceiptAllocation"("receiptId", "invoiceId");

-- CreateIndex
CREATE INDEX "RecurringInvoiceProfile_companyId_isActive_idx" ON "RecurringInvoiceProfile"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "RecurringInvoiceProfile_nextRunDate_idx" ON "RecurringInvoiceProfile"("nextRunDate");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_companyId_creditNoteNumber_key" ON "CreditNote"("companyId", "creditNoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DebitNote_companyId_debitNoteNumber_key" ON "DebitNote"("companyId", "debitNoteNumber");

-- CreateIndex
CREATE INDEX "Expense_companyId_date_idx" ON "Expense"("companyId", "date");

-- CreateIndex
CREATE INDEX "Expense_companyId_status_idx" ON "Expense"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_companyId_expenseNumber_key" ON "Expense"("companyId", "expenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_companyId_orderNumber_key" ON "PurchaseOrder"("companyId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_employeeId_key" ON "Employee"("companyId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_email_key" ON "Employee"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_externalId_key" ON "Transaction"("externalId");

-- CreateIndex
CREATE INDEX "PaymentReminder_companyId_status_idx" ON "PaymentReminder"("companyId", "status");

-- CreateIndex
CREATE INDEX "PaymentReminder_invoiceId_idx" ON "PaymentReminder"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_companyId_estimateNumber_key" ON "Estimate"("companyId", "estimateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_companyId_orderNumber_key" ON "SalesOrder"("companyId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryChallan_companyId_challanNumber_key" ON "DeliveryChallan"("companyId", "challanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_companyId_quotationNumber_key" ON "Quotation"("companyId", "quotationNumber");

-- CreateIndex
CREATE INDEX "PurchaseBill_branchId_idx" ON "PurchaseBill"("branchId");

-- CreateIndex
CREATE INDEX "PurchaseBill_companyId_billDate_idx" ON "PurchaseBill"("companyId", "billDate");

-- CreateIndex
CREATE INDEX "PurchaseBill_companyId_status_idx" ON "PurchaseBill"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseBill_companyId_billNumber_key" ON "PurchaseBill"("companyId", "billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceivedNote_companyId_grnNumber_key" ON "GoodsReceivedNote"("companyId", "grnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_companyId_code_key" ON "Warehouse"("companyId", "code");

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_companyId_idx" ON "StockMovement"("companyId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockBatch_expiryDate_idx" ON "StockBatch"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockBatch_companyId_productId_batchNumber_key" ON "StockBatch"("companyId", "productId", "batchNumber");

-- CreateIndex
CREATE INDEX "StockAdjustment_date_idx" ON "StockAdjustment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StockAdjustment_companyId_adjustmentNumber_key" ON "StockAdjustment"("companyId", "adjustmentNumber");

-- CreateIndex
CREATE INDEX "StockAdjustmentItem_productId_idx" ON "StockAdjustmentItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_companyId_symbol_key" ON "Unit"("companyId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Category_companyId_name_key" ON "Category"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Sequence_companyId_documentType_fiscalYear_key" ON "Sequence"("companyId", "documentType", "fiscalYear");

-- CreateIndex
CREATE INDEX "GSTPayment_companyId_idx" ON "GSTPayment"("companyId");

-- CreateIndex
CREATE INDEX "GSTPayment_period_idx" ON "GSTPayment"("period");

-- CreateIndex
CREATE UNIQUE INDEX "GSTPayment_companyId_challanNumber_key" ON "GSTPayment"("companyId", "challanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EInvoice_invoiceId_key" ON "EInvoice"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "EInvoice_irn_key" ON "EInvoice"("irn");

-- CreateIndex
CREATE INDEX "EInvoice_companyId_idx" ON "EInvoice"("companyId");

-- CreateIndex
CREATE INDEX "EInvoice_invoiceId_idx" ON "EInvoice"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "EWaybill_ewaybillNumber_key" ON "EWaybill"("ewaybillNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EWaybill_invoiceId_key" ON "EWaybill"("invoiceId");

-- CreateIndex
CREATE INDEX "EWaybill_companyId_idx" ON "EWaybill"("companyId");

-- CreateIndex
CREATE INDEX "EWaybill_documentNumber_idx" ON "EWaybill"("documentNumber");

-- CreateIndex
CREATE INDEX "Device_companyId_idx" ON "Device"("companyId");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "IPWhitelist_companyId_idx" ON "IPWhitelist"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "IPWhitelist_companyId_ipAddress_key" ON "IPWhitelist"("companyId", "ipAddress");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_companyId_idx" ON "ApprovalWorkflow"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_documentType_idx" ON "ApprovalWorkflow"("documentType");

-- CreateIndex
CREATE INDEX "Conversation_companyId_idx" ON "Conversation"("companyId");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_partyId_idx" ON "ConversationParticipant"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_partyId_key" ON "ConversationParticipant"("conversationId", "partyId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "MessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "MessageRead_userId_idx" ON "MessageRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_companyId_idx" ON "Invite"("companyId");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_changedAt_idx" ON "AuditLog"("changedAt");

-- CreateIndex
CREATE INDEX "AuditLog_hash_idx" ON "AuditLog"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_companyId_employeeId_date_key" ON "Attendance"("companyId", "employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_employeeId_key" ON "SalaryStructure"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerGroup_companyId_code_key" ON "LedgerGroup"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_partyId_key" ON "Ledger"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_bankAccountId_key" ON "Ledger"("bankAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_companyId_code_key" ON "Ledger"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_companyId_voucherNumber_key" ON "Voucher"("companyId", "voucherNumber");

-- CreateIndex
CREATE INDEX "LedgerPosting_ledgerId_idx" ON "LedgerPosting"("ledgerId");

-- CreateIndex
CREATE INDEX "LedgerPosting_voucherId_idx" ON "LedgerPosting"("voucherId");

-- CreateIndex
CREATE INDEX "LedgerPosting_companyId_idx" ON "LedgerPosting"("companyId");

-- CreateIndex
CREATE INDEX "SerialNumber_productId_idx" ON "SerialNumber"("productId");

-- CreateIndex
CREATE INDEX "SerialNumber_companyId_idx" ON "SerialNumber"("companyId");

-- CreateIndex
CREATE INDEX "SerialNumber_status_idx" ON "SerialNumber"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SerialNumber_serialNumber_companyId_key" ON "SerialNumber"("serialNumber", "companyId");

-- CreateIndex
CREATE INDEX "BillOfMaterial_companyId_idx" ON "BillOfMaterial"("companyId");

-- CreateIndex
CREATE INDEX "BillOfMaterial_finishedProductId_idx" ON "BillOfMaterial"("finishedProductId");

-- CreateIndex
CREATE INDEX "BOMItem_bomId_idx" ON "BOMItem"("bomId");

-- CreateIndex
CREATE INDEX "BOMItem_productId_idx" ON "BOMItem"("productId");

-- CreateIndex
CREATE INDEX "WorkOrder_companyId_idx" ON "WorkOrder"("companyId");

-- CreateIndex
CREATE INDEX "WorkOrder_bomId_idx" ON "WorkOrder"("bomId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_planId_idx" ON "WorkOrder"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_companyId_orderNumber_key" ON "WorkOrder"("companyId", "orderNumber");

-- CreateIndex
CREATE INDEX "ProductionPlan_companyId_idx" ON "ProductionPlan"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionPlan_companyId_planNumber_key" ON "ProductionPlan"("companyId", "planNumber");

-- CreateIndex
CREATE INDEX "RFQ_companyId_status_idx" ON "RFQ"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RFQ_companyId_rfqNumber_key" ON "RFQ"("companyId", "rfqNumber");

-- CreateIndex
CREATE INDEX "SupplierQuote_rfqId_idx" ON "SupplierQuote"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierQuote_companyId_supplierId_quoteNumber_key" ON "SupplierQuote"("companyId", "supplierId", "quoteNumber");

-- CreateIndex
CREATE INDEX "GroupBuyIntent_status_idx" ON "GroupBuyIntent"("status");

-- CreateIndex
CREATE INDEX "GroupBuyIntent_productId_idx" ON "GroupBuyIntent"("productId");

-- CreateIndex
CREATE INDEX "GroupBuyIntent_expiresAt_idx" ON "GroupBuyIntent"("expiresAt");

-- CreateIndex
CREATE INDEX "GroupBuyParticipation_companyId_idx" ON "GroupBuyParticipation"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupBuyParticipation_groupBuyId_companyId_key" ON "GroupBuyParticipation"("groupBuyId", "companyId");

-- CreateIndex
CREATE INDEX "Shipment_companyId_idx" ON "Shipment"("companyId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "QualityInspection_companyId_idx" ON "QualityInspection"("companyId");

-- CreateIndex
CREATE INDEX "QualityInspection_workOrderId_idx" ON "QualityInspection"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityInspection_companyId_inspectionNumber_key" ON "QualityInspection"("companyId", "inspectionNumber");

-- CreateIndex
CREATE INDEX "GSTR2BRecord_companyId_idx" ON "GSTR2BRecord"("companyId");

-- CreateIndex
CREATE INDEX "GSTR2BRecord_matchStatus_idx" ON "GSTR2BRecord"("matchStatus");

-- CreateIndex
CREATE INDEX "GSTR2BRecord_returnPeriod_idx" ON "GSTR2BRecord"("returnPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "GSTR2BRecord_supplierGstin_invoiceNumber_returnPeriod_companyId_key" ON "GSTR2BRecord"("supplierGstin", "invoiceNumber", "returnPeriod", "companyId");

-- CreateIndex
CREATE INDEX "UnitConversion_companyId_idx" ON "UnitConversion"("companyId");

-- CreateIndex
CREATE INDEX "UnitConversion_productId_idx" ON "UnitConversion"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitConversion_fromUnit_toUnit_productId_companyId_key" ON "UnitConversion"("fromUnit", "toUnit", "productId", "companyId");

-- CreateIndex
CREATE INDEX "TDSTCSEntry_companyId_idx" ON "TDSTCSEntry"("companyId");

-- CreateIndex
CREATE INDEX "TDSTCSEntry_type_idx" ON "TDSTCSEntry"("type");

-- CreateIndex
CREATE INDEX "TDSTCSEntry_status_idx" ON "TDSTCSEntry"("status");

-- CreateIndex
CREATE INDEX "TDSTCSEntry_partyId_idx" ON "TDSTCSEntry"("partyId");

-- CreateIndex
CREATE INDEX "IntegrityCheckResult_companyId_runAt_idx" ON "IntegrityCheckResult"("companyId", "runAt");

-- CreateIndex
CREATE INDEX "IntegrityCheckResult_checkType_idx" ON "IntegrityCheckResult"("checkType");

-- CreateIndex
CREATE INDEX "IntegrityCheckResult_status_idx" ON "IntegrityCheckResult"("status");

-- CreateIndex
CREATE INDEX "CustomRole_companyId_idx" ON "CustomRole"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_companyId_name_key" ON "CustomRole"("companyId", "name");

-- CreateIndex
CREATE INDEX "HSN_code_idx" ON "HSN"("code");

-- CreateIndex
CREATE INDEX "HSN_category_idx" ON "HSN"("category");

-- CreateIndex
CREATE INDEX "HSN_gstRate_idx" ON "HSN"("gstRate");

-- CreateIndex
CREATE UNIQUE INDEX "HSN_code_key" ON "HSN"("code");

-- CreateIndex
CREATE INDEX "GSTFiling_companyId_idx" ON "GSTFiling"("companyId");

-- CreateIndex
CREATE INDEX "GSTFiling_status_idx" ON "GSTFiling"("status");

-- CreateIndex
CREATE INDEX "GSTFiling_returnType_idx" ON "GSTFiling"("returnType");

-- CreateIndex
CREATE UNIQUE INDEX "GSTFiling_returnType_period_companyId_key" ON "GSTFiling"("returnType", "period", "companyId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_companyId_idx" ON "MaintenanceSchedule"("companyId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_scheduledDate_idx" ON "MaintenanceSchedule"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCategory_name_key" ON "BusinessCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "Industry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessActivity_name_key" ON "BusinessActivity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProduct_name_key" ON "BusinessProduct"("name");

-- CreateIndex
CREATE INDEX "BusinessProduct_name_idx" ON "BusinessProduct"("name");

-- CreateIndex
CREATE INDEX "BusinessProduct_normalizedName_idx" ON "BusinessProduct"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransaction_escrowNumber_key" ON "EscrowTransaction"("escrowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowTransaction_invoiceId_key" ON "EscrowTransaction"("invoiceId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_companyId_idx" ON "EscrowTransaction"("companyId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_status_idx" ON "EscrowTransaction"("status");

-- CreateIndex
CREATE INDEX "EscrowTransaction_payerId_idx" ON "EscrowTransaction"("payerId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_payeeId_idx" ON "EscrowTransaction"("payeeId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCapability_name_key" ON "BusinessCapability"("name");

-- CreateIndex
CREATE INDEX "UserCompany_userId_idx" ON "UserCompany"("userId");

-- CreateIndex
CREATE INDEX "UserCompany_companyId_idx" ON "UserCompany"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompany_userId_companyId_key" ON "UserCompany"("userId", "companyId");

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "Branch_gstin_idx" ON "Branch"("gstin");

-- CreateIndex
CREATE INDEX "Branch_state_idx" ON "Branch"("state");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_code_key" ON "Branch"("companyId", "code");

-- CreateIndex
CREATE INDEX "DomainEvent_companyId_eventType_idx" ON "DomainEvent"("companyId", "eventType");

-- CreateIndex
CREATE INDEX "DomainEvent_aggregateType_aggregateId_idx" ON "DomainEvent"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "DomainEvent_status_lockedUntil_idx" ON "DomainEvent"("status", "lockedUntil");

-- CreateIndex
CREATE INDEX "DomainEvent_createdAt_idx" ON "DomainEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SyncConflict_companyId_status_idx" ON "SyncConflict"("companyId", "status");

-- CreateIndex
CREATE INDEX "SyncConflict_entityType_entityId_idx" ON "SyncConflict"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "PostDatedCheque_voucherId_key" ON "PostDatedCheque"("voucherId");

-- CreateIndex
CREATE INDEX "PostDatedCheque_companyId_status_idx" ON "PostDatedCheque"("companyId", "status");

-- CreateIndex
CREATE INDEX "PostDatedCheque_companyId_maturityDate_idx" ON "PostDatedCheque"("companyId", "maturityDate");

-- CreateIndex
CREATE INDEX "PostDatedCheque_partyId_idx" ON "PostDatedCheque"("partyId");

-- CreateIndex
CREATE INDEX "FinancialYear_companyId_isCurrent_idx" ON "FinancialYear"("companyId", "isCurrent");

-- CreateIndex
CREATE INDEX "FinancialYear_companyId_startDate_endDate_idx" ON "FinancialYear"("companyId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "FinancialPeriod_companyId_startDate_endDate_idx" ON "FinancialPeriod"("companyId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriod_financialYearId_name_key" ON "FinancialPeriod"("financialYearId", "name");

-- CreateIndex
CREATE INDEX "StatusTransitionLog_entityType_entityId_idx" ON "StatusTransitionLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "StatusTransitionLog_companyId_createdAt_idx" ON "StatusTransitionLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_companyId_idx" ON "PaymentGatewayConfig"("companyId");

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_isActive_idx" ON "PaymentGatewayConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayConfig_companyId_provider_key" ON "PaymentGatewayConfig"("companyId", "provider");

-- CreateIndex
CREATE INDEX "Subscription_companyId_idx" ON "Subscription"("companyId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");

-- CreateIndex
CREATE INDEX "SettingsAuditLog_companyId_timestamp_idx" ON "SettingsAuditLog"("companyId", "timestamp");

-- CreateIndex
CREATE INDEX "SettingsAuditLog_userId_idx" ON "SettingsAuditLog"("userId");

-- CreateIndex
CREATE INDEX "SettingsAuditLog_settingType_idx" ON "SettingsAuditLog"("settingType");

-- CreateIndex
CREATE INDEX "SettingsAuditLog_action_idx" ON "SettingsAuditLog"("action");

-- CreateIndex
CREATE INDEX "SettingsApprovalRequest_companyId_status_idx" ON "SettingsApprovalRequest"("companyId", "status");

-- CreateIndex
CREATE INDEX "SettingsApprovalRequest_requestedById_idx" ON "SettingsApprovalRequest"("requestedById");

-- CreateIndex
CREATE INDEX "SettingsApprovalRequest_status_idx" ON "SettingsApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_companyId_status_idx" ON "ApprovalRequest"("companyId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entityType_entityId_idx" ON "ApprovalRequest"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WastageLog_companyId_recordedAt_idx" ON "WastageLog"("companyId", "recordedAt");

-- CreateIndex
CREATE INDEX "WastageLog_productId_idx" ON "WastageLog"("productId");

-- CreateIndex
CREATE INDEX "WastageLog_reason_idx" ON "WastageLog"("reason");

-- CreateIndex
CREATE INDEX "ChannelConfig_isActive_idx" ON "ChannelConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConfig_companyId_channel_key" ON "ChannelConfig"("companyId", "channel");

-- CreateIndex
CREATE INDEX "ChannelOrder_companyId_status_idx" ON "ChannelOrder"("companyId", "status");

-- CreateIndex
CREATE INDEX "ChannelOrder_channelConfigId_idx" ON "ChannelOrder"("channelConfigId");

-- CreateIndex
CREATE INDEX "ChannelOrder_orderedAt_idx" ON "ChannelOrder"("orderedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelOrder_companyId_channel_externalOrderId_key" ON "ChannelOrder"("companyId", "channel", "externalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "_CompanyToIndustry_AB_unique" ON "_CompanyToIndustry"("A", "B");

-- CreateIndex
CREATE INDEX "_CompanyToIndustry_B_index" ON "_CompanyToIndustry"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BusinessActivityToCompany_AB_unique" ON "_BusinessActivityToCompany"("A", "B");

-- CreateIndex
CREATE INDEX "_BusinessActivityToCompany_B_index" ON "_BusinessActivityToCompany"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BusinessProductToCompany_AB_unique" ON "_BusinessProductToCompany"("A", "B");

-- CreateIndex
CREATE INDEX "_BusinessProductToCompany_B_index" ON "_BusinessProductToCompany"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BusinessCapabilityToCompany_AB_unique" ON "_BusinessCapabilityToCompany"("A", "B");

-- CreateIndex
CREATE INDEX "_BusinessCapabilityToCompany_B_index" ON "_BusinessCapabilityToCompany"("B");
