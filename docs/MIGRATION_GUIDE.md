# 🔄 Migration Guide: Old Structure → New Architecture

This guide helps you understand the changes and how to work with the new architecture.

---

## 📋 What Changed?

### Before (Old Structure)
```
App.tsx (Main component with all routing logic)
├── LoginPage, RegisterPage (Auth)
├── Dashboard (Main dashboard with internal routing)
└── All modules as direct components
```

### After (New Structure)
```
src/
├── App.tsx (Router setup)
├── main.tsx (Entry point)
├── contexts/ (Global state)
├── routes/ (Route configuration)
├── layouts/ (Layout components)
├── services/ (API layer)
├── hooks/ (Custom hooks)
└── types/ (TypeScript types)
```

---

## 🔑 Key Changes

### 1. **React Router Integration**

**Old Way:**
```typescript
// App.tsx
const [activeModule, setActiveModule] = useState("dashboard");

const renderContent = () => {
  switch (activeModule) {
    case "sales": return <SalesModule />;
    // ...
  }
}
```

**New Way:**
```typescript
// src/routes/index.tsx
<Routes>
  <Route path="/sales" element={<SalesModule />} />
  <Route path="/purchase" element={<PurchaseModule />} />
  // ...
</Routes>
```

### 2. **Authentication Context**

**Old Way:**
```typescript
// App.tsx
const [isLoggedIn, setIsLoggedIn] = useState(false);
```

**New Way:**
```typescript
// src/contexts/AuthContext.tsx
const { user, login, logout, isAuthenticated } = useAuth();
```

### 3. **API Service Layer**

**Old Way:**
```typescript
// Direct fetch in components
const fetchData = async () => {
  const response = await fetch('/api/products');
  const data = await response.json();
}
```

**New Way:**
```typescript
// src/services/modules.service.ts
import { productsService } from '@/services/modules.service';

const { data, loading, error, execute } = useApi(productsService.getAll);
```

### 4. **Protected Routes**

**Old Way:**
```typescript
// Manual checks in components
if (!isLoggedIn) {
  return <Navigate to="/login" />;
}
```

**New Way:**
```typescript
// src/routes/index.tsx
<Route path="/*" element={
  <ProtectedRoute>
    <DashboardLayout>
      {/* Protected routes */}
    </DashboardLayout>
  </ProtectedRoute>
} />
```

---

## 🚀 How to Use the New Structure

### 1. **Starting the Application**

```bash
# Install new dependency
npm install react-router-dom

# Start dev server
npm run dev
```

### 2. **Working with Auth**

```typescript
// In any component
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <p>Welcome, {user.name}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. **Making API Calls**

```typescript
// Using the useApi hook
import { useApi } from '@/hooks/useApi';
import { productsService } from '@/services/modules.service';

