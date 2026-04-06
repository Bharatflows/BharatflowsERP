import { useState, useEffect } from "react";
import { expensesService } from "../../services/modules.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  IndianRupee,
  ArrowRight,
  Receipt,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "../../lib/utils";
import { chartColors } from "@/lib/chartColors";

interface ExpensesDashboardProps {
  onViewExpenses: () => void;
  hideStats?: boolean;
}

export function ExpensesDashboard({ onViewExpenses, hideStats = false }: ExpensesDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await expensesService.getDashboardStats();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpi, monthlyData, categoryBreakdown, recentExpenses, pendingPayments } = data;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {!hideStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-start justify-between mb-3">
              <div className="bg-blue-500/10 p-2.5 rounded-lg">
                <Wallet className="size-5 text-blue-500" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Total Expenses (MTD)</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold text-foreground">₹{kpi.currentMonthTotal.toLocaleString("en-IN")}</h3>
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium mb-1",
                kpi.percentChange > 0 ? "text-rose-600" : "text-emerald-600"
              )}>
                {kpi.percentChange > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(kpi.percentChange)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs last month</p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-start justify-between mb-3">
              <div className="bg-amber-500/10 p-2.5 rounded-lg">
                <BarChartIcon className="size-5 text-amber-500" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Budget Utilization</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold text-foreground">{kpi.budgetUtilization.toFixed(0)}%</h3>
              {kpi.budgetUtilization > 100 && <span className="text-rose-600 text-xs font-medium mb-1">Over Budget</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹50,000 limit
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-start justify-between mb-3">
              <div className="bg-emerald-500/10 p-2.5 rounded-lg">
                <AlertCircle className="size-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Pending Payments</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold text-foreground">₹{kpi.pendingAmount.toLocaleString("en-IN")}</h3>
              <span className="text-muted-foreground text-xs font-medium mb-1">
                {kpi.pendingCount} items
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require action</p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-start justify-between mb-3">
              <div className="bg-violet-500/10 p-2.5 rounded-lg">
                <Calendar className="size-5 text-violet-500" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Avg Daily Expense</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold text-foreground">
                ₹{(kpi.currentMonthTotal / 30).toFixed(0)}
              </h3>
              <span className="text-muted-foreground text-xs font-medium mb-1">
                approx
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on 30 days</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Monthly Expense Trend</h3>
            <p className="text-sm text-muted-foreground">Actual vs Budget comparison</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, undefined]}
                />
                <Legend iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="budget"
                  stackId="1"
                  stroke={chartColors.success}
                  strokeWidth={2}
                  fill="url(#colorBudget)"
                  name="Budget"
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stackId="2"
                  stroke={chartColors.brand}
                  strokeWidth={2}
                  fill="url(#colorAmount)"
                  name="Actual"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Expense by Category</h3>
            <p className="text-sm text-muted-foreground">Current month breakdown</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {categoryBreakdown.length > 0 ? (
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, undefined]}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Expenses & Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Recent Expenses</h3>
              <p className="text-sm text-muted-foreground">Last 5 expense entries</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onViewExpenses} className="hover:bg-primary/5 hover:text-primary">
              View All
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors bg-background/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{expense.description}</p>
                      {expense.status === "APPROVED" || expense.status === "PAID" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-2xs px-1.5 py-0 h-5 gap-1">
                          <CheckCircle className="size-2.5" />
                          {expense.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-2xs px-1.5 py-0 h-5 gap-1">
                          <Clock className="size-2.5" />
                          {expense.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">{expense.vendor}</span>
                      <span>•</span>
                      <span>{expense.category}</span>
                      <span>•</span>
                      <span>{new Date(expense.date).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent expenses</p>
            )}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Pending Payments</h3>
            <p className="text-sm text-muted-foreground">Upcoming payment obligations</p>
          </div>
          <div className="space-y-3">
            {pendingPayments.length > 0 ? (
              pendingPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-amber-500/20 rounded-lg bg-amber-500/5"
                >
                  <div>
                    <p className="font-medium text-foreground">{payment.vendor}</p>
                    <p className="text-sm text-amber-700 mt-0.5 flex items-center gap-1">
                      <Clock className="size-3" />
                      Date: {new Date(payment.date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </p>
                    <Button size="sm" className="mt-2 h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No pending payments</p>
            )}
          </div>

          {/* Category Summary */}
          <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Top Expense Categories</h4>
            {categoryBreakdown
              .sort((a: any, b: any) => b.value - a.value)
              .slice(0, 5)
              .map((cat: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    ₹{cat.value.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
