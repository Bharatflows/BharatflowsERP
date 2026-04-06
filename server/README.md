# BharatFlows Backend Server

This directory contains the backend API server for Bharatflows MSME OS.

## Technology Stack

### Recommended Stack:
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL or MongoDB
- **ORM**: Prisma (for PostgreSQL) or Mongoose (for MongoDB)
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod or Joi
- **File Storage**: AWS S3 or local storage

## Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── app.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimit.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── parties.routes.ts
│   │   ├── products.routes.ts
│   │   ├── sales.routes.ts
│   │   ├── purchase.routes.ts
│   │   ├── expenses.routes.ts
│   │   ├── hr.routes.ts
│   │   └── ... (other modules)
│   ├── controllers/     # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── parties.controller.ts
│   │   └── ... (other modules)
│   ├── services/        # Business logic
│   │   ├── auth.service.ts
│   │   ├── parties.service.ts
│   │   └── ... (other modules)
│   ├── models/          # Database models
│   │   ├── User.model.ts
│   │   ├── Company.model.ts
│   │   ├── Party.model.ts
│   │   ├── Product.model.ts
│   │   └── ... (other models)
│   ├── utils/           # Utility functions
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   ├── encryption.ts
│   │   └── emailService.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── app.ts           # Express app setup
├── prisma/              # Prisma schema (if using PostgreSQL)
│   └── schema.prisma
├── tests/               # Test files
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

### Core Tables:

1. **users** - User accounts
2. **companies** - Business/company details
3. **parties** - Customers and suppliers
4. **products** - Inventory items
5. **invoices** - Sales invoices
6. **invoice_items** - Invoice line items
7. **purchase_orders** - Purchase orders
8. **purchase_items** - PO line items
9. **expenses** - Expense records
10. **employees** - HR employee records
11. **attendance** - Attendance records
12. **leave_requests** - Leave applications
13. **notifications** - User notifications
14. **documents** - Document metadata
15. **settings** - Application settings

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- POST `/api/auth/refresh` - Refresh token
- GET `/api/auth/me` - Get current user
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password

### Parties (Customers/Suppliers)
- GET `/api/parties` - List all parties
- GET `/api/parties/:id` - Get party by ID
- POST `/api/parties` - Create party
- PUT `/api/parties/:id` - Update party
- DELETE `/api/parties/:id` - Delete party
- GET `/api/parties/:id/ledger` - Get party ledger

### Products/Inventory
- GET `/api/products` - List all products
- GET `/api/products/:id` - Get product by ID
- POST `/api/products` - Create product
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product
- POST `/api/products/:id/adjust-stock` - Adjust stock
- GET `/api/products/low-stock` - Get low stock items

### Sales/Invoices
- GET `/api/invoices` - List all invoices
- GET `/api/invoices/:id` - Get invoice by ID
- POST `/api/invoices` - Create invoice
- PUT `/api/invoices/:id` - Update invoice
- DELETE `/api/invoices/:id` - Delete invoice
- POST `/api/invoices/:id/payment` - Record payment
- GET `/api/invoices/:id/pdf` - Download PDF
- POST `/api/invoices/:id/send` - Send via email

### Purchase
- GET `/api/purchases` - List all purchases
- GET `/api/purchases/:id` - Get purchase by ID
- POST `/api/purchases` - Create purchase
- PUT `/api/purchases/:id` - Update purchase
- DELETE `/api/purchases/:id` - Delete purchase

### Expenses
- GET `/api/expenses` - List all expenses
- GET `/api/expenses/:id` - Get expense by ID
- POST `/api/expenses` - Create expense
- PUT `/api/expenses/:id` - Update expense
- DELETE `/api/expenses/:id` - Delete expense
- POST `/api/expenses/:id/approve` - Approve expense
- POST `/api/expenses/:id/reject` - Reject expense

### HR/Employees
- GET `/api/employees` - List all employees
- GET `/api/employees/:id` - Get employee by ID
- POST `/api/employees` - Create employee
- PUT `/api/employees/:id` - Update employee
- DELETE `/api/employees/:id` - Delete employee
- POST `/api/employees/:id/attendance` - Mark attendance
- POST `/api/payroll/process` - Process payroll
- GET `/api/employees/:id/payslip/:month` - Get payslip

### Notifications
- GET `/api/notifications` - List notifications
- PATCH `/api/notifications/:id/read` - Mark as read
- POST `/api/notifications/read-all` - Mark all as read
- DELETE `/api/notifications/:id` - Delete notification
- GET `/api/notifications/unread-count` - Get unread count

### Dashboard
- GET `/api/dashboard/kpis` - Get KPIs
- GET `/api/dashboard/sales-chart` - Get sales chart data
- GET `/api/dashboard/recent-transactions` - Get recent transactions

### Reports
- GET `/api/reports/sales` - Sales report
- GET `/api/reports/purchase` - Purchase report
- GET `/api/reports/inventory` - Inventory report
- GET `/api/reports/gst` - GST report
- GET `/api/reports/export/:type` - Export report

### GST
- GET `/api/gst/gstr1/:month` - Generate GSTR-1
- GET `/api/gst/gstr3b/:month` - Generate GSTR-3B
- POST `/api/gst/e-invoice/:invoiceId` - Generate E-Invoice
- POST `/api/gst/e-waybill/:invoiceId` - Generate E-Way Bill

## Setup Instructions

1. Install dependencies:
```bash
cd server
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
# For Prisma (PostgreSQL)
npx prisma migrate dev

# For Mongoose (MongoDB)
# Ensure MongoDB is running
```

4. Seed database (optional):
```bash
npm run seed
```

5. Start development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
npm start
```

## Security Considerations

1. **Authentication**: JWT tokens with short expiry + refresh tokens
2. **Password**: Bcrypt hashing with salt rounds ≥ 10
3. **Rate Limiting**: Implement on all endpoints
4. **CORS**: Configure properly for production
5. **Input Validation**: Validate all inputs using Zod/Joi
6. **SQL Injection**: Use parameterized queries (ORM handles this)
7. **XSS Protection**: Sanitize user inputs
8. **HTTPS**: Always use HTTPS in production
9. **Environment Variables**: Never commit .env files

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test auth.test.ts
```

## Deployment

### Option 1: Traditional VPS/Cloud (AWS EC2, DigitalOcean)
- Use PM2 for process management
- Nginx as reverse proxy
- PostgreSQL/MongoDB on same or separate server

### Option 2: Serverless (AWS Lambda, Vercel)
- Deploy as serverless functions
- Use managed database (AWS RDS, MongoDB Atlas)

### Option 3: Container (Docker + Kubernetes)
- Containerize application
- Deploy to Kubernetes cluster
- Use managed database service

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bharatflow
# OR
MONGODB_URI=mongodb://localhost:27017/bharatflow

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Optional: AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Optional: SMS Gateway
SMS_API_KEY=
SMS_API_URL=

# CORS
CORS_ORIGIN=http://localhost:5173
```

## License

Proprietary - Bharatflows MSME OS
