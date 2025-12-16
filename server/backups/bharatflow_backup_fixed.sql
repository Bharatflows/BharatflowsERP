--
-- PostgreSQL database dump
--

\restrict W5Ne6aMhgpwar8fhID8FAWontybFAHU96bYnVQXRIZ7GR1lRjC1F4DvuNrZnBtW

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'PAID',
    'PARTIAL',
    'OVERDUE',
    'CANCELLED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO postgres;

--
-- Name: Plan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Plan" AS ENUM (
    'FREE',
    'BASIC',
    'PRO',
    'ENTERPRISE'
);


ALTER TYPE public."Plan" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'MANAGER',
    'ACCOUNTANT',
    'USER'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: Status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Status" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."Status" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BankAccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BankAccount" (
    id text NOT NULL,
    name text NOT NULL,
    "bankName" text NOT NULL,
    "accountNumber" text NOT NULL,
    ifsc text NOT NULL,
    type text NOT NULL,
    balance numeric(65,30) DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "lastReconciled" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."BankAccount" OWNER TO postgres;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    "businessName" text NOT NULL,
    "legalName" text,
    gstin text,
    pan text,
    email text,
    phone text,
    address jsonb,
    "bankDetails" jsonb,
    logo text,
    "fiscalYear" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    features jsonb,
    plan public."Plan" DEFAULT 'FREE'::public."Plan" NOT NULL
);


ALTER TABLE public."Company" OWNER TO postgres;

--
-- Name: DeliveryChallan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DeliveryChallan" (
    id text NOT NULL,
    "challanNumber" text NOT NULL,
    "challanDate" timestamp(3) without time zone NOT NULL,
    "referenceNumber" text,
    subtotal numeric(65,30) DEFAULT 0 NOT NULL,
    "totalAmount" numeric(65,30) DEFAULT 0 NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "customerId" text NOT NULL
);


ALTER TABLE public."DeliveryChallan" OWNER TO postgres;

--
-- Name: DeliveryChallanItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DeliveryChallanItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    rate numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL,
    "challanId" text NOT NULL,
    "productId" text,
    "productName" text NOT NULL
);


ALTER TABLE public."DeliveryChallanItem" OWNER TO postgres;

--
-- Name: Employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    department text NOT NULL,
    designation text NOT NULL,
    "joiningDate" timestamp(3) without time zone NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    salary numeric(65,30) NOT NULL,
    "accountNumber" text,
    "ifscCode" text,
    "panNumber" text,
    "aadhaarNumber" text,
    "pfNumber" text,
    "esiNumber" text,
    address text,
    "emergencyContact" text,
    "emergencyName" text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."Employee" OWNER TO postgres;

--
-- Name: Estimate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Estimate" (
    id text NOT NULL,
    "estimateNumber" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "validUntil" timestamp(3) without time zone NOT NULL,
    subtotal numeric(65,30) NOT NULL,
    "totalTax" numeric(65,30) NOT NULL,
    "totalAmount" numeric(65,30) NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "customerId" text NOT NULL
);


ALTER TABLE public."Estimate" OWNER TO postgres;

--
-- Name: EstimateItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EstimateItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    rate numeric(65,30) NOT NULL,
    "taxRate" numeric(65,30) NOT NULL,
    "taxAmount" numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL,
    "estimateId" text NOT NULL,
    "productId" text,
    "productName" text NOT NULL
);


ALTER TABLE public."EstimateItem" OWNER TO postgres;

--
-- Name: Expense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    category text NOT NULL,
    amount numeric(65,30) NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "gstAmount" numeric(65,30) DEFAULT 0 NOT NULL,
    notes text,
    "paymentMethod" text,
    "receiptUrl" text,
    vendor text
);


ALTER TABLE public."Expense" OWNER TO postgres;

--
-- Name: GoodsReceivedNote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GoodsReceivedNote" (
    id text NOT NULL,
    "grnNumber" text NOT NULL,
    "grnDate" timestamp(3) without time zone NOT NULL,
    "referenceNumber" text,
    subtotal numeric(65,30) DEFAULT 0 NOT NULL,
    "totalAmount" numeric(65,30) DEFAULT 0 NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "supplierId" text NOT NULL
);


ALTER TABLE public."GoodsReceivedNote" OWNER TO postgres;

