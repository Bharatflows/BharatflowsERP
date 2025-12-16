# BharatFlow MSME OS - Architecture Documentation

## 🏗️ Project Structure

```
bharatflow/
├── src/                          # Frontend Source Code
│   ├── App.tsx                   # Main App with Router
│   ├── main.tsx                  # Entry Point
│   │
│   ├── contexts/                 # React Context Providers
│   │   └── AuthContext.tsx       # Authentication Context
│   │
│   ├── routes/                   # Route Configuration
│   │   └── index.tsx             # All app routes
│   │
│   ├── layouts/                  # Layout Components
│   │   └── DashboardLayout.tsx   # Main Dashboard Layout
│   │
│   ├── services/                 # API Service Layer
│   │   ├── api.ts                # Base API client
│   │   ├── auth.service.ts       # Auth API calls
│   │   └── modules.service.ts    # Module-specific APIs
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   └── useApi.ts             # API hook with loading states
│   │
│   └── types/                    # TypeScript Types
│       └── index.ts              # Shared types
│
├── components/                   # React Components
│   ├── Dashboard.tsx             # Main Dashboard (will be updated)
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   │
│   ├── ui/                       # Reusable UI Components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ... (shadcn components)
│   │
│   ├── sales/                    # Sales Module
│   ├── purchase/                 # Purchase Module
│   ├── inventory/                # Inventory Module
│   ├── parties/                  # Parties Module
│   ├── expenses/                 # Expenses Module
│   ├── hr/                       # HR & Payroll
│   ├── crm/                      # CRM Module
│   ├── production/               # Production Module
│   ├── barcode/                  # Barcode Module
│   ├── documents/                # Documents Module
│   ├── banking/                  # Banking Module
│   ├── gst/                      # GST Module
│   ├── quotation/                # Quotations
│   ├── analytics/                # Analytics
│   ├── reports/                  # Reports
│   ├── notifications/            # Notifications
│   ├── messages/                 # Messages
│   └── settings/                 # Settings
│
├── server/                       # Backend API Server
│   ├── src/
│   │   ├── config/               # Configuration
│   │   ├── middleware/           # Express Middleware
│   │   ├── routes/               # API Routes
│   │   ├── controllers/          # Route Controllers
│   │   ├── services/             # Business Logic
│   │   ├── models/               # Database Models
│   │   ├── utils/                # Utilities
│   │   └── app.ts                # Express App
│   │
│   ├── prisma/                   # Prisma Schema
│   │   └── schema.prisma
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── styles/                       # Global Styles
│   └── globals.css
│
├── lib/                          # Utility Functions
│   └── utils.ts
│
├── package.json                  # Frontend Dependencies
├── tsconfig.json                 # TypeScript Config
├── vite.config.ts                # Vite Configuration
├── .env.example                  # Environment Variables
└── README.md                     # Project Documentation
```

---

## 🔄 Application Flow

### 1. Authentication Flow

```
User → Login Page → Auth Service → Backend API → JWT Token → Local Storage
                                         ↓
                                    Set Auth Context
                                         ↓
                                  Redirect to Dashboard
```

### 2. Data Fetching Flow

```
Component → useApi Hook → Service Layer → API Client → Backend API
                                                            ↓
                                                      Database
                                                            ↓
Component ← Loading/Error/Data ← Response ← API Client ← Backend
```

### 3. Route Protection Flow

```
User Navigates → Router → ProtectedRoute Component → Check Auth
                                    ↓
                            Authenticated?
                            ↓           ↓
                          Yes          No
                            ↓           ↓
                    Show Component   Redirect to Login
```

---

## 🎯 Key Design Patterns

### 1. **Separation of Concerns**
- **Presentation**: React components (UI only)
- **Business Logic**: Services layer
- **State Management**: React Context + Hooks
- **Data Fetching**: Custom hooks (useApi)

### 2. **Service Layer Pattern**
All API calls go through service layer:
```typescript
// ❌ Bad: Direct API call in component
fetch('/api/products')

// ✅ Good: Through service layer
import { productsService } from '@/services/modules.service';
productsService.getAll()
```

### 3. **Repository Pattern** (Backend)
Controllers → Services → Models → Database

### 4. **Dependency Injection**
Services are injectable and testable

