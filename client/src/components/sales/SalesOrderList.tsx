import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { salesService } from "../../services/sales.service";
import { toast } from "sonner";
import type { SalesOrder } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  IndianRupee,
  Truck,
  Package,
  ArrowRightCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface SalesOrderListProps {
  orders: SalesOrder[];
  onCreateNew?: () => void;
  onViewOrder?: (id: string) => void;
  onEditOrder?: (id: string) => void;
  onCreateDeliveryChallan?: (orderId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SalesOrderList({ orders, onCreateNew, onViewOrder, onEditOrder, onCreateDeliveryChallan, onRefresh, isLoading = false }: SalesOrderListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null);

  const handleDeleteClick = (order: SalesOrder) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (orderToDelete) {
      try {
        await salesService.deleteSalesOrder(orderToDelete.id);
        toast.success("Sales order deleted successfully");
        onRefresh?.();
      } catch (error) {
        console.error("Failed to delete sales order:", error);
        toast.error("Failed to delete sales order");
      }
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleConvert = async (id: string) => {
    if (window.confirm("Are you sure you want to convert this sales order to an invoice?")) {
      try {
        const invoice = await salesService.convertSalesOrderToInvoice(id);
        toast.success("Sales order converted to invoice successfully");
        if (invoice && invoice.id) {
          navigate(`/sales/invoices/${invoice.id}/edit`);
        }
        onRefresh?.();
      } catch (error) {
        console.error("Failed to convert sales order:", error);
        toast.error("Failed to convert sales order");
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string | undefined) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "draft":
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
      case "confirmed":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "partially fulfilled":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "fulfilled":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "cancelled":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "draft":
        return <FileText className="size-3" />;
      case "confirmed":
        return <CheckCircle className="size-3" />;
      case "partially fulfilled":
        return <Clock className="size-3" />;
      case "fulfilled":
        return <Package className="size-3" />;
      case "cancelled":
        return <XCircle className="size-3" />;
      default:
        return <FileText className="size-3" />;
    }
  };

  const stats = {
    total: orders.length,
    confirmed: orders.filter((o) => o.status?.toLowerCase() === "confirmed").length,
    partiallyFulfilled: orders.filter((o) => o.status?.toLowerCase() === "partially fulfilled").length,
    fulfilled: orders.filter((o) => o.status?.toLowerCase() === "fulfilled").length,
    totalValue: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.totalAmount), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading sales orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Orders</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.total}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Confirmed</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.confirmed}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">In Progress</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.partiallyFulfilled}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Package className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Fulfilled</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.fulfilled}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Value</span>
            </div>
            <h3 className="text-2xl font-bold">
              {stats.totalValue >= 100000
                ? `₹${(stats.totalValue / 100000).toFixed(1)}L`
                : `₹${stats.totalValue.toLocaleString("en-IN")}`}
            </h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-11 rounded-xl">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="partially fulfilled">In Progress</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2 h-11 rounded-xl"
              onClick={onRefresh}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2 h-11 rounded-xl">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr className="border-b border-border">
              <th className="px-5 py-4 text-left font-semibold text-foreground">Order Number</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Customer</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Date</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Items</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Delivery Date</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Status</th>
              <th className="px-5 py-4 text-right font-semibold text-foreground">Amount</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileText className="size-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1">No sales orders found</p>
                      <p className="text-muted-foreground">Create your first sales order to get started</p>
                    </div>
                    <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                      <Plus className="size-4" />
                      Create First Order
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, idx) => (
                <tr
                  key={order.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-slate-50/50 transition-all duration-200",
                    idx === filteredOrders.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        <FileText className="size-4" />
                      </div>
                      <span className="font-medium text-foreground">{order.orderNumber}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{order.customer?.name || "Unknown"}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-foreground">{order.items?.length || 0} items</span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }) : "-"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(order.status))}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-lg font-semibold text-foreground">
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => onViewOrder?.(order.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600"
                        onClick={() => onEditOrder?.(order.id)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuItem onClick={() => onViewOrder?.(order.id)} className="rounded-lg">
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditOrder?.(order.id)} className="rounded-lg">
                            <Edit className="size-4 mr-2" />
                            Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onCreateDeliveryChallan?.(order.id)} className="rounded-lg">
                            <Truck className="size-4 mr-2" />
                            Create Delivery Challan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvert(order.id)} className="rounded-lg">
                            <ArrowRightCircle className="size-4 mr-2" />
                            Convert to Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Downloading PDF...")} className="rounded-lg">
                            <Download className="size-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive rounded-lg"
                            onClick={() => handleDeleteClick(order)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <FileText className="size-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-1">No sales orders found</p>
                <p className="text-muted-foreground">Create your first sales order to get started</p>
              </div>
              <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                <Plus className="size-4" />
                Create First Order
              </Button>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{order.orderNumber}</h3>
                    <p className="text-sm text-muted-foreground">{order.customer?.name || "Unknown"}</p>
                  </div>
                </div>
                <Badge className={cn("rounded-full px-3 py-1", getStatusColor(order.status))}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">
                    {new Date(order.orderDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Items</p>
                  <p className="font-medium">{order.items?.length || 0} items</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Amount</p>
                  <p className="text-xl font-bold text-indigo-600">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onViewOrder?.(order.id)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onEditOrder?.(order.id)}
                >
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => onCreateDeliveryChallan?.(order.id)} className="rounded-lg">
                      <Truck className="size-4 mr-2" />
                      Create DC
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleConvert(order.id)} className="rounded-lg">
                      <ArrowRightCircle className="size-4 mr-2" />
                      Convert to Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Downloading PDF...")} className="rounded-lg">
                      <Download className="size-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive rounded-lg"
                      onClick={() => handleDeleteClick(order)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{orderToDelete?.orderNumber}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
