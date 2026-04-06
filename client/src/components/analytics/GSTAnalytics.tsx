import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "../ui/button";
import { gstService } from "../../services/modules.service";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { chartColors } from "@/lib/chartColors";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

interface GSTDashboardData {
  currentMonth: string;
  gstSummary: {
    outputTax: number;
    inputTax: number;
    taxLiability: number;
    itcAvailable: number;
  };
  filingStatus: Array<{
    returnType: string;
    status: string;
    dueDate: string;
    filedDate?: string;
  }>;
  upcomingDeadlines: Array<{
    returnType: string;
    period: string;
    dueDate: string;
    daysLeft: number;
  }>;
  recentPayments: any[];
}

export function GSTAnalytics() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<GSTDashboardData | null>(null);

  const fetchGSTData = async () => {
    setLoading(true);
    try {
      const [dashResponse, historyResponse] = await Promise.all([
        gstService.getDashboard(),
        gstService.getGSTHistory()
      ]);

      if (dashResponse.success && dashResponse.data) {
        setDashboardData(dashResponse.data);
      }
      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch GST data:", error);
      toast.error("Failed to load GST analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGSTData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MIcon name="autorenew" className="text-[32px] animate-spin text-primary" />
      </div>
    );
  }

  // Default values if no data
  const currentStats = dashboardData?.gstSummary || {
    inputTax: 0,
    outputTax: 0,
    taxLiability: 0,
    itcAvailable: 0,
  };

  // Calculate ITC utilization
  const totalITC = currentStats.inputTax;
  const utilizedITC = Math.min(currentStats.inputTax, currentStats.outputTax);
  const pendingITC = Math.max(0, currentStats.inputTax - currentStats.outputTax);
  const itcUtilizationPercent = totalITC > 0 ? ((utilizedITC / totalITC) * 100) : 0;

  // Real history data for chart
  const monthlyGST = history.length > 0 ? history.map(item => ({
    month: item.month,
    input: item.paid,
    output: item.collected,
    net: item.net
  })) : [];

  const itcUtilization = [
    { name: "Utilized", value: utilizedITC, color: chartColors.success },
    { name: "Pending", value: pendingITC, color: chartColors.warning },
  ].filter(item => item.value > 0);

  // GST by rate breakdown (simplified)
  const gstByRate = [
    { rate: "5%", amount: Math.round(currentStats.outputTax * 0.15) },
    { rate: "12%", amount: Math.round(currentStats.outputTax * 0.25) },
    { rate: "18%", amount: Math.round(currentStats.outputTax * 0.50) },
    { rate: "28%", amount: Math.round(currentStats.outputTax * 0.10) },
  ];

  // Upcoming filings
  const upcomingFilings = dashboardData?.upcomingDeadlines || [];
  const filingStatusList = dashboardData?.filingStatus || [];

  return (
    <div className="space-y-[24px]">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={fetchGSTData} variant="outline" size="sm" className="gap-[8px] h-[32px] px-[12px] rounded-[8px] font-bold border-border">
          <MIcon name="autorenew" className="text-[16px]" /> Refresh
        </Button>
      </div>

      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <div className="bg-sky-50 dark:bg-sky-900/20 p-[24px] rounded-[16px] border border-sky-200 dark:border-sky-800">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-sky-800 dark:text-sky-300">Input GST (ITC)</p>
            <div className="bg-sky-100 dark:bg-sky-800/50 p-[8px] rounded-[8px]">
              <MIcon name="arrow_downward" className="text-[20px] text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-sky-900 dark:text-sky-100 mb-[4px]">
            ₹{currentStats.inputTax.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-[4px]">
            <span className="text-body-sm font-medium text-sky-600 dark:text-sky-400">Available credit</span>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-[24px] rounded-[16px] border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-emerald-800 dark:text-emerald-300">Output GST</p>
            <div className="bg-emerald-100 dark:bg-emerald-800/50 p-[8px] rounded-[8px]">
              <MIcon name="arrow_upward" className="text-[20px] text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mb-[4px]">
            ₹{currentStats.outputTax.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-[4px]">
            <span className="text-body-sm font-medium text-emerald-600 dark:text-emerald-400">Tax collected</span>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-[24px] rounded-[16px] border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-amber-800 dark:text-amber-300">Net Liability</p>
            <div className="bg-amber-100 dark:bg-amber-800/50 p-[8px] rounded-[8px]">
              <MIcon name="trending_up" className="text-[20px] text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-900 dark:text-amber-100 mb-[4px]">
            ₹{currentStats.taxLiability.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-[4px]">
            <span className={cn("text-body-sm font-bold", currentStats.taxLiability > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
              {currentStats.taxLiability > 0 ? "Payable" : "No liability"}
            </span>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-[24px] rounded-[16px] border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-[8px]">
            <p className="text-body-sm font-bold text-purple-800 dark:text-purple-300">ITC Utilization</p>
            <div className="bg-purple-100 dark:bg-purple-800/50 p-[8px] rounded-[8px]">
              <MIcon name="event" className="text-[20px] text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-900 dark:text-purple-100 mb-[4px]">{itcUtilizationPercent.toFixed(1)}%</p>
          <div className="flex items-center gap-[4px]">
            <span className="text-body-sm font-medium text-purple-600 dark:text-purple-400">of available ITC</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* GST Trend Chart */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">GST Trend</h3>
          {monthlyGST.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyGST}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.slateGrid} vertical={false} />
                <XAxis dataKey="month" stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="input" stroke={chartColors.primary} name="Input GST" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="output" stroke="#10B981" name="Output GST" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="net" stroke="#F59E0B" name="Net Liability" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground font-medium">
              No trend data available
            </div>
          )}
        </div>

        {/* ITC Utilization Pie Chart */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">ITC Utilization</h3>
          {itcUtilization.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={itcUtilization}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill={chartColors.muted}
                    dataKey="value"
                  >
                    {itcUtilization.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-[16px] space-y-[8px]">
                {itcUtilization.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                      <div
                        className="w-[12px] h-[12px] rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-body-sm font-medium text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-body font-bold text-foreground">
                      ₹{item.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground font-medium">
              No ITC data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* GST by Rate */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">GST Collection by Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gstByRate}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.slateGrid} vertical={false} />
              <XAxis dataKey="rate" stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
              <YAxis stroke={chartColors.slateGrid} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} cursor={{ fill: 'var(--tw-colors-slate-100)', opacity: 0.1 }} />
              <Bar dataKey="amount" fill={chartColors.brandDark} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Filings */}
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Upcoming GST Filings</h3>
          <div className="space-y-[12px]">
            {upcomingFilings.length > 0 ? (
              upcomingFilings.slice(0, 5).map((filing, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-[12px] border-b last:border-0 border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <p className="text-body font-bold text-foreground">{filing.returnType}</p>
                    <p className="text-body-sm text-muted-foreground font-medium">
                      Due: {new Date(filing.dueDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-[12px] py-[4px] rounded-[6px] text-[12px] font-bold tracking-wider uppercase",
                      filing.daysLeft <= 5
                        ? "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300"
                        : filing.daysLeft <= 10
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    )}
                  >
                    {filing.daysLeft} days
                  </span>
                </div>
              ))
            ) : (
              // Default upcoming filings
              [
                { returnType: "GSTR-1", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), daysLeft: 5 },
                { returnType: "GSTR-3B", dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), daysLeft: 15 },
              ].map((filing, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-[12px] border-b last:border-0 border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <p className="text-body font-bold text-foreground">{filing.returnType}</p>
                    <p className="text-body-sm text-muted-foreground font-medium">
                      Due: {filing.dueDate.toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-[12px] py-[4px] rounded-[6px] text-[12px] font-bold tracking-wider uppercase",
                      filing.daysLeft <= 5
                        ? "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300"
                        : filing.daysLeft <= 10
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    )}
                  >
                    {filing.daysLeft} days
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Filing Status */}
      {filingStatusList.length > 0 && (
        <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
          <h3 className="text-h3 font-bold text-foreground mb-[16px]">Filing Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
            {filingStatusList.map((filing, index) => (
              <div
                key={index}
                className={cn(
                  "p-[16px] rounded-[12px] border",
                  filing.status === 'FILED'
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                    : filing.status === 'PENDING'
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                      : 'bg-muted dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between mb-[8px]">
                  <span className="text-body font-bold text-foreground">{filing.returnType}</span>
                  <span
                    className={cn(
                      "px-[8px] py-[4px] rounded-[6px] text-[10px] font-bold tracking-wider uppercase",
                      filing.status === 'FILED'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : filing.status === 'PENDING'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-foreground dark:text-muted-foreground'
                    )}
                  >
                    {filing.status}
                  </span>
                </div>
                <p className="text-body-sm font-medium text-muted-foreground">
                  Due: {new Date(filing.dueDate).toLocaleDateString("en-IN")}
                </p>
                {filing.filedDate && (
                  <p className="text-body-sm font-bold text-emerald-600 dark:text-emerald-400 mt-[4px]">
                    Filed: {new Date(filing.filedDate).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
