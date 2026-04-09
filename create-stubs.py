import os

stubs = {
    'hooks/useAccounting.ts': 'export function useVouchers(..._: any[]): any { return {}; }',
    'hooks/useBanking.ts': 'export function useBankingTransactions(..._: any[]): any { return {}; }\nexport function useBankingDashboard(..._: any[]): any { return {}; }',
    'hooks/useCRM.ts': 'export function useCRMDashboard(..._: any[]): any { return {}; }',
    'hooks/useExpenses.ts': 'export function useExpenses(..._: any[]): any { return {}; }\nexport function useDeleteExpense(..._: any[]): any { return {}; }\nexport function useApproveExpense(..._: any[]): any { return {}; }\nexport function useExpenseDashboard(..._: any[]): any { return {}; }\nexport function useMarkAsPaid(..._: any[]): any { return {}; }',
    'hooks/useFinancialYears.ts': 'export function useFYOptions(..._: any[]): any { return {}; }',
    'hooks/useGST.ts': 'export function useGSTDashboard(..._: any[]): any { return {}; }',
    'hooks/useHR.ts': 'export function useHRDashboard(..._: any[]): any { return {}; }\nexport function useEmployees(..._: any[]): any { return {}; }\nexport function useDeleteEmployee(..._: any[]): any { return {}; }',
    'hooks/useProduction.ts': 'export function useProductionDashboard(..._: any[]): any { return {}; }',
    'hooks/useReports.ts': 'export function useReportsDashboard(..._: any[]): any { return {}; }',
    'hooks/usePersonaView.ts': 'export function usePersonaView(..._: any[]): any { return {}; }\nexport type PersonaType = string;',
    'hooks/useKeyboardShortcuts.ts': 'export function useKeyboardShortcuts(..._: any[]): any { return {}; }',
    'hooks/useScreenSize.ts': 'export function useScreenSize(..._: any[]): any { return {}; }',
    'hooks/index.ts': 'export function useAssets(..._: any[]): any { return {}; }\nexport function useManufacturing(..._: any[]): any { return {}; }',
    'constants/roles.ts': "export type Role = 'admin' | 'manager' | 'staff' | 'viewer';\nexport const ROLES: Role[] = ['admin', 'manager', 'staff', 'viewer'];",
    'constants/api-endpoints.ts': "export const CONTENT_TYPES = {\n  JSON: 'application/json',\n  FORM: 'application/x-www-form-urlencoded',\n} as const;",
    'constants/plans.ts': "export type Plan = 'free' | 'starter' | 'professional' | 'enterprise';\nexport const PLANS: Plan[] = ['free', 'starter', 'professional', 'enterprise'];",
    'constants/indianStates.ts': "export const INDIAN_STATES = [\n  { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },\n  { code: '03', name: 'Punjab' }, { code: '06', name: 'Haryana' },\n  { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },\n  { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' },\n  { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },\n  { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },\n  { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' },\n  { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },\n  { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },\n  { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' },\n  { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },\n  { code: '27', name: 'Maharashtra' }, { code: '29', name: 'Karnataka' },\n  { code: '30', name: 'Goa' }, { code: '31', name: 'Lakshadweep' },\n  { code: '32', name: 'Kerala' }, { code: '33', name: 'Tamil Nadu' },\n  { code: '34', name: 'Puducherry' }, { code: '35', name: 'Andaman & Nicobar' },\n  { code: '36', name: 'Telangana' }, { code: '37', name: 'Andhra Pradesh' },\n];\nexport function getStateCodeFromGSTIN(gstin: string): string {\n  return gstin?.slice(0, 2) || '';\n}\nexport function isInterStateTransaction(gstin1: string, gstin2: string): boolean {\n  return getStateCodeFromGSTIN(gstin1) !== getStateCodeFromGSTIN(gstin2);\n}",
    'constants/crm.ts': 'export {};',
    'constants/accounting.ts': 'export {};',
    'config/business.config.ts': 'export const OUTSTANDING_THRESHOLDS = {\n  low: 30,\n  medium: 60,\n  high: 90,\n  critical: 120,\n};',
    'lib/exportUtils.ts': "export function exportToPDF(_data: any[], _filename: string): void {}\nexport function exportToExcel(_data: any[], _filename: string): void {}\nexport function exportToCSV(_data: any[], _filename: string): void {}\nexport function formatCurrency(amount: number, currency = 'INR'): string {\n  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);\n}\nexport function formatDate(date: string | Date): string {\n  return new Date(date).toLocaleDateString('en-IN');\n}",
    'utils/numberToWords.ts': "const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',\n  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];\nconst tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];\nfunction convert(n: number): string {\n  if (n < 20) return ones[n];\n  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');\n  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');\n  if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');\n  if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');\n  return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');\n}\nexport function numberToWords(amount: number): string {\n  if (amount === 0) return 'Zero';\n  return convert(Math.round(amount)) + ' Only';\n}",
    'services/gst.service.ts': 'export const gstService = {\n  async getGSTRReturns(_params: any) { return []; },\n  async computeGSTLiability(_params: any) { return {}; },\n  async getInputTaxCredit(_params: any) { return {}; },\n};',
    'services/masterData.service.ts': "export type BusinessType = 'manufacturer' | 'trader' | 'service' | 'retail';\nexport const masterDataService = {\n  async getBusinessTypes() { return [] as BusinessType[]; },\n  async getMasterData(_key: string) { return []; },\n};",
    'components/layout/AuthLayout.tsx': 'import { ReactNode } from \'react\';\nexport function AuthLayout({ children }: { children: ReactNode }) {\n  return <div className="min-h-screen flex items-center justify-center bg-background">{children}</div>;\n}',
    'components/layout/PageContainer.tsx': 'import { ReactNode } from \'react\';\nexport function PageContainer({ children, className = \'\' }: { children: ReactNode; className?: string }) {\n  return <div className={`page-container-constrained ${className}`}>{children}</div>;\n}',
    'components/layout/LayoutDiagnosticProvider.tsx': 'import { ReactNode } from \'react\';\nexport function LayoutDiagnosticProvider({ children }: { children: ReactNode }) { return <>{children}</>; }',
    'components/layout/workbench/WorkbenchLayout.tsx': 'import { ReactNode } from \'react\';\nexport function WorkbenchLayout({ children }: { children: ReactNode }) {\n  return <div className="flex h-screen overflow-hidden">{children}</div>;\n}',
    'components/layout/ResponsiveGrid.tsx': 'import { ReactNode } from \'react\';\nexport function ResponsiveGrid({ children, className = \'\' }: { children: ReactNode; className?: string }) {\n  return <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>{children}</div>;\n}',
    'components/layout/ModuleLayout.tsx': 'import { ReactNode } from \'react\';\nexport function ModuleLayout({ children }: { children: ReactNode }) { return <div className="module-layout">{children}</div>; }\nexport function ModuleHeader({ children }: { children: ReactNode }) { return <div className="module-header flex items-center justify-between py-4">{children}</div>; }\nexport function ModuleContent({ children }: { children: ReactNode }) { return <div className="module-content flex-1 overflow-auto">{children}</div>; }\nexport function ModuleControls({ children }: { children: ReactNode }) { return <div className="flex items-center gap-2">{children}</div>; }\nexport function ControlGroup({ children }: { children: ReactNode }) { return <div className="flex items-center gap-1">{children}</div>; }\nexport function FilterBar({ children }: { children: ReactNode }) { return <div className="flex items-center gap-2 py-2">{children}</div>; }',
    'components/common/Logo.tsx': 'export function Logo({ className = \'\' }: { className?: string }) {\n  return <span className={`font-bold text-brand-primary text-xl ${className}`}>BharatFlows</span>;\n}',
    'components/Sidebar.tsx': 'import { ReactNode } from \'react\';\nexport function Sidebar({ children }: { children?: ReactNode }) { return <aside className="w-64 h-full bg-sidebar-bg border-r">{children}</aside>; }',
    'components/CompanySelector.tsx': 'export function CompanySelector(_props: any) { return null; }',
    'components/ResetPassword.tsx': 'export function ResetPassword() { return <div className="flex items-center justify-center min-h-screen"><p>Reset Password</p></div>; }',
    'components/DashboardCustomizer.tsx': 'export type DashboardPreferences = Record<string, boolean>;\nexport const defaultPreferences: DashboardPreferences = {};\nexport function DashboardCustomizer(_props: any) { return null; }',
    'components/ui/data-table.tsx': 'import { ReactNode } from \'react\';\nexport function DataTable({ data = [], columns = [], ..._ }: any) {\n  return <div className="rounded-md border"><table className="w-full"><tbody>{data.map((_r: any, i: number) => <tr key={i}></tr>)}</tbody></table></div>;\n}',
    'components/ui/stats-card.tsx': 'export function StatsCard({ title, value, ..._ }: any) {\n  return <div className="card-base p-4"><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p></div>;\n}\nexport function StatsCardSkeleton() { return <div className="card-base p-4 animate-pulse h-24" />; }',
    'components/ui/ListFilters.tsx': 'export function ListFilters(_props: any) { return <div className="flex gap-2 py-2" />; }',
    'components/ui/searchable-select.tsx': 'export function SearchableSelect({ placeholder = \'Select...\', onChange, ..._ }: any) {\n  return <select className="input-base" onChange={(e) => onChange?.(e.target.value)}><option value="">{placeholder}</option></select>;\n}',
    'components/ui/AdaptiveTable.tsx': 'export function AdaptiveTable({ data = [], columns = [], ..._ }: any) {\n  return <div className="rounded-md border overflow-auto"><table className="w-full text-sm"><thead><tr>{columns.map((c: any, i: number) => <th key={i} className="p-2 text-left">{c.header || c.accessorKey}</th>)}</tr></thead><tbody>{data.map((_r: any, i: number) => <tr key={i} className="border-t" />)}</tbody></table></div>;\n}',
    'components/ui/command-palette.tsx': 'import { useState } from \'react\';\nexport function CommandPalette({ open, onClose }: { open?: boolean; onClose?: () => void }) {\n  if (!open) return null;\n  return <div className="fixed inset-0 z-modal bg-black/50 flex items-start justify-center pt-32" onClick={onClose}><div className="bg-card rounded-xl shadow-xl w-full max-w-lg p-4" onClick={e => e.stopPropagation()}><input className="input-base" placeholder="Type a command..." autoFocus /></div></div>;\n}',
    'components/calendar/CalendarDrawer.tsx': 'export function CalendarDrawer({ open, onClose }: any) { return null; }',
    'components/system/index.ts': 'export function ConfirmActionDialog(_props: any) { return null; }',
    'components/system/PageLayout.tsx': 'import { ReactNode } from \'react\';\nexport function PageLayout({ children, title }: { children: ReactNode; title?: string }) {\n  return <div className="flex flex-col h-full"><div className="p-6">{title && <h1 className="text-2xl font-bold mb-4">{title}</h1>}{children}</div></div>;\n}',
    'components/system/FormSection.tsx': 'import { ReactNode } from \'react\';\nexport default function FormSection({ children, title }: { children: ReactNode; title?: string }) {\n  return <div className="space-y-4"><h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>{children}</div>;\n}',
    'components/dashboard/BusinessOverview.tsx': 'export function BusinessOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Business Overview</h2></div>; }',
    'components/dashboard/AppBazaarSheet.tsx': 'export function AppBazaarSheet(_props: any) { return null; }',
    'components/crm/CRMOverview.tsx': 'export function CRMOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">CRM</h2></div>; }',
    'components/gst/GSTOverview.tsx': 'export function GSTOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">GST</h2></div>; }',
    'components/expenses/ExpensesOverview.tsx': 'export function ExpensesOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Expenses</h2></div>; }',
    'components/reports/ReportsOverview.tsx': 'export function ReportsOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Reports</h2></div>; }',
    'components/banking/BankingOverview.tsx': 'export function BankingOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Banking</h2></div>; }',
    'components/inventory/InventoryOverview.tsx': 'export function InventoryOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Inventory</h2></div>; }',
    'components/parties/PartiesOverview.tsx': 'export function PartiesOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Parties</h2></div>; }',
    'components/production/ProductionOverview.tsx': 'export function ProductionOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Production</h2></div>; }',
    'components/accounting/AccountingOverview.tsx': 'export function AccountingOverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Accounting</h2></div>; }',
    'components/hr/HROverview.tsx': 'export function HROverview(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">HR</h2></div>; }',
    'components/sales/SalesTicker.tsx': 'export function SalesTicker(_props: any) { return <div className="card-base p-6"><h2 className="text-lg font-semibold">Sales Ticker</h2></div>; }',
    'components/accounting/JournalEntry.tsx': 'export function JournalEntry(_props: any) { return <div className="p-4">Journal Entry</div>; }',
    'components/accounting/CostCenterManagement.tsx': 'export function CostCenterManagement(_props: any) { return <div className="p-4">Cost Centers</div>; }',
    'components/purchase/DebitNoteList.tsx': 'export function DebitNoteList(_props: any) { return <div className="p-4">DebitNoteList</div>; }',
    'components/purchase/CreateDebitNote.tsx': 'export function CreateDebitNote(_props: any) { return <div className="p-4">CreateDebitNote</div>; }',
    'components/purchase/ViewDebitNote.tsx': 'export function ViewDebitNote(_props: any) { return <div className="p-4">ViewDebitNote</div>; }',
    'components/inventory/WastageTracking.tsx': 'export function WastageTracking(_props: any) { return <div className="p-4">WastageTracking</div>; }',
    'components/inventory/CreateStockAdjustment.tsx': 'export function CreateStockAdjustment(_props: any) { return <div className="p-4">CreateStockAdjustment</div>; }',
    'components/inventory/ViewStockAdjustment.tsx': 'export function ViewStockAdjustment(_props: any) { return <div className="p-4">ViewStockAdjustment</div>; }',
    'components/sales/CreateCreditNote.tsx': 'export function CreateCreditNote(_props: any) { return <div className="p-4">Create Credit Note</div>; }',
    'components/settings/TwoFactorSetup.tsx': 'export function TwoFactorSetup(_props: any) { return <div className="p-4">TwoFactorSetup</div>; }',
    'components/settings/WorkflowBuilder.tsx': 'export function WorkflowBuilder(_props: any) { return <div className="p-4">WorkflowBuilder</div>; }',
    'components/settings/AuditLogViewer.tsx': 'export function AuditLogViewer(_props: any) { return <div className="p-4">AuditLogViewer</div>; }',
    'components/settings/GeneralSettings.tsx': 'export function GeneralSettings(_props: any) { return <div className="p-4">GeneralSettings</div>; }',
    'components/settings/DataIntegrityDashboard.tsx': 'export function DataIntegrityDashboard(_props: any) { return <div className="p-4">DataIntegrityDashboard</div>; }',
    'components/settings/BranchSettings.tsx': 'export function BranchSettings(_props: any) { return <div className="p-4">BranchSettings</div>; }',
    'components/settings/FinancialYearSettings.tsx': 'export function FinancialYearSettings(_props: any) { return <div className="p-4">FinancialYearSettings</div>; }',
    'components/settings/ApprovalQueue.tsx': 'export function ApprovalQueue(_props: any) { return <div className="p-4">ApprovalQueue</div>; }',
    'components/settings/SubscriptionPlans.tsx': 'export function SubscriptionPlans(_props: any) { return <div className="p-4">SubscriptionPlans</div>; }',
    'components/settings/PaymentGatewaySettings.tsx': 'export function PaymentGatewaySettings(_props: any) { return <div className="p-4">PaymentGatewaySettings</div>; }',
    'components/settings/SettingsSidebar.tsx': (
        'import { ReactNode } from \'react\';\n'
        'export type SettingsPage = string;\n'
        'export const SETTINGS_NAV: Array<{ id: SettingsPage; label: string; icon?: string }> = [\n'
        '  { id: \'general\', label: \'General\' },\n'
        '  { id: \'branch\', label: \'Branches\' },\n'
        '  { id: \'fy\', label: \'Financial Year\' },\n'
        '  { id: \'users\', label: \'Users & Roles\' },\n'
        '  { id: \'subscription\', label: \'Subscription\' },\n'
        '  { id: \'payment-gateway\', label: \'Payment Gateway\' },\n'
        '];\n'
        'export function SettingsSidebar({ active, onSelect }: { active?: SettingsPage; onSelect?: (p: SettingsPage) => void }) {\n'
        '  return <nav className="w-56 border-r p-4 space-y-1">'
        '{SETTINGS_NAV.map(n => <button key={n.id} className={`w-full text-left px-3 py-2 rounded-md text-sm ${active === n.id ? \'bg-accent text-accent-foreground\' : \'hover:bg-accent/50\'}`} onClick={() => onSelect?.(n.id)}>{n.label}</button>)}'
        '</nav>;\n'
        '}'
    ),
    'components/hr/dashboard/PaymentMethodCard.tsx': 'export function PaymentMethodCard(_props: any) { return <div className="card-base p-4">PaymentMethod</div>; }',
    'components/hr/dashboard/UpcomingEventsCard.tsx': 'export function UpcomingEventsCard(_props: any) { return <div className="card-base p-4">UpcomingEvents</div>; }',
    'components/hr/dashboard/TodayScheduleCard.tsx': 'export function TodayScheduleCard(_props: any) { return <div className="card-base p-4">TodaySchedule</div>; }',
    'components/hr/dashboard/EmployeeRequestCard.tsx': 'export function EmployeeRequestCard(_props: any) { return <div className="card-base p-4">EmployeeRequest</div>; }',
    'components/parties/TrustScoreBadge.tsx': (
        'export function TrustScoreBadge({ score = 0 }: { score?: number }) {\n'
        '  const color = score >= 80 ? \'text-green-600\' : score >= 50 ? \'text-amber-600\' : \'text-red-600\';\n'
        '  return <span className={`text-xs font-semibold ${color}`}>{score}%</span>;\n'
        '}'
    ),
    'components/pos/terminal/index.tsx': (
        'import { ReactNode } from \'react\';\n'
        'export function POSHeader(_props: any) { return <div className="h-16 border-b flex items-center px-4 font-semibold">POS Terminal</div>; }\n'
        'export function HeldOrdersDialog(_props: any) { return null; }\n'
        'export function ProductGrid(_props: any) { return <div className="grid grid-cols-3 gap-2 p-4" />; }\n'
        'export function CartSection(_props: any) { return <div className="w-80 border-l h-full p-4" />; }'
    ),
    # Pages (missing from repo)
    'pages/StockroomPage.tsx': 'export function StockroomPage(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Stockroom</h1></div>; }',
    'pages/ModuleSetupPage.tsx': 'export function ModuleSetupPage(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Module Setup</h1></div>; }',
    'pages/LedgerDetailPage.tsx': 'export function LedgerDetailPage(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Ledger Detail</h1></div>; }',
    'pages/OrderPipelinePage.tsx': 'export function OrderPipelinePage(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Order Pipeline</h1></div>; }',
    # Modules (missing from repo)
    'modules/admin/AdminDashboard.tsx': 'export function AdminDashboard(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Admin Dashboard</h1></div>; }',
    'modules/accounting/AccountingDashboard.tsx': 'export function AccountingDashboard(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Accounting Dashboard</h1></div>; }\nexport default AccountingDashboard;',
    # Missing components imported from routes/index.tsx
    'components/logistics/LogisticsTracker.tsx': 'export function LogisticsTracker(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Logistics</h1></div>; }',
    'components/channels/ChannelHub.tsx': 'export function ChannelHub(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Channel Hub</h1></div>; }',
    'components/channels/OrderAggregator.tsx': 'export function OrderAggregator(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Order Aggregator</h1></div>; }',
    'components/channels/ChannelSettings.tsx': 'export function ChannelSettings(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Channel Settings</h1></div>; }',
    'components/setup/SetupWizard.tsx': 'export function SetupWizard(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Setup Wizard</h1></div>; }',
    'components/admin/UXDashboard.tsx': 'export function UXDashboard(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">UX Dashboard</h1></div>; }',
    'components/escrow/EscrowManager.tsx': 'export function EscrowManager(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Escrow Manager</h1></div>; }',
    'components/assets/AssetModule.tsx': 'export function AssetModule(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Assets</h1></div>; }',
    'components/projects/ProjectModule.tsx': 'export function ProjectModule(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Projects</h1></div>; }',
    'components/support/SupportModule.tsx': 'export function SupportModule(_props: any) { return <div className="p-6"><h1 className="text-2xl font-bold">Support</h1></div>; }',
}

src = 'client/src'
for rel_path, content in stubs.items():
    full_path = os.path.join(src, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print('Created:', full_path)
print('Done! Created', len(stubs), 'files')
