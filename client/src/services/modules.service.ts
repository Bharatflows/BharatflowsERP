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
  Quotation,
  SalesOrder,
  StockAdjustment,
} from '../types';

// ============ PARTIES ============
export const partiesService = createExtendedCrudService<Party, {
  getLedger: (id: string, params?: QueryParams) => Promise<ApiResponse<any>>;
  getTrustScore: (id: string) => Promise<ApiResponse<{ score: number; history: any[] }>>;
  verifyBusiness: (gstin: string) => Promise<ApiResponse<any>>;
}>('parties', (endpoint) => ({
  getLedger: (id: string, params?: QueryParams) =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/${id}/ledger?${new URLSearchParams(params as any)}`),
  getTrustScore: (id: string) =>
    apiService.get<ApiResponse<{ score: number; history: any[] }>>(`/${endpoint}/${id}/trust-score`),
  verifyBusiness: (gstin: string) =>
    apiService.post<ApiResponse<any>>(`/${endpoint}/verify-business`, { gstin }),
}));

// ============ PRODUCTS ============
export const productsService = createExtendedCrudService<Product, {
  adjustStock: (id: string, data: { quantity: number; reason: string }) => Promise<ApiResponse<Product>>;
  getLowStock: () => Promise<ApiResponse<Product[]>>;
  getByBarcode: (barcode: string) => Promise<ApiResponse<Product>>;
}>('inventory/products', (endpoint) => ({
  adjustStock: (id: string, data: { quantity: number; reason: string }) =>
    apiService.post<ApiResponse<Product>>(`/${endpoint}/${id}/adjust-stock`, data),
  getLowStock: () =>
    apiService.get<ApiResponse<Product[]>>('/inventory/low-stock'),
  getByBarcode: (barcode: string) =>
    apiService.get<ApiResponse<Product>>(`/${endpoint}/barcode/${barcode}`),
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

  // Unit Conversions
  getUnitConversions: () => apiService.get<ApiResponse<any[]>>('/inventory/unit-conversions'),
  createUnitConversion: (data: any) => apiService.post<ApiResponse<any>>('/inventory/unit-conversions', data),
  deleteUnitConversion: (id: string) => apiService.delete<ApiResponse<void>>(`/inventory/unit-conversions/${id}`),

  // Serial Numbers
  getSerialNumbers: (params?: { productId?: string; status?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/inventory/serial-numbers${query}`);
  },
  updateSerialNumber: (id: string, data: any) =>
    apiService.put<ApiResponse<any>>(`/inventory/serial-numbers/${id}`, data),

  // Stock Adjustment Documents
  getStockAdjustments: (params?: QueryParams) =>
    apiService.get<PaginatedResponse<StockAdjustment>>(`/inventory/stock-adjustments?${new URLSearchParams(params as any)}`),

  getStockAdjustmentById: (id: string) =>
    apiService.get<ApiResponse<StockAdjustment>>(`/inventory/stock-adjustments/${id}`),

  createStockAdjustment: (data: any) =>
    apiService.post<ApiResponse<StockAdjustment>>('/inventory/stock-adjustments', data),

  deleteStockAdjustment: (id: string) =>
    apiService.delete<ApiResponse<void>>(`/inventory/stock-adjustments/${id}`),
};

// ============ WASTAGE TRACKING ============
export const wastageService = {
  getSummary: () =>
    apiService.get<ApiResponse<any>>('/wastage/summary'),

  getAll: (params?: QueryParams) =>
    apiService.get<PaginatedResponse<any>>(`/wastage?${new URLSearchParams(params as any)}`),

  getById: (id: string) =>
    apiService.get<ApiResponse<any>>(`/wastage/${id}`),

  create: (data: any) =>
    apiService.post<ApiResponse<any>>('/wastage', data),
};

