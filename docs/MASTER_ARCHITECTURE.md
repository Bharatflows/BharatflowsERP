# 🏗️ BharatFlow MSME ERP/OS - Master Architecture Plan

> **Enterprise Systems Architecture for Production-Grade MSME Software**  
> Version 2.0 | December 2024

---

## 📋 Executive Summary

This document provides a comprehensive re-architecture plan for BharatFlow MSME ERP/OS, covering frontend, backend, database, API design, security, and DevOps. The current implementation uses Express + PostgreSQL + React, and this plan proposes incremental improvements while maintaining backward compatibility.

### Current State Analysis

| Component | Current Stack | Status |
|-----------|--------------|--------|
| Frontend | React 18 + Vite + TypeScript + shadcn/ui | ✅ Good foundation |
| Backend | Node.js + Express + TypeScript | ✅ Working, needs structure |
| Database | PostgreSQL + Prisma ORM | ✅ Solid choice |
| Auth | JWT + role-based (4 roles) | ⚠️ Needs enhancement |
| State Management | React Context only | ⚠️ Needs Zustand/TanStack Query |
| Validation | Minimal | ❌ Needs Zod integration |
| Testing | None | ❌ Critical gap |

---

## 1️⃣ FRONTEND ARCHITECTURE PLAN

### 1.1 Component Structure (Atomic Design)

```
client/src/
├── components/
│   ├── atoms/           # Base building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Spinner/
│   │   └── Icon/
│   ├── molecules/       # Combinations of atoms
│   │   ├── FormField/
│   │   ├── SearchInput/
│   │   ├── DataTableRow/
│   │   ├── KPICard/
│   │   ├── StatCard/
│   │   └── EmptyState/
│   ├── organisms/       # Complex components
│   │   ├── DataTable/
│   │   ├── FormBuilder/
│   │   ├── FilterSidebar/
│   │   ├── ModuleHeader/
│   │   ├── ConfirmDialog/
│   │   └── FileUploader/
│   ├── templates/       # Page layouts
│   │   ├── DashboardLayout/
│   │   ├── AuthLayout/
│   │   ├── ModuleLayout/
│   │   └── PrintLayout/
│   └── modules/         # Feature modules
│       ├── sales/
│       ├── purchase/
│       ├── inventory/
│       ├── parties/
│       ├── banking/
│       ├── hr/
│       ├── gst/
│       └── reports/
├── hooks/               # Custom React hooks
│   ├── useApi.ts        # API request hook with caching
│   ├── useDebounce.ts
│   ├── usePagination.ts
│   ├── useLocalStorage.ts
│   ├── useKeyboardShortcut.ts
│   └── useFormDraft.ts
├── stores/              # Zustand stores
│   ├── authStore.ts
│   ├── uiStore.ts
│   ├── notificationStore.ts
│   └── index.ts
├── services/            # API service layer
│   ├── api.ts           # Base HTTP client
│   ├── auth.service.ts
│   ├── sales.service.ts
│   ├── purchase.service.ts
│   └── [module].service.ts
├── lib/                 # Utilities
│   ├── validators/      # Zod schemas
│   ├── formatters/      # Date, currency, etc.
│   ├── constants/       # App constants
│   └── utils.ts
└── types/               # TypeScript types
    ├── api.types.ts
    ├── models.types.ts
    └── index.ts
```

### 1.2 State Management Strategy

**Recommended: Zustand + TanStack Query**

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        login: async (email, password) => {
          const response = await authService.login(email, password);
          set({ user: response.user, token: response.token, isAuthenticated: true });
        },
        logout: () => {
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('authToken');
        },
        setUser: (user) => set({ user }),
      }),
      { name: 'auth-storage' }
    )
  )
);
```

**TanStack Query for Server State:**
```typescript
// hooks/useSales.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useInvoices = (params: QueryParams) => {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => salesService.getInvoices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created!');
    },
  });
};
```

### 1.3 Form Management (Zod + React Hook Form)

```typescript
// lib/validators/invoice.schema.ts
import { z } from 'zod';

export const invoiceItemSchema = z.object({
  productId: z.string().uuid('Invalid product'),
  quantity: z.number().int().positive('Quantity must be positive'),
  rate: z.number().positive('Rate must be positive'),
  taxRate: z.number().min(0).max(28),
});