--
-- Name: GoodsReceivedNoteItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GoodsReceivedNoteItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    rate numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL,
    "grnId" text NOT NULL,
    "productId" text,
    "productName" text NOT NULL
);


ALTER TABLE public."GoodsReceivedNoteItem" OWNER TO postgres;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "invoiceNumber" text NOT NULL,
    "invoiceDate" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone,
    subtotal numeric(65,30) NOT NULL,
    "totalTax" numeric(65,30) NOT NULL,
    "totalAmount" numeric(65,30) NOT NULL,
    "amountPaid" numeric(65,30) DEFAULT 0 NOT NULL,
    "balanceAmount" numeric(65,30) NOT NULL,
    status public."InvoiceStatus" DEFAULT 'DRAFT'::public."InvoiceStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "userId" text NOT NULL,
    "customerId" text NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO postgres;

--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InvoiceItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    rate numeric(65,30) NOT NULL,
    "taxRate" numeric(65,30) NOT NULL,
    "taxAmount" numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL,
    "invoiceId" text NOT NULL,
    "productId" text,
    "productName" text NOT NULL
);


ALTER TABLE public."InvoiceItem" OWNER TO postgres;

--
-- Name: Party; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Party" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    gstin text,
    pan text,
    email text,
    phone text,
    "billingAddress" jsonb,
    "shippingAddress" jsonb,
    "openingBalance" numeric(65,30) DEFAULT 0 NOT NULL,
    "currentBalance" numeric(65,30) DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."Party" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    code text,
    "hsnCode" text,
    description text,
    unit text NOT NULL,
    "purchasePrice" numeric(65,30) DEFAULT 0 NOT NULL,
    "sellingPrice" numeric(65,30) DEFAULT 0 NOT NULL,
    mrp numeric(65,30),
    "gstRate" numeric(65,30) DEFAULT 0 NOT NULL,
    "currentStock" integer DEFAULT 0 NOT NULL,
    "minStock" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    barcode text,
    category text,
    location text,
    "maxStock" integer DEFAULT 0 NOT NULL,
    "reorderLevel" integer DEFAULT 0 NOT NULL,
    "sellWithoutStock" boolean DEFAULT false NOT NULL,
    "taxInclusive" boolean DEFAULT false NOT NULL,
    "trackInventory" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: PurchaseBill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseBill" (
    id text NOT NULL,
    "billNumber" text NOT NULL,
    "billDate" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone,
    subtotal numeric(65,30) NOT NULL,
    "totalTax" numeric(65,30) NOT NULL,
    "totalAmount" numeric(65,30) NOT NULL,
    "amountPaid" numeric(65,30) DEFAULT 0 NOT NULL,
    "balanceAmount" numeric(65,30) NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "supplierId" text NOT NULL
);


ALTER TABLE public."PurchaseBill" OWNER TO postgres;

--
-- Name: PurchaseBillItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseBillItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    rate numeric(65,30) NOT NULL,
    "taxRate" numeric(65,30) NOT NULL,
    "taxAmount" numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL,
    "billId" text NOT NULL,
    "productId" text,
    "productName" text NOT NULL
);


ALTER TABLE public."PurchaseBillItem" OWNER TO postgres;

--
-- Name: PurchaseOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseOrder" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "supplierInvoiceNumber" text,
    "orderDate" timestamp(3) without time zone NOT NULL,
    "billDate" timestamp(3) without time zone,
    "expectedDate" timestamp(3) without time zone,
    subtotal numeric(65,30) NOT NULL,
    "totalTax" numeric(65,30) NOT NULL,
    "totalAmount" numeric(65,30) NOT NULL,
    "paidAmount" numeric(65,30) DEFAULT 0 NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "supplierId" text NOT NULL
);


ALTER TABLE public."PurchaseOrder" OWNER TO postgres;

--
-- Name: PurchaseOrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseOrderItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    "receivedQuantity" integer DEFAULT 0 NOT NULL,
    rate numeric(65,30) NOT NULL,
    "taxRate" numeric(65,30) NOT NULL,
    "taxAmount" numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL,
    "purchaseOrderId" text NOT NULL,
    "productId" text,
    "productName" text NOT NULL
);


ALTER TABLE public."PurchaseOrderItem" OWNER TO postgres;