// ============ SALES/INVOICES ============
// Base service with CRUD operations
const baseSalesService = createExtendedCrudService<Invoice, {
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

// Extended salesService with backward-compatible methods for legacy API
export const salesService = {
  ...baseSalesService,

  // Backward-compatible invoice methods
  getInvoice: (id: string) => baseSalesService.getById(id),
  getInvoices: (params?: QueryParams) => baseSalesService.getAll(params),
  createInvoice: (data: Partial<Invoice>) => baseSalesService.create(data),
  updateInvoice: (id: string, data: Partial<Invoice>) => baseSalesService.update(id, data),
  deleteInvoice: (id: string) => baseSalesService.delete(id),

  // Backward-compatible estimate methods (delegates to estimatesService)
  getEstimate: (id: string) => apiService.get<ApiResponse<Estimate>>(`/sales/estimates/${id}`),
  getEstimates: (params?: QueryParams) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<PaginatedResponse<Estimate>>(`/sales/estimates${query}`);
  },
  createEstimate: (data: any) => apiService.post<ApiResponse<Estimate>>('/sales/estimates', data),
  updateEstimate: (id: string, data: any) => apiService.put<ApiResponse<Estimate>>(`/sales/estimates/${id}`, data),
  deleteEstimate: (id: string) => apiService.delete<ApiResponse<void>>(`/sales/estimates/${id}`),
  convertEstimateToInvoice: (id: string) => apiService.post<ApiResponse<Invoice>>(`/sales/estimates/${id}/convert`, {}),

  // Backward-compatible quotation methods
  getQuotation: (id: string) => apiService.get<ApiResponse<Quotation>>(`/sales/quotations/${id}`),
  getQuotations: (params?: QueryParams) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<PaginatedResponse<Quotation>>(`/sales/quotations${query}`);
  },
  createQuotation: (data: any) => apiService.post<ApiResponse<Quotation>>('/sales/quotations', data),
  updateQuotation: (id: string, data: any) => apiService.put<ApiResponse<Quotation>>(`/sales/quotations/${id}`, data),
  deleteQuotation: (id: string) => apiService.delete<ApiResponse<void>>(`/sales/quotations/${id}`),

  // Backward-compatible sales order methods
  getSalesOrder: (id: string) => apiService.get<ApiResponse<SalesOrder>>(`/sales/orders/${id}`),
  getSalesOrders: (params?: QueryParams) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<PaginatedResponse<SalesOrder>>(`/sales/orders${query}`);
  },
  createSalesOrder: (data: any) => apiService.post<ApiResponse<SalesOrder>>('/sales/orders', data),
  updateSalesOrder: (id: string, data: any) => apiService.put<ApiResponse<SalesOrder>>(`/sales/orders/${id}`, data),
  deleteSalesOrder: (id: string) => apiService.delete<ApiResponse<void>>(`/sales/orders/${id}`),
  convertSalesOrderToInvoice: (id: string) => apiService.post<ApiResponse<Invoice>>(`/sales/orders/${id}/convert`, {}),

  // OCR upload for invoice scanning
  uploadInvoiceOCR: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post<any>('/sales/invoices/ocr', formData);
  },
};

// ============ ESTIMATES ============
export const estimatesService = createExtendedCrudService<Estimate, {
  convert: (id: string) => Promise<ApiResponse<Invoice>>;
}>('sales/estimates', (endpoint) => ({
  convert: (id: string) =>
    apiService.post<ApiResponse<Invoice>>(`/${endpoint}/${id}/convert`, {}),
}));

// ============ SALES ORDERS ============
export const salesOrdersService = createExtendedCrudService<SalesOrder, {
  convert: (id: string) => Promise<ApiResponse<Invoice>>;
  convertToChallan: (id: string) => Promise<ApiResponse<any>>;
}>('sales/orders', (endpoint) => ({
  convert: (id: string) =>
    apiService.post<ApiResponse<Invoice>>(`/${endpoint}/${id}/convert`, {}),
  convertToChallan: (id: string) =>
    apiService.post<ApiResponse<any>>(`/${endpoint}/${id}/challan`, {}),
}));

// ============ QUOTATIONS ============
export const quotationsService = createExtendedCrudService<Quotation, {
  convert: (id: string) => Promise<ApiResponse<SalesOrder>>;
}>('sales/quotations', (endpoint) => ({
  convert: (id: string) =>
    apiService.post<ApiResponse<SalesOrder>>(`/${endpoint}/${id}/convert`, {}),
}));

