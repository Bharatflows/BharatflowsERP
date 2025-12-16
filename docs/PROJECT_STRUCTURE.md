# 🏗️ BharatFlow - New Project Structure

## 📁 **Complete Folder Structure**

```
bharatflow/
├── client/                          # Frontend Application
│   ├── public/                      # Static assets
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/                  # Images, fonts, etc.
│   │   ├── components/              # React components
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── modules/             # Feature modules
│   │   │   │   ├── sales/
│   │   │   │   ├── purchase/
│   │   │   │   ├── inventory/
│   │   │   │   ├── parties/
│   │   │   │   ├── expenses/
│   │   │   │   ├── hr/
│   │   │   │   ├── crm/
│   │   │   │   ├── production/
│   │   │   │   ├── barcode/
│   │   │   │   ├── documents/
│   │   │   │   ├── banking/
│   │   │   │   ├── gst/
│   │   │   │   ├── quotation/
│   │   │   │   ├── analytics/
│   │   │   │   ├── reports/
│   │   │   │   ├── notifications/
│   │   │   │   ├── messages/
│   │   │   │   └── settings/
│   │   │   ├── auth/                # Auth components
│   │   │   ├── dashboard/           # Dashboard components
│   │   │   └── shared/              # Shared components
│   │   ├── contexts/                # React contexts
│   │   ├── hooks/                   # Custom hooks
│   │   ├── layouts/                 # Layout components
│   │   ├── lib/                     # Utilities
│   │   ├── routes/                  # Route configuration
│   │   ├── services/                # API services
│   │   ├── styles/                  # Global styles
│   │   ├── types/                   # TypeScript types
│   │   ├── utils/                   # Helper functions
│   │   ├── App.tsx                  # Root component
│   │   └── main.tsx                 # Entry point
│   ├── index.html                   # HTML entry
│   ├── package.json                 # Client dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── vite.config.ts               # Vite config
│   └── README.md                    # Client docs
│
├── server/                          # Backend Application
│   ├── src/
│   │   ├── config/                  # Configuration
│   │   │   ├── database.ts          # Database config
│   │   │   ├── jwt.ts               # JWT config
│   │   │   └── env.ts               # Environment variables
│   │   ├── controllers/             # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── sales.controller.ts
│   │   │   ├── purchase.controller.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── parties.controller.ts
│   │   │   ├── expenses.controller.ts
│   │   │   ├── hr.controller.ts
│   │   │   ├── gst.controller.ts
│   │   │   └── reports.controller.ts
│   │   ├── models/                  # Database models
│   │   │   ├── User.ts
│   │   │   ├── Company.ts
│   │   │   ├── Invoice.ts
│   │   │   ├── Product.ts
│   │   │   ├── Party.ts
│   │   │   ├── Expense.ts
│   │   │   ├── Employee.ts
│   │   │   └── index.ts
│   │   ├── routes/                  # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── sales.routes.ts
│   │   │   ├── purchase.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── parties.routes.ts
│   │   │   └── index.ts
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── services/                # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── sales.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── sms.service.ts
│   │   ├── utils/                   # Helper functions
│   │   │   ├── validators.ts
│   │   │   ├── gst.utils.ts
│   │   │   └── date.utils.ts
│   │   ├── types/                   # TypeScript types
│   │   │   └── index.ts
│   │   ├── app.ts                   # Express app
│   │   └── server.ts                # Server entry
│   ├── .env.example                 # Environment template
│   ├── package.json                 # Server dependencies
│   ├── tsconfig.json                # TypeScript config
│   └── README.md                    # Server docs
│
├── shared/                          # Shared code (types, utils)
│   ├── types/                       # Common TypeScript types
│   │   ├── models.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── constants/                   # Shared constants
│   │   ├── states.ts                # Indian states
│   │   ├── gst-rates.ts             # GST rates
│   │   └── hsn-codes.ts             # HSN codes
│   └── utils/                       # Shared utilities
│       ├── validators.ts
│       └── formatters.ts
│
├── docs/                            # Documentation
│   ├── API.md                       # API documentation
│   ├── DATABASE.md                  # Database schema
│   ├── DEPLOYMENT.md                # Deployment guide
│   └── CONTRIBUTING.md              # Contributing guide
│
├── scripts/                         # Build & deploy scripts
│   ├── setup.sh                     # Initial setup
│   ├── dev.sh                       # Start dev environment
│   └── deploy.sh                    # Deploy script
│
├── .gitignore                       # Git ignore
├── package.json                     # Root package.json (workspaces)
├── README.md                        # Main readme
├── ARCHITECTURE.md                  # Architecture docs
├── SETUP_GUIDE.md                   # Setup guide
└── docker-compose.yml               # Docker setup (optional)
```

