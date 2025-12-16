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

interface PurchaseSummary {
  totalPurchases: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface TopSupplier {
  name: string;
  totalPurchases: number;
  orderCount: number;
}

interface PurchaseRecord {
  orderNumber: string;
  date: string;
  supplier: string;
  amount: number;
  status: string;
}

export function PurchaseReports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PurchaseSummary>({
    totalPurchases: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  });
  const [purchaseData, setPurchaseData] = useState<PurchaseRecord[]>([]);
  const [topSupplier, setTopSupplier] = useState<TopSupplier | null>(null);
  const [period] = useState("This Month");

  const fetchPurchaseData = async () => {
    setLoading(true);
    try {
      // Calculate date range for this month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await reportsService.getPurchaseReport({ startDate, endDate });

      if (response.success && response.data) {
        setSummary({
          totalPurchases: response.data.summary?.totalPurchases || 0,
          totalOrders: response.data.summary?.totalOrders || 0,
          averageOrderValue: response.data.summary?.averageOrderValue || 0,
        });
        setPurchaseData(response.data.purchases || []);

        // Get top supplier
        if (response.data.topSuppliers && response.data.topSuppliers.length > 0) {
          setTopSupplier(response.data.topSuppliers[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch purchase report:", error);
      toast.error("Failed to load purchase report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RECEIVED':
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
      case 'SENT':
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-700';
      case 'DUE':
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculate outstanding payables from purchase data
  const outstandingPayables = purchaseData.reduce((sum, p) => {
    if (p.status !== 'PAID' && p.status !== 'RECEIVED') {
      return sum + Number(p.amount);
    }
    return sum;
  }, 0);

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
          <h2 className="text-lg font-semibold">Purchase Reports</h2>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
            <Calendar className="size-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{period}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchPurchaseData}>
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

      {/* Purchase Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.totalPurchases.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Payables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{outstandingPayables.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {purchaseData.filter(p => p.status !== 'PAID').length} orders pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{topSupplier?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topSupplier ? `₹${Number(topSupplier.totalPurchases).toLocaleString('en-IN')} this month` : 'No purchases'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Purchase Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase data found for this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order No</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseData.map((purchase, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(purchase.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="font-medium">{purchase.orderNumber}</TableCell>
                    <TableCell>{purchase.supplier || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">₹{Number(purchase.amount).toLocaleString('en-IN')}</TableCell>
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
