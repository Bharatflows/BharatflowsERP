import { useState, useEffect } from "react";
import { SmartCard } from "@/components/ui/SmartCard";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { dashboardService } from "../services/modules.service";
import { Loader2 } from "lucide-react";
import { chartColors, CHART_PALETTE } from "@/lib/chartColors";

type Period = "7d" | "30d" | "90d";

const periodLabels = {
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
};

export function SalesChart() {
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const response = await dashboardService.getSalesChart({ period });
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch sales chart:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, [period]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-card border border-border-light dark:border-slate-700 rounded-xl p-4 shadow-xl">
          <p className="text-text-main-light dark:text-white font-bold mb-2">{payload[0].payload.date}</p>
          <div className="space-y-1">
            <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
              Sales: ₹{payload[0].value.toLocaleString("en-IN")}
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">
              Purchases: ₹{payload[1].value.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <SmartCard
      title="Sales & Purchase Overview"
      className="h-full"
      action={
        <div className="flex bg-background-light dark:bg-white/5 p-1 rounded-lg">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-all",
                period === p
                  ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm"
                  : "text-text-muted-light dark:text-muted-foreground hover:text-text-main-light dark:hover:text-white"
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <Loader2 className="size-8 animate-spin text-primary-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
          <div className="bg-muted p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8 opacity-50"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y2="4" y1="20" /><line x1="6" x2="6" y2="7" y1="20" /></svg>
          </div>
          <p className="font-semibold">No transactions found</p>
          <p className="text-sm">Sales data will appear here once you start selling.</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.brandGreen} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={chartColors.brandGreen} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.slateGrid} opacity={0.5} />
              <XAxis
                dataKey="date"
                stroke={chartColors.slate}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                stroke={chartColors.slate}
                fontSize={12}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                align="right"
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke={chartColors.brandGreen}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSales)"
                name="Sales"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="purchases"
                stroke={chartColors.brand}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPurchases)"
                name="Purchases"
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SmartCard>
  );
}