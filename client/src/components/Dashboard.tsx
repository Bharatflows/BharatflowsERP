import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KPICards } from "./KPICards";
import { QuickActions } from "./QuickActions";
import { RecentTransactions } from "./RecentTransactions";
import { SalesChart } from "./SalesChart";
import { dashboardService } from "../services/modules.service";
import { Loader2, Settings2, TrendingUp, AlertTriangle, CheckCircle2, Package, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { SmartCard } from "@/components/ui/SmartCard";
import { DashboardCustomizer, defaultPreferences, DashboardPreferences } from "./DashboardCustomizer";
import { AppBazaarSheet } from "./dashboard/AppBazaarSheet";
import { usePersonaView } from "../hooks/usePersonaView";
import { cn } from "../lib/utils";
import { ResponsiveGrid } from "./layout/ResponsiveGrid";

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout: _onLogout }: DashboardProps) {
  const { user } = useAuth();
  const persona = usePersonaView();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [appBazaarOpen, setAppBazaarOpen] = useState(false);

  const prefs: DashboardPreferences = user?.preferences?.dashboard || defaultPreferences;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getStats();
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="size-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Welcome Section */}
      {/* Welcome Header */}
      {/* Command Center Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-text-main tracking-tight flex items-center gap-2">
            {getGreeting()}, {user?.name?.split(' ')[0]} <span className="animate-wave inline-block origin-[70%_70%] text-xl">👋</span>
          </h1>
          <p className="text-text-muted text-base font-medium mt-2 truncate">
            {persona.type === 'OWNER' && "Here's your strategic business overview."}
            {persona.type === 'ACCOUNTANT' && "Focusing on your financial compliance."}
            {persona.type === 'MANAGER' && "Tracking operations performance."}
            {(persona.type === 'STAFF' || persona.type === 'AUDITOR') && "Your daily business snapshot."}
          </p>
        </div>

        {/* Compact Quick Actions Toolbar */}
        {prefs.quickActions && (
          <div className="flex-1 w-full xl:w-auto xl:max-w-2xl bg-white dark:bg-card-dark rounded-2xl p-1.5 shadow-sm border border-border-light dark:border-white/5">
            <QuickActions />
          </div>
        )}
      </div>

      {/* Main Command Grid (Adaptive) */}
      <ResponsiveGrid variant="details" className="gap-8">

        {/* KPI Row - Full Width */}
        <div className="col-span-full">
          {prefs.kpiCards && <KPICards persona={persona.type} healthScore={stats?.businessHealthScore} />}
        </div>

        {/* Charts & Analytics - Main Viewport */}
        {prefs.salesChart && (
          <div className="col-span-1 lg:col-span-2">
            <SalesChart />
          </div>
        )}

        {/* Top Products / Insights - Side Panel */}
        {prefs.topProducts && (
          <div className="col-span-1 h-full">
            <SmartCard title="Top Movers" className="h-full">
              <div className="space-y-1 pr-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {stats?.topProducts?.length > 0 ? (
                  stats.topProducts.map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between group p-3 hover:bg-background-light dark:hover:bg-white/5 rounded-xl transition-all cursor-default relative overflow-hidden">
                      {/* Hover Progress Bar Effect */}
                      <div className="absolute left-0 top-0 bottom-0 bg-primary-50 dark:bg-primary-900/20 w-0 group-hover:w-full transition-all duration-500 ease-out -z-10" />

                      <div className="flex-1 min-w-0 z-10">
                        <p className="text-sm font-semibold text-text-main group-hover:text-primary-600 transition-colors truncate">{product.name}</p>
                        <p className="text-xs text-text-muted">
                          {product.sales} units <span className="text-text-muted-light">•</span> <span className="font-medium text-emerald-600">High Demand</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end z-10 pl-3">
                        <span className="text-xs font-mono font-bold text-text-main">
                          ₹{product.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center opacity-60">
                    <Package className="size-8 mb-2 text-text-muted-light" />
                    <p className="text-xs text-text-muted">No market data available.</p>
                  </div>
                )}
              </div>
            </SmartCard>
          </div>
        )}


        {/* Row 2: Recent Transactions (Main) & Alerts (Side) */}
        {/* Recent Transactions - Main Viewport */}
        {prefs.recentTransactions && (
          <div className="col-span-1 lg:col-span-2">
            <RecentTransactions />
          </div>
        )}

        {/* Side Panel Stack: Alerts & Tasks */}
        <div className="col-span-1 space-y-6">
          {/* Low Stock Alerts */}
          {prefs.lowStock && (
            <SmartCard
              title="Inventory Alerts"
              className="border-l-4 border-l-rose-500"
              action={
                <Button variant="ghost" size="sm" className="h-6 text-xs text-rose-600 hover:bg-rose-50">
                  View All
                </Button>
              }
            >
              <div className="space-y-3">
                {stats?.lowStock?.length > 0 ? (
                  stats.lowStock.slice(0, 3).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-light dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="p-2 bg-rose-50 rounded-lg text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                        <AlertTriangle className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main truncate group-hover:text-rose-600 transition-colors">{item.name}</p>
                        <p className="text-xs text-text-muted">
                          {item.current} {item.unit} left <span className="text-rose-500">(Min: {item.minimum})</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs text-text-muted">Stock levels healthy</p>
                  </div>
                )}
              </div>
            </SmartCard>
          )}

          {/* Pending Tasks */}
          {prefs.pendingTasks && (
            <SmartCard title="Pending Tasks">
              <div className="space-y-2">
                {stats?.pendingTasks?.length > 0 ? (
                  stats.pendingTasks.map((task: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border-light hover:border-primary-200 transition-all cursor-pointer bg-white dark:bg-card-dark"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <p className="text-sm font-medium text-text-main">{task.task}</p>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded">
                        {task.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted text-center py-4">No pending tasks</p>
                )}
              </div>
            </SmartCard>
          )}
          {/* Empty Slot - Pin a new App */}
          <div
            onClick={() => setAppBazaarOpen(true)}
            className="col-span-1 border-2 border-dashed border-border dark:border-white/10 rounded-2xl flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors group"
          >
            <div className="p-3 bg-muted dark:bg-white/5 rounded-full mb-3 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
              <Plus className="size-6 text-muted-foreground group-hover:text-primary-600 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-foreground dark:text-muted-foreground group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">Pin a new App</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Browse Modules</p>
          </div>
        </div>
      </ResponsiveGrid>

      <DashboardCustomizer open={customizerOpen} onOpenChange={setCustomizerOpen} />

      <AppBazaarSheet
        open={appBazaarOpen}
        onOpenChange={setAppBazaarOpen}
        recommendations={stats?.appRecommendations || []}
      />
    </div>
  );
}
