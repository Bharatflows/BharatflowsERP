import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";
import { reportsService } from "../../services/modules.service";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { chartColors } from "@/lib/chartColors";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

interface PLData {
  period: { startDate: string; endDate: string };
  revenue: { totalSales: number; taxCollected: number; netRevenue: number };
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: { total: number; breakdown: Record<string, number> };
  operatingProfit: number;
  netProfit: number;
  profitMargin: number;
}

export function ProfitLossAnalysis() {
  const [loading, setLoading] = useState(true);
  const [plData, setPlData] = useState<PLData | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const fetchPLData = async () => {
    setLoading(true);
    try {
      // Fetch current month P&L
      const now = new Date();
      const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]; // Start of year
      const endDate = now.toISOString().split('T')[0];

      const [pnlResponse, trendsResponse] = await Promise.all([
        reportsService.getProfitLoss({ startDate, endDate }),
        reportsService.getProfitLossTrends()
      ]);

      if (pnlResponse.success && pnlResponse.data) {
        setPlData(pnlResponse.data);
      }

      if (trendsResponse.success && trendsResponse.data) {
        setMonthlyData(trendsResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch P&L data:", error);
      toast.error("Failed to load Profit & Loss data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MIcon name="autorenew" className="text-[32px] animate-spin text-primary" />
      </div>
    );
  }

  if (!plData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <p>No data available</p>
        <Button onClick={fetchPLData} variant="outline" className="mt-4">
          <RefreshCw className="size-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const currentMonth = monthlyData[monthlyData.length - 1] || { revenue: 0, cogs: 0, expenses: 0, profit: 0 };
  const prevMonth = monthlyData[monthlyData.length - 2] || { revenue: 1, profit: 1 }; // Default to 1 to avoid division by zero

  const metrics = {
    grossProfit: plData.grossProfit,
    grossMargin: plData.revenue.totalSales > 0
      ? (plData.grossProfit / plData.revenue.totalSales) * 100
      : 0,
    netMargin: plData.profitMargin,
    operatingExpenses: plData.operatingExpenses?.total || 0,
  };

  // Convert expense breakdown to array
  const expenseBreakdown = Object.entries(plData.operatingExpenses?.breakdown || {}).map(([category, amount]) => ({
    category,
    amount: Number(amount),
    percentage: metrics.operatingExpenses > 0
      ? (Number(amount) / metrics.operatingExpenses) * 100
      : 0,
  })).sort((a, b) => b.amount - a.amount).slice(0, 5);

  const categoryBreakdown = [
    { category: "Sales", amount: plData.revenue.totalSales, color: chartColors.success },
    { category: "COGS", amount: -plData.costOfGoodsSold, color: chartColors.error },
    { category: "Operating Exp.", amount: -metrics.operatingExpenses, color: chartColors.warning },
    { category: "Net Profit", amount: plData.netProfit, color: chartColors.primary },
  ];

  const revenueGrowth = prevMonth.revenue > 0
    ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
    : 0;

  const profitGrowth = prevMonth.profit > 0
    ? ((currentMonth.profit - prevMonth.profit) / prevMonth.profit) * 100
    : 0;

  return (
    <div className="space-y-[24px]">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={fetchPLData} variant="outline" size="sm" className="gap-[8px] h-[32px] px-[12px] rounded-[8px] font-bold border-border">
          <MIcon name="autorenew" className="text-[16px]" /> Refresh
        </Button>
      </div>

      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-[24px] rounded-[16px] border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-emerald-800 dark:text-emerald-300">Revenue</p>
            <div className="bg-emerald-100 dark:bg-emerald-800/50 p-[8px] rounded-[8px]">
              <MIcon name="currency_rupee" className="text-[20px] text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mb-[4px]">
            ₹{plData.revenue.totalSales.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-[4px]">
            <span className="text-body-sm font-medium text-emerald-600 dark:text-emerald-400">YTD Total</span>
          </div>
        </div>

        <div className="bg-sky-50 dark:bg-sky-900/20 p-[24px] rounded-[16px] border border-sky-200 dark:border-sky-800">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-sky-800 dark:text-sky-300">Gross Profit</p>
            <div className="bg-sky-100 dark:bg-sky-800/50 p-[8px] rounded-[8px]">
              <MIcon name="trending_up" className="text-[20px] text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-sky-900 dark:text-sky-100 mb-[4px]">
            ₹{metrics.grossProfit.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-[4px]">
            <span className="text-body-sm font-bold text-sky-600 dark:text-sky-400">{metrics.grossMargin.toFixed(1)}%</span>
            <span className="text-body-sm font-medium text-muted-foreground">margin</span>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-[24px] rounded-[16px] border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-amber-800 dark:text-amber-300">Operating Exp.</p>
            <div className="bg-amber-100 dark:bg-amber-800/50 p-[8px] rounded-[8px]">
              <MIcon name="shopping_cart" className="text-[20px] text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-900 dark:text-amber-100 mb-[4px]">
            ₹{metrics.operatingExpenses.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-[4px]">
            <span className="text-body-sm font-bold text-muted-foreground">
              {plData.revenue.totalSales > 0
                ? ((metrics.operatingExpenses / plData.revenue.totalSales) * 100).toFixed(1)
                : 0}%
            </span>
            <span className="text-body-sm font-medium text-muted-foreground">of revenue</span>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-[24px] rounded-[16px] border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-purple-800 dark:text-purple-300">Net Profit</p>
            <div className="bg-purple-100 dark:bg-purple-800/50 p-[8px] rounded-[8px]">
              <MIcon name="trending_up" className="text-[20px] text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-900 dark:text-purple-100 mb-[4px]">
            ₹{plData.netProfit.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-[4px]">
            <span className="text-body-sm font-bold text-emerald-600 dark:text-emerald-400">{metrics.netMargin.toFixed(1)}%</span>
            <span className="text-body-sm font-medium text-muted-foreground">margin</span>
          </div>
        </div>
      </div>

      {/* P&L Trend Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Profit & Loss Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.slateGrid} vertical={false} />
              <XAxis dataKey="month" stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
              <YAxis stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cogs" fill="#F43F5E" name="COGS" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#F59E0B" name="Expenses" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" stroke={chartColors.brandDark} strokeWidth={3} name="Net Profit" dot={false} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* Category Breakdown */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">YTD Breakdown</h3>
          <div className="space-y-[16px]">
            {categoryBreakdown.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-[8px]">
                  <span className="text-body-sm font-medium text-muted-foreground">{item.category}</span>
                  <span
                    className={cn(
                      "text-body font-bold",
                      item.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    ₹{Math.abs(item.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-[8px]">
                  <div
                    className="h-[8px] rounded-full"
                    style={{
                      width: `${Math.min((Math.abs(item.amount) / (plData.revenue.totalSales || 1)) * 100, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Operating Expenses Breakdown</h3>
          {expenseBreakdown.length > 0 ? (
            <div className="space-y-[12px]">
              {expenseBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-[12px] bg-muted dark:bg-slate-800/50 rounded-[12px] border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-[4px]">
                      <span className="text-body-sm font-bold text-foreground">{item.category}</span>
                      <span className="text-body-sm font-medium text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white dark:bg-slate-700 rounded-full h-[6px]">
                      <div
                        className="bg-blue-500 h-[6px] rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-body font-bold text-foreground ml-[16px]">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground font-medium text-center py-[32px]">No expense data available</p>
          )}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
        <h3 className="text-h3 font-bold text-foreground mb-[16px]">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
          <div className="p-[16px] bg-emerald-50 dark:bg-emerald-900/10 rounded-[12px] border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-start gap-[12px]">
              <div className="bg-emerald-500 p-[8px] rounded-[8px]">
                <MIcon name="currency_rupee" className="text-[20px] text-white" />
              </div>
              <div>
                <p className="text-body font-bold text-emerald-900 dark:text-emerald-100 mb-[4px]">Revenue</p>
                <p className="text-body-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Total revenue of ₹{plData.revenue.totalSales.toLocaleString("en-IN")} year-to-date
                </p>
              </div>
            </div>
          </div>

          <div className="p-[16px] bg-sky-50 dark:bg-sky-900/10 rounded-[12px] border border-sky-200 dark:border-sky-800/50">
            <div className="flex items-start gap-[12px]">
              <div className="bg-sky-500 p-[8px] rounded-[8px]">
                <MIcon name="pie_chart" className="text-[20px] text-white" />
              </div>
              <div>
                <p className="text-body font-bold text-sky-900 dark:text-sky-100 mb-[4px]">Profit Margin</p>
                <p className="text-body-sm font-medium text-sky-700 dark:text-sky-300">
                  Net profit margin at {metrics.netMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="p-[16px] bg-amber-50 dark:bg-amber-900/10 rounded-[12px] border border-amber-200 dark:border-amber-800/50">
            <div className="flex items-start gap-[12px]">
              <div className="bg-amber-500 p-[8px] rounded-[8px]">
                <MIcon name="shopping_cart" className="text-[20px] text-white" />
              </div>
              <div>
                <p className="text-body font-bold text-amber-900 dark:text-amber-100 mb-[4px]">Cost Control</p>
                <p className="text-body-sm font-medium text-amber-700 dark:text-amber-300">
                  Operating expenses at{" "}
                  {plData.revenue.totalSales > 0
                    ? ((metrics.operatingExpenses / plData.revenue.totalSales) * 100).toFixed(1)
                    : 0}% of revenue
                </p>
              </div>
            </div>
          </div>

          <div className="p-[16px] bg-purple-50 dark:bg-purple-900/10 rounded-[12px] border border-purple-200 dark:border-purple-800/50">
            <div className="flex items-start gap-[12px]">
              <div className="bg-purple-500 p-[8px] rounded-[8px]">
                <MIcon name="trending_up" className="text-[20px] text-white" />
              </div>
              <div>
                <p className="text-body font-bold text-purple-900 dark:text-purple-100 mb-[4px]">Net Profit</p>
                <p className="text-body-sm font-medium text-purple-700 dark:text-purple-300">
                  Net profit of ₹{plData.netProfit.toLocaleString("en-IN")} YTD
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
