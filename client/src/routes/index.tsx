// Route Configuration
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lazy, Suspense } from 'react';

// Auth Pages - Keep these as direct imports (needed immediately)
import { LoginPage } from '../components/LoginPage';
import { RegisterPage } from '../components/RegisterPage';
import { OTPLogin } from '../components/OTPLogin';
import { ForgotPassword } from '../components/ForgotPassword';
import { ResetPassword } from '../components/ResetPassword';

// Main Layout - Keep direct import
// Main Layout
import { WorkbenchLayout as AppLayout } from '../components/layout/workbench/WorkbenchLayout';
import { BusinessOverview } from '../components/dashboard/BusinessOverview';

import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary';
import { hasPermission } from '../lib/permissions';

// Lazy-loaded Module Pages (code-split for performance)
// const Dashboard = lazy(() => import('../components/Dashboard').then(m => ({ default: m.Dashboard })));
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
const SettingsModule = lazy(() => import('../components/settings/SettingsModule'));

const POSModule = lazy(() => import('../components/pos/POSModule').then(m => ({ default: m.POSModule })));
const LogisticsTracker = lazy(() => import('../components/logistics/LogisticsTracker').then(m => ({ default: m.LogisticsTracker })));
const ChannelHub = lazy(() => import('../components/channels/ChannelHub').then(m => ({ default: m.ChannelHub })));
const OrderAggregator = lazy(() => import('../components/channels/OrderAggregator').then(m => ({ default: m.OrderAggregator })));
const ChannelSettings = lazy(() => import('../components/channels/ChannelSettings').then(m => ({ default: m.ChannelSettings })));
const InviteAcceptPage = lazy(() => import('../components/invite/InviteAcceptPage'));
const SetupWizard = lazy(() => import('../components/setup/SetupWizard').then(m => ({ default: m.SetupWizard })));
const UXDashboard = lazy(() => import('../components/admin/UXDashboard').then(m => ({ default: m.UXDashboard })));
const EscrowManager = lazy(() => import('../components/escrow/EscrowManager').then(m => ({ default: m.EscrowManager })));
const AssetModule = lazy(() => import('../components/assets/AssetModule').then(m => ({ default: m.AssetModule })));
const ProjectModule = lazy(() => import('../components/projects/ProjectModule').then(m => ({ default: m.ProjectModule })));
const SupportModule = lazy(() => import('../components/support/SupportModule').then(m => ({ default: m.SupportModule })));
const AdminDashboard = lazy(() => import('../modules/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AccountingDashboard = lazy(() => import('../modules/accounting/AccountingDashboard'));

// BharatFlow Page Templates
const StockroomPage = lazy(() => import('../pages/StockroomPage').then(m => ({ default: m.StockroomPage })));
const ModuleSetupPage = lazy(() => import('../pages/ModuleSetupPage').then(m => ({ default: m.ModuleSetupPage })));
const LedgerDetailPage = lazy(() => import('../pages/LedgerDetailPage').then(m => ({ default: m.LedgerDetailPage })));
const OrderPipelinePage = lazy(() => import('../pages/OrderPipelinePage').then(m => ({ default: m.OrderPipelinePage })));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
      <div className="flex items-center justify-center min-h-dvh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
      <div className="flex items-center justify-center min-h-dvh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Module Permission Guard
function ModuleRoute({ module, children }: { module: string, children: React.ReactNode }) {
  const { user } = useAuth();
  // Bypass if user not loaded yet (ProtectedRoute handles validation/loading)
  // If we rely on ProtectedRoute to ensure user exists.
  if (!user) return null;

  if (!hasPermission(user as any, module)) {
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
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
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
            <AppLayout>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/setup" element={<RouteErrorBoundary moduleName="Setup"><SetupWizard /></RouteErrorBoundary>} />
                  <Route path="/dashboard" element={<RouteErrorBoundary moduleName="Dashboard"><BusinessOverview /></RouteErrorBoundary>} />
                  <Route path="/quotations" element={<ModuleRoute module="sales"><RouteErrorBoundary moduleName="Quotations"><QuotationModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/sales/*" element={<ModuleRoute module="sales"><RouteErrorBoundary moduleName="Sales"><SalesModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/purchase/*" element={<ModuleRoute module="purchase"><RouteErrorBoundary moduleName="Purchase"><PurchaseModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/inventory/*" element={<ModuleRoute module="inventory"><RouteErrorBoundary moduleName="Inventory"><InventoryModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/parties/*" element={<ModuleRoute module="parties"><RouteErrorBoundary moduleName="Parties"><PartiesModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/expenses/*" element={<ModuleRoute module="expenses"><RouteErrorBoundary moduleName="Expenses"><ExpensesModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/hr/*" element={<ModuleRoute module="hr"><RouteErrorBoundary moduleName="HR"><HRModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/crm/*" element={<ModuleRoute module="crm"><RouteErrorBoundary moduleName="CRM"><CRMModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/production/*" element={<ModuleRoute module="production"><RouteErrorBoundary moduleName="Production"><ProductionModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/manufacturing/*" element={<ModuleRoute module="production"><RouteErrorBoundary moduleName="Manufacturing"><ProductionModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/logistics/*" element={<RouteErrorBoundary moduleName="Logistics"><LogisticsTracker /></RouteErrorBoundary>} />
                  <Route path="/barcode/*" element={<ModuleRoute module="barcode"><RouteErrorBoundary moduleName="Barcode"><BarcodeModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/documents/*" element={<ModuleRoute module="documents"><RouteErrorBoundary moduleName="Documents"><DocumentsModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/banking/*" element={<ModuleRoute module="banking"><RouteErrorBoundary moduleName="Payments"><BankingModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/gst/*" element={<ModuleRoute module="gst"><RouteErrorBoundary moduleName="GST"><GSTModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/analytics/*" element={<ModuleRoute module="analytics"><RouteErrorBoundary moduleName="Analytics"><AnalyticsModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/reports/*" element={<ModuleRoute module="reports"><RouteErrorBoundary moduleName="Reports"><ReportsModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/notifications/*" element={<RouteErrorBoundary moduleName="Notifications"><NotificationsModule /></RouteErrorBoundary>} />
                  {/* Messages module hidden for launch - redirect to dashboard */}
                  <Route path="/messages/*" element={<Navigate to="/dashboard" replace />} />

                  <Route path="/assets/*" element={<ModuleRoute module="assets"><RouteErrorBoundary moduleName="Assets"><AssetModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/projects/*" element={<ModuleRoute module="projects"><RouteErrorBoundary moduleName="Projects"><ProjectModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/support/*" element={<ModuleRoute module="support"><RouteErrorBoundary moduleName="Support"><SupportModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/pos/*" element={<RouteErrorBoundary moduleName="POS"><POSModule /></RouteErrorBoundary>} />
                  <Route path="/settings/*" element={<ModuleRoute module="settings"><RouteErrorBoundary moduleName="Settings"><SettingsModule /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/channel-hub" element={<ModuleRoute module="channel-hub"><RouteErrorBoundary moduleName="ChannelHub"><ChannelHub /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/channel-hub/orders" element={<ModuleRoute module="channel-hub"><RouteErrorBoundary moduleName="ChannelOrders"><OrderAggregator /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/admin" element={<ModuleRoute module="admin"><RouteErrorBoundary moduleName="Admin"><AdminDashboard /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/accounting/*" element={<ModuleRoute module="accounting"><RouteErrorBoundary moduleName="Accounting"><AccountingDashboard /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/settings/channels" element={<ModuleRoute module="settings"><RouteErrorBoundary moduleName="ChannelSettings"><ChannelSettings /></RouteErrorBoundary></ModuleRoute>} />
                  <Route path="/ux-dashboard" element={<RouteErrorBoundary moduleName="UXDashboard"><UXDashboard /></RouteErrorBoundary>} />
                  <Route path="/escrow" element={<ProtectedRoute><RouteErrorBoundary moduleName="Escrow"><EscrowManager /></RouteErrorBoundary></ProtectedRoute>} />


                  {/* BharatFlow Pages */}
                  <Route path="/stockroom" element={<RouteErrorBoundary moduleName="Stockroom"><StockroomPage /></RouteErrorBoundary>} />
                  <Route path="/module-setup" element={<RouteErrorBoundary moduleName="ModuleSetup"><ModuleSetupPage /></RouteErrorBoundary>} />
                  <Route path="/ledger" element={<RouteErrorBoundary moduleName="Ledger"><LedgerDetailPage /></RouteErrorBoundary>} />
                  <Route path="/order-pipeline" element={<RouteErrorBoundary moduleName="OrderPipeline"><OrderPipelinePage /></RouteErrorBoundary>} />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}