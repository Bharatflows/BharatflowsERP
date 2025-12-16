import { useState, useEffect } from "react";
import { Download, Filter, Calendar, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { reportsService } from "../../services/modules.service";
import { toast } from "sonner";

interface SalesSummary {
  totalSales: number;
  totalInvoices: number;
  averageOrderValue: number;
}

interface SaleRecord {
  invoiceNumber: string;
  date: string;
  customer: string;
  amount: number;
  status: string;
}

export function SalesReports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalInvoices: 0,
    averageOrderValue: 0,
  });
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);
  const [period] = useState("This Month");

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // Calculate date range for this month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await reportsService.getSalesReport({ startDate, endDate });

      if (response.success && response.data) {
        setSummary({
          totalSales: response.data.summary?.totalSales || 0,
          totalInvoices: response.data.summary?.totalInvoices || 0,
          averageOrderValue: response.data.summary?.averageOrderValue || 0,
        });
        setSalesData(response.data.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch sales report:", error);
      toast.error("Failed to load sales report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
      case 'SENT':
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-700';
      case 'OVERDUE':
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Sales Reports</h2>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
            <Calendar className="size-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{period}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchSalesData}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.totalSales.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">Invoices created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(summary.averageOrderValue).toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Per invoice</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sales Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Sales Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales data found for this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((sale, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(sale.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                    <TableCell>{sale.customer || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">₹{Number(sale.amount).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
