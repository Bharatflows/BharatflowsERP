/**
 * Module-specific API Services
 * 
 * Uses the generic CRUD factory for standard operations and adds
 * custom methods only where needed.
 */

import { apiService } from './api';
import { createCrudService, createExtendedCrudService } from './createCrudService';
import type {
  Party,
  Product,
  Invoice,
  PurchaseOrder,
  Expense,
  Employee,
  Notification,
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  Estimate,
  SalesOrder,
} from '../types';

// ============ PARTIES ============
export const partiesService = createExtendedCrudService<Party, {
  getLedger: (id: string, params?: QueryParams) => Promise<ApiResponse<any>>;
}>('parties', (endpoint) => ({
  getLedger: (id: string, params?: QueryParams) =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/${id}/ledger?${new URLSearchParams(params as any)}`),
}));

// ============ PRODUCTS ============
export const productsService = createExtendedCrudService<Product, {
  adjustStock: (id: string, data: { quantity: number; reason: string }) => Promise<ApiResponse<Product>>;
  getLowStock: () => Promise<ApiResponse<Product[]>>;
}>('inventory/products', (endpoint) => ({
  adjustStock: (id: string, data: { quantity: number; reason: string }) =>
    apiService.post<ApiResponse<Product>>(`/${endpoint}/${id}/adjust-stock`, data),
  getLowStock: () =>
    apiService.get<ApiResponse<Product[]>>('/inventory/low-stock'),
}));

// ============ INVENTORY MANAGEMENT ============
export const inventoryService = {
  // Stock Operations
  adjustStock: (data: {
    productId: string;
    quantity: number;
    type: 'ADD' | 'REMOVE' | 'DAMAGE' | 'RETURN' | 'CORRECTION';
    reason: string;
    notes?: string;
    warehouseId?: string;
  }) => apiService.post<ApiResponse<any>>('/inventory/adjust-stock', data),

  transferStock: (data: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    notes?: string;
  }) => apiService.post<ApiResponse<any>>('/inventory/transfer-stock', data),

  // Monitoring & History
  getLowStock: () =>
    apiService.get<ApiResponse<Product[]>>('/inventory/low-stock'),

  getStockHistory: (productId: string) =>
    apiService.get<ApiResponse<any[]>>(`/inventory/stock-history/${productId}`),

  getStockMovements: (params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/inventory/stock-movements${query}`);
  },

  // Warehouse Management
  getWarehouses: () =>
    apiService.get<ApiResponse<any[]>>('/inventory/warehouses'),

  createWarehouse: (data: {
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isDefault?: boolean;
  }) => apiService.post<ApiResponse<any>>('/inventory/warehouses', data),

  updateWarehouse: (id: string, data: Partial<any>) =>
    apiService.put<ApiResponse<any>>(`/inventory/warehouses/${id}`, data),

  deleteWarehouse: (id: string) =>
    apiService.delete<ApiResponse<void>>(`/inventory/warehouses/${id}`),

  // Valuation
  getValuation: () =>
    apiService.get<ApiResponse<{
      totalValue: number;
      totalProducts: number;
      totalStock: number;
      breakdown: { category: string; value: number }[];
      method: string;
    }>>('/inventory/valuation'),

  // Batch Tracking
  createBatch: (data: any) =>
    apiService.post<ApiResponse<any>>('/inventory/stock/batches', data),
  getBatches: (productId: string) =>
    apiService.get<ApiResponse<any>>(`/inventory/stock/batches/${productId}`),
};

// ============ SALES/INVOICES ============
export const salesService = createExtendedCrudService<Invoice, {
  recordPayment: (id: string, data: { amount: number; paymentMode: string; date: string }) => Promise<ApiResponse<Invoice>>;
  downloadPDF: (id: string) => Promise<Blob>;
  sendEmail: (id: string, email: string) => Promise<ApiResponse<void>>;
}>('sales/invoices', (endpoint) => ({
  recordPayment: (id: string, data: { amount: number; paymentMode: string; date: string }) =>
    apiService.post<ApiResponse<Invoice>>(`/${endpoint}/${id}/payment`, data),
  downloadPDF: (id: string) =>
    apiService.get<Blob>(`/${endpoint}/${id}/pdf`),
  sendEmail: (id: string, email: string) =>
    apiService.post<ApiResponse<void>>(`/${endpoint}/${id}/send`, { email }),
}));

