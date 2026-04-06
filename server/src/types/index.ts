export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    count?: number;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface UserDTO {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    status: string;
    avatar?: string | null;
    companyId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CompanyDTO {
    id: string;
    businessName: string;
    gstin?: string | null;
    email: string;
    phone?: string | null;
    website?: string | null;
    logo?: string | null;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    } | null;
    isActive: boolean;
    businessType?: string | null;
    sector?: string | null;
    plan: string;
    subscriptionStatus: string;
    subscriptionExpiry?: Date | null;
    createdAt: Date;
}

export interface AuthResponseDTO {
    user: UserDTO;
    company?: CompanyDTO | null;
    token: string;
    refreshToken: string;
}