--
-- Name: Quotation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Quotation" (
    id text NOT NULL,
    "quotationNumber" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "validUntil" timestamp(3) without time zone NOT NULL,
    subtotal numeric(65,30) NOT NULL,
    "totalTax" numeric(65,30) NOT NULL,
    "totalAmount" numeric(65,30) NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    notes text,
    terms text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "customerId" text NOT NULL
);


ALTER TABLE public."Quotation" OWNER TO postgres;

--
-- Name: QuotationItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QuotationItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    rate numeric(65,30) NOT NULL,
    "taxRate" numeric(65,30) NOT NULL,
    "taxAmount" numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL,
    "quotationId" text NOT NULL,
    "productId" text,
    "productName" text NOT NULL
);


ALTER TABLE public."QuotationItem" OWNER TO postgres;

--
-- Name: SalesOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SalesOrder" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "orderDate" timestamp(3) without time zone NOT NULL,
    "expectedDate" timestamp(3) without time zone,
    subtotal numeric(65,30) NOT NULL,
    "totalTax" numeric(65,30) NOT NULL,
    "totalAmount" numeric(65,30) NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "customerId" text NOT NULL
);


ALTER TABLE public."SalesOrder" OWNER TO postgres;

--
-- Name: SalesOrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SalesOrderItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    "shippedQuantity" integer DEFAULT 0 NOT NULL,
    rate numeric(65,30) NOT NULL,
    "taxRate" numeric(65,30) NOT NULL,
    "taxAmount" numeric(65,30) NOT NULL,
    total numeric(65,30) NOT NULL,
    "salesOrderId" text NOT NULL,
    "productId" text,
    "productName" text NOT NULL
);


ALTER TABLE public."SalesOrderItem" OWNER TO postgres;

--
-- Name: StockMovement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StockMovement" (
    id text NOT NULL,
    type text NOT NULL,
    quantity integer NOT NULL,
    "previousStock" integer NOT NULL,
    "newStock" integer NOT NULL,
    reference text,
    reason text,
    notes text,
    "productId" text NOT NULL,
    "warehouseId" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."StockMovement" OWNER TO postgres;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    amount numeric(65,30) NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'CLEARED'::text NOT NULL,
    reference text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "accountId" text NOT NULL
);


ALTER TABLE public."Transaction" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    status public."Status" DEFAULT 'ACTIVE'::public."Status" NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "phoneVerified" boolean DEFAULT false NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: Warehouse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Warehouse" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    address text,
    city text,
    state text,
    pincode text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public."Warehouse" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: BankAccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BankAccount" (id, name, "bankName", "accountNumber", ifsc, type, balance, status, "lastReconciled", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Company" (id, "businessName", "legalName", gstin, pan, email, phone, address, "bankDetails", logo, "fiscalYear", "createdAt", "updatedAt", features, plan) FROM stdin;
2ab1ba3f-9230-49b0-a408-bb03efdb57ab	Test Business	\N	\N	\N	test@bharatflow.com	\N	{"country": "India"}	\N	\N	\N	2025-12-04 06:13:57.689	2025-12-04 06:13:57.689	\N	FREE
\.


--
-- Data for Name: DeliveryChallan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryChallan" (id, "challanNumber", "challanDate", "referenceNumber", subtotal, "totalAmount", status, notes, "createdAt", "updatedAt", "companyId", "customerId") FROM stdin;
\.


--
-- Data for Name: DeliveryChallanItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DeliveryChallanItem" (id, quantity, rate, total, "challanId", "productId", "productName") FROM stdin;
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Employee" (id, "employeeId", name, email, phone, department, designation, "joiningDate", "dateOfBirth", salary, "accountNumber", "ifscCode", "panNumber", "aadhaarNumber", "pfNumber", "esiNumber", address, "emergencyContact", "emergencyName", status, "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: Estimate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Estimate" (id, "estimateNumber", date, "validUntil", subtotal, "totalTax", "totalAmount", status, notes, "createdAt", "updatedAt", "companyId", "customerId") FROM stdin;
\.


--
-- Data for Name: EstimateItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EstimateItem" (id, quantity, rate, "taxRate", "taxAmount", total, "estimateId", "productId", "productName") FROM stdin;
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Expense" (id, category, amount, date, description, status, "createdAt", "updatedAt", "companyId", "gstAmount", notes, "paymentMethod", "receiptUrl", vendor) FROM stdin;
\.