// ============ SALES ANALYTICS ============
export const salesAnalyticsService = {
  getAnalytics: () =>
    apiService.get<ApiResponse<{
      funnel: {
        quotes: number;
        quotesValue?: number;
        orders: number;
        ordersValue?: number;
        invoices: number;
        invoicesValue?: number;
        conversionRate: number;
      };
      avgTimeToConvert: number;
      topProducts: { name: string; quantity: number; value: number }[];
      lostReasons: { reason: string; count: number; percentage: number }[];
      insights: { title: string; description: string; type: string }[];
    }>>('/sales/analytics'),
};

// ============ DELIVERY CHALLANS ============
export const deliveryChallansService = createExtendedCrudService<any, {
  convert: (id: string) => Promise<ApiResponse<Invoice>>;
}>('sales/challans', (endpoint) => ({
  convert: (id: string) =>
    apiService.post<ApiResponse<Invoice>>(`/${endpoint}/${id}/convert`, {}),
}));

// ============ CREDIT NOTES ============
export const creditNotesService = createCrudService<any>('sales/credit-notes');

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
  getDebitNotes: (params?: QueryParams) => Promise<PaginatedResponse<any>>;
  getDebitNoteById: (id: string) => Promise<ApiResponse<any>>;
  createDebitNote: (data: any) => Promise<ApiResponse<any>>;
  deleteDebitNote: (id: string) => Promise<ApiResponse<void>>;
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
  // Debit Notes
  getDebitNotes: (params?: QueryParams) =>
    apiService.get<PaginatedResponse<any>>(`/${endpoint}/debit-notes?${new URLSearchParams(params as any)}`),
  getDebitNoteById: (id: string) =>
    apiService.get<ApiResponse<any>>(`/${endpoint}/debit-notes/${id}`),
  createDebitNote: (data: any) =>
    apiService.post<ApiResponse<any>>(`/${endpoint}/debit-notes`, data),
  deleteDebitNote: (id: string) =>
    apiService.delete<ApiResponse<void>>(`/${endpoint}/debit-notes/${id}`),
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
  maxAmount?: number;
}>('expense-categories');