// ============ ESTIMATES ============
export const estimatesService = createCrudService<Estimate>('sales/estimates');

// ============ SALES ORDERS ============
export const salesOrdersService = createCrudService<SalesOrder>('sales/orders');

// ============ DELIVERY CHALLANS ============
export const deliveryChallansService = createExtendedCrudService<any, {
  convert: (id: string) => Promise<ApiResponse<Invoice>>;
}>('sales/challans', (endpoint) => ({
  convert: (id: string) =>
    apiService.post<ApiResponse<Invoice>>(`/${endpoint}/${id}/convert`, {}),
}));

// ============ PURCHASE ORDERS ============
export const purchaseService = createExtendedCrudService<PurchaseOrder, {
  updateStatus: (id: string, status: string) => Promise<ApiResponse<PurchaseOrder>>;
  getBills: (params?: QueryParams) => Promise<PaginatedResponse<any>>;
  getBillById: (id: string) => Promise<ApiResponse<any>>;
  createBill: (data: any) => Promise<ApiResponse<any>>;
  updateBill: (id: string, data: any) => Promise<ApiResponse<any>>;
  deleteBill: (id: string) => Promise<ApiResponse<void>>;
  getGRNs: (params?: QueryParams) => Promise<PaginatedResponse<any>>;
  getGRNById: (id: string) => Promise<ApiResponse<any>>;
  createGRN: (data: any) => Promise<ApiResponse<any>>;
  updateGRN: (id: string, data: any) => Promise<ApiResponse<any>>;
  deleteGRN: (id: string) => Promise<ApiResponse<void>>;
}>('purchase', (endpoint) => ({
  updateStatus: (id: string, status: string) =>
    apiService.patch<ApiResponse<PurchaseOrder>>(`/${endpoint}/${id}/status`, { status }),
  // Purchase Bills
  getBills: (params?: QueryParams) =>
    apiService.get<PaginatedResponse<any>>(`/${endpoint}/bills?${new URLSearchParams(params as any)}`),
  getBillById: (id: string) =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/bills/${id}`),
  createBill: (data: any) =>
    apiService.post<ApiResponse<any>>(`/${endpoint}/bills`, data),
  updateBill: (id: string, data: any) =>
    apiService.put<ApiResponse<any>>(`/${endpoint}/bills/${id}`, data),
  deleteBill: (id: string) =>
    apiService.delete<ApiResponse<void>>(`/${endpoint}/bills/${id}`),
  // GRN
  getGRNs: (params?: QueryParams) =>
    apiService.get<PaginatedResponse<any>>(`/${endpoint}/grn?${new URLSearchParams(params as any)}`),
  getGRNById: (id: string) =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/grn/${id}`),
  createGRN: (data: any) =>
    apiService.post<ApiResponse<any>>(`/${endpoint}/grn`, data),
  updateGRN: (id: string, data: any) =>
    apiService.put<ApiResponse<any>>(`/${endpoint}/grn/${id}`, data),
  deleteGRN: (id: string) =>
    apiService.delete<ApiResponse<void>>(`/${endpoint}/grn/${id}`),
}));

// ============ EXPENSES ============
export const expensesService = createExtendedCrudService<Expense, {
  approve: (id: string) => Promise<ApiResponse<Expense>>;
  reject: (id: string, reason: string) => Promise<ApiResponse<Expense>>;
  markAsPaid: (id: string, paymentMethod?: string) => Promise<ApiResponse<Expense>>;
  getDashboardStats: () => Promise<ApiResponse<any>>;
  getVendorPayments: () => Promise<ApiResponse<any>>;
  recordVendorPayment: (data: { vendor: string; amount: number; paymentMethod?: string }) => Promise<ApiResponse<any>>;
  getBudgetVsActual: (months?: number) => Promise<ApiResponse<any>>;
  getCategoryTrend: (months?: number) => Promise<ApiResponse<any>>;
  getVendorSummary: () => Promise<ApiResponse<any>>;
  getTaxReport: (months?: number) => Promise<ApiResponse<any>>;
}>('expenses', (endpoint) => ({
  approve: (id: string) =>
    apiService.post<ApiResponse<Expense>>(`/${endpoint}/${id}/approve`, {}),
  reject: (id: string, reason: string) =>
    apiService.post<ApiResponse<Expense>>(`/${endpoint}/${id}/reject`, { reason }),
  markAsPaid: (id: string, paymentMethod?: string) =>
    apiService.post<ApiResponse<Expense>>(`/${endpoint}/${id}/paid`, { paymentMethod }),
  getDashboardStats: () =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/dashboard/stats`),
  getVendorPayments: () =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/vendor-payments`),
  recordVendorPayment: (data: { vendor: string; amount: number; paymentMethod?: string }) =>
    apiService.post<ApiResponse<any>>(`/${endpoint}/vendor-payments/pay`, data),
  getBudgetVsActual: (months = 6) =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/reports/budget-vs-actual?months=${months}`),
  getCategoryTrend: (months = 6) =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/reports/category-trend?months=${months}`),
  getVendorSummary: () =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/reports/vendor-summary`),
  getTaxReport: (months = 6) =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/reports/tax?months=${months}`),
}));

