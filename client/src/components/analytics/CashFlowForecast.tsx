import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { reportsService, bankingService } from "@/services/modules.service";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { chartColors } from "@/lib/chartColors";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

interface AgingData {
  range: string;
  amount: number;
  percentage: number;
}

interface CashFlowData {
  month: string;
  actual: number | null;
  forecast: number | null;
  inflow: number;
  outflow: number;
}

export function CashFlowForecast() {
  const [loading, setLoading] = useState(true);
  const [receivablesAging, setReceivablesAging] = useState<AgingData[]>([]);
  const [payablesAging, setPayablesAging] = useState<AgingData[]>([]);
  const [currentCash, setCurrentCash] = useState(0);
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [totalPayables, setTotalPayables] = useState(0);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [upcomingCollections, setUpcomingCollections] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);

  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch aging reports, banking trends, and forecast
      const [receivablesRes, payablesRes, bankingRes, trendsRes, forecastRes] = await Promise.all([
        reportsService.getAgingReceivables(),
        reportsService.getAgingPayables(),
        bankingService.getDashboard(),
        bankingService.getCashFlowTrends(),
        bankingService.getCashFlowForecast()
      ]);

      // Process receivables aging
      if (receivablesRes.success && receivablesRes.data) {
        const { summary, totalReceivables: total, parties } = receivablesRes.data;
        setTotalReceivables(total || 0);

        const receivablesData: AgingData[] = [
          { range: "0-30 days", amount: summary?.current || 0, percentage: total ? Math.round((summary?.current || 0) / total * 100) : 0 },
          { range: "31-60 days", amount: summary?.days31to60 || 0, percentage: total ? Math.round((summary?.days31to60 || 0) / total * 100) : 0 },
          { range: "61-90 days", amount: summary?.days61to90 || 0, percentage: total ? Math.round((summary?.days61to90 || 0) / total * 100) : 0 },
          { range: "90+ days", amount: summary?.over90 || 0, percentage: total ? Math.round((summary?.over90 || 0) / total * 100) : 0 },
        ];
        setReceivablesAging(receivablesData);

        // Set upcoming collections from top parties with receivables
        if (parties && Array.isArray(parties)) {
          const collections = parties
            .filter((p: any) => p.totalDue > 0)
            .slice(0, 3)
            .map((p: any, i: number) => ({
              party: p.partyName,
              amount: p.totalDue,
              date: new Date(Date.now() + (i + 2) * 86400000).toISOString().split('T')[0],
              days: i + 2
            }));
          setUpcomingCollections(collections);
        }
      }

      // Process payables aging
      if (payablesRes.success && payablesRes.data) {
        const { summary, totalPayables: total, suppliers } = payablesRes.data;
        setTotalPayables(total || 0);

        const payablesData: AgingData[] = [
          { range: "0-30 days", amount: summary?.current || 0, percentage: total ? Math.round((summary?.current || 0) / total * 100) : 0 },
          { range: "31-60 days", amount: summary?.days31to60 || 0, percentage: total ? Math.round((summary?.days31to60 || 0) / total * 100) : 0 },
          { range: "61-90 days", amount: summary?.days61to90 || 0, percentage: total ? Math.round((summary?.days61to90 || 0) / total * 100) : 0 },
          { range: "90+ days", amount: summary?.over90 || 0, percentage: total ? Math.round((summary?.over90 || 0) / total * 100) : 0 },
        ];
        setPayablesAging(payablesData);

        // Set upcoming payments from top suppliers with payables
        if (suppliers && Array.isArray(suppliers)) {
          const payments = suppliers
            .filter((s: any) => s.totalDue > 0)
            .slice(0, 3)
            .map((s: any, i: number) => ({
              party: s.supplierName,
              amount: s.totalDue,
              date: new Date(Date.now() + (i + 3) * 86400000).toISOString().split('T')[0],
              days: i + 3
            }));
          setUpcomingPayments(payments);
        }
      }

      // Process banking dashboard
      if (bankingRes.success && bankingRes.data) {
        setCurrentCash(bankingRes.data.summary?.totalBalance || 0);
      }

      // Process cash flow trends and forecast
      if (trendsRes.success && trendsRes.data && forecastRes.success && forecastRes.data) {
        const trends = trendsRes.data.map((m: any) => ({
          month: m.month,
          actual: m.net,
          forecast: null,
          inflow: m.inflow,
          outflow: m.outflow
        }));

        const forecast = forecastRes.data.forecast.map((f: any) => ({
          month: f.month,
          actual: null,
          forecast: f.balance,
          inflow: f.inflow,
          outflow: f.outflow
        }));

        setCashFlowData([...trends, ...forecast]);
        setAlerts(forecastRes.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      toast.error('Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const netPosition = currentCash + totalReceivables - totalPayables;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MIcon name="autorenew" className="text-[32px] animate-spin text-primary" />
        <span className="ml-[8px] text-body font-medium text-muted-foreground font-medium">Loading cash flow data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-[24px]">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Cash Flow Forecast</h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-[8px] text-body-sm font-bold text-muted-foreground hover:text-foreground dark:hover:text-slate-100 transition-colors"
        >
          <MIcon name="autorenew" className="text-[16px]" />
          Refresh
        </button>
      </div>

      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm border-l-[4px] border-l-sky-500">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-muted-foreground">Current Cash</p>
            <div className="bg-sky-50 dark:bg-sky-900/20 p-[8px] rounded-[8px]">
              <MIcon name="trending_up" className="text-[20px] text-sky-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mb-[4px]">
            ₹{currentCash.toLocaleString("en-IN")}
          </p>
          <p className="text-body-sm font-medium text-muted-foreground">Bank + Cash on hand</p>
        </div>

        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm border-l-[4px] border-l-emerald-500">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-muted-foreground">Receivables</p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-[8px] rounded-[8px]">
              <MIcon name="trending_up" className="text-[20px] text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mb-[4px]">
            ₹{totalReceivables.toLocaleString("en-IN")}
          </p>
          <p className="text-body-sm font-medium text-muted-foreground">To be collected</p>
        </div>

        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm border-l-[4px] border-l-amber-500">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-muted-foreground">Payables</p>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-[8px] rounded-[8px]">
              <MIcon name="trending_down" className="text-[20px] text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mb-[4px]">
            ₹{totalPayables.toLocaleString("en-IN")}
          </p>
          <p className="text-body-sm font-medium text-muted-foreground">To be paid</p>
        </div>

        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm border-l-[4px] border-l-purple-500">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-muted-foreground">Net Position</p>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-[8px] rounded-[8px]">
              <MIcon name="check_circle" className="text-[20px] text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mb-[4px]">
            ₹{netPosition.toLocaleString("en-IN")}
          </p>
          <p className="text-body-sm font-medium text-muted-foreground">Working capital</p>
        </div>
      </div>

      {/* Cash Flow Forecast Chart */}
      <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-[16px] gap-[8px]">
          <h3 className="text-h3 font-bold text-foreground">Cash Flow Forecast (Next 3 Months)</h3>
          <div className="flex items-center gap-[16px] text-body-sm font-medium">
            <div className="flex items-center gap-[8px]">
              <div className="w-[12px] h-[12px] rounded-full bg-slate-400" />
              <span className="text-muted-foreground">Actual</span>
            </div>
            <div className="flex items-center gap-[8px]">
              <div className="w-[12px] h-[12px] rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Forecast</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.slateGrid} vertical={false} />
            <XAxis dataKey="month" stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
            <YAxis stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
            <Area
              type="monotone"
              dataKey="actual"
              stroke={chartColors.slate}
              fill={chartColors.slate}
              fillOpacity={0.2}
              strokeWidth={2}
              name="Actual Cash"
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Forecast"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div >

      {/* Inflow vs Outflow */}
      <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
        <h3 className="text-h3 font-bold text-foreground mb-[16px]">Cash Inflow vs Outflow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.slateGrid} vertical={false} />
            <XAxis dataKey="month" stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
            <YAxis stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'var(--tw-colors-slate-100)', opacity: 0.1 }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="inflow" fill="#10B981" name="Cash Inflow" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outflow" fill="#F43F5E" name="Cash Outflow" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div >

      {/* Receivables & Payables Aging */}
      < div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]" >
        {/* Receivables Aging */}
        < div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm" >
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Receivables Aging</h3>
          <div className="space-y-[12px]">
            {receivablesAging.map((item, index) => (
              <div key={index} className="space-y-[8px]">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium text-muted-foreground">{item.range}</span>
                  <span className="text-body font-bold text-foreground">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-[8px]">
                  <div className="flex-1 bg-muted rounded-full h-[8px]">
                    <div
                      className="bg-emerald-500 h-[8px] rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-body-sm font-bold text-muted-foreground w-[40px] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-[16px] pt-[16px] border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-body-sm font-bold text-muted-foreground">Total Receivables:</span>
              <span className="text-h3 font-black text-foreground">
                ₹{totalReceivables.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div >

        {/* Payables Aging */}
        < div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm" >
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Payables Aging</h3>
          <div className="space-y-[12px]">
            {payablesAging.map((item, index) => (
              <div key={index} className="space-y-[8px]">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium text-muted-foreground">{item.range}</span>
                  <span className="text-body font-bold text-foreground">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center gap-[8px]">
                  <div className="flex-1 bg-muted rounded-full h-[8px]">
                    <div
                      className="bg-rose-500 h-[8px] rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-body-sm font-bold text-muted-foreground w-[40px] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-[16px] pt-[16px] border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-body-sm font-bold text-muted-foreground">Total Payables:</span>
              <span className="text-h3 font-black text-foreground">
                ₹{totalPayables.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div >
      </div >

      {/* Upcoming Collections & Payments */}
      < div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]" >
        {/* Upcoming Collections */}
        < div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm" >
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Upcoming Collections</h3>
          <div className="space-y-[12px]">
            {upcomingCollections.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-[12px] bg-emerald-50 dark:bg-emerald-900/10 rounded-[12px] border border-emerald-200 dark:border-emerald-800/50 gap-[8px]"
              >
                <div className="flex-1">
                  <p className="text-body font-bold text-foreground">{item.party}</p>
                  <p className="text-body-sm font-medium text-muted-foreground">
                    Due: {new Date(item.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-body-sm text-muted-foreground font-medium">in {item.days} days</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-[16px] pt-[16px] border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-body-sm font-bold text-muted-foreground">Total Expected:</span>
              <span className="text-h3 font-black text-emerald-600 dark:text-emerald-400">
                ₹{upcomingCollections.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div >

        {/* Upcoming Payments */}
        < div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm" >
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Upcoming Payments</h3>
          <div className="space-y-[12px]">
            {upcomingPayments.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-[12px] bg-rose-50 dark:bg-rose-900/10 rounded-[12px] border border-rose-200 dark:border-rose-800/50 gap-[8px]"
              >
                <div className="flex-1">
                  <p className="text-body font-bold text-foreground">{item.party}</p>
                  <p className="text-body-sm font-medium text-muted-foreground">
                    Due: {new Date(item.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-body font-bold text-rose-600 dark:text-rose-400">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-body-sm text-muted-foreground font-medium">in {item.days} days</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-[16px] pt-[16px] border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-body-sm font-bold text-muted-foreground">Total Due:</span>
              <span className="text-h3 font-black text-rose-600 dark:text-rose-400">
                ₹{upcomingPayments.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div >
      </div >

      <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
        <h3 className="text-h3 font-bold text-foreground mb-[16px]">Cash Flow Alerts</h3>
        <div className="space-y-[12px]">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-[12px] p-[16px] rounded-[12px] border",
                  alert.type === "critical"
                    ? "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50"
                    : alert.type === "warning"
                      ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50"
                      : "bg-sky-50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-800/50"
                )}
              >
                {alert.type === "critical" ? (
                  <div className="bg-rose-100 dark:bg-rose-900/50 p-[8px] rounded-[8px] flex-shrink-0">
                    <MIcon name="trending_down" className="text-[20px] text-rose-600 dark:text-rose-400" />
                  </div>
                ) : alert.type === "warning" ? (
                  <div className="bg-amber-100 dark:bg-amber-900/50 p-[8px] rounded-[8px] flex-shrink-0">
                    <MIcon name="warning" className="text-[20px] text-amber-600 dark:text-amber-400" />
                  </div>
                ) : (
                  <div className="bg-sky-100 dark:bg-sky-900/50 p-[8px] rounded-[8px] flex-shrink-0">
                    <MIcon name="info" className="text-[20px] text-sky-600 dark:text-sky-400" />
                  </div>
                )}
                <div>
                  <p className="text-body font-bold text-foreground mb-[4px]">{alert.message}</p>
                  <p className="text-body-sm text-muted-foreground font-medium">{alert.action}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-start gap-[12px] p-[16px] bg-emerald-50 dark:bg-emerald-900/10 rounded-[12px] border border-emerald-200 dark:border-emerald-800/50">
              <div className="bg-emerald-100 dark:bg-emerald-900/50 p-[8px] rounded-[8px] flex-shrink-0">
                <MIcon name="check_circle" className="text-[20px] text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-body font-bold text-foreground mb-[4px]">No urgent alerts</p>
                <p className="text-body-sm text-muted-foreground font-medium">Your cash position looks stable for the upcoming period.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
