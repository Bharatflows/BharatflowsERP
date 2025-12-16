import { useState, useEffect } from "react";
import { expensesService, expenseCategoriesService } from "../../services/modules.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ReportDetailsDialog } from "./ReportDetailsDialog";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Download, FileText, TrendingUp, TrendingDown, Loader2, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

export function ExpenseReports() {
  const [loading, setLoading] = useState(true);
  const [monthlyComparison, setMonthlyComparison] = useState<any[]>([]);
  const [categoryTrend, setCategoryTrend] = useState<any[]>([]);
  const [vendorExpenses, setVendorExpenses] = useState<any[]>([]);
  const [months, setMonths] = useState("6");

  // Dialog State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportType, setReportType] = useState<"category" | "vendor" | "tax">("category");
  const [reportTitle, setReportTitle] = useState("");
  const [reportData, setReportData] = useState<any[]>([]);

  const handleReportClick = async (type: "category" | "vendor" | "tax") => {
    setReportType(type);
    setReportData([]); // Clear previous data
    setIsReportOpen(true);

    try {
      let response;
      if (type === "category") {
        setReportTitle("Category Expense Report");
        // For category report table, we want the summary list with budgets and spent
        response = await expenseCategoriesService.getAll();
      } else if (type === "vendor") {
        setReportTitle("Vendor Payment Report");
        response = await expensesService.getVendorSummary();
      } else if (type === "tax") {
        setReportTitle("Tax (GST) Report");
        response = await expensesService.getTaxReport(Number(months));
      }

      if (response && response.success) {
        setReportData(response.data || []);
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} report:`, error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [months]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [budgetRes, categoryRes, vendorRes] = await Promise.all([
        expensesService.getBudgetVsActual(Number(months)),
        expensesService.getCategoryTrend(Number(months)),
        expensesService.getVendorSummary(),
      ]);

      if (budgetRes.success) setMonthlyComparison(budgetRes.data || []);
      if (categoryRes.success) setCategoryTrend(categoryRes.data || []);
      if (vendorRes.success) setVendorExpenses(vendorRes.data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = monthlyComparison.reduce((sum, m) => sum + (m.expenses || 0), 0);
  const avgMonthlyExpense = monthlyComparison.length > 0 ? totalExpenses / monthlyComparison.length : 0;
  const lastMonthExpense = monthlyComparison.length > 0 ? monthlyComparison[monthlyComparison.length - 1]?.expenses || 0 : 0;
  const prevMonthExpense = monthlyComparison.length > 1 ? monthlyComparison[monthlyComparison.length - 2]?.expenses || 0 : 0;
  const monthOverMonthChange = prevMonthExpense > 0 ? ((lastMonthExpense - prevMonthExpense) / prevMonthExpense) * 100 : 0;
  const lastVariance = monthlyComparison.length > 0 ? monthlyComparison[monthlyComparison.length - 1]?.variance || 0 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (monthlyComparison.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border border-border/50 p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="size-8 text-muted-foreground/50" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">No expense data yet</p>
        <p className="text-muted-foreground text-center">
          Add some expenses to see reports and analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses (6M)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">₹{totalExpenses.toLocaleString("en-IN")}</p>
            <p className="text-muted-foreground mt-1">Apr - Sep 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Monthly Expense</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">₹{Math.round(avgMonthlyExpense).toLocaleString("en-IN")}</p>
            <p className="text-muted-foreground mt-1">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">₹{lastMonthExpense.toLocaleString("en-IN")}</p>
            <div className="flex items-center gap-1 mt-1">
              {monthOverMonthChange > 0 ? (
                <>
                  <TrendingUp className="size-3 text-[#ef4444]" />
                  <span className="text-[#ef4444]">+{monthOverMonthChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="size-3 text-[#10b981]" />
                  <span className="text-[#10b981]">{monthOverMonthChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budget Variance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[#ef4444]">
              +₹{monthlyComparison[monthlyComparison.length - 1].variance.toLocaleString("en-IN")}
            </p>
            <p className="text-muted-foreground mt-1">Over budget (Sep)</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Expense Reports</CardTitle>
              <CardDescription>Analyze expense trends and patterns</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="6m">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="size-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                />
                <Legend />
                <Bar dataKey="budget" fill="#10b981" name="Budget" />
                <Bar dataKey="expenses" fill="#2563eb" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense by Vendor */}
        <Card>
          <CardHeader>
            <CardTitle>Expense by Vendor</CardTitle>
            <CardDescription>Current month distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vendorExpenses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vendorExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category-wise Expense Trend</CardTitle>
            <CardDescription>Last 6 months breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={categoryTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rent"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Rent"
                />
                <Line
                  type="monotone"
                  dataKey="salaries"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Salaries"
                />
                <Line
                  type="monotone"
                  dataKey="utilities"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Utilities"
                />
                <Line
                  type="monotone"
                  dataKey="transport"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Transport"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Summary</CardTitle>
          <CardDescription>Detailed month-wise breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyComparison.map((month, index) => (
              <div
                key={index}
                className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border rounded-lg"
              >
                <div>
                  <p className="text-muted-foreground">Month</p>
                  <p className="text-foreground">{month.month} {month.year}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Budget</p>
                  <p className="text-foreground">₹{month.budget.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actual</p>
                  <p className="text-foreground">₹{month.expenses.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Variance</p>
                  <p className={month.variance > 0 ? "text-[#ef4444]" : "text-[#10b981]"}>
                    {month.variance > 0 ? "+" : ""}₹{month.variance.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Utilization</p>
                  <p className="text-foreground">
                    {((month.expenses / month.budget) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleReportClick("category")}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#2563eb]/10 p-3 rounded-lg">
                <FileText className="size-5 text-[#2563eb]" />
              </div>
              <div>
                <p className="text-foreground mb-1">Category Report</p>
                <p className="text-muted-foreground">Detailed category breakdown</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleReportClick("vendor")}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#10b981]/10 p-3 rounded-lg">
                <FileText className="size-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-foreground mb-1">Vendor Report</p>
                <p className="text-muted-foreground">Vendor-wise expense summary</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleReportClick("tax")}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#f97316]/10 p-3 rounded-lg">
                <FileText className="size-5 text-[#f97316]" />
        
              <div>
                <p className="text-foreground mb-1">Tax Report</p>
                <p className="text-muted-foreground">GST & tax deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      <ReportDetailsDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title={reportTitle}
        type={reportType}
        data={reportData}
      />
    </div >
  );
}
