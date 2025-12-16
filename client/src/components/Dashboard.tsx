import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { KPICards } from "./KPICards";
import { QuickActions } from "./QuickActions";
import { RecentTransactions } from "./RecentTransactions";
import { SalesChart } from "./SalesChart";
import { dashboardService } from "../services/modules.service";
import { Loader2 } from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout: _onLogout }: DashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts and Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <SalesChart />
        </div>

        {/* Top Selling Products Card */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Top Selling Products</h3>
          <div className="space-y-5">
            {stats?.topProducts?.length > 0 ? (
              stats.topProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.sales} units sold
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    ₹{product.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">No sales data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />

      {/* Bottom Grid - Stock Alerts & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Low Stock Alerts</h3>
          <div className="space-y-3">
            {stats?.lowStock?.length > 0 ? (
              stats.lowStock.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-rose-50/50 rounded-lg border border-rose-100 hover:bg-rose-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: <span className="font-medium text-rose-600">{item.current} {item.unit}</span> • Min: {item.minimum} {item.unit}
                    </p>
                  </div>
                  <div className="text-rose-500 bg-white p-1.5 rounded-md shadow-sm">⚠️</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-secondary/20 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground text-sm">No low stock items.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Pending Tasks</h3>
          <div className="space-y-3">
            {stats?.pendingTasks?.length > 0 ? (
              stats.pendingTasks.map((task: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-amber-50/50 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground flex-1">{task.task}</p>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full ml-3 border border-amber-200">
                    {task.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-secondary/20 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground text-sm">No pending tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