export const hrService = createExtendedCrudService<Employee, {
  markAttendance: (id: string, data: { date: string; status: string }) => Promise<ApiResponse<void>>;
  processPayroll: (month: string) => Promise<ApiResponse<void>>;
  generatePayslip: (employeeId: string, month: string) => Promise<Blob>;
  getDashboardStats: () => Promise<ApiResponse<any>>;
  getAttendance: (params?: { date?: string; employeeId?: string }) => Promise<ApiResponse<any>>;
  getDailyAttendance: (date?: string) => Promise<ApiResponse<any>>;
  getLeaves: (params?: { status?: string; employeeId?: string }) => Promise<ApiResponse<any>>;
  updateLeaveStatus: (id: string, status: string) => Promise<ApiResponse<any>>;
  getPayrollRuns: (params?: { month?: string; employeeId?: string }) => Promise<ApiResponse<any>>;
}>('hr/employees', (endpoint) => ({
  markAttendance: (employeeId: string, data: { date: string; status: string }) =>
    apiService.post<ApiResponse<void>>('/hr/attendance', { employeeId, ...data }),
  processPayroll: (month: string) =>
    apiService.post<ApiResponse<void>>('/hr/payroll/process', { month }),
  generatePayslip: (employeeId: string, month: string) =>
    apiService.get<Blob>(`/${endpoint}/${employeeId}/payslip/${month}`),
  getDashboardStats: () =>
    apiService.get<ApiResponse<any>>('/hr/dashboard/stats'),
  getAttendance: (params?: { date?: string; employeeId?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any>>(`/hr/attendance${query}`);
  },
  getDailyAttendance: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return apiService.get<ApiResponse<any>>(`/hr/attendance/daily${query}`);
  },
  getLeaves: (params?: { status?: string; employeeId?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any>>(`/hr/leaves${query}`);
  },
  updateLeaveStatus: (id: string, status: string) =>
    apiService.put<ApiResponse<any>>(`/hr/leaves/${id}/status`, { status }),
  getPayrollRuns: (params?: { month?: string; employeeId?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any>>(`/hr/payroll${query}`);
  },
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
  getStats: () =>
    apiService.get<ApiResponse<any>>('/dashboard/stats'),
  getKPIs: () =>
    apiService.get<ApiResponse<any>>('/dashboard/kpis'),
  getSalesChart: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    apiService.get<ApiResponse<any>>(`/dashboard/sales-chart?${new URLSearchParams(params as any)}`),
  getTicker: () =>
    apiService.get<any>('/dashboard/ticker'),
  getCashFlow: () =>
    apiService.get<any>('/dashboard/cash-flow'),
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
  getProfitLossTrends: () =>
    apiService.get<ApiResponse<any[]>>('/reports/profit-loss-trends'),
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
  emailPartyStatement: (partyId: string, params: { startDate?: string; endDate?: string }) =>
    apiService.post<ApiResponse<any>>(`/reports/party-statement/${partyId}/email`, params),
  exportPartyStatement: (partyId: string, format: 'pdf' | 'excel', params: { startDate?: string; endDate?: string }) =>
    apiService.get<any>(`/reports/party-statement/${partyId}/export?${new URLSearchParams({ ...params, format })}`, { responseType: 'blob' } as any),
};

// ============ BANKING ============
export const bankingService = createExtendedCrudService<any, {
  getTransactions: (accountId?: string, params?: QueryParams) => Promise<PaginatedResponse<any>>;
  createTransaction: (data: any) => Promise<ApiResponse<any>>;
  deleteTransaction: (id: string) => Promise<ApiResponse<void>>;
  getDashboard: () => Promise<ApiResponse<any>>;
  getCashFlowTrends: () => Promise<ApiResponse<any[]>>;
  getCashFlowForecast: () => Promise<ApiResponse<any>>;
  getReminders: (params?: { type?: string; status?: string }) => Promise<ApiResponse<any>>;
  createReminder: (data: any) => Promise<ApiResponse<any>>;
  updateReminder: (id: string, data: any) => Promise<ApiResponse<any>>;
  deleteReminder: (id: string) => Promise<ApiResponse<void>>;
  sendReminder: (id: string) => Promise<ApiResponse<any>>;
  syncAccount: (id: string) => Promise<ApiResponse<any>>;
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
  getCashFlowTrends: () =>
    apiService.get<ApiResponse<any[]>>('/banking/cash-flow-trends'),
  getCashFlowForecast: () =>
    apiService.get<ApiResponse<any>>('/banking/cash-flow-forecast'),
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
  syncAccount: (id: string) =>
    apiService.post<ApiResponse<any>>(`/banking/accounts/${id}/sync`, {}),
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
  getGSTHistory: () =>
    apiService.get<ApiResponse<any[]>>('/gst/history'),
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

  // PrimeSync+ (Live Portal Connectivity)
  syncGSTR2B: (period: string) => apiService.post<ApiResponse<any>>('/gst/sync-gstr2b', { period }),
  getLiveGSTR2BRecords: (params?: { period?: string; matchStatus?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/gst/gstr2b-records${query}`);
  },
  generateLiveEInvoice: (invoiceId: string) => apiService.post<ApiResponse<any>>(`/gst/invoices/${invoiceId}/einvoice`, {}),

  // TDS/TCS & GSTR-2B
  getTDSTCSEntries: () =>
    apiService.get<ApiResponse<any[]>>('/gst/tds-tcs'),
  createTDSTCSEntry: (data: any) =>
    apiService.post<ApiResponse<any>>('/gst/tds-tcs', data),
  getGSTR2BRecords: (params?: { returnPeriod?: string; matchStatus?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/gst/gstr-2b${query}`);
  },
  reconcileGSTR2B: (id: string, data: any) =>
    apiService.put<ApiResponse<any>>(`/gst/gstr-2b/${id}/reconcile`, data),
  uploadGSTR2B: (data: { records: any[]; returnPeriod: string }) =>
    apiService.post<ApiResponse<any>>('/gst/gstr-2b/upload', data),

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
  // Company Config
  getCompany: () => apiService.get<ApiResponse<any>>('/settings/company'),
  updateCompany: (data: any) => apiService.put<ApiResponse<any>>('/settings/company', data),

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

  // Company Profile
  getCompanyDetails: () => apiService.get<ApiResponse<any>>('/settings/company'),
  updateCompanyDetails: (data: any) => apiService.put<ApiResponse<any>>('/settings/company', data),

  // Dashboard Stats
  getDashboardStats: () => apiService.get<ApiResponse<any>>('/settings/dashboard/stats'),

  // Integrity Check (enhanced with history)
  checkIntegrity: (checkTypes?: string[]) => apiService.post<ApiResponse<any>>('/settings/integrity-check', { checkTypes }),
  getIntegrityHistory: (params?: { limit?: number; offset?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any>>(`/settings/integrity-check/history${query}`);
  },
  getIntegrityCheckDetails: (id: string) => apiService.get<ApiResponse<any>>(`/settings/integrity-check/${id}`),

  // Security Summary
  getSecuritySummary: () => apiService.get<ApiResponse<{
    securityScore: number;
    failedLogins: number;
    devices: { total: number; trusted: number; blocked: number };
    ipWhitelist: { active: number };
    recentEvents: any[];
  }>>('/settings/security/summary'),

  // App Configuration
  getAppConfig: () => apiService.get<ApiResponse<any>>('/settings/app-config'),
  updateAppConfig: (data: {
    enabledModules?: Record<string, boolean>;
    features?: Record<string, boolean>;
    fiscalYear?: string;
    valuationMethod?: string;
    sector?: string;
  }) => apiService.put<ApiResponse<any>>('/settings/app-config', data),

  // Apply Industry/Sector Defaults
  applyIndustryDefaults: (data: { industry: string; sector?: string }) =>
    apiService.post<ApiResponse<any>>('/settings/apply-industry-defaults', data),

  // Bulk User Import
  bulkImportUsers: (csvContent: string, sendInvites = false) =>
    apiService.post<ApiResponse<{
      imported: number;
      failed: number;
      errors: { row: number; email: string; error: string }[];
      users: { id: string; email: string; name: string }[];
    }>>('/settings/users/bulk-import', { csvContent, sendInvites }),
  getImportTemplate: () => apiService.get<string>('/settings/users/import-template'),

  // Settings Export/Import
  exportSettings: () => apiService.get<any>('/settings/export'),
  importSettings: (data: any) => apiService.post<ApiResponse<{
    imported: { company: boolean; sequences: number; workflows: number; ipWhitelist: number; expenseCategories: number };
    errors: string[];
  }>>('/settings/import', data),
  // GSTIN Lookup
  getGSTINDetails: (gstin: string) => apiService.get<ApiResponse<any>>(`/gstin/${gstin}`),
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
  getDashboard: () =>
    apiService.get<ApiResponse<any>>('/crm/dashboard'),
  getSalesFunnel: () =>
    apiService.get<ApiResponse<any[]>>('/crm/sales-funnel'),
};

// ============ CALENDAR & TASKS ============
export const calendarService = {
  getActivities: (params?: { start?: string; end?: string; type?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/calendar/activities${query}`);
  },
  createTask: (data: {
    subject: string;
    description?: string;
    date: string;
    priority?: string;
    leadId?: string;
    partyId?: string;
  }) => apiService.post<ApiResponse<any>>('/calendar/tasks', data),
  updateTask: (id: string, data: {
    isCompleted?: boolean;
    priority?: string;
    subject?: string;
    description?: string;
    date?: string;
  }) => apiService.put<ApiResponse<any>>(`/calendar/tasks/${id}`, data),
  deleteTask: (id: string) => apiService.delete<ApiResponse<void>>(`/calendar/tasks/${id}`),
};

// ============ PRODUCTION ============
export const productionService = {
  // BOMs
  getBOMs: () => apiService.get<ApiResponse<any[]>>('/production/boms'),
  getBOM: (id: string) => apiService.get<ApiResponse<any>>(`/production/boms/${id}`),
  createBOM: (data: any) => apiService.post<ApiResponse<any>>('/production/boms', data),
  updateBOM: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/production/boms/${id}`, data),
  deleteBOM: (id: string) => apiService.delete<ApiResponse<void>>(`/production/boms/${id}`),

  // Work Orders
  getWorkOrders: (params?: { status?: string; bomId?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/production/work-orders${query}`);
  },
  getWorkOrder: (id: string) => apiService.get<ApiResponse<any>>(`/production/work-orders/${id}`),
  createWorkOrder: (data: any) => apiService.post<ApiResponse<any>>('/production/work-orders', data),
  updateWorkOrder: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/production/work-orders/${id}`, data),
  deleteWorkOrder: (id: string) => apiService.delete<ApiResponse<void>>(`/production/work-orders/${id}`),

  // Dashboard
  getDashboard: () => apiService.get<ApiResponse<any>>('/production/dashboard'),

  // Planning
  getProductionPlans: () => apiService.get<ApiResponse<any[]>>('/production/plans'),
  createProductionPlan: (data: any) => apiService.post<ApiResponse<any>>('/production/plans', data),

  // Quality Control
  getInspections: () => apiService.get<ApiResponse<any[]>>('/production/inspections'),
  createInspection: (data: any) => apiService.post<ApiResponse<any>>('/production/inspections', data),
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

// ============ ESCROW ============
export const escrowService = {
  create: (data: any) =>
    apiService.post<ApiResponse<any>>('/escrow', data),
  release: (id: string) =>
    apiService.post<ApiResponse<any>>(`/escrow/${id}/release`, {}),
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

  getLedgerBalance: (id: string, asOfDate?: string) => {
    const query = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return apiService.get<ApiResponse<{ debit: number; credit: number; balance: number; type: 'Dr' | 'Cr' }>>(`/accounting/ledgers/${id}/balance${query}`);
  },

  // Vouchers
  getVouchers: (params?: { type?: string; startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<any[]>>(`/accounting/vouchers${query}`);
  },
  getVoucher: (id: string) => apiService.get<ApiResponse<any>>(`/accounting/vouchers/${id}`),
  createVoucher: (data: any) => apiService.post<ApiResponse<any>>('/accounting/vouchers', data),
  cancelVoucher: (id: string, reason: string) => apiService.post<ApiResponse<void>>(`/accounting/vouchers/${id}/cancel`, { reason }),

  // Reports
  getTrialBalance: (asOfDate?: string) => {
    const query = asOfDate ? `?asOfDate=${asOfDate}` : '';
    return apiService.get<ApiResponse<any>>(`/accounting/trial-balance${query}`);
  },
};

// ============ FINANCIAL YEAR MANAGEMENT ============
export const financialYearService = {
  getAll: () => apiService.get<ApiResponse<any[]>>('/financial-years'),
  getCurrent: () => apiService.get<ApiResponse<any>>('/financial-years/current'),
  create: (data: any) => apiService.post<ApiResponse<any>>('/financial-years', data),
  lock: (id: string, reason: string) => apiService.post<ApiResponse<any>>(`/financial-years/${id}/lock`, { reason }),
  unlock: (id: string, overrideNote: string) => apiService.post<ApiResponse<any>>(`/financial-years/${id}/unlock`, { overrideNote }),
  setCurrent: (id: string) => apiService.post<ApiResponse<any>>(`/financial-years/${id}/set-current`, {}),

  // Period Management
  getPeriods: (fyId: string) => apiService.get<ApiResponse<any[]>>(`/financial-years/${fyId}/periods`),
  lockPeriod: (periodId: string, isLocked: boolean, reason?: string) =>
    apiService.post<ApiResponse<any>>(`/financial-years/periods/${periodId}/lock`, { isLocked, reason }),
};

// ============ AUDIT LOGS ============
export const auditService = {
  getEntityLogs: (entityType: string, entityId: string) =>
    apiService.get<ApiResponse<any[]>>(`/audit/entity/${entityType}/${entityId}`),

  getGlobalLogs: (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    search?: string;
  }) => {
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return apiService.get<ApiResponse<any>>(`/audit/global${query}`);
  },

  verifyIntegrity: () => apiService.post<ApiResponse<any>>('/audit/verify', {}),
};


// ============ USER & ROLE MANAGEMENT ============
export const roleService = createExtendedCrudService<any, {
  getRoles: () => Promise<ApiResponse<any[]>>;
  updateRole: (id: string, data: any) => Promise<ApiResponse<any>>;
  deleteRole: (id: string) => Promise<ApiResponse<void>>;
}>('settings/roles', (endpoint) => ({
  getRoles: () => apiService.get<ApiResponse<any[]>>(`/${endpoint}`),
  updateRole: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/${endpoint}/${id}`, data),
  deleteRole: (id: string) => apiService.delete<ApiResponse<void>>(`/${endpoint}/${id}`),
}));

export const userService = createExtendedCrudService<any, {
  getUsers: () => Promise<ApiResponse<any[]>>;
  inviteUser: (data: any) => Promise<ApiResponse<any>>;
  updateUser: (id: string, data: any) => Promise<ApiResponse<any>>;
  deleteUser: (id: string) => Promise<ApiResponse<void>>;
}>('settings/users', (endpoint) => ({
  getUsers: () => apiService.get<ApiResponse<any[]>>(`/${endpoint}`),
  inviteUser: (data: any) => apiService.post<ApiResponse<any>>(`/${endpoint}`, data),
  updateUser: (id: string, data: any) => apiService.put<ApiResponse<any>>(`/${endpoint}/${id}`, data),
  deleteUser: (id: string) => apiService.delete<ApiResponse<void>>(`/${endpoint}/${id}`),
}));

// ============ PROFILE MANAGEMENT ============
export const profileService = {
  getProfile: () => apiService.get<ApiResponse<any>>('/settings/profile'),
  updateProfile: (data: {
    name?: string;
    phone?: string;
    designation?: string;
    bio?: string;
    avatar?: string;
    signature?: string;
    preferences?: {
      language?: string;
      timezone?: string;
      dateFormat?: string;
      numberFormat?: string;
      theme?: string;
      currency?: string;
    };
    notificationSettings?: Record<string, boolean>;
  }) => apiService.put<ApiResponse<any>>('/settings/profile', data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => apiService.put<ApiResponse<{ success: boolean; message: string }>>('/settings/profile/password', data),

  updatePreferences: (preferences: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
    numberFormat?: string;
    theme?: string;
    currency?: string;
  }) => apiService.put<ApiResponse<{ preferences: any }>>('/settings/profile/preferences', { preferences }),

  updateNotificationSettings: (notificationSettings: {
    emailInvoice?: boolean;
    emailPayment?: boolean;
    emailLowStock?: boolean;
    emailGST?: boolean;
    emailExpenseApproval?: boolean;
    mobileInvoice?: boolean;
    mobilePayment?: boolean;
    mobileLowStock?: boolean;
    whatsappInvoice?: boolean;
    whatsappPayment?: boolean;
    inAppEnabled?: boolean;
    inAppSound?: boolean;
  }) => apiService.put<ApiResponse<{ notificationSettings: any }>>('/settings/profile/notifications', { notificationSettings }),
};

// ============ GSTIN LOOKUP ============
export const gstinService = {
  // Lookup GSTIN and fetch party details from government database
  lookup: (gstin: string) =>
    apiService.get<ApiResponse<{
      gstin: string;
      legalName: string;
      tradeName: string | null;
      status: string;
      registrationDate: string | null;
      businessType: string | null;
      stateCode: string;
      stateName: string;
      address: {
        building: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
      };
    }>>(`/gstin/${gstin}`),

  // Validate GSTIN format only (no API call to government)
  validate: (gstin: string) =>
    apiService.get<ApiResponse<{
      gstin: string;
      isValid: boolean;
      stateCode: string | null;
      stateName: string | null;
      pan: string | null;
    }>>(`/gstin/validate/${gstin}`),
};

// ============ HSN CODE MANAGEMENT ============
interface HSNCode {
  id: string;
  code: string;
  description: string;
  gstRate: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  unit?: string;
  category?: string;
  chapter?: string;
  isService: boolean;
  isActive: boolean;
  matchScore?: number;
}

export const hsnService = {
  // Search HSN codes with fuzzy matching
  search: (query: string, options?: { limit?: number; category?: string; isService?: boolean }) => {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.category) params.set('category', options.category);
    if (options?.isService !== undefined) params.set('isService', options.isService.toString());
    return apiService.get<ApiResponse<HSNCode[]>>(`/hsn/search?${params}`);
  },

  // Get HSN code suggestions for a product name (uses fuzzy matching)
  suggest: (productName: string, limit = 5) =>
    apiService.get<ApiResponse<HSNCode[]>>(`/hsn/suggest?q=${encodeURIComponent(productName)}&limit=${limit}`),

  // Get single HSN by code
  getByCode: (code: string) =>
    apiService.get<ApiResponse<HSNCode>>(`/hsn/${code}`),

  // Get all HSN codes (paginated)
  getAll: (params?: { page?: number; limit?: number; category?: string; isService?: boolean; gstRate?: number }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return apiService.get<ApiResponse<{ data: HSNCode[]; pagination: any }>>(`/hsn${query}`);
  },

  // Create or update HSN code
  create: (data: Partial<HSNCode>) =>
    apiService.post<ApiResponse<HSNCode>>('/hsn', data),

  // Bulk import HSN codes
  import: (codes: Partial<HSNCode>[]) =>
    apiService.post<ApiResponse<{ imported: number; skipped: number; errors: string[] }>>('/hsn/import', { codes }),

  // Delete (deactivate) HSN code
  delete: (code: string) =>
    apiService.delete<ApiResponse<HSNCode>>(`/hsn/${code}`),

  // Get unique categories for filtering
  getCategories: () =>
    apiService.get<ApiResponse<string[]>>('/hsn/categories'),
};

// ============ SEARCH ============
export const searchService = {
  globalSearch: (query: string) =>
    apiService.get<ApiResponse<any[]>>(`/search/global?query=${encodeURIComponent(query)}`),
};

// ============ SETTINGS AUDIT LOGS ============
export const auditLogsService = {
  getLogs: (params: {
    page?: number;
    limit?: number;
    search?: string;
    settingType?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.settingType) query.append('settingType', params.settingType);
    if (params.action) query.append('action', params.action);
    if (params.userId) query.append('userId', params.userId);
    if (params.startDate) query.append('startDate', params.startDate.toISOString());
    if (params.endDate) query.append('endDate', params.endDate.toISOString());

    return apiService.get<PaginatedResponse<any>>(`/settings/audit-logs?${query.toString()}`);
  },

  getLogDetail: (id: string) =>
    apiService.get<ApiResponse<any>>(`/settings/audit-logs/${id}`),

  getStats: (days: number = 30) =>
    apiService.get<ApiResponse<any>>(`/settings/audit-logs/stats?days=${days}`),

  exportLogs: (params: any) =>
    apiService.getBlob(`/settings/audit-logs/export?${new URLSearchParams(params)}`),
};

// ============ SETTINGS APPROVAL WORKFLOW ============
export const approvalService = {
  createRequest: (data: { settingType: string; changeData: any; reason: string }) =>
    apiService.post<ApiResponse<any>>('/settings/approvals/request', data),

  getRequests: (params: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);
    return apiService.get<PaginatedResponse<any>>(`/settings/approvals?${query.toString()}`);
  },

  getPendingCount: () =>
    apiService.get<ApiResponse<{ count: number }>>('/settings/approvals/pending-count'),

  approveRequest: (id: string) =>
    apiService.post<ApiResponse<any>>(`/settings/approvals/${id}/approve`, {}),

  rejectRequest: (id: string, reason: string) =>
    apiService.post<ApiResponse<any>>(`/settings/approvals/${id}/reject`, { rejectionReason: reason }),
};

// ============ TWO-FACTOR AUTH (2FA) ============
export const auth2faService = {
  getStatus: () =>
    apiService.get<ApiResponse<{ enabled: boolean; method?: string; backupCodesRemaining?: number }>>('/auth/2fa/status'),

  setup: () =>
    apiService.post<ApiResponse<{ secret: string; qrCode: string; manualEntryKey: string }>>('/auth/2fa/setup', {}),

  verifySetup: (code: string) =>
    apiService.post<ApiResponse<{ backupCodes: string[] }>>('/auth/2fa/verify-setup', { code }),

  verify: (userId: string, code: string, isBackupCode?: boolean) =>
    apiService.post<ApiResponse<any>>('/auth/2fa/verify', { userId, code, isBackupCode }),

  disable: (password: string, code?: string) =>
    apiService.post<ApiResponse<any>>('/auth/2fa/disable', { password, code }),

  generateBackupCodes: (password: string) =>
    apiService.post<ApiResponse<{ backupCodes: string[] }>>('/auth/2fa/backup-codes', { password }),
};


