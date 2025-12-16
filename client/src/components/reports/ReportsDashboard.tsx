import { useState, useEffect } from "react";
import { ArrowRight, TrendingUp, TrendingDown, IndianRupee, Package, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";
import { reportsService } from "../../services/modules.service";

interface ReportsDashboardProps {
  onNavigate: (tab: string) => void;
}

interface KPIData {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: any;
  color: string;
  bg: string;
}

export function ReportsDashboard({ onNavigate }: ReportsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await reportsService.getDashboard();
        if (response.success && response.data) {
          const { kpis } = response.data;

          const formatCurrency = (value: number) => {
            if (value >= 100000) {
              return `₹${(value / 100000).toFixed(2)}L`;
            }
            return `₹${value.toLocaleString('en-IN')}`;
          };

          setKpiData([
            {
              title: "Total Sales",
              value: formatCurrency(kpis.totalSales),
              trend: `${kpis.salesTrend >= 0 ? '+' : ''}${kpis.salesTrend}%`,
              trendUp: kpis.salesTrend >= 0,
              icon: TrendingUp,
              color: "text-blue-600",
              bg: "bg-blue-100",
            },
            {
              title: "Total Purchases",
              value: formatCurrency(kpis.totalPurchases),
              trend: `${kpis.purchaseTrend >= 0 ? '+' : ''}${kpis.purchaseTrend}%`,
              trendUp: kpis.purchaseTrend <= 0, // For purchases, lower is better
              icon: ShoppingCart,
              color: "text-orange-600",
              bg: "bg-orange-100",
            },
            {
              title: "Net Profit",
              value: formatCurrency(kpis.netProfit),
              trend: `${kpis.profitTrend >= 0 ? '+' : ''}${kpis.profitTrend}%`,
              trendUp: kpis.profitTrend >= 0,
              icon: IndianRupee,
              color: "text-green-600",
              bg: "bg-green-100",
            },
            {
              title: "Inventory Value",
              value: formatCurrency(kpis.inventoryValue),
              trend: "Current",
              trendUp: true,
              icon: Package,
              color: "text-purple-600",
              bg: "bg-purple-100",
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const popularReports = [
    {
      title: "GSTR-1 Summary",
      description: "Monthly outward supplies summary for GST filing",
      category: "GST",
      link: "gst",
    },
    {
      title: "Sales by Customer",
      description: "Detailed breakdown of sales performance per customer",
      category: "Sales",
      link: "sales",
    },
    {
      title: "Stock Summary",
      description: "Current stock levels and valuation summary",
      category: "Inventory",
      link: "inventory",
    },
    {
      title: "Profit & Loss",
      description: "Net profit/loss statement for the selected period",
      category: "Financial",
      link: "financial",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-3 rounded-xl", kpi.bg)}>
                    <Icon className={cn("size-6", kpi.color)} />
                  </div>
                  <div className={cn("flex items-center text-sm font-medium", kpi.trendUp ? "text-green-600" : "text-red-600")}>
                    {kpi.trendUp ? <TrendingUp className="size-4 mr-1" /> : <TrendingDown className="size-4 mr-1" />}
                    {kpi.trend}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{kpi.value}</h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Popular Reports Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Popular Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popularReports.map((report, index) => (
            <div
              key={index}
              onClick={() => onNavigate(report.link)}
              className="group bg-white border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {report.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {report.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {report.description}
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <ArrowRight className="size-5 text-slate-400 group-hover:text-primary" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights / Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-muted-foreground">Revenue Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-muted-foreground">Expense Pie Chart Placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
