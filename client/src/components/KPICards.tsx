import { TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Package, Users, Wallet, Landmark, Activity } from "lucide-react";
import { SmartCard } from "@/components/ui/SmartCard";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { dashboardService } from "../services/modules.service";
import { PersonaType } from "../hooks/usePersonaView";
import { Skeleton } from "./ui/skeleton";

interface KPI {
  id: string;
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export function KPICards({ persona, healthScore }: { persona?: PersonaType, healthScore?: number }) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await dashboardService.getKPIs();
        const data = response.data?.kpis || response.data;

        // Transform API data to KPI format
        if (data) {
          const transformedData: KPI[] = [
            {
              id: "sales",
              title: "Total Sales",
              value: `₹${(data.sales || 0).toLocaleString('en-IN')}`,
              change: data.salesChange || 0,
              changeLabel: "vs last month",
              icon: IndianRupee,
              color: "text-emerald-600",
              bgColor: "bg-emerald-50",
            },
            {
              id: "purchases",
              title: "Total Purchases",
              value: `₹${(data.purchases || 0).toLocaleString('en-IN')}`,
              change: data.purchasesChange || 0,
              changeLabel: "vs last month",
              icon: ShoppingCart,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              id: "receivables",
              title: "Receivables",
              value: `₹${(data.receivables || 0).toLocaleString('en-IN')}`,
              change: 0,
              changeLabel: "Current",
              icon: Users,
              color: "text-orange-600",
              bgColor: "bg-orange-50",
            },
            {
              id: "payables",
              title: "Payables",
              value: `₹${(data.payables || 0).toLocaleString('en-IN')}`,
              change: 0,
              changeLabel: "Current",
              icon: Package,
              color: "text-purple-600",
              bgColor: "bg-purple-50",
            },
            {
              id: "cash",
              title: "Cash Balance",
              value: `₹${(data.cash || 0).toLocaleString('en-IN')}`,
              change: 0,
              changeLabel: "Current",
              icon: Wallet,
              color: "text-teal-600",
              bgColor: "bg-teal-50",
            },
            {
              id: "bank",
              title: "Bank Balance",
              value: `₹${(data.bank || 0).toLocaleString('en-IN')}`,
              change: 0,
              changeLabel: "Current",
              icon: Landmark,
              color: "text-indigo-600",
              bgColor: "bg-indigo-50",
            },
          ];

          // Filter/Reorder based on persona
          let filteredKpis = transformedData;
          if (persona === 'OWNER') {
            filteredKpis = transformedData.filter(k => ['sales', 'receivables', 'cash', 'bank'].includes(k.id));
          } else if (persona === 'ACCOUNTANT') {
            filteredKpis = transformedData.filter(k => ['receivables', 'payables', 'cash', 'bank'].includes(k.id));
          } else if (persona === 'MANAGER') {
            filteredKpis = transformedData.filter(k => ['sales', 'purchases', 'payables'].includes(k.id));
          } else if (persona === 'STAFF') {
            filteredKpis = transformedData.filter(k => ['sales', 'receivables'].includes(k.id));
          }

          // Add Health Score for Owner/Manager if available
          if (healthScore !== undefined && (persona === 'OWNER' || persona === 'MANAGER' || !persona)) {
            filteredKpis.unshift({
              id: "health",
              title: "Business Health",
              value: `${healthScore}/100`,
              change: 0,
              changeLabel: "Overall Score",
              icon: Activity,
              color: healthScore > 80 ? "text-emerald-600" : healthScore > 50 ? "text-amber-600" : "text-rose-600",
              bgColor: healthScore > 80 ? "bg-emerald-50" : healthScore > 50 ? "bg-amber-50" : "bg-rose-50",
            });
          }

          setKpis(filteredKpis);
        }
      } catch (error) {
        console.error("Failed to fetch KPIs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SmartCard key={i} className="h-40">
            <div className="space-y-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </SmartCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        const isPositive = kpi.change >= 0; // Re-added for consistency with original logic, though 'trend' is now used.
        const trend = kpi.change >= 0 ? 'up' : 'down'; // Derive trend from change

        return (
          <SmartCard
            key={idx}
            density="compact"
            className="group hover:border-primary/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between gap-3 overflow-hidden">
              <div className="flex-1 space-y-1.5 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {kpi.title} {/* Changed from kpi.label to kpi.title */}
                </p>
                <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 truncate">
                  {!kpi.value && kpi.value !== '₹0' ? <span className="text-muted-foreground">—</span> : kpi.value} {/* Adjusted condition for '₹0' */}
                </h2>
                {kpi.change !== 0 && ( // Only show trend if change is not 0
                  <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0",
                      trend === 'up' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(kpi.change)}% {/* Display absolute value of change */}
                    </span>
                    <span className="text-2xs font-medium text-muted-foreground truncate">
                      {kpi.changeLabel} {/* Changed from 'vs last mth' to kpi.changeLabel */}
                    </span>
                  </div>
                )}
              </div>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                kpi.color.replace('text-', 'bg-') + "/10",
                kpi.color
              )}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </SmartCard>
        );
      })}
    </div>
  );
}