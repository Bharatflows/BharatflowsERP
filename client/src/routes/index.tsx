// Route Configuration
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lazy, Suspense } from 'react';

// Auth Pages - Keep these as direct imports (needed immediately)
import { LoginPage } from '../components/LoginPage';
import { RegisterPage } from '../components/RegisterPage';
import { OTPLogin } from '../components/OTPLogin';
import { ForgotPassword } from '../components/ForgotPassword';

// Main Layout - Keep direct import
import { DashboardLayout } from '../layouts/DashboardLayout';

// Route-level error boundary for better error isolation
import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary';

// Lazy-loaded Module Pages (code-split for performance)
const Dashboard = lazy(() => import('../components/Dashboard').then(m => ({ default: m.Dashboard })));
const SalesModule = lazy(() => import('../components/sales/SalesModule').then(m => ({ default: m.SalesModule })));
const PurchaseModule = lazy(() => import('../components/purchase/PurchaseModule').then(m => ({ default: m.PurchaseModule })));
const InventoryModule = lazy(() => import('../components/inventory/InventoryModule').then(m => ({ default: m.InventoryModule })));
const PartiesModule = lazy(() => import('../components/parties/PartiesModule').then(m => ({ default: m.PartiesModule })));
const ExpensesModule = lazy(() => import('../components/expenses/ExpensesModule').then(m => ({ default: m.ExpensesModule })));
const HRModule = lazy(() => import('../components/hr/HRModule').then(m => ({ default: m.HRModule })));
const CRMModule = lazy(() => import('../components/crm/CRMModule').then(m => ({ default: m.CRMModule })));
const ProductionModule = lazy(() => import('../components/production/ProductionModule').then(m => ({ default: m.ProductionModule })));
const BarcodeModule = lazy(() => import('../components/barcode/BarcodeModule').then(m => ({ default: m.BarcodeModule })));
const DocumentsModule = lazy(() => import('../components/documents/DocumentsModule').then(m => ({ default: m.DocumentsModule })));
const BankingModule = lazy(() => import('../components/banking/BankingModule').then(m => ({ default: m.BankingModule })));
const GSTModule = lazy(() => import('../components/gst/GSTModule').then(m => ({ default: m.GSTModule })));
const QuotationModule = lazy(() => import('../components/quotation/QuotationModule').then(m => ({ default: m.QuotationModule })));
const AnalyticsModule = lazy(() => import('../components/analytics/AnalyticsModule').then(m => ({ default: m.AnalyticsModule })));
const ReportsModule = lazy(() => import('../components/reports/ReportsModule').then(m => ({ default: m.ReportsModule })));
const NotificationsModule = lazy(() => import('../components/notifications/NotificationsModule').then(m => ({ default: m.NotificationsModule })));
const MessagesModule = lazy(() => import('../components/messages/MessagesModule').then(m => ({ default: m.MessagesModule })));
const SettingsModule = lazy(() => import('../components/settings/SettingsModule').then(m => ({ default: m.SettingsModule })));
const AccountingModule = lazy(() => import('../components/accounting/AccountingModule').then(m => ({ default: m.AccountingModule })));
const POSModule = lazy(() => import('../components/pos/POSModule').then(m => ({ default: m.POSModule })));
const InviteAcceptPage = lazy(() => import('../components/invite/InviteAcceptPage'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/otp-login"
        element={
          <PublicRoute>
            <OTPLogin />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* Invite Accept Routes (Public - no auth required) */}
      <Route
        path="/invite/:type/:token"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <InviteAcceptPage />
          </Suspense>
        }
      />

      {/* Protected Routes - All inside Dashboard Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/dashboard" element={<RouteErrorBoundary moduleName="Dashboard"><Dashboard onLogout={() => { }} /></RouteErrorBoundary>} />
                  <Route path="/quotations" element={<RouteErrorBoundary moduleName="Quotations"><QuotationModule /></RouteErrorBoundary>} />
                  <Route path="/sales/*" element={<RouteErrorBoundary moduleName="Sales"><SalesModule /></RouteErrorBoundary>} />
                  <Route path="/purchase/*" element={<RouteErrorBoundary moduleName="Purchase"><PurchaseModule /></RouteErrorBoundary>} />
                  <Route path="/inventory/*" element={<RouteErrorBoundary moduleName="Inventory"><InventoryModule /></RouteErrorBoundary>} />
                  <Route path="/parties/*" element={<RouteErrorBoundary moduleName="Parties"><PartiesModule /></RouteErrorBoundary>} />
                  <Route path="/expenses/*" element={<RouteErrorBoundary moduleName="Expenses"><ExpensesModule /></RouteErrorBoundary>} />
                  <Route path="/hr/*" element={<RouteErrorBoundary moduleName="HR"><HRModule /></RouteErrorBoundary>} />
                  <Route path="/crm/*" element={<RouteErrorBoundary moduleName="CRM"><CRMModule /></RouteErrorBoundary>} />
                  <Route path="/production/*" element={<RouteErrorBoundary moduleName="Production"><ProductionModule /></RouteErrorBoundary>} />
                  <Route path="/barcode/*" element={<RouteErrorBoundary moduleName="Barcode"><BarcodeModule /></RouteErrorBoundary>} />
                  <Route path="/documents/*" element={<RouteErrorBoundary moduleName="Documents"><DocumentsModule /></RouteErrorBoundary>} />
                  <Route path="/payments/*" element={<RouteErrorBoundary moduleName="Payments"><BankingModule /></RouteErrorBoundary>} />
                  <Route path="/gst/*" element={<RouteErrorBoundary moduleName="GST"><GSTModule /></RouteErrorBoundary>} />
                  <Route path="/analytics/*" element={<RouteErrorBoundary moduleName="Analytics"><AnalyticsModule /></RouteErrorBoundary>} />
                  <Route path="/reports/*" element={<RouteErrorBoundary moduleName="Reports"><ReportsModule /></RouteErrorBoundary>} />
                  <Route path="/notifications/*" element={<RouteErrorBoundary moduleName="Notifications"><NotificationsModule /></RouteErrorBoundary>} />
                  {/* Messages module hidden for launch - redirect to dashboard */}
                  <Route path="/messages/*" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/accounting/*" element={<RouteErrorBoundary moduleName="Accounting"><AccountingModule /></RouteErrorBoundary>} />
                  <Route path="/pos/*" element={<RouteErrorBoundary moduleName="POS"><POSModule /></RouteErrorBoundary>} />
                  <Route path="/settings/*" element={<RouteErrorBoundary moduleName="Settings"><SettingsModule /></RouteErrorBoundary>} />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}