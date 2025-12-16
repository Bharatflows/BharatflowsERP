# 🔧 BharatFlow - Backend & Database Requirements

## 📊 **Database Schema Requirements**

### **1. Users & Authentication**

#### **users**
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  phone: String (unique),
  name: String (required),
  role: String (enum: ['admin', 'manager', 'accountant', 'user']),
  status: String (enum: ['active', 'inactive', 'suspended']),
  emailVerified: Boolean (default: false),
  phoneVerified: Boolean (default: false),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### **companies**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  businessName: String (required),
  legalName: String,
  gstin: String (unique, required),
  pan: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String (default: 'India')
  },
  contactDetails: {
    phone: String,
    email: String,
    website: String
  },
  bankDetails: [{
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountType: String,
    isPrimary: Boolean
  }],
  logo: String (url),
  fiscalYear: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **2. Sales Module**

#### **invoices**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId (ref: 'companies'),
  userId: ObjectId (ref: 'users'),
  invoiceNumber: String (unique, required),
  invoiceType: String (enum: ['tax_invoice', 'proforma', 'export']),
  customerId: ObjectId (ref: 'parties'),
  customerName: String,
  customerGSTIN: String,
  customerAddress: Object,
  invoiceDate: Date (required),
  dueDate: Date,
  placeOfSupply: String,
  items: [{
    productId: ObjectId (ref: 'products'),
    productName: String,
    hsnCode: String,
    quantity: Number,
    unit: String,
    rate: Number,
    discount: Number,
    taxableAmount: Number,
    gstRate: Number,
    cgst: Number,
    sgst: Number,
    igst: Number,
    cess: Number,
    totalAmount: Number
  }],
  subtotal: Number,
  totalDiscount: Number,
  totalTaxableAmount: Number,
  totalCGST: Number,
  totalSGST: Number,
  totalIGST: Number,
  totalTax: Number,
  roundOff: Number,
  grandTotal: Number,
  amountPaid: Number,
  balanceAmount: Number,
  status: String (enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled']),
  paymentTerms: String,
  notes: String,
  termsAndConditions: String,
  attachments: [String],
  eInvoiceDetails: {
    irn: String,
    ackNo: String,
    ackDate: Date,
    qrCode: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### **estimates** (Quotations)
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  userId: ObjectId,
  estimateNumber: String (unique),
  customerId: ObjectId,
  estimateDate: Date,
  validUntil: Date,
  items: [Object],
  subtotal: Number,
  grandTotal: Number,
  status: String (enum: ['draft', 'sent', 'accepted', 'rejected', 'expired']),
  convertedToInvoice: Boolean,
  invoiceId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### **sales_orders**
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  customerId: ObjectId,
  orderDate: Date,
  deliveryDate: Date,
  items: [Object],
  status: String (enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled']),
  grandTotal: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### **delivery_challans**
```javascript
{
  _id: ObjectId,
  challanNumber: String (unique),
  invoiceId: ObjectId,
  customerId: ObjectId,
  deliveryDate: Date,
  transportDetails: Object,
  items: [Object],
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **3. Purchase Module**

#### **purchase_orders**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  poNumber: String (unique),
  supplierId: ObjectId (ref: 'parties'),
  poDate: Date,
  expectedDelivery: Date,
  items: [{
    productId: ObjectId,
    productName: String,
    quantity: Number,
    rate: Number,
    gstRate: Number,
    amount: Number
  }],
  subtotal: Number,
  totalTax: Number,
  grandTotal: Number,
  status: String (enum: ['draft', 'sent', 'confirmed', 'received', 'cancelled']),
  createdAt: Date,
  updatedAt: Date
}
```

#### **purchase_bills**
```javascript
{
  _id: ObjectId,
  billNumber: String,
  supplierId: ObjectId,
  billDate: Date,
  dueDate: Date,
  items: [Object],
  subtotal: Number,
  totalTax: Number,
  grandTotal: Number,
  amountPaid: Number,
  status: String (enum: ['unpaid', 'partial', 'paid', 'overdue']),
  createdAt: Date,
  updatedAt: Date
}
```

#### **goods_received**
```javascript
{
  _id: ObjectId,
  grnNumber: String (unique),
  poId: ObjectId,
  receivedDate: Date,
  items: [{
    productId: ObjectId,
    orderedQty: Number,
    receivedQty: Number,
    rejectedQty: Number,
    acceptedQty: Number
  }],
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **4. Inventory Module**

#### **products**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  productName: String (required),
  productCode: String (unique),
  barcode: String,
  hsnCode: String,
  sacCode: String,
  category: String,
  subCategory: String,
  description: String,
  unit: String (enum: ['pcs', 'kg', 'ltr', 'mtr', 'box']),
  pricing: {
    purchasePrice: Number,
    sellingPrice: Number,
    mrp: Number,
    minPrice: Number
  },
  tax: {
    gstRate: Number,
    taxPreference: String (enum: ['taxable', 'non_taxable', 'exempt'])
  },
  stock: {
    currentStock: Number,
    minStock: Number,
    maxStock: Number,
    reorderLevel: Number,
    warehouseStock: [{
      warehouseId: ObjectId,
      quantity: Number
    }]
  },
  images: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **stock_adjustments**
```javascript
{
  _id: ObjectId,
  adjustmentNumber: String (unique),
  adjustmentDate: Date,
  adjustmentType: String (enum: ['increase', 'decrease', 'damage', 'theft', 'correction']),
  items: [{
    productId: ObjectId,
    currentStock: Number,
    adjustedQty: Number,
    newStock: Number,
    reason: String
  }],
  notes: String,
  createdBy: ObjectId,
  createdAt: Date
}
```

#### **stock_transfers**
```javascript
{
  _id: ObjectId,
  transferNumber: String,
  fromWarehouse: ObjectId,
  toWarehouse: ObjectId,
  transferDate: Date,
  items: [Object],
  status: String (enum: ['pending', 'in_transit', 'completed']),
  createdAt: Date,
  updatedAt: Date
}
```

#### **warehouses**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  warehouseName: String,
  warehouseCode: String,
  address: Object,
  contactPerson: String,
  phone: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **5. Parties Module**

#### **parties**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  partyType: String (enum: ['customer', 'supplier', 'both']),
  partyName: String (required),
  displayName: String,
  gstin: String,
  pan: String,
  contactPerson: String,
  email: String,
  phone: String,
  whatsapp: String,
  billingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  shippingAddress: Object,
  bankDetails: Object,
  creditLimit: Number,
  creditPeriod: Number,
  openingBalance: Number,
  currentBalance: Number,
  status: String (enum: ['active', 'inactive']),
  tags: [String],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **party_ledger**
```javascript
{
  _id: ObjectId,
  partyId: ObjectId,
  transactionType: String (enum: ['invoice', 'payment', 'credit_note', 'debit_note']),
  referenceNumber: String,
  referenceId: ObjectId,
  date: Date,
  debit: Number,
  credit: Number,
  balance: Number,
  description: String,
  createdAt: Date
}
```

---

### **6. Expenses Module**

#### **expenses**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  expenseNumber: String,
  expenseDate: Date,
  category: String (required),
  subCategory: String,
  vendorId: ObjectId,
  vendorName: String,
  amount: Number,
  taxAmount: Number,
  totalAmount: Number,
  paymentMethod: String,
  description: String,
  billNumber: String,
  attachments: [String],
  status: String (enum: ['pending', 'approved', 'rejected', 'paid']),
  approvedBy: ObjectId,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### **expense_categories**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  categoryName: String,
  parentCategory: ObjectId,
  description: String,
  isActive: Boolean,
  createdAt: Date
}
```

---

### **7. HR Module**

#### **employees**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  employeeCode: String (unique),
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  address: Object,
  department: String,
  designation: String,
  joiningDate: Date,
  employmentType: String (enum: ['full_time', 'part_time', 'contract', 'intern']),
  salary: {
    basicSalary: Number,
    hra: Number,
    allowances: Number,
    deductions: Number,
    netSalary: Number
  },
  bankDetails: Object,
  documents: [{
    docType: String,
    docNumber: String,
    docUrl: String
  }],
  status: String (enum: ['active', 'on_leave', 'resigned', 'terminated']),
  createdAt: Date,
  updatedAt: Date
}
```

#### **attendance**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  date: Date,
  checkIn: Date,
  checkOut: Date,
  workingHours: Number,
  status: String (enum: ['present', 'absent', 'half_day', 'leave', 'holiday']),
  notes: String,
  createdAt: Date
}
```

#### **leave_applications**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  leaveType: String (enum: ['casual', 'sick', 'earned', 'unpaid']),
  fromDate: Date,
  toDate: Date,
  numberOfDays: Number,
  reason: String,
  status: String (enum: ['pending', 'approved', 'rejected']),
  approvedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### **payroll**
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  month: String,
  year: Number,
  basicSalary: Number,
  allowances: Number,
  deductions: Number,
  netSalary: Number,
  paymentDate: Date,
  paymentMethod: String,
  status: String (enum: ['pending', 'processed', 'paid']),
  createdAt: Date
}
```

---

### **8. Banking Module**

#### **bank_accounts**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  accountName: String,
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  accountType: String,
  currentBalance: Number,
  openingBalance: Number,
  isPrimary: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **transactions**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  accountId: ObjectId,
  transactionType: String (enum: ['debit', 'credit']),
  transactionDate: Date,
  amount: Number,
  category: String,
  partyId: ObjectId,
  partyName: String,
  paymentMethod: String (enum: ['cash', 'cheque', 'upi', 'neft', 'rtgs', 'card']),
  referenceNumber: String,
  description: String,
  balance: Number,
  status: String (enum: ['pending', 'completed', 'failed']),
  createdAt: Date
}
```

#### **payment_reminders**
```javascript
{
  _id: ObjectId,
  partyId: ObjectId,
  invoiceId: ObjectId,
  amount: Number,
  dueDate: Date,
  reminderDate: Date,
  status: String,
  sentCount: Number,
  createdAt: Date
}
```

---

### **9. GST Module**

#### **gst_returns**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  returnType: String (enum: ['GSTR1', 'GSTR3B', 'GSTR2A', 'GSTR9']),
  month: String,
  year: Number,
  filingDate: Date,
  status: String (enum: ['not_filed', 'filed', 'revised']),
  data: Object,
  createdAt: Date
}
```

#### **e_invoices**
```javascript
{
  _id: ObjectId,
  invoiceId: ObjectId,
  irn: String (unique),
  ackNo: String,
  ackDate: Date,
  signedInvoice: String,
  signedQRCode: String,
  status: String,
  createdAt: Date
}
```

#### **e_waybills**
```javascript
{
  _id: ObjectId,
  invoiceId: ObjectId,
  ewaybillNumber: String (unique),
  generatedDate: Date,
  validUntil: Date,
  vehicleNumber: String,
  transporterId: String,
  distance: Number,
  status: String (enum: ['active', 'cancelled', 'expired']),
  createdAt: Date
}
```

---

### **10. CRM Module**

#### **leads**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  leadName: String,
  companyName: String,
  email: String,
  phone: String,
  source: String (enum: ['website', 'referral', 'social_media', 'cold_call']),
  status: String (enum: ['new', 'contacted', 'qualified', 'converted', 'lost']),
  assignedTo: ObjectId,
  expectedValue: Number,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **opportunities**
```javascript
{
  _id: ObjectId,
  leadId: ObjectId,
  opportunityName: String,
  value: Number,
  probability: Number,
  stage: String (enum: ['prospecting', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  expectedCloseDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **11. Documents Module**

#### **documents**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  documentName: String,
  documentType: String,
  category: String,
  fileUrl: String,
  fileSize: Number,
  mimeType: String,
  uploadedBy: ObjectId,
  tags: [String],
  sharedWith: [ObjectId],
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

### **12. Notifications Module**

#### **notifications**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String (enum: ['invoice_due', 'payment_received', 'low_stock', 'gst_filing', 'system']),
  title: String,
  message: String,
  link: String,
  isRead: Boolean,
  priority: String (enum: ['low', 'medium', 'high', 'urgent']),
  createdAt: Date,
  readAt: Date
}
```

#### **alert_rules**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  ruleName: String,
  ruleType: String,
  conditions: Object,
  actions: Object,
  isActive: Boolean,
  createdAt: Date
}
```

---

### **13. Reports & Analytics**

#### **reports**
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,
  reportType: String,
  reportName: String,
  filters: Object,
  generatedDate: Date,
  fileUrl: String,
  generatedBy: ObjectId,
  createdAt: Date
}
```

---

## 🔌 **Backend API Endpoints Required**

### **Authentication Endpoints**
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
POST   /api/auth/forgot-password   - Forgot password
POST   /api/auth/reset-password    - Reset password
POST   /api/auth/verify-email      - Verify email
POST   /api/auth/verify-otp        - Verify OTP
POST   /api/auth/resend-otp        - Resend OTP
GET    /api/auth/me                - Get current user
PUT    /api/auth/update-profile    - Update user profile
```

### **Sales Endpoints**
```
GET    /api/sales/invoices                - Get all invoices
GET    /api/sales/invoices/:id            - Get single invoice
POST   /api/sales/invoices                - Create invoice
PUT    /api/sales/invoices/:id            - Update invoice
DELETE /api/sales/invoices/:id            - Delete invoice
GET    /api/sales/invoices/search         - Search invoices
GET    /api/sales/invoices/export         - Export invoices

GET    /api/sales/estimates               - Get all estimates
POST   /api/sales/estimates               - Create estimate
PUT    /api/sales/estimates/:id           - Update estimate
DELETE /api/sales/estimates/:id           - Delete estimate

GET    /api/sales/orders                  - Get sales orders
POST   /api/sales/orders                  - Create sales order
```

### **Purchase Endpoints**
```
GET    /api/purchase/orders               - Get purchase orders
POST   /api/purchase/orders               - Create purchase order
PUT    /api/purchase/orders/:id           - Update purchase order
DELETE /api/purchase/orders/:id           - Delete purchase order

GET    /api/purchase/bills                - Get purchase bills
POST   /api/purchase/bills                - Create purchase bill
```

### **Inventory Endpoints**
```
GET    /api/inventory/products            - Get all products
GET    /api/inventory/products/:id        - Get single product
POST   /api/inventory/products            - Create product
PUT    /api/inventory/products/:id        - Update product
DELETE /api/inventory/products/:id        - Delete product
GET    /api/inventory/products/search     - Search products
GET    /api/inventory/low-stock           - Get low stock products

POST   /api/inventory/adjustments         - Create stock adjustment
GET    /api/inventory/transfers           - Get stock transfers
POST   /api/inventory/transfers           - Create stock transfer
```

### **Parties Endpoints**
```
GET    /api/parties                       - Get all parties
GET    /api/parties/:id                   - Get single party
POST   /api/parties                       - Create party
PUT    /api/parties/:id                   - Update party
DELETE /api/parties/:id                   - Delete party
GET    /api/parties/search                - Search parties
GET    /api/parties/:id/ledger            - Get party ledger
GET    /api/parties/:id/statement         - Get party statement
```

### **Expenses Endpoints**
```
GET    /api/expenses                      - Get all expenses
POST   /api/expenses                      - Create expense
PUT    /api/expenses/:id                  - Update expense
DELETE /api/expenses/:id                  - Delete expense
GET    /api/expenses/categories           - Get categories
POST   /api/expenses/categories           - Create category
```

### **HR Endpoints**
```
GET    /api/hr/employees                  - Get all employees
POST   /api/hr/employees                  - Create employee
PUT    /api/hr/employees/:id              - Update employee
DELETE /api/hr/employees/:id              - Delete employee

GET    /api/hr/attendance                 - Get attendance
POST   /api/hr/attendance                 - Mark attendance

GET    /api/hr/leaves                     - Get leave applications
POST   /api/hr/leaves                     - Apply for leave
PUT    /api/hr/leaves/:id                 - Approve/reject leave

GET    /api/hr/payroll                    - Get payroll
POST   /api/hr/payroll                    - Process payroll
```

### **Banking Endpoints**
```
GET    /api/banking/accounts              - Get bank accounts
POST   /api/banking/accounts              - Create bank account
GET    /api/banking/transactions          - Get transactions
POST   /api/banking/transactions          - Create transaction
GET    /api/banking/reconciliation        - Get reconciliation data
```

### **GST Endpoints**
```
GET    /api/gst/returns                   - Get GST returns
POST   /api/gst/returns/file              - File GST return
GET    /api/gst/hsn-summary               - Get HSN summary
POST   /api/gst/e-invoice                 - Generate e-invoice
POST   /api/gst/e-waybill                 - Generate e-waybill
GET    /api/gst/itc-ledger                - Get ITC ledger
```

### **CRM Endpoints**
```
GET    /api/crm/leads                     - Get leads
POST   /api/crm/leads                     - Create lead
PUT    /api/crm/leads/:id                 - Update lead
DELETE /api/crm/leads/:id                 - Delete lead

GET    /api/crm/opportunities             - Get opportunities
POST   /api/crm/opportunities             - Create opportunity
```

### **Reports Endpoints**
```
GET    /api/reports/sales                 - Sales report
GET    /api/reports/purchase              - Purchase report
GET    /api/reports/inventory             - Inventory report
GET    /api/reports/profit-loss           - P&L report
GET    /api/reports/balance-sheet         - Balance sheet
GET    /api/reports/aging                 - Aging report
GET    /api/reports/gst                   - GST report
POST   /api/reports/generate              - Generate custom report
```

### **Dashboard Endpoints**
```
GET    /api/dashboard/stats               - Get dashboard stats
GET    /api/dashboard/recent-transactions - Recent transactions
GET    /api/dashboard/low-stock           - Low stock alerts
GET    /api/dashboard/pending-payments    - Pending payments
```

### **Notifications Endpoints**
```
GET    /api/notifications                 - Get all notifications
GET    /api/notifications/unread          - Get unread notifications
PUT    /api/notifications/:id/read        - Mark as read
PUT    /api/notifications/read-all        - Mark all as read
DELETE /api/notifications/:id             - Delete notification
```

### **Search Endpoint (Global)**
```
GET    /api/search?q=query&type=all       - Global search across all modules
```

### **Settings Endpoints**
```
GET    /api/settings/company              - Get company settings
PUT    /api/settings/company              - Update company settings
GET    /api/settings/users                - Get users
POST   /api/settings/users                - Create user
PUT    /api/settings/users/:id            - Update user
DELETE /api/settings/users/:id            - Delete user
```

---

## 📦 **Technology Stack Recommendations**

### **Backend:**
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT + bcrypt
- **File Upload:** Multer + AWS S3 / Cloudinary
- **Email:** Nodemailer
- **SMS:** Twilio / MSG91
- **PDF Generation:** PDFKit / Puppeteer
- **Excel Export:** ExcelJS
- **Validation:** Joi / Zod
- **API Documentation:** Swagger

### **Infrastructure:**
- **Hosting:** AWS / Railway / Heroku
- **Database:** MongoDB Atlas
- **Storage:** AWS S3 / Cloudinary
- **CDN:** CloudFlare
- **Monitoring:** Sentry / LogRocket

---

This document serves as the complete backend development blueprint! 🚀