---

## 🎯 **Key Differences from Old Structure**

### **Before (Mixed Structure):**
```
/
├── components/          ❌ Mixed with root
├── src/                 ❌ Incomplete separation
├── server/              ❌ Not properly separated
├── styles/              ❌ No clear organization
└── lib/                 ❌ Scattered utilities
```

### **After (Clean Separation):**
```
/
├── client/              ✅ Complete frontend
├── server/              ✅ Complete backend
├── shared/              ✅ Common code
├── docs/                ✅ All documentation
└── scripts/             ✅ Automation scripts
```

---

## 📦 **Package Management**

### **Root package.json (Workspace Manager):**
```json
{
  "name": "bharatflow",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "install:all": "npm install && cd client && npm install && cd ../server && npm install"
  }
}
```

### **Client package.json:**
```json
{
  "name": "@bharatflow/client",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "sonner": "^1.0.0",
    "lucide-react": "^0.300.0"
  }
}
```

### **Server package.json:**
```json
{
  "name": "@bharatflow/server",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

---

## 🚀 **Running the Application**

### **Option 1: Run Both (Recommended for Development)**
```bash
# From root directory
npm run dev
```
This runs:
- Client on: http://localhost:5173
- Server on: http://localhost:3000

### **Option 2: Run Separately**
```bash
# Terminal 1 - Client
cd client
npm run dev

# Terminal 2 - Server
cd server
npm run dev
```

### **Option 3: Production Build**
```bash
# Build both
npm run build

# Run production server
cd server
npm start
```

---

## 🔄 **Data Flow**

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Port 5173)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  React Components                                │   │
│  │  ├── Auth (Login, Register)                      │   │
│  │  ├── Dashboard                                    │   │
│  │  ├── Modules (Sales, Purchase, Inventory, etc.)  │   │
│  │  └── Settings                                     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Services (API Calls)                            │   │
│  │  ├── authService.login()                         │   │
│  │  ├── salesService.createInvoice()                │   │
│  │  └── inventoryService.getProducts()              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                     Server (Port 3000)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Routes                                       │   │
│  │  ├── POST /api/auth/login                        │   │
│  │  ├── POST /api/sales/invoices                    │   │
│  │  └── GET  /api/inventory/products                │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Controllers (Request Handlers)                  │   │
│  │  └── Business Logic                              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Services (Business Logic)                       │   │
│  │  └── Database Operations                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  Database (MongoDB)                      │
│  ├── users                                              │
│  ├── companies                                          │
│  ├── invoices                                           │
│  ├── products                                           │
│  └── transactions                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 **Benefits of New Structure**

1. **Clear Separation** ✅
   - Frontend and backend completely separated
   - No confusion about file locations
   - Easy to understand for new developers

2. **Easy Deployment** ✅
   - Deploy client to Vercel/Netlify
   - Deploy server to Heroku/Railway/AWS
   - Independent scaling

3. **Better Development** ✅
   - Run client and server independently
   - Test backend without frontend
   - Mock frontend without backend

4. **Shared Code** ✅
   - Types shared between client and server
   - Constants (States, GST rates) shared
   - Validators used on both sides

5. **Professional** ✅
   - Industry-standard structure
   - Easy for team collaboration
   - Ready for CI/CD

---

## 📝 **Migration Steps**

### **Step 1: Create New Structure**
```bash
mkdir client server shared docs scripts
```

### **Step 2: Move Files**
```bash
# Move client files
mv components client/src/
mv src/* client/src/
mv styles client/src/
mv lib client/src/
mv index.html client/
mv vite.config.ts client/

# Move server files
mv server/* server/

# Create shared
mkdir -p shared/types shared/constants shared/utils
```

### **Step 3: Update Import Paths**
```typescript
// Before
import { Button } from './components/ui/button';

// After
import { Button } from '@/components/ui/button';
```

### **Step 4: Set Up Workspaces**
```bash
npm install
cd client && npm install
cd ../server && npm install
```

---

## 🎯 **Next Actions**

1. ✅ Create folder structure
2. ✅ Move files to new locations
3. ✅ Update package.json files
4. ✅ Fix import paths
5. ✅ Test client separately
6. ✅ Test server separately
7. ✅ Test together
8. ✅ Update documentation

---

This structure is production-ready and follows industry best practices! 🚀