// ============ EXPENSE CATEGORIES ============
export const expenseCategoriesService = createCrudService<{
  id: string;
  name: string;
  description?: string;
  budget: number;
  color: string;
  spent: number;
  count: number;
}>('expense-categories');

// ============ HR/EMPLOYEES ============
export const hrService = createExtendedCrudService<Employee, {
  markAttendance: (id: string, data: { date: string; status: string }) => Promise<ApiResponse<void>>;
  processPayroll: (month: string) => Promise<ApiResponse<void>>;
  generatePayslip: (employeeId: string, month: string) => Promise<Blob>;
}>('hr/employees', (endpoint) => ({
  markAttendance: (id: string, data: { date: string; status: string }) =>
    apiService.post<ApiResponse<void>>(`/${endpoint}/${id}/attendance`, data),
  processPayroll: (month: string) =>
    apiService.post<ApiResponse<void>>('/hr/payroll/process', { month }),
  generatePayslip: (employeeId: string, month: string) =>
    apiService.get<Blob>(`/${endpoint}/${employeeId}/payslip/${month}`),
}));

// ============ NOTIFICATIONS ============
export const notificationsService = {
  getAll: (params?: QueryParams) =>
    apiService.get<PaginatedResponse<Notification>>(`/notifications?${new URLSearchParams(params as any)}`),
  markAsRead: (id: string) =>
    apiService.patch<ApiResponse<Notification>>(`/notifications/${id}/read`, {}),
  markAllAsRead: () =>
    apiService.post<ApiResponse<void>>('/notifications/read-all', {}),
  delete: (id: string) =>
    apiService.delete<ApiResponse<void>>(`/notifications/${id}`),
  getUnreadCount: () =>
    apiService.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
};

// ============ DASHBOARD/ANALYTICS ============
export const dashboardService = {
  getKPIs: () =>
    apiService.get<ApiResponse<any>>('/dashboard/kpis'),
  getSalesChart: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    apiService.get<ApiResponse<any>>(`/dashboard/sales-chart?${new URLSearchParams(params as any)}`),
  getRecentTransactions: () =>
    apiService.get<ApiResponse<any>>('/dashboard/recent-transactions'),
  getStats: () =>
    apiService.get<ApiResponse<any>>('/dashboard/stats'),
};