export const invoiceSchema = z.object({
  customerId: z.string().uuid('Please select a customer'),
  invoiceDate: z.date(),
  dueDate: z.date().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Add at least one item'),
  notes: z.string().max(500).optional(),
  termsAndConditions: z.string().max(1000).optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
```

### 1.4 Routing Structure

```typescript
// routes/index.tsx
const routes: RouteObject[] = [
  // Public routes
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
    ],
  },
  // Protected routes
  {
    path: '/dashboard',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      // Sales Module
      {
        path: 'sales',
        children: [
          { index: true, element: <SalesOverview /> },
          { path: 'invoices', element: <InvoiceList /> },
          { path: 'invoices/new', element: <CreateInvoice /> },
          { path: 'invoices/:id', element: <ViewInvoice /> },
          { path: 'invoices/:id/edit', element: <EditInvoice /> },
          { path: 'estimates', element: <EstimateList /> },
          { path: 'sales-orders', element: <SalesOrderList /> },
          { path: 'challans', element: <DeliveryChallanList /> },
        ],
      },
      // Purchase Module
      {
        path: 'purchase',
        children: [
          { index: true, element: <PurchaseOverview /> },
          { path: 'orders', element: <PurchaseOrderList /> },
          { path: 'orders/new', element: <CreatePurchaseOrder /> },
          { path: 'bills', element: <PurchaseBillList /> },
          { path: 'grn', element: <GRNList /> },
        ],
      },
      // ... other modules
    ],
  },
];
```

### 1.5 Loading States & Error Boundaries

```typescript
// components/organisms/DataTable/DataTableSkeleton.tsx
export function DataTableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-10 w-64" /> {/* Search */}
        <Skeleton className="h-10 w-32" /> {/* Filter */}
      </div>
      <div className="border rounded-lg">
        <div className="grid grid-cols-${columns} gap-4 p-4 border-b">
          {Array(columns).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
        {Array(rows).fill(0).map((_, i) => (
          <div key={i} className="grid grid-cols-${columns} gap-4 p-4 border-b">
            {Array(columns).fill(0).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 2️⃣ BACKEND ARCHITECTURE PLAN

### 2.1 Recommended Stack Decision

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Express (Current)** | Team familiarity, stable | Manual patterns, less structured | ✅ **Keep, enhance with patterns** |
| NestJS | Enterprise patterns, TypeScript-first | Learning curve, migration cost | Consider for v3.0 |
| Fastify | Performance, schema validation | Less ecosystem | Not recommended |

**Decision: Enhance Express with NestJS-inspired patterns**

### 2.2 Enhanced Backend Structure

```
server/src/
├── config/
│   ├── database.ts      # PostgreSQL connection
│   ├── redis.ts         # Redis client (NEW)
│   ├── prisma.ts        # Prisma client
│   ├── logger.ts        # Winston logger
│   ├── queue.ts         # BullMQ config (NEW)
│   └── env.ts           # Environment validation
├── modules/             # Feature modules (NEW pattern)
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.dto.ts         # Data Transfer Objects
│   │   ├── auth.validator.ts   # Zod schemas
│   │   └── auth.routes.ts
│   ├── sales/
│   │   ├── sales.controller.ts
│   │   ├── sales.service.ts
│   │   ├── invoice/
│   │   │   ├── invoice.controller.ts
│   │   │   ├── invoice.service.ts
│   │   │   ├── invoice.dto.ts
│   │   │   └── invoice.validator.ts
│   │   ├── estimate/
│   │   └── sales-order/
│   ├── inventory/
│   ├── purchase/
│   ├── parties/
│   ├── banking/
│   ├── hr/
│   ├── gst/
│   └── reports/
├── shared/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts      # Enhanced RBAC
│   │   ├── validation.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── audit.middleware.ts     # (NEW)
│   │   └── tenant.middleware.ts    # (NEW)
│   ├── decorators/          # (NEW)
│   │   ├── roles.decorator.ts
│   │   └── validate.decorator.ts
│   ├── guards/              # (NEW)
│   │   ├── permission.guard.ts
│   │   └── company.guard.ts
│   ├── exceptions/          # (NEW)
│   │   ├── http.exception.ts
│   │   ├── validation.exception.ts
│   │   └── business.exception.ts
│   ├── utils/
│   │   ├── response.util.ts
│   │   ├── pagination.util.ts
│   │   ├── gst.util.ts
│   │   └── pdf.util.ts
│   └── types/
│       ├── express.d.ts
│       └── index.ts
├── jobs/                # Background jobs (NEW)
│   ├── email.job.ts
│   ├── pdf.job.ts
│   ├── report.job.ts
│   └── stock-alert.job.ts
├── events/              # Event system (NEW)
│   ├── invoice.events.ts
│   ├── stock.events.ts
│   └── notification.events.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/               # (NEW)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── app.ts               # Express app setup
└── server.ts            # Entry point
```

### 2.3 DTO Pattern Implementation

```typescript
// modules/sales/invoice/invoice.dto.ts
import { z } from 'zod';

// Create DTO
export const CreateInvoiceDTO = z.object({
  customerId: z.string().uuid(),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    rate: z.number().positive(),
    taxRate: z.number().min(0).max(28),
  })).min(1),
  notes: z.string().max(500).optional(),
});

// Update DTO
export const UpdateInvoiceDTO = CreateInvoiceDTO.partial();

// Response DTO
export const InvoiceResponseDTO = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  customer: z.object({
    id: z.string(),
    name: z.string(),
  }),
  items: z.array(z.object({
    id: z.string(),
    productName: z.string(),
    quantity: z.number(),
    rate: z.number(),
    taxAmount: z.number(),
    total: z.number(),
  })),
  subtotal: z.number(),
  totalTax: z.number(),
  totalAmount: z.number(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']),
  createdAt: z.string(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceDTO>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceDTO>;
export type InvoiceResponse = z.infer<typeof InvoiceResponseDTO>;
```

### 2.4 Service Layer Pattern (SOLID)

```typescript
// modules/sales/invoice/invoice.service.ts
import { Prisma } from '@prisma/client';
import prisma from '@/config/prisma';
import { CreateInvoiceInput } from './invoice.dto';
import { generateInvoiceNumber } from '@/shared/utils/sequence.util';
import { EventEmitter } from '@/events';

export class InvoiceService {
  // Single Responsibility: Only invoice operations
  
  async create(companyId: string, userId: string, data: CreateInvoiceInput) {
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(companyId, 'INV');
    
    // Calculate totals
    const items = data.items.map(item => {
      const taxAmount = (item.rate * item.quantity * item.taxRate) / 100;
      const total = (item.rate * item.quantity) + taxAmount;
      return { ...item, taxAmount, total };
    });
    
    const subtotal = items.reduce((sum, i) => sum + (i.rate * i.quantity), 0);
    const totalTax = items.reduce((sum, i) => sum + i.taxAmount, 0);
    const totalAmount = subtotal + totalTax;
    
    // Transaction: Create invoice + update stock
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          invoiceDate: new Date(data.invoiceDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          customerId: data.customerId,
          companyId,
          userId,
          subtotal,
          totalTax,
          totalAmount,
          balanceAmount: totalAmount,
          status: 'DRAFT',
          notes: data.notes,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              productName: '', // Fetch from product
              quantity: item.quantity,
              rate: item.rate,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              total: item.total,
            })),
          },
        },
        include: { items: true, customer: true },
      });
      
      // Update stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
        
        // Record stock movement
        await tx.stockMovement.create({
          data: {
            type: 'SALE',
            productId: item.productId,
            quantity: -item.quantity,
            previousStock: 0, // Calculate
            newStock: 0, // Calculate
            reference: invoiceNumber,
            companyId,
            createdBy: userId,
          },
        });
      }
      
      return inv;
    });
    
    // Emit event for async processing
    EventEmitter.emit('invoice.created', invoice);
    
    return invoice;
  }
  
  async findAll(companyId: string, params: QueryParams) {
    const { page = 1, limit = 20, search, status, startDate, endDate, sortBy, sortOrder } = params;
    
    const where: Prisma.InvoiceWhereInput = {
      companyId,
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(status && { status }),
      ...(startDate && endDate && {
        invoiceDate: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);
    
    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  // ... findById, update, delete, sendEmail, downloadPdf
}

export const invoiceService = new InvoiceService();
```

### 2.5 Enhanced Error Handling

```typescript
// shared/exceptions/http.exception.ts
export class HttpException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HttpException';
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string, code?: string, details?: any) {
    super(400, message, code || 'BAD_REQUEST', details);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    super(404, `${resource}${id ? ` with ID ${id}` : ''} not found`, 'NOT_FOUND');
  }
}

export class ConflictException extends HttpException {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class ValidationException extends HttpException {
  constructor(errors: any[]) {
    super(422, 'Validation failed', 'VALIDATION_ERROR', errors);
  }
}
```

---

## 3️⃣ DATABASE BLUEPRINT

### 3.1 ER Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE ENTITIES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────┐         ┌───────────┐         ┌───────────┐                  │
│  │  Company  │◄────────│   User    │─────────▶│   Branch  │                  │
│  └─────┬─────┘   1:N   └───────────┘    N:1   └───────────┘                  │
│        │                                                                      │
│        │ 1:N                                                                  │
│        ▼                                                                      │
│  ┌───────────┐         ┌───────────┐         ┌───────────┐                  │
│  │   Party   │◄────────│  Invoice  │─────────▶│  Product  │                  │
│  │(Cust/Sup) │   1:N   └─────┬─────┘    N:M   └─────┬─────┘                  │
│  └───────────┘               │                      │                        │
│                              │ 1:N                  │ 1:N                    │
│                              ▼                      ▼                        │
│                        ┌───────────┐         ┌───────────┐                  │
│                        │InvoiceItem│         │StockMove  │                  │
│                        └───────────┘         └───────────┘                  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                            SALES WORKFLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Quotation ──▶ Estimate ──▶ SalesOrder ──▶ DeliveryChallan ──▶ Invoice      │
│      │            │             │                │               │          │
│      ▼            ▼             ▼                ▼               ▼          │
│  QuotationItem EstimateItem SOItem       DCItem         InvoiceItem        │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PURCHASE WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PurchaseRequest ──▶ PurchaseOrder ──▶ GRN ──▶ PurchaseBill ──▶ Payment     │
│       │                   │             │           │                        │
│       ▼                   ▼             ▼           ▼                        │
│  PRItem              POItem        GRNItem     BillItem                     │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                            FINANCIAL                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────┐         ┌───────────┐         ┌───────────┐                  │
│  │BankAccount│◄────────│Transaction│─────────▶│  Expense  │                  │
│  └───────────┘   1:N   └───────────┘    N:1   └───────────┘                  │
│                                                                              │
│  ┌───────────┐         ┌───────────┐                                        │
│  │ JournalEntry│       │  Ledger   │                                        │
│  └───────────┘         └───────────┘                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Additional Models Needed

The following models are planned for future phases:

```prisma
// Add to schema.prisma

// Activity Log (User actions - distinct from CRM Activity)
// Currently 'AuditLog' covers entity changes, but 'ActivityLog' for login/view actions is pending.
model ActivityLog {
  id          String   @id @default(uuid())
  action      String   // "logged_in", "created_invoice", etc.
  details     Json?
  userId      String
  companyId   String
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([companyId, createdAt])
}

// Notification (System notifications)
model Notification {
  id          String   @id @default(uuid())
  type        String   // "LOW_STOCK", "PAYMENT_DUE", etc.
  category    String   // "critical", "warning", "info"
  title       String
  message     String
  data        Json?    // Additional data
  read        Boolean  @default(false)
  readAt      DateTime?
  userId      String
  companyId   String
  createdAt   DateTime @default(now())
  
  @@index([userId, read])
  @@index([companyId])
}

// Settings (Company-level configuration store)
model Settings {
  id                  String   @id @default(uuid())
  category            String   // "invoice", "gst", "general"
  key                 String
  value               Json
  companyId           String
  
  @@unique([companyId, category, key])
}

// Document Storage (Centralized file management)
model Document {
  id          String   @id @default(uuid())
  name        String
  type        String   // "invoice_pdf", "receipt", "contract"
  mimeType    String
  size        Int
  path        String   // S3 key or file path
  entityType  String?  // Related entity type
  entityId    String?  // Related entity ID
  companyId   String
  uploadedBy  String
  createdAt   DateTime @default(now())
  
  @@index([entityType, entityId])
  @@index([companyId])
}

// Payment Record (Consolidated Payment entity)
// Currently handled via 'Transaction' (Banking) and 'GSTPayment'.
// A unified 'Payment' model linking Invoices/Bills directly is planned.
model Payment {
  id              String   @id @default(uuid())
  paymentNumber   String
  date            DateTime
  amount          Decimal
  paymentMethod   String   // "cash", "bank", "upi", "cheque"
  referenceNumber String?
  notes           String?
  type            String   // "received", "made"
  entityType      String   // "Invoice", "PurchaseBill"
  entityId        String
  bankAccountId   String?
  partyId         String
  companyId       String
  createdBy       String
  createdAt       DateTime @default(now())
  
  @@unique([companyId, paymentNumber])
  @@index([entityType, entityId])
}
```

### 3.3 Implemented Models (Recently Added)

The following models have been implemented in the core schema:

- **AuditLog**: Entity change tracking (Implemented)
- **Sequence**: Document number generation (Implemented)
- **Branch**: Multi-location/GSTIN support (Implemented)
- **Message** & **Conversation**: Internal messaging system (Implemented)


### 3.3 Indexing Strategy

```prisma
// Performance indexes to add

model Invoice {
  // ... existing fields
  
  @@index([companyId, invoiceDate])       // Date range queries
  @@index([companyId, status])            // Status filtering
  @@index([customerId])                   // Customer invoices
  @@index([companyId, invoiceNumber])     // Search
}

model Product {
  @@index([companyId, name])              // Search
  @@index([companyId, code])              // SKU lookup
  @@index([companyId, category])          // Category filter
  @@index([companyId, currentStock])      // Low stock queries
}

model Party {
  @@index([companyId, type])              // Customer/Supplier filter
  @@index([companyId, name])              // Search
  @@index([gstin])                        // GST lookup
}

model Transaction {
  @@index([companyId, date])              // Date range
  @@index([accountId, date])              // Account statement
  @@index([companyId, type])              // Credit/Debit filter
}
```

---

## 4️⃣ API BLUEPRINT

### 4.1 REST API Design Standards

**Base URL:** `/api/v1`

**Response Format:**
```json
// Success Response
{
  "success": true,
  "data": { ... },           // Single object OR
  "data": [ ... ],           // Array for list
  "message": "Success",
  "pagination": {            // Only for lists
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### 4.2 Complete API Endpoints

```yaml
# Authentication
POST   /auth/register           # Register user + company
POST   /auth/login              # Login with email/password
POST   /auth/google             # Google OAuth login
POST   /auth/logout             # Logout (invalidate token)
POST   /auth/forgot-password    # Request password reset
POST   /auth/reset-password     # Reset password with token
POST   /auth/verify-email       # Verify email
POST   /auth/verify-otp         # Verify OTP
GET    /auth/me                 # Get current user
PUT    /auth/profile            # Update profile
POST   /auth/refresh-token      # Refresh JWT token

# Sales Module
GET    /sales/invoices                    # List invoices (paginated)
POST   /sales/invoices                    # Create invoice
GET    /sales/invoices/:id                # Get invoice details
PUT    /sales/invoices/:id                # Update invoice
DELETE /sales/invoices/:id                # Delete invoice
PATCH  /sales/invoices/:id/status         # Update status
GET    /sales/invoices/:id/pdf            # Download PDF
POST   /sales/invoices/:id/email          # Email to customer
POST   /sales/invoices/:id/duplicate      # Duplicate invoice

GET    /sales/estimates                   # List estimates
POST   /sales/estimates                   # Create estimate
GET    /sales/estimates/:id               # Get estimate
PUT    /sales/estimates/:id               # Update estimate
DELETE /sales/estimates/:id               # Delete estimate
POST   /sales/estimates/:id/convert       # Convert to invoice

GET    /sales/orders                      # List sales orders
POST   /sales/orders                      # Create sales order
GET    /sales/orders/:id                  # Get sales order
PUT    /sales/orders/:id                  # Update sales order
POST   /sales/orders/:id/fulfill          # Fulfill order

GET    /sales/challans                    # List delivery challans
POST   /sales/challans                    # Create challan
GET    /sales/challans/:id                # Get challan
PUT    /sales/challans/:id/status         # Update delivery status

GET    /sales/quotations                  # List quotations
POST   /sales/quotations                  # Create quotation
GET    /sales/quotations/:id              # Get quotation
POST   /sales/quotations/:id/convert      # Convert to SO

# Purchase Module
GET    /purchase/orders                   # List purchase orders
POST   /purchase/orders                   # Create PO
GET    /purchase/orders/:id               # Get PO details
PUT    /purchase/orders/:id               # Update PO
DELETE /purchase/orders/:id               # Delete PO
GET    /purchase/orders/:id/pdf           # Download PO PDF

GET    /purchase/grn                      # List GRN
POST   /purchase/grn                      # Create GRN
GET    /purchase/grn/:id                  # Get GRN
POST   /purchase/grn/:id/verify           # Verify received goods

GET    /purchase/bills                    # List purchase bills
POST   /purchase/bills                    # Create bill
GET    /purchase/bills/:id                # Get bill
POST   /purchase/bills/:id/payment        # Record payment

# Inventory Module
GET    /inventory/products                # List products
POST   /inventory/products                # Create product
GET    /inventory/products/:id            # Get product
PUT    /inventory/products/:id            # Update product
DELETE /inventory/products/:id            # Delete product
POST   /inventory/products/import         # Bulk import
GET    /inventory/products/export         # Export to CSV
GET    /inventory/products/low-stock      # Low stock alerts
PATCH  /inventory/products/:id/stock      # Adjust stock

GET    /inventory/warehouses              # List warehouses
POST   /inventory/warehouses              # Create warehouse
GET    /inventory/warehouses/:id          # Get warehouse
PUT    /inventory/warehouses/:id          # Update warehouse

GET    /inventory/stock-movements         # Stock movement history
POST   /inventory/stock-transfer          # Transfer between warehouses

# Parties Module
GET    /parties                           # List all parties
POST   /parties                           # Create party
GET    /parties/:id                       # Get party details
PUT    /parties/:id                       # Update party
DELETE /parties/:id                       # Delete party
GET    /parties/:id/ledger                # Party ledger
GET    /parties/:id/transactions          # Party transactions
GET    /parties/customers                 # List customers only
GET    /parties/suppliers                 # List suppliers only

# Banking Module
GET    /banking/accounts                  # List bank accounts
POST   /banking/accounts                  # Create account
GET    /banking/accounts/:id              # Get account
PUT    /banking/accounts/:id              # Update account
GET    /banking/accounts/:id/statement    # Account statement

GET    /banking/transactions              # List transactions
POST   /banking/transactions              # Create transaction
GET    /banking/transactions/:id          # Get transaction
POST   /banking/reconcile                 # Bank reconciliation
GET    /banking/cash-flow                 # Cash flow report

# Expenses Module
GET    /expenses                          # List expenses
POST   /expenses                          # Create expense
GET    /expenses/:id                      # Get expense
PUT    /expenses/:id                      # Update expense
DELETE /expenses/:id                      # Delete expense
PATCH  /expenses/:id/approve              # Approve expense
GET    /expenses/categories               # List categories
GET    /expenses/summary                  # Monthly summary

# HR Module
GET    /hr/employees                      # List employees
POST   /hr/employees                      # Create employee
GET    /hr/employees/:id                  # Get employee
PUT    /hr/employees/:id                  # Update employee
GET    /hr/employees/:id/payslips         # Employee payslips

GET    /hr/attendance                     # List attendance
POST   /hr/attendance                     # Mark attendance
GET    /hr/attendance/summary             # Attendance summary

GET    /hr/leaves                         # List leave requests
POST   /hr/leaves                         # Apply for leave
PATCH  /hr/leaves/:id/status              # Approve/reject leave

POST   /hr/payroll/generate               # Generate payroll
GET    /hr/payroll/:month                 # Get payroll for month
GET    /hr/payroll/:id/payslip            # Download payslip

# GST Module
GET    /gst/summary/:month                # Monthly GST summary
GET    /gst/gstr1                         # GSTR-1 report
GET    /gst/gstr3b                        # GSTR-3B report
GET    /gst/hsn-summary                   # HSN-wise summary
POST   /gst/export/:format                # Export for filing

# Reports Module
GET    /reports/sales                     # Sales report
GET    /reports/purchase                  # Purchase report
GET    /reports/inventory                 # Stock report
GET    /reports/profit-loss               # P&L statement
GET    /reports/balance-sheet             # Balance sheet
GET    /reports/receivables-aging         # Receivables aging
GET    /reports/payables-aging            # Payables aging
GET    /reports/day-book                  # Day book
GET    /reports/party-ledger              # Party ledger
GET    /reports/trial-balance             # Trial balance

# Dashboard
GET    /dashboard/stats                   # KPI stats
GET    /dashboard/charts                  # Chart data
GET    /dashboard/recent-activity         # Recent transactions
GET    /dashboard/alerts                  # Low stock, overdue, etc.

# Notifications
GET    /notifications                     # List notifications
PATCH  /notifications/:id/read            # Mark as read
PATCH  /notifications/read-all            # Mark all as read
DELETE /notifications/:id                 # Delete notification

# Messages (Internal)
GET    /messages/channels                 # List channels
POST   /messages/channels                 # Create channel
GET    /messages/channels/:id             # Get channel messages
POST   /messages/channels/:id             # Send message
GET    /messages/direct/:userId           # Direct messages

# Settings
GET    /settings                          # Get all settings
GET    /settings/:category                # Get category settings
PUT    /settings/:category                # Update settings
GET    /settings/company                  # Company profile
PUT    /settings/company                  # Update company
```

### 4.3 Query Parameters Standard

```yaml
# Pagination
?page=1                    # Page number (default: 1)
&limit=20                  # Items per page (default: 20, max: 100)

# Sorting
&sortBy=createdAt          # Field to sort by
&sortOrder=desc            # asc or desc

# Filtering
&status=PAID               # Exact match
&status=PAID,PARTIAL       # Multiple values (OR)
&startDate=2024-01-01      # Date range start
&endDate=2024-01-31        # Date range end
&minAmount=1000            # Numeric range
&maxAmount=50000

# Search
&search=INV-2024           # Global search
&q=customer+name           # Alternative

# Include relations
&include=items,customer    # Include related data

# Select fields
&fields=id,invoiceNumber,totalAmount  # Specific fields only
```

### 4.4 Webhook Events

```typescript
// Event types for external integrations
type WebhookEvent = 
  | 'invoice.created' | 'invoice.updated' | 'invoice.paid' | 'invoice.cancelled'
  | 'payment.received' | 'payment.made'
  | 'stock.low' | 'stock.updated'
  | 'order.created' | 'order.fulfilled'
  | 'expense.approved' | 'expense.rejected'
  | 'employee.added' | 'payroll.generated';

// Webhook payload
interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  timestamp: string;
  companyId: string;
  signature: string;  // HMAC signature for verification
}
```

---

## 5️⃣ SECURITY & AUTHENTICATION DESIGN

### 5.1 Enhanced JWT Strategy

```typescript
// config/jwt.ts
export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};

// Token payload
interface TokenPayload {
  userId: string;
  companyId: string;
  role: Role;
  permissions: string[];  // Granular permissions
  deviceId?: string;      // For device-based login
  iat: number;
  exp: number;
}
```

### 5.2 Permission-Based RBAC

```typescript
// Define granular permissions
const permissions = {
  // Sales
  'sales:read': 'View sales data',
  'sales:create': 'Create invoices/estimates',
  'sales:update': 'Edit invoices',
  'sales:delete': 'Delete invoices',
  'sales:export': 'Export sales data',
  
  // Inventory
  'inventory:read': 'View products',
  'inventory:create': 'Add products',
  'inventory:update': 'Edit products',
  'inventory:delete': 'Delete products',
  'inventory:adjust': 'Adjust stock',
  
  // ... more permissions
};

// Role definitions
const roles = {
  ADMIN: Object.keys(permissions),  // All permissions
  MANAGER: [
    'sales:*',
    'inventory:*',
    'parties:*',
    'expenses:read',
    'expenses:create',
    'reports:read',
  ],
  ACCOUNTANT: [
    'sales:read',
    'sales:export',
    'expenses:*',
    'banking:*',
    'gst:*',
    'reports:*',
  ],
  USER: [
    'sales:read',
    'sales:create',
    'inventory:read',
    'parties:read',
  ],
};
```

### 5.3 Audit Logging Middleware

```typescript
// middleware/audit.middleware.ts
export const auditLog = (entityType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original send
    const originalSend = res.send;
    
    res.send = function(body) {
      // Log CREATE, UPDATE, DELETE actions
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const action = {
          POST: 'CREATE',
          PUT: 'UPDATE',
          PATCH: 'UPDATE',
          DELETE: 'DELETE',
        }[req.method];
        
        auditService.log({
          entityType,
          entityId: req.params.id || body?.data?.id,
          action,
          oldValues: req._originalEntity,  // Set by controller
          newValues: req.body,
          userId: req.user.id,
          companyId: req.user.companyId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};
```

---

## 6️⃣ MODULE USE CASES & EDGE CASES

### 6.1 Sales Module

| Use Case | Description | Edge Cases |
|----------|-------------|------------|
| Create Invoice | Generate invoice with items | • Product out of stock<br>• Customer credit limit exceeded<br>• Duplicate invoice number |
| Edit Invoice | Modify existing invoice | • Concurrent editing<br>• Status change conflicts<br>• Stock already deducted |
| Payment Receipt | Record payment | • Partial payment calculation<br>• Over-payment handling<br>• Multiple currencies |
| Convert Estimate | Estimate → Invoice | • Expired estimate<br>• Price changes<br>• Stock availability |

### 6.2 Inventory Module

| Use Case | Description | Edge Cases |
|----------|-------------|------------|
| Stock Adjustment | Manual stock correction | • Negative stock prevention<br>• Audit trail requirement<br>• Multi-warehouse sync |
| Low Stock Alert | Automatic notification | • Threshold calculation<br>• Batch vs single alerts<br>• Alert fatigue |
| Stock Transfer | Move between warehouses | • In-transit tracking<br>• Partial transfers<br>• Transfer cancellation |

### 6.3 Concurrency Issues

```typescript
// Optimistic locking for invoice updates
model Invoice {
  // ... fields
  version     Int       @default(1)  // Version for optimistic locking
}

// In service
async update(id: string, data: UpdateInvoiceInput, version: number) {
  const result = await prisma.invoice.updateMany({
    where: { 
      id, 
      version  // Only update if version matches
    },
    data: {
      ...data,
      version: { increment: 1 }
    }
  });
  
  if (result.count === 0) {
    throw new ConflictException('Invoice was modified by another user');
  }
}
```

---

## 7️⃣ MESSAGE SYSTEM DESIGN

### 7.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE SYSTEM                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  WebSocket   │    │   Redis      │    │  PostgreSQL  │      │
│  │  Server      │◄──▶│   Pub/Sub    │◄──▶│   Storage    │      │
│  └──────┬───────┘    └──────────────┘    └──────────────┘      │
│         │                                                        │
│         │ Real-time                                              │
│         ▼                                                        │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   Client     │         │  Push        │                      │
│  │   (Browser)  │         │  Notifications│                      │
│  └──────────────┘         └──────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Features

- **Direct Messages**: 1:1 private conversations
- **Group Channels**: Team/department channels
- **Announcement Channels**: Admin → All users
- **Message Types**: Text, file attachments, mentions
- **Read Receipts**: Seen indicators
- **Offline Support**: Queue messages, sync on reconnect

---

## 8️⃣ E2E WORKFLOWS

### 8.1 Sales Workflow

```
Quotation → SO → DC → Invoice → Payment
    │       │     │       │        │
    └───────┴─────┴───────┴────────┴── Stock deducted at Invoice creation
                                       Party balance updated at Payment
```

### 8.2 Purchase Workflow

```
PR → PO → GRN → Bill → Payment
     │     │      │       │
     └─────┴──────┴───────┴── Stock added at GRN
                              Party balance updated at Payment
```

---

## 9️⃣ PRODUCTION IMPROVEMENTS

### 9.1 Performance

| Improvement | Priority | Effort |
|-------------|----------|--------|
| Redis caching for dashboard stats | High | Medium |
| Database connection pooling | High | Low |
| Lazy loading for reports | High | Medium |
| Image optimization (CDN) | Medium | Medium |
| GraphQL for complex queries | Low | High |

### 9.2 Reliability

| Improvement | Priority | Effort |
|-------------|----------|--------|
| Database backups (automated) | Critical | Low |
| Error monitoring (Sentry) | High | Low |
| Health check endpoints | High | Low |
| Graceful shutdown handling | Medium | Low |
| Queue for async operations | Medium | Medium |

### 9.3 DevOps

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build: ./server
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
```

---

## 🗓️ IMPLEMENTATION ROADMAPS

### 30-Day Roadmap (Critical Path)

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Foundation | • Zustand + TanStack Query setup<br>• Zod validation layer<br>• Enhanced error handling |
| **Week 2** | Sales Module | • Complete CRUD with validation<br>• PDF generation<br>• Email integration |
| **Week 3** | Inventory + Purchase | • Stock sync with transactions<br>• Low stock alerts<br>• PO workflow |
| **Week 4** | Testing + Polish | • Unit tests (80% coverage)<br>• Loading states<br>• Error boundaries |

### 90-Day Roadmap (Production Ready)

| Month | Focus | Deliverables |
|-------|-------|--------------|
| **Month 1** | Core Modules | Sales, Purchase, Inventory, Parties, Banking complete with tests |
| **Month 2** | Advanced Features | HR, GST, Reports, Audit logs, Message system |
| **Month 3** | Production Hardening | Performance optimization, Security audit, Documentation, CI/CD |

---

## Verification Plan

### Automated Testing

Since this is an architecture planning document, verification will happen during implementation:

1. **Unit Tests**: Each new service/controller will have corresponding test files
2. **Integration Tests**: API endpoint tests using Jest + Supertest
3. **E2E Tests**: Playwright for critical user flows

### Manual Verification

After implementing each section:
1. Review code structure against this plan
2. Verify API responses match documented formats
3. Test RBAC permissions across roles
4. Validate database schema matches ERD

---

> **Next Steps**: Review this plan and provide feedback on priorities, technology choices, or specific module requirements.