--
-- Data for Name: GoodsReceivedNote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GoodsReceivedNote" (id, "grnNumber", "grnDate", "referenceNumber", subtotal, "totalAmount", status, notes, "createdAt", "updatedAt", "companyId", "supplierId") FROM stdin;
\.


--
-- Data for Name: GoodsReceivedNoteItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GoodsReceivedNoteItem" (id, quantity, rate, total, "grnId", "productId", "productName") FROM stdin;
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invoice" (id, "invoiceNumber", "invoiceDate", "dueDate", subtotal, "totalTax", "totalAmount", "amountPaid", "balanceAmount", status, notes, "createdAt", "updatedAt", "companyId", "userId", "customerId") FROM stdin;
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InvoiceItem" (id, quantity, rate, "taxRate", "taxAmount", total, "invoiceId", "productId", "productName") FROM stdin;
\.


--
-- Data for Name: Party; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Party" (id, name, type, gstin, pan, email, phone, "billingAddress", "shippingAddress", "openingBalance", "currentBalance", "isActive", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, code, "hsnCode", description, unit, "purchasePrice", "sellingPrice", mrp, "gstRate", "currentStock", "minStock", "isActive", "createdAt", "updatedAt", "companyId", barcode, category, location, "maxStock", "reorderLevel", "sellWithoutStock", "taxInclusive", "trackInventory") FROM stdin;
\.


--
-- Data for Name: PurchaseBill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseBill" (id, "billNumber", "billDate", "dueDate", subtotal, "totalTax", "totalAmount", "amountPaid", "balanceAmount", status, notes, "createdAt", "updatedAt", "companyId", "supplierId") FROM stdin;
\.


--
-- Data for Name: PurchaseBillItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseBillItem" (id, quantity, rate, "taxRate", "taxAmount", total, "billId", "productId", "productName") FROM stdin;
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseOrder" (id, "orderNumber", "supplierInvoiceNumber", "orderDate", "billDate", "expectedDate", subtotal, "totalTax", "totalAmount", "paidAmount", status, notes, "createdAt", "updatedAt", "companyId", "supplierId") FROM stdin;
\.


--
-- Data for Name: PurchaseOrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseOrderItem" (id, quantity, "receivedQuantity", rate, "taxRate", "taxAmount", total, "purchaseOrderId", "productId", "productName") FROM stdin;
\.


--
-- Data for Name: Quotation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Quotation" (id, "quotationNumber", date, "validUntil", subtotal, "totalTax", "totalAmount", status, notes, terms, "createdAt", "updatedAt", "companyId", "customerId") FROM stdin;
\.


--
-- Data for Name: QuotationItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QuotationItem" (id, quantity, rate, "taxRate", "taxAmount", total, "quotationId", "productId", "productName") FROM stdin;
\.


--
-- Data for Name: SalesOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SalesOrder" (id, "orderNumber", "orderDate", "expectedDate", subtotal, "totalTax", "totalAmount", status, notes, "createdAt", "updatedAt", "companyId", "customerId") FROM stdin;
\.


--
-- Data for Name: SalesOrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SalesOrderItem" (id, quantity, "shippedQuantity", rate, "taxRate", "taxAmount", total, "salesOrderId", "productId", "productName") FROM stdin;
\.


--
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StockMovement" (id, type, quantity, "previousStock", "newStock", reference, reason, notes, "productId", "warehouseId", "createdBy", "createdAt", "companyId") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Transaction" (id, date, description, category, amount, type, status, reference, "createdAt", "updatedAt", "companyId", "accountId") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, phone, role, status, "emailVerified", "phoneVerified", "lastLogin", "createdAt", "updatedAt", "companyId") FROM stdin;
e677cea5-6bda-4b7f-9610-656118e58993	test@bharatflow.com	$2a$10$JdL9gdIM86IaKF6Hi2O/neCBR.2CVsBS/BVE6LD5pV9zyr433olnO	Test User	\N	ADMIN	ACTIVE	t	f	2025-12-04 06:17:28.179	2025-12-04 06:13:57.754	2025-12-04 06:17:28.183	2ab1ba3f-9230-49b0-a408-bb03efdb57ab
\.


