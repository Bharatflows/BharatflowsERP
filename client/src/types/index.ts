// Shared TypeScript types for client and server
import { Role } from '../constants/roles';

// User & Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  preferences?: any;
  companyId: string;
  company?: Company;
  companies?: Array<{ id: string; businessName: string; role: string; isDefault: boolean }>; // P0-1: Multi-company
  createdAt: string;
  updatedAt: string;
  permissions?: any; // Start with any, can be typed strictly later
}

export type UserRole = Role;

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

// Company/Business
export interface Company {
  id: string;
  businessName: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  logo?: string;
  plan?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  features?: any;
  enabledModules?: Record<string, boolean>;
}

// Party (Customer/Supplier)
export interface PartyAddress {
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Party {
  id: string;
  type: 'customer' | 'supplier' | 'CUSTOMER' | 'SUPPLIER';
  name: string;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
  billingAddress?: PartyAddress;
  shippingAddress?: PartyAddress;
  // Legacy flat address fields for backwards compatibility
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Financial fields
  openingBalance?: number;
  currentBalance?: number;
  balance?: number; // Alias for currentBalance
  creditLimit?: number;
  creditDays?: number;
  notes?: string;
  isActive?: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// Product/Inventory
export interface Product {
  id: string;
  name: string;
  sku: string;
  code?: string; // Alias for sku
  hsnCode: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  sellingPrice?: number; // Alias for salePrice
  mrp?: number;
  gstRate: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  description?: string;
  barcode?: string;
  location?: string;
  taxInclusive?: boolean;
  trackInventory?: boolean;
  isBatchTracked?: boolean;
  isSerialTracked?: boolean;
  sellWithoutStock?: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice/Sale
export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customer?: Party;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  termsAndConditions?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  product?: Product;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  batchNumber?: string;
  expiryDate?: string;
  serialNumbers?: string[];
}

// Purchase Order/Bill
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderNumber?: string; // Alias for poNumber
  poDate: string;
  orderDate?: string; // Alias for poDate
  expectedDate?: string;
  supplierId: string;
  supplier?: Party;
  items: PurchaseOrderItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  paymentTerms?: string;
  notes?: string;
  termsConditions?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  product?: Product;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  batchNumber?: string;
  expiryDate?: string;
  serialNumbers?: string[];
}

// Expense
export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  vendor?: string;
  description: string;
  paymentMode: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  attachments?: string[];
  companyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Employee/HR
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  bankAccount?: string;
  ifscCode?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  status: 'active' | 'inactive';
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// Notification
export interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: string;
  title: string;
  message: string;
  read: boolean;
  actionLink?: string;
  userId: string;
  companyId: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Estimate
export interface Estimate {
  id: string;
  estimateNumber: string;
  date: string;
  validUntil: string;
  customerId: string;
  customer?: Party;
  items: EstimateItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'converted';
  notes?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  rate: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

// Sales Order
export interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  expectedDate?: string;
  customerId: string;
  customer?: Party;
  items: SalesOrderItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'Draft' | 'Confirmed' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled';
  notes?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  shippedQuantity: number;
  rate: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

// Query Parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
  [key: string]: any;
}

// Delivery Challan
export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  date: string;
  customerId: string;
  customer?: Party;
  salesOrderId?: string;
  salesOrder?: SalesOrder; // Or string if populated differently
  items: DeliveryChallanItem[];
  totalQuantity: number;
  status: 'Draft' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Returned';
  deliveryDate?: string;
  vehicleNumber?: string;
  transporterName?: string;
  notes?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryChallanItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unit?: string;
  description?: string;
}

// Quotation
export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  customerId: string;
  customer?: Party;
  items: QuotationItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Converted';
  notes?: string;
  terms?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  convertedToSO?: string;
  createdBy?: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  product?: Product;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount?: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  total?: number;
  productName?: string;
  hsn?: string;
}

// Warehouse Management
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive: boolean;
  isDefault: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// Stock Movement Tracking
export interface StockMovement {
  id: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DAMAGE' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  reason?: string;
  notes?: string;
  productId: string;
  product?: Product;
  warehouseId?: string;
  warehouse?: Warehouse;
  createdBy: string;
  companyId: string;
}

// Credit Note
export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  date: string;
  customerId: string;
  customer?: Party;
  invoiceId?: string;
  invoice?: Invoice;
  items: CreditNoteItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  reason?: string;
  type: 'RETURN' | 'DISCOUNT' | 'CORRECTION' | 'CANCELLATION' | 'BAD_DEBT';
  status: 'ISSUED' | 'APPLIED' | 'REFUNDED';
  notes?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteItem {
  id: string;
  productId?: string;
  product?: Product;
  quantity: number;
  rate: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  reason?: string;
}

// Stock Adjustment
export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  date: string;
  reason?: string;
  notes?: string;
  status: 'COMPLETED' | 'DRAFT' | 'CANCELLED';
  type: 'QUANTITY' | 'VALUE' | 'BOTH';
  items: StockAdjustmentItem[];
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustmentItem {
  id: string;
  stockAdjustmentId: string;
  productId: string;
  product?: Product;
  variation: number; // Positive for addition, negative for reduction
  previousStock: number;
  newStock: number;
  reason?: string;
  batchId?: string;
  batch?: any;
}
