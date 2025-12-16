import { Building2, MapPin, CreditCard, Package, DollarSign, Receipt, User } from "lucide-react";

// ============================================
// FORM STEP CONFIGURATIONS
// ============================================

// Party (Customer/Supplier) Form Steps
export const PARTY_FORM_STEPS = [
    { id: 1, title: "Basic Info", icon: Building2, description: "Business details" },
    { id: 2, title: "Address", icon: MapPin, description: "Location info" },
    { id: 3, title: "Financial", icon: CreditCard, description: "Payment terms" },
] as const;

// Product Form Steps
export const PRODUCT_FORM_STEPS = [
    { id: 1, title: "Basic Info", icon: Package, description: "Product details" },
    { id: 2, title: "Stock & Pricing", icon: DollarSign, description: "Inventory & rates" },
    { id: 3, title: "Tax & HSN", icon: Receipt, description: "Tax information" },
] as const;

// Employee Form Steps
export const EMPLOYEE_FORM_STEPS = [
    { id: 1, title: "Personal", icon: User, description: "Personal details" },
    { id: 2, title: "Employment", icon: Building2, description: "Job info" },
    { id: 3, title: "Salary", icon: DollarSign, description: "Compensation" },
] as const;

// Types
export type FormStep = { id: number; title: string; icon: typeof Building2; description: string };