--
-- Data for Name: Warehouse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Warehouse" (id, name, code, address, city, state, pincode, "isActive", "isDefault", "createdAt", "updatedAt", "companyId") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
2abe6f43-ce11-4390-991a-fc7c1e1be618	6db73e02cd0243df0c8501ec859f9c851371a6033748f7fb1c01eb78818b5349	2025-12-03 20:26:07.335226+00	20251129071001_init	\N	\N	2025-12-03 20:26:06.808193+00	1
f0045c5d-1793-494b-b129-3cb9cab73be7	2609044f06dd7ea7f48a97deb990b14eb47b3af6fe3d1f6ff6317964412a470e	2025-12-03 20:26:08.860421+00	20251130064258_add_plan_to_company	\N	\N	2025-12-03 20:26:07.347046+00	1
2b726060-ded3-4289-9aa3-e74354db7480	91739f6e27213174e1446dd18c8c34f623d717033905f5854d39cf34065ba0f2	2025-12-03 20:26:09.143046+00	20251201155403_add_delivery_challan	\N	\N	2025-12-03 20:26:08.876412+00	1
ecfc8801-f298-42ef-9916-a73faf826551	c1de9bc232264e3dc4f963e47923c7998d33c39c0b3d7d5cd049a73731e1f5fe	2025-12-03 20:26:19.205537+00	20251203202618_add_inventory_models	\N	\N	2025-12-03 20:26:18.501434+00	1
\.


--
-- Name: BankAccount BankAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BankAccount"
    ADD CONSTRAINT "BankAccount_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryChallanItem DeliveryChallanItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryChallanItem"
    ADD CONSTRAINT "DeliveryChallanItem_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryChallan DeliveryChallan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryChallan"
    ADD CONSTRAINT "DeliveryChallan_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: EstimateItem EstimateItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EstimateItem"
    ADD CONSTRAINT "EstimateItem_pkey" PRIMARY KEY (id);


--
-- Name: Estimate Estimate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Estimate"
    ADD CONSTRAINT "Estimate_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: GoodsReceivedNoteItem GoodsReceivedNoteItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceivedNoteItem"
    ADD CONSTRAINT "GoodsReceivedNoteItem_pkey" PRIMARY KEY (id);


--
-- Name: GoodsReceivedNote GoodsReceivedNote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceivedNote"
    ADD CONSTRAINT "GoodsReceivedNote_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItem InvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: Party Party_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Party"
    ADD CONSTRAINT "Party_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseBillItem PurchaseBillItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseBillItem"
    ADD CONSTRAINT "PurchaseBillItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseBill PurchaseBill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseBill"
    ADD CONSTRAINT "PurchaseBill_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrderItem PurchaseOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrder PurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: QuotationItem QuotationItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_pkey" PRIMARY KEY (id);


--
-- Name: Quotation Quotation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_pkey" PRIMARY KEY (id);


--
-- Name: SalesOrderItem SalesOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesOrderItem"
    ADD CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: SalesOrder SalesOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesOrder"
    ADD CONSTRAINT "SalesOrder_pkey" PRIMARY KEY (id);


--
-- Name: StockMovement StockMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Warehouse Warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Company_gstin_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Company_gstin_key" ON public."Company" USING btree (gstin);


--
-- Name: DeliveryChallan_companyId_challanNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DeliveryChallan_companyId_challanNumber_key" ON public."DeliveryChallan" USING btree ("companyId", "challanNumber");


--
-- Name: Employee_companyId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Employee_companyId_email_key" ON public."Employee" USING btree ("companyId", email);


--
-- Name: Employee_companyId_employeeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Employee_companyId_employeeId_key" ON public."Employee" USING btree ("companyId", "employeeId");


--
-- Name: Estimate_companyId_estimateNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Estimate_companyId_estimateNumber_key" ON public."Estimate" USING btree ("companyId", "estimateNumber");


--
-- Name: GoodsReceivedNote_companyId_grnNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "GoodsReceivedNote_companyId_grnNumber_key" ON public."GoodsReceivedNote" USING btree ("companyId", "grnNumber");


--
-- Name: Invoice_companyId_invoiceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_companyId_invoiceNumber_key" ON public."Invoice" USING btree ("companyId", "invoiceNumber");


--
-- Name: PurchaseBill_companyId_billNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PurchaseBill_companyId_billNumber_key" ON public."PurchaseBill" USING btree ("companyId", "billNumber");


