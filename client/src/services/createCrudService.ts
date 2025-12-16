/**
 * Generic CRUD Service Factory
 * 
 * Creates standardized CRUD operations for any entity type.
 * Reduces code duplication across service files.
 */

import { apiService } from './api';
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types';

/**
 * Interface for a standard CRUD service
 */
export interface CrudService<T> {
    getAll: (params?: QueryParams) => Promise<PaginatedResponse<T>>;
    getById: (id: string) => Promise<ApiResponse<T>>;
    create: (data: Partial<T>) => Promise<ApiResponse<T>>;
    update: (id: string, data: Partial<T>) => Promise<ApiResponse<T>>;
    delete: (id: string) => Promise<ApiResponse<void>>;
}

/**
 * Creates a CRUD service for a given API endpoint
 * 
 * @param endpoint - The API endpoint path (e.g., 'parties', 'inventory/products')
 * @returns A service object with standard CRUD operations
 * 
 * @example
 * ```ts
 * const partiesService = createCrudService<Party>('parties');
 * const invoices = await partiesService.getAll({ page: 1, limit: 10 });
 * ```
 */
export function createCrudService<T>(endpoint: string): CrudService<T> {
    return {
        getAll: (params?: QueryParams) => {
            const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
            return apiService.get<PaginatedResponse<T>>(`/${endpoint}${query}`);
        },

        getById: (id: string) =>
            apiService.get<ApiResponse<T>>(`/${endpoint}/${id}`),

        create: (data: Partial<T>) =>
            apiService.post<ApiResponse<T>>(`/${endpoint}`, data),

        update: (id: string, data: Partial<T>) =>
            apiService.put<ApiResponse<T>>(`/${endpoint}/${id}`, data),

        delete: (id: string) =>
            apiService.delete<ApiResponse<void>>(`/${endpoint}/${id}`),
    };
}

/**
 * Extended CRUD service with additional custom methods
 */
export function createExtendedCrudService<T, E extends object>(
    endpoint: string,
    extensions: (baseEndpoint: string) => E
): CrudService<T> & E {
    const baseService = createCrudService<T>(endpoint);
    const extendedMethods = extensions(endpoint);

    return {
        ...baseService,
        ...extendedMethods,
    };
}