// ============ REPORTS ============
export const reportsService = {
  getDashboard: () =>
    apiService.get<ApiResponse<{
      period: { month: string; startDate: string; endDate: string };
      kpis: {
        totalSales: number;
        salesTrend: number;
        totalPurchases: number;
        purchaseTrend: number;
        netProfit: number;
        profitTrend: number;
        inventoryValue: number;
      };
    }>>('/reports/dashboard'),
  getProfitLoss: (params?: { startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any>>(`/reports/profit-loss${query}`);
  },
  getBalanceSheet: (params?: { asOfDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any>>(`/reports/balance-sheet${query}`);
  },
  getAgingReceivables: () =>
    apiService.get<ApiResponse<any>>('/reports/aging-receivables'),
  getAgingPayables: () =>
    apiService.get<ApiResponse<any>>('/reports/aging-payables'),
  getSalesReport: (params: { startDate: string; endDate: string }) =>
    apiService.get<ApiResponse<any>>(`/reports/sales?${new URLSearchParams(params)}`),
  getPurchaseReport: (params: { startDate: string; endDate: string }) =>
    apiService.get<ApiResponse<any>>(`/reports/purchase?${new URLSearchParams(params)}`),
  getInventoryReport: () =>
    apiService.get<ApiResponse<any>>('/reports/inventory'),
  getPartyStatement: (partyId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any>>(`/reports/party-statement/${partyId}${query}`);
  },
  getGSTReport: (params: { month: string }) =>
    apiService.get<ApiResponse<any>>(`/reports/gst?${new URLSearchParams(params)}`),
  exportReport: (type: string, params: any) =>
    apiService.get<Blob>(`/reports/export/${type}?${new URLSearchParams(params)}`),
};

// ============ BANKING ============
export const bankingService = createExtendedCrudService<any, {
  getTransactions: (accountId?: string, params?: QueryParams) => Promise<PaginatedResponse<any>>;
  createTransaction: (data: any) => Promise<ApiResponse<any>>;
  deleteTransaction: (id: string) => Promise<ApiResponse<void>>;
  getDashboard: () => Promise<ApiResponse<any>>;
  getReminders: (params?: { type?: string; status?: string }) => Promise<ApiResponse<any>>;
  createReminder: (data: any) => Promise<ApiResponse<any>>;
  updateReminder: (id: string, data: any) => Promise<ApiResponse<any>>;
  deleteReminder: (id: string) => Promise<ApiResponse<void>>;
  sendReminder: (id: string) => Promise<ApiResponse<any>>;
}>('banking/accounts', () => ({
  getTransactions: (accountId?: string, params?: QueryParams) => {
    const query = new URLSearchParams(params as any);
    if (accountId) query.append('accountId', accountId);
    return apiService.get<PaginatedResponse<any>>(`/banking/transactions?${query}`);
  },
  createTransaction: (data: any) =>
    apiService.post<ApiResponse<any>>('/banking/transactions', data),
  deleteTransaction: (id: string) =>
    apiService.delete<ApiResponse<void>>(`/banking/transactions/${id}`),
  getDashboard: () =>
    apiService.get<ApiResponse<any>>('/banking/dashboard'),
  getReminders: (params?: { type?: string; status?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any>>(`/banking/reminders${query}`);
  },
  createReminder: (data: any) =>
    apiService.post<ApiResponse<any>>('/banking/reminders', data),
  updateReminder: (id: string, data: any) =>
    apiService.put<ApiResponse<any>>(`/banking/reminders/${id}`, data),
  deleteReminder: (id: string) =>
    apiService.delete<ApiResponse<void>>(`/banking/reminders/${id}`),
  sendReminder: (id: string) =>
    apiService.post<ApiResponse<any>>(`/banking/reminders/${id}/send`, {}),
}));

// ============ GST COMPLIANCE ============
export const gstService = {
  getDashboard: () =>
    apiService.get<ApiResponse<{
      currentMonth: string;
      gstSummary: { outputTax: number; inputTax: number; taxLiability: number; itcAvailable: number };
      filingStatus: any[];
      upcomingDeadlines: any[];
      recentPayments: any[];
    }>>('/gst/dashboard'),
  generateGSTR1: (params: { month: string; year: string }) =>
    apiService.get<ApiResponse<any>>(`/gst/gstr1?${new URLSearchParams(params)}`),
  generateGSTR3B: (params: { month: string; year: string }) =>
    apiService.get<ApiResponse<any>>(`/gst/gstr3b?${new URLSearchParams(params)}`),
  createEWayBill: (data: {
    invoiceId: string;
    transporterName: string;
    transporterId?: string;
    vehicleNumber: string;
    vehicleType: string;
    distance: number;
    transactionType: string;
    supplyType: string;
    subSupplyType?: string;
  }) => apiService.post<ApiResponse<any>>('/gst/eway-bill', data),
  getHSNSummary: (params?: { startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/gst/hsn-summary${query}`);
  },
  getITCLedger: (params?: { startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<{ entries: any[]; summary: any }>>(`/gst/itc-ledger${query}`);
  },
  fileGSTReturn: (data: {
    returnType: 'GSTR1' | 'GSTR3B';
    month: string;
    year: string;
    data: any;
  }) => apiService.post<ApiResponse<any>>('/gst/file-return', data),

  // GST Payments
  getPayments: (params?: { status?: string; period?: string; page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<{ items: any[]; pagination: any }>>(`/gst/payments${query}`);
  },
  getPaymentSummary: (year?: string) => {
    const query = year ? `?year=${year}` : '';
    return apiService.get<ApiResponse<any>>(`/gst/payments/summary${query}`);
  },
  getPayment: (id: string) => apiService.get<ApiResponse<any>>(`/gst/payments/${id}`),
  createPayment: (data: any) => apiService.post<ApiResponse<any>>('/gst/payments', data),
  updatePayment: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/gst/payments/${id}`, data),
  deletePayment: (id: string) => apiService.delete<ApiResponse<void>>(`/gst/payments/${id}`),

  // E-Invoices
  getEInvoices: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<{ items: any[]; pagination: any }>>(`/gst/e-invoices${query}`);
  },
  getEInvoice: (id: string) => apiService.get<ApiResponse<any>>(`/gst/e-invoices/${id}`),
  generateEInvoice: (invoiceId: string) => apiService.post<ApiResponse<any>>('/gst/e-invoices/generate', { invoiceId }),
  updateEInvoiceStatus: (id: string, data: { status: string; irn?: string; ackNumber?: string; ackDate?: string }) =>
    apiService.put<ApiResponse<any>>(`/gst/e-invoices/${id}/status`, data),
  cancelEInvoice: (id: string, reason?: string) => apiService.post<ApiResponse<any>>(`/gst/e-invoices/${id}/cancel`, { reason }),
  deleteEInvoice: (id: string) => apiService.delete<ApiResponse<void>>(`/gst/e-invoices/${id}`),

  // E-Waybills
  getEWaybills: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<{ items: any[]; pagination: any }>>(`/gst/e-waybills${query}`);
  },
  getEWaybill: (id: string) => apiService.get<ApiResponse<any>>(`/gst/e-waybills/${id}`),
  createEWaybill: (data: any) => apiService.post<ApiResponse<any>>('/gst/e-waybills', data),
  updateEWaybill: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/gst/e-waybills/${id}`, data),
  extendEWaybill: (id: string, data: { reason: string; newVehicleNumber?: string; newValidUpto: string }) =>
    apiService.post<ApiResponse<any>>(`/gst/e-waybills/${id}/extend`, data),
  cancelEWaybill: (id: string, reason?: string) => apiService.post<ApiResponse<any>>(`/gst/e-waybills/${id}/cancel`, { reason }),
  deleteEWaybill: (id: string) => apiService.delete<ApiResponse<void>>(`/gst/e-waybills/${id}`),
};

// ============ SETTINGS ============
export const settingsService = {
  // Sequences
  getNextSequenceNumber: (documentType: string) =>
    apiService.get<ApiResponse<{ nextNumber: string; sequence: any }>>(`/settings/sequences/${documentType}/next`),
  getSequences: () =>
    apiService.get<ApiResponse<any[]>>('/settings/sequences'),
  updateSequence: (documentType: string, data: { prefix?: string; nextNumber?: number; format?: string }) =>
    apiService.put<ApiResponse<any>>(`/settings/sequences/${documentType}`, data),

  // Devices
  getDevices: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<{ items: any[]; pagination: any }>>(`/settings/devices${query}`);
  },
  getDeviceSummary: () =>
    apiService.get<ApiResponse<{ totalDevices: number; activeDevices: number; blockedDevices: number; trustedDevices: number }>>('/settings/devices/summary'),
  getDevice: (id: string) => apiService.get<ApiResponse<any>>(`/settings/devices/${id}`),
  registerDevice: (data: any) => apiService.post<ApiResponse<any>>('/settings/devices', data),
  updateDevice: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/settings/devices/${id}`, data),
  blockDevice: (id: string) => apiService.post<ApiResponse<any>>(`/settings/devices/${id}/block`, {}),
  unblockDevice: (id: string) => apiService.post<ApiResponse<any>>(`/settings/devices/${id}/unblock`, {}),
  deleteDevice: (id: string) => apiService.delete<ApiResponse<void>>(`/settings/devices/${id}`),

  // IP Whitelist
  getIPWhitelist: (params?: { isActive?: string; page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<{ items: any[]; pagination: any }>>(`/settings/ip-whitelist${query}`);
  },
  getIPWhitelistEntry: (id: string) => apiService.get<ApiResponse<any>>(`/settings/ip-whitelist/${id}`),
  addIPToWhitelist: (data: { ipAddress: string; description?: string; expiresAt?: string }) =>
    apiService.post<ApiResponse<any>>('/settings/ip-whitelist', data),
  updateIPWhitelist: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/settings/ip-whitelist/${id}`, data),
  toggleIPWhitelist: (id: string) => apiService.post<ApiResponse<any>>(`/settings/ip-whitelist/${id}/toggle`, {}),
  removeIPFromWhitelist: (id: string) => apiService.delete<ApiResponse<void>>(`/settings/ip-whitelist/${id}`),
  checkIPWhitelist: (ip: string) => apiService.get<ApiResponse<{ isWhitelisted: boolean; entry: any }>>(`/settings/ip-whitelist/check/${ip}`),

  // Approval Workflows
  getWorkflows: (params?: { isActive?: string; documentType?: string; page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<{ items: any[]; pagination: any }>>(`/settings/workflows${query}`);
  },
  getWorkflow: (id: string) => apiService.get<ApiResponse<any>>(`/settings/workflows/${id}`),
  createWorkflow: (data: any) => apiService.post<ApiResponse<any>>('/settings/workflows', data),
  updateWorkflow: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/settings/workflows/${id}`, data),
  toggleWorkflow: (id: string) => apiService.post<ApiResponse<any>>(`/settings/workflows/${id}/toggle`, {}),
  deleteWorkflow: (id: string) => apiService.delete<ApiResponse<void>>(`/settings/workflows/${id}`),
  getWorkflowForDocument: (documentType: string, amount?: number) => {
    const params = new URLSearchParams({ documentType });
    if (amount !== undefined) params.append('amount', String(amount));
    return apiService.get<ApiResponse<{ requiresApproval: boolean; workflow: any }>>(`/settings/workflows/for-document?${params}`);
  },
};

// ============ CRM ============
export const crmService = {
  getLeads: () => apiService.get<ApiResponse<any[]>>('/crm/leads'),
  getLead: (id: string) => apiService.get<ApiResponse<any>>(`/crm/leads/${id}`),
  createLead: (data: any) => apiService.post<ApiResponse<any>>('/crm/leads', data),
  updateLead: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => apiService.delete<ApiResponse<void>>(`/crm/leads/${id}`),
  updateStatus: (id: string, status: string) =>
    apiService.put<ApiResponse<any>>(`/crm/leads/${id}/status`, { status }),
  addActivity: (data: any) =>
    apiService.post<ApiResponse<any>>('/crm/activities', data),
  getActivities: (params?: { leadId?: string; partyId?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/crm/activities${query}`);
  },
};

// ============ POS ============
export const posService = {
  openSession: (openingCash: number) =>
    apiService.post<ApiResponse<any>>('/pos/sessions/open', { openingCash }),
  closeSession: (sessionId: string, closingCash: number) =>
    apiService.post<ApiResponse<any>>('/pos/sessions/close', { sessionId, closingCash }),
  createOrder: (data: any) =>
    apiService.post<ApiResponse<any>>('/pos/orders', data),
};

// ============ INVITES ============
export interface Invite {
  id: string;
  email: string;
  type: 'EMPLOYEE' | 'PARTY';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  role?: string;
  moduleAccess?: Record<string, boolean>;
  inviteLink?: string;
  message?: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: { id: string; name: string; email: string };
  party?: { id: string; name: string; type: string };
  company?: { id: string; businessName: string; logo?: string };
}

export const inviteService = {
  // Employee invites
  createEmployeeInvite: (data: {
    email: string;
    role?: string;
    moduleAccess?: Record<string, boolean>;
    message?: string;
  }) => apiService.post<ApiResponse<{ id: string; email: string; role: string; expiresAt: string; inviteLink: string }>>('/invite/employee', data),

  // Party invites
  createPartyInvite: (data: {
    partyId?: string;
    email?: string;
    message?: string;
  }) => apiService.post<ApiResponse<{ id: string; email: string; expiresAt: string; inviteLink: string }>>('/invite/party', data),

  // List invites
  getInvites: (params?: { status?: string; type?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<Invite[]>>(`/invite${query}`);
  },

  // Cancel invite
  cancelInvite: (id: string) => apiService.delete<ApiResponse<void>>(`/invite/${id}`),

  // Resend invite
  resendInvite: (id: string) => apiService.post<ApiResponse<{ inviteLink: string }>>(`/invite/${id}/resend`, {}),

  // Public: Verify invite token
  verifyInvite: (token: string) => apiService.get<ApiResponse<Invite>>(`/invite/verify/${token}`),

  // Public: Accept employee invite
  acceptEmployeeInvite: (data: {
    token: string;
    name: string;
    phone?: string;
    password: string;
  }) => apiService.post<ApiResponse<{ email: string }>>('/invite/accept/employee', data),

  // Public: Accept party invite
  acceptPartyInvite: (data: {
    token: string;
    name: string;
    email?: string;
    phone?: string;
    password: string;
    businessName: string;
    gstin?: string;
  }) => apiService.post<ApiResponse<{ email: string; companyName: string }>>('/invite/accept/party', data),
};

// ============ ACCOUNTING (Chart of Accounts, Vouchers, Reports) ============
export const accountingService = {
  // Ledger Groups
  getLedgerGroups: () => apiService.get<ApiResponse<any[]>>('/accounting/ledger-groups'),
  createLedgerGroup: (data: {
    name: string;
    code: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
    description?: string;
    parentId?: string;
  }) => apiService.post<ApiResponse<any>>('/accounting/ledger-groups', data),

  // Seed default Chart of Accounts
  seedDefaults: () => apiService.post<ApiResponse<void>>('/accounting/seed-defaults', {}),

  // Ledgers (Chart of Accounts)
  getLedgers: () => apiService.get<ApiResponse<any[]>>('/accounting/ledgers'),
  getLedger: (id: string) => apiService.get<ApiResponse<any>>(`/accounting/ledgers/${id}`),
  createLedger: (data: {
    name: string;
    code: string;
    groupId: string;
    description?: string;
    openingBalance?: number;
    openingType?: 'DEBIT' | 'CREDIT';
    partyId?: string;
    bankAccountId?: string;
  }) => apiService.post<ApiResponse<any>>('/accounting/ledgers', data),
  getLedgerBalance: (id: string, asOfDate?: string) =>
    apiService.get<ApiResponse<{ debit: number; credit: number; balance: number; type: 'Dr' | 'Cr' }>>(
      `/accounting/ledgers/${id}/balance${asOfDate ? `?asOfDate=${asOfDate}` : ''}`
    ),

  // Vouchers (Journal Entries)
  getVouchers: (filters?: { type?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    const queryString = params.toString();
    return apiService.get<ApiResponse<any[]>>(`/accounting/vouchers${queryString ? `?${queryString}` : ''}`);
  },
  getVoucher: (id: string) => apiService.get<ApiResponse<any>>(`/accounting/vouchers/${id}`),
  createVoucher: (data: {
    date: string;
    type: 'SALES' | 'PURCHASE' | 'PAYMENT' | 'RECEIPT' | 'CONTRA' | 'JOURNAL';
    narration?: string;
    postings: {
      ledgerId: string;
      amount: number;
      type: 'DEBIT' | 'CREDIT';
      narration?: string;
    }[];
  }) => apiService.post<ApiResponse<any>>('/accounting/vouchers', data),

  // Receipts
  getReceipts: () => apiService.get<ApiResponse<any>>('/accounting/receipts'),
  createReceipt: (data: {
    partyId: string;
    amount: number;
    date: string;
    mode: 'CASH' | 'BANK';
    reference?: string;
    notes?: string;
    bankAccountId?: string;
  }) => apiService.post<ApiResponse<any>>('/accounting/receipts', data),

  // Reports
  getTrialBalance: (asOfDate?: string) =>
    apiService.get<ApiResponse<{
      entries: {
        ledgerId: string;
        ledgerName: string;
        ledgerCode: string;
        groupName: string;
        groupType: string;
        debit: number;
        credit: number;
      }[];
      totals: { debit: number; credit: number };
    }>>(`/accounting/trial-balance${asOfDate ? `?asOfDate=${asOfDate}` : ''}`),
};


// ============ AUDIT LOGS ============
export const auditService = {
  getEntityLogs: (entityType: string, entityId: string) =>
    apiService.get<ApiResponse<any[]>>(`/audit/entity/${entityType}/${entityId}`),

  getGlobalLogs: (params?: QueryParams) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<PaginatedResponse<any>>(`/audit/global${query}`);
  },

  verifyIntegrity: () =>
    apiService.post<ApiResponse<any>>('/audit/verify', {}),
};
