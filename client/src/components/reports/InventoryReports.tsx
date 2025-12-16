import { useState, useEffect } from "react";
import { Download, Filter, Package, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
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

interface InventorySummary {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface InventoryItem {
  name: string;
  sku?: string;
  category?: string;
  currentStock: number;
  minStock?: number;
  reorderLevel?: number;
  value: number;
}

export function InventoryReports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filter] = useState("All Items");

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getInventoryReport();

      if (response.success && response.data) {
        setSummary({
          totalProducts: response.data.summary?.totalProducts || 0,
          totalValue: response.data.summary?.totalValue || 0,
          lowStockCount: response.data.summary?.lowStockCount || 0,
          outOfStockCount: response.data.summary?.outOfStockCount || 0,
        });
        setInventoryData(response.data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch inventory report:", error);
      toast.error("Failed to load inventory report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'Out of Stock';
    const minStock = item.minStock || item.reorderLevel || 10;
    if (item.currentStock <= minStock) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-700';
      case 'Low Stock':
        return 'bg-orange-100 text-orange-700';
      case 'Out of Stock':
        return 'bg-red-100 text-red-700';
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
          <h2 className="text-lg font-semibold">Inventory Reports</h2>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
            <Package className="size-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{filter}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchInventoryData}>
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

      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.totalValue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">across {summary.totalProducts} items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Items below reorder level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Inventory Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Stock Status</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inventory data found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Stock Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item, index) => {
                  const status = getStockStatus(item);
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category || 'Uncategorized'}</TableCell>
                      <TableCell className="text-center">{item.currentStock}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1 ${getStatusColor(status)}`}>
                          {status !== 'In Stock' && <AlertTriangle className="size-3" />}
                          {status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">₹{Number(item.value).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