function ProductList() {
  const { data, loading, error, execute } = useApi(productsService.getAll);
  
  useEffect(() => {
    execute({ page: 1, limit: 20 });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {data?.data.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 4. **Navigation**

```typescript
// Old way
setActiveModule("sales");

// New way
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const goToSales = () => {
    navigate('/sales');
  };
  
  return <button onClick={goToSales}>Go to Sales</button>;
}
```

### 5. **Getting Current Route**

```typescript
import { useLocation } from 'react-router-dom';

function MyComponent() {
  const location = useLocation();
  const currentPath = location.pathname; // "/sales"
  
  return <div>Current: {currentPath}</div>;
}
```

---

## 📝 Component Migration Examples

### Example 1: Dashboard Component

**Before:**
```typescript
// App.tsx
function App() {
  const [activeModule, setActiveModule] = useState("dashboard");
  
  return (
    <Dashboard 
      activeModule={activeModule}
      onModuleChange={setActiveModule}
    />
  );
}
```

**After:**
```typescript
// src/App.tsx
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

// src/routes/index.tsx
<Route path="/*" element={
  <ProtectedRoute>
    <DashboardLayout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sales" element={<SalesModule />} />
      </Routes>
    </DashboardLayout>
  </ProtectedRoute>
} />
```

### Example 2: Login Component

**Before:**
```typescript
<LoginPage onLogin={() => setIsLoggedIn(true)} />
```

**After:**
```typescript
// Component
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleLogin = async (email, password) => {
    await login(email, password);
    navigate('/dashboard');
  };
}

// Route
<Route path="/login" element={
  <PublicRoute>
    <LoginPage />
  </PublicRoute>
} />
```

### Example 3: Module Components

**Before:**
```typescript
// SalesModule rendered based on state
{activeModule === 'sales' && <SalesModule />}
```

**After:**
```typescript
// Route-based rendering
<Route path="/sales/*" element={<SalesModule />} />

// Internal module routing
function SalesModule() {
  return (
    <Routes>
      <Route path="/" element={<InvoiceList />} />
      <Route path="/create" element={<CreateInvoice />} />
      <Route path="/:id" element={<InvoiceDetail />} />
    </Routes>
  );
}
```

---

## 🔧 Updating Existing Components

### 1. **Remove State-Based Routing**

Remove all instances of:
```typescript
const [activeModule, setActiveModule] = useState(...);
const [activeTab, setActiveTab] = useState(...);
```

Replace with:
```typescript
import { useNavigate, useLocation } from 'react-router-dom';
const navigate = useNavigate();
```

### 2. **Update Navigation Callbacks**

Replace:
```typescript
onModuleChange={(module) => setActiveModule(module)}
```

With:
```typescript
onClick={() => navigate('/module-name')}
```

### 3. **Update Conditional Rendering**

Replace:
```typescript
{activeModule === 'sales' && <SalesModule />}
```

With React Router's `<Route>` components.

---

## 🗄️ Backend Integration Steps

### 1. **Set Up Environment Variables**

```bash
# Frontend .env
VITE_API_URL=http://localhost:3000/api

# Backend .env
DATABASE_URL=postgresql://user:pass@localhost:5432/bharatflow
JWT_SECRET=your-secret-key
```

### 2. **Update API Service**

The API service is already configured to use `VITE_API_URL`. Just ensure your backend is running on the correct port.

### 3. **Handle API Responses**

All services return typed responses:

```typescript
// Success
{
  success: true,
  data: {...},
  message: "Operation successful"
}

// Error
{
  success: false,
  error: "Error message"
}

// Paginated
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

### 4. **Error Handling**

The `useApi` hook automatically handles errors:

```typescript
const { data, error, loading } = useApi(service.method);

if (error) {
  // Error is automatically available
  toast.error(error);
}
```

---

## 🧪 Testing the Migration

### 1. **Test Authentication**
```bash
# Start both servers
npm run dev              # Frontend
cd server && npm run dev # Backend

# Test login at http://localhost:5173/login
```

### 2. **Test Routing**
- Navigate to different modules
- Check URL changes
- Test back button
- Test direct URL access

### 3. **Test API Calls**
- Check browser DevTools Network tab
- Verify API endpoints are called
- Check request/response format

---

## 📚 New Folder Structure Benefits

### ✅ **Advantages**

1. **Scalability**: Easy to add new features
2. **Maintainability**: Clear separation of concerns
3. **Testability**: Services and hooks are testable
4. **Type Safety**: Full TypeScript support
5. **SEO**: React Router enables better SEO
6. **Code Reuse**: Shared services and hooks
7. **Backend Ready**: Clean API layer for backend integration

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find module '@/contexts/AuthContext'"

**Solution**: Update your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue 2: "Blank page after routing"

**Solution**: Check that:
1. `BrowserRouter` wraps the entire app
2. Routes are properly nested
3. No conflicting route paths

### Issue 3: "API calls fail with CORS error"

**Solution**: Configure backend CORS:
```typescript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Issue 4: "Auth token not persisting"

**Solution**: Check localStorage in browser DevTools:
```typescript
localStorage.getItem('authToken'); // Should exist
```

---

## 📖 Additional Resources

- [React Router Docs](https://reactrouter.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [API Architecture Guide](./ARCHITECTURE.md)
- [Backend Setup Guide](./server/README.md)

---

## 💡 Best Practices

1. **Always use the service layer** for API calls
2. **Use TypeScript types** from `src/types/`
3. **Handle loading and error states** in components
4. **Use `useApi` hook** for consistent API handling
5. **Implement proper error boundaries**
6. **Add loading skeletons** for better UX
7. **Use React Router's `Link`** instead of `<a>` tags

---

## 🎯 Next Steps

1. ✅ Install `react-router-dom`
2. ✅ Review new file structure
3. ✅ Update imports in components
4. ⏳ Set up backend server
5. ⏳ Test all modules
6. ⏳ Deploy to production

---

**Questions?** Open an issue or contact the development team.

**Ready to start?** Run `npm install react-router-dom` and `npm run dev`!