---

## 🔐 Authentication & Authorization

### Frontend
- JWT token stored in localStorage
- Auth context provides user state globally
- Protected routes check authentication
- Automatic token refresh on expiry

### Backend
- JWT tokens with short expiry (15 min)
- Refresh tokens for long sessions (7 days)
- Role-based access control (RBAC)
- Middleware validates tokens on protected routes

---

## 📡 API Communication

### Request Flow:
```typescript
// 1. Component initiates request
const { data, loading, error, execute } = useApi(partiesService.getAll);

// 2. Service formats request
export const partiesService = {
  getAll: (params) => apiService.get(`/parties?${params}`)
}

// 3. API client adds auth headers
private async request(endpoint, options) {
  const headers = {
    'Authorization': `Bearer ${this.token}`,
    'Content-Type': 'application/json'
  }
  // ...
}

// 4. Backend receives & validates
router.get('/parties', authMiddleware, async (req, res) => {
  // Controller logic
})
```

### Response Format:
```typescript
// Success Response
{
  success: true,
  data: { /* actual data */ },
  message: "Operation successful"
}

// Error Response
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE"
}

// Paginated Response
{
  success: true,
  data: [/* items */],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

---

## 🗄️ Database Schema

### Core Entities:

1. **users** - Application users
2. **companies** - Business entities
3. **parties** - Customers & suppliers
4. **products** - Inventory items
5. **invoices** - Sales invoices
6. **invoice_items** - Invoice line items
7. **purchase_orders** - Purchase orders
8. **purchase_items** - PO line items
9. **expenses** - Expense records
10. **employees** - HR records
11. **attendance** - Attendance tracking
12. **leave_requests** - Leave applications
13. **notifications** - System notifications
14. **documents** - Document metadata
15. **settings** - App configurations

### Relationships:
- users → companies (many-to-one)
- invoices → parties (many-to-one)
- invoices → invoice_items (one-to-many)
- products → invoice_items (one-to-many)
- companies → products (one-to-many)
- employees → attendance (one-to-many)

---

## 🚀 Getting Started

### Frontend Setup:

```bash
# Install dependencies
npm install

# Install React Router
npm install react-router-dom

# Set up environment
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
```

### Backend Setup:

```bash
cd server

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database and secrets

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

### Full Stack Development:

```bash
# Terminal 1: Run backend
cd server && npm run dev

# Terminal 2: Run frontend
npm run dev

# Access: http://localhost:5173
# API: http://localhost:3000/api
```

---

## 🧪 Testing Strategy

### Frontend Testing:
```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Component tests (React Testing Library)
npm run test:components
```

### Backend Testing:
```bash
cd server

# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

---

## 📦 Deployment

### Frontend (Vercel/Netlify):
```bash
# Build production
npm run build

# Preview build
npm run preview

# Deploy
# Connect GitHub repo to Vercel/Netlify
```

### Backend (AWS/DigitalOcean):
```bash
cd server

# Build
npm run build

# Start production
NODE_ENV=production npm start

# Using PM2
pm2 start dist/app.js --name bharatflow-api
```

### Docker Deployment:
```dockerfile
# Dockerfile for full stack
FROM node:18-alpine

# Backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/dist ./dist

# Frontend
WORKDIR /app/client
COPY dist ./dist

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔧 Configuration Files

### Frontend (vite.config.ts):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

### Backend (Express App):
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api', routes);

export default app;
```

---

## 🔒 Security Best Practices

1. **Authentication**: JWT with httpOnly cookies
2. **Authorization**: Role-based access control
3. **Input Validation**: Zod schemas on all inputs
4. **SQL Injection**: ORM (Prisma) prevents this
5. **XSS Protection**: Sanitize user inputs
6. **CSRF Protection**: CSRF tokens on state-changing ops
7. **Rate Limiting**: Limit API requests per IP
8. **HTTPS**: Always use HTTPS in production
9. **Secrets**: Use environment variables, never hardcode

---

## 📚 Additional Resources

- [React Router Documentation](https://reactrouter.com/)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Best Practices](https://jwt.io/introduction)
- [REST API Design Guidelines](https://restfulapi.net/)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

Proprietary - BharatFlow MSME OS © 2024