--
-- Name: PurchaseOrder_companyId_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PurchaseOrder_companyId_orderNumber_key" ON public."PurchaseOrder" USING btree ("companyId", "orderNumber");


--
-- Name: Quotation_companyId_quotationNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Quotation_companyId_quotationNumber_key" ON public."Quotation" USING btree ("companyId", "quotationNumber");


--
-- Name: SalesOrder_companyId_orderNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SalesOrder_companyId_orderNumber_key" ON public."SalesOrder" USING btree ("companyId", "orderNumber");


--
-- Name: StockMovement_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StockMovement_companyId_idx" ON public."StockMovement" USING btree ("companyId");


--
-- Name: StockMovement_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StockMovement_createdAt_idx" ON public."StockMovement" USING btree ("createdAt");


--
-- Name: StockMovement_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StockMovement_productId_idx" ON public."StockMovement" USING btree ("productId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- Name: Warehouse_companyId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Warehouse_companyId_code_key" ON public."Warehouse" USING btree ("companyId", code);


--
-- Name: BankAccount BankAccount_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BankAccount"
    ADD CONSTRAINT "BankAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryChallanItem DeliveryChallanItem_challanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryChallanItem"
    ADD CONSTRAINT "DeliveryChallanItem_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES public."DeliveryChallan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryChallanItem DeliveryChallanItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryChallanItem"
    ADD CONSTRAINT "DeliveryChallanItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DeliveryChallan DeliveryChallan_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryChallan"
    ADD CONSTRAINT "DeliveryChallan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryChallan DeliveryChallan_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DeliveryChallan"
    ADD CONSTRAINT "DeliveryChallan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Party"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Employee Employee_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EstimateItem EstimateItem_estimateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EstimateItem"
    ADD CONSTRAINT "EstimateItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES public."Estimate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EstimateItem EstimateItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EstimateItem"
    ADD CONSTRAINT "EstimateItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Estimate Estimate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Estimate"
    ADD CONSTRAINT "Estimate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Estimate Estimate_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Estimate"
    ADD CONSTRAINT "Estimate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Party"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Expense Expense_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsReceivedNoteItem GoodsReceivedNoteItem_grnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceivedNoteItem"
    ADD CONSTRAINT "GoodsReceivedNoteItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES public."GoodsReceivedNote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GoodsReceivedNoteItem GoodsReceivedNoteItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceivedNoteItem"
    ADD CONSTRAINT "GoodsReceivedNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GoodsReceivedNote GoodsReceivedNote_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceivedNote"
    ADD CONSTRAINT "GoodsReceivedNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GoodsReceivedNote GoodsReceivedNote_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GoodsReceivedNote"
    ADD CONSTRAINT "GoodsReceivedNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Party"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InvoiceItem InvoiceItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Party"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Party Party_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Party"
    ADD CONSTRAINT "Party_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseBillItem PurchaseBillItem_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseBillItem"
    ADD CONSTRAINT "PurchaseBillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES public."PurchaseBill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseBillItem PurchaseBillItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseBillItem"
    ADD CONSTRAINT "PurchaseBillItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PurchaseBill PurchaseBill_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseBill"
    ADD CONSTRAINT "PurchaseBill_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseBill PurchaseBill_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseBill"
    ADD CONSTRAINT "PurchaseBill_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Party"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrderItem PurchaseOrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PurchaseOrderItem PurchaseOrderItem_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public."PurchaseOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseOrder PurchaseOrder_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseOrder PurchaseOrder_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Party"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuotationItem QuotationItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuotationItem QuotationItem_quotationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuotationItem"
    ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES public."Quotation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quotation Quotation_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Quotation Quotation_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Quotation"
    ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Party"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesOrderItem SalesOrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesOrderItem"
    ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SalesOrderItem SalesOrderItem_salesOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesOrderItem"
    ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES public."SalesOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesOrder SalesOrder_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesOrder"
    ADD CONSTRAINT "SalesOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalesOrder SalesOrder_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SalesOrder"
    ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Party"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."BankAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Warehouse Warehouse_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict W5Ne6aMhgpwar8fhID8FAWontybFAHU96bYnVQXRIZ7GR1lRjC1F4DvuNrZnBtW


