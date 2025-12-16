import { TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Package, Users } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

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



import { useState, useEffect } from "react";
import { dashboardService } from "../services/modules.service";

export function KPICards() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {

        const response = await dashboardService.getKPIs();
        // The API returns { kpis: { ... }, topProducts: ... }
        // We need to extract the kpis object
        const data = response.data?.kpis || response.data;

        // Transform API data to KPI format if needed, or assume API returns correct format
        // For now, mapping manual fields if API returns raw numbers
        if (data) {
          const transformedData: KPI[] = [
            {
              id: "revenue",
              title: "Total Revenue",
              value: `₹${(data.revenue || 0).toLocaleString('en-IN')}`,
              change: data.revenueChange || 0,
              changeLabel: "vs last month",
              icon: IndianRupee,
              color: "text-info",
              bgColor: "bg-info-light",
            },
            {
              id: "sales",
              title: "Sales",
              value: `₹${(data.sales || 0).toLocaleString('en-IN')}`,
              change: data.salesChange || 0,
              changeLabel: "vs last month",
              icon: ShoppingCart,
              color: "text-success",
              bgColor: "bg-success-light",
            },
            {
              id: "purchases",
              title: "Purchases",
              value: `₹${(data.purchases || 0).toLocaleString('en-IN')}`,
              change: data.purchasesChange || 0,
              changeLabel: "vs last month",
              icon: Package,
              color: "text-orange",
              bgColor: "bg-orange-light",
            },
            {
              id: "parties",
              title: "Active Parties",
              value: (data.activeParties || 0).toString(),
              change: data.partiesChange || 0,
              changeLabel: "vs last month",
              icon: Users,
              color: "text-purple",
              bgColor: "bg-purple-light",
            },
          ];
          setKpis(transformedData);
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
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="h-32 animate-pulse bg-secondary/50 border-0 rounded-xl" />
      ))}
    </div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isPositive = kpi.change >= 0;

        return (
          <Card key={kpi.id} className="hover:shadow-md transition-all duration-300 border-border/50 shadow-sm bg-card rounded-xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-lg transition-colors group-hover:bg-primary/5", kpi.bgColor.replace('/10', '/5'))}>
                  <Icon className={cn("size-5", kpi.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  isPositive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                )}>
                  {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  <span>{Math.abs(kpi.change)}%</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</h2>
                <p className="text-sm text-muted-foreground font-medium mt-1">{kpi.title}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}