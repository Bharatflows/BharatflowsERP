import { apiService } from './api';
import {
    Invoice,
    Estimate,
    Quotation,
    SalesOrder,
    PaginatedResponse,
    ApiResponse,
    QueryParams
} from '../types';

class SalesService {
    // --- Invoices ---

    async getInvoices(params: QueryParams = {}): Promise<PaginatedResponse<Invoice>> {
        const queryString = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryString.append(key, value.toString());
            }
        });

        const response = await apiService.get<any>(`/sales/invoices?${queryString.toString()}`);
        return response.data;
    }

    async getInvoice(id: string): Promise<Invoice> {
        const response = await apiService.get<any>(`/sales/invoices/${id}`);
        return response.data.invoice;
    }

    async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
        const response = await apiService.post<any>('/sales/invoices', data);
        return response.data.invoice;
    }

    async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
        const response = await apiService.put<any>(`/sales/invoices/${id}`, data);
        return response.data.invoice;
    }

    async deleteInvoice(id: string): Promise<void> {
        await apiService.delete(`/sales/invoices/${id}`);
    }

    async searchInvoices(query: string): Promise<Invoice[]> {
        const response = await apiService.get<any>(`/sales/invoices/search?q=${encodeURIComponent(query)}`);
        return response.data.invoices;
    }

    // --- Estimates ---

    async getEstimates(params: QueryParams = {}): Promise<PaginatedResponse<Estimate>> {
        const queryString = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryString.append(key, value.toString());
            }
        });

        const response = await apiService.get<any>(`/sales/estimates?${queryString.toString()}`);
        return response.data;
    }

    async getEstimate(id: string): Promise<Estimate> {
        const response = await apiService.get<any>(`/sales/estimates/${id}`);
        return response.data.estimate;
    }

    async createEstimate(data: Partial<Estimate>): Promise<Estimate> {
        const response = await apiService.post<any>('/sales/estimates', data);
        return response.data.estimate;
    }

    async updateEstimate(id: string, data: Partial<Estimate>): Promise<Estimate> {
        const response = await apiService.put<any>(`/sales/estimates/${id}`, data);
        return response.data.estimate;
    }

    async deleteEstimate(id: string): Promise<void> {
        await apiService.delete(`/sales/estimates/${id}`);
    }

    async convertEstimateToInvoice(id: string): Promise<Invoice> {
        const response = await apiService.post<any>(`/sales/estimates/${id}/convert`, {});
        return response.data.invoice;
    }

    // --- Sales Orders ---

    async getSalesOrders(params: QueryParams = {}): Promise<PaginatedResponse<SalesOrder>> {
        const queryString = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryString.append(key, value.toString());
            }
        });

        const response = await apiService.get<any>(`/sales/orders?${queryString.toString()}`);
        return response.data;
    }

    async getSalesOrder(id: string): Promise<SalesOrder> {
        const response = await apiService.get<any>(`/sales/orders/${id}`);
        return response.data.order;
    }

    async createSalesOrder(data: Partial<SalesOrder>): Promise<SalesOrder> {
        const response = await apiService.post<any>('/sales/orders', data);
        return response.data.order;
    }

    async updateSalesOrder(id: string, data: Partial<SalesOrder>): Promise<SalesOrder> {
        const response = await apiService.put<any>(`/sales/orders/${id}`, data);
        return response.data.order;
    }

    async deleteSalesOrder(id: string): Promise<void> {
        await apiService.delete(`/sales/orders/${id}`);
    }

    async convertSalesOrderToInvoice(id: string): Promise<Invoice> {
        const response = await apiService.post<any>(`/sales/orders/${id}/convert`, {});
        return response.data.invoice;
    }

    // --- Quotations ---

    async getQuotations(params: QueryParams = {}): Promise<PaginatedResponse<Quotation>> {
        const queryString = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryString.append(key, value.toString());
            }
        });

        const response = await apiService.get<any>(`/sales/quotations?${queryString.toString()}`);
        return response.data;
    }

    async getQuotation(id: string): Promise<Quotation> {
        const response = await apiService.get<any>(`/sales/quotations/${id}`);
        return response.data.quotation;
    }

    async createQuotation(data: Partial<Quotation>): Promise<Quotation> {
        const response = await apiService.post<any>('/sales/quotations', data);
        return response.data.quotation;
    }

    async updateQuotation(id: string, data: Partial<Quotation>): Promise<Quotation> {
        const response = await apiService.put<any>(`/sales/quotations/${id}`, data);
        return response.data.quotation;
    }

    async deleteQuotation(id: string): Promise<void> {
        await apiService.delete(`/sales/quotations/${id}`);
    }

    async convertQuotationToSalesOrder(id: string): Promise<SalesOrder> {
        const response = await apiService.post<any>(`/sales/quotations/${id}/convert`, {});
        return response.data.order;
    }
}

export const salesService = new SalesService();
