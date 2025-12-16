import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePurchaseOrders, useDeletePurchaseOrder, useUpdatePurchaseOrderStatus, purchaseKeys } from "../../hooks/usePurchase";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import { cn } from "../../lib/utils";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  amount: number;
  status: "draft" | "sent" | "received" | "partial" | "cancelled";
  itemsCount: number;
}

interface PurchaseOrderListProps {
  onCreateNew: () => void;
  onViewOrder: (id: string) => void;
  onEditOrder: (id: string) => void;
}

export function PurchaseOrderList({
  onCreateNew,
  onViewOrder,
  onEditOrder,
}: PurchaseOrderListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TanStack Query - automatic caching, loading states, and refetching
  const { data: ordersData, isLoading: loading, isFetching, refetch } = usePurchaseOrders();
  const deleteMutation = useDeletePurchaseOrder();
  const statusMutation = useUpdatePurchaseOrderStatus();

  // Map API response to component format
  const orders: PurchaseOrder[] = (ordersData?.data || []).map((order: any) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    supplierName: order.supplier?.name || 'Unknown Supplier',
    orderDate: order.orderDate,
    expectedDate: order.expectedDate || order.orderDate,
    amount: Number(order.totalAmount || 0),
    status: (order.status || 'draft').toLowerCase(),
    itemsCount: (order.items || []).length
  }));

  const handleConvertToGRN = (id: string) => {
    navigate(`/purchase/grn/new?orderId=${id}`);
  };

  const handleConvertToBill = (id: string) => {
    navigate(`/purchase/bills/new?orderId=${id}`);
  };

  const handleDeleteClick = (order: PurchaseOrder) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.id);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
    refetch();
  };

  const handleUpdateStatus = (id: string, status: string) => {
    statusMutation.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
      case "sent":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "received":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "partial":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "cancelled":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="size-3" />;
      case "sent":
        return <Clock className="size-3" />;
      case "received":
        return <CheckCircle className="size-3" />;
      case "partial":
        return <Package className="size-3" />;
      case "cancelled":
        return <XCircle className="size-3" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "sent":
        return "Sent";
      case "received":
        return "Received";
      case "partial":
        return "Partial";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, order) => sum + order.amount, 0);
  const pendingOrders = orders.filter(
    (o) => o.status === "sent" || o.status === "partial"
  ).length;
  const receivedOrders = orders.filter((o) => o.status === "received").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Orders</span>
            </div>
            <h3 className="text-3xl font-bold">{totalOrders}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Value</span>
            </div>
            <h3 className="text-2xl font-bold">
              {totalValue >= 100000
                ? `₹${(totalValue / 100000).toFixed(1)}L`
                : `₹${totalValue.toLocaleString("en-IN")}`}
            </h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Pending</span>
            </div>
            <h3 className="text-3xl font-bold">{pendingOrders}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Received</span>
            </div>
            <h3 className="text-3xl font-bold">{receivedOrders}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or supplier..."
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
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2 h-11 rounded-xl"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
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
              <th className="px-5 py-4 text-left font-semibold text-foreground">Order Details</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Supplier</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Order Date</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Expected Date</th>
              <th className="px-5 py-4 text-right font-semibold text-foreground">Amount</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Status</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="size-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1">No purchase orders found</p>
                      <p className="text-muted-foreground">Create your first purchase order to get started</p>
                    </div>
                    <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                      <Plus className="size-4" />
                      Create First Purchase Order
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
                        <ShoppingCart className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.itemsCount} items</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{order.supplierName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-foreground">
                      {new Date(order.orderDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-foreground">
                      {new Date(order.expectedDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-lg font-semibold text-foreground">
                      ₹{order.amount.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(order.status))}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => onViewOrder(order.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600"
                        onClick={() => onEditOrder(order.id)}
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
                          <DropdownMenuItem onClick={() => onViewOrder(order.id)} className="rounded-lg">
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditOrder(order.id)} className="rounded-lg">
                            <Edit className="size-4 mr-2" />
                            Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <Download className="size-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'SENT')} className="rounded-lg">
                              <Clock className="size-4 mr-2" />
                              Send to Supplier
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleConvertToGRN(order.id)} className="rounded-lg">
                            <Package className="size-4 mr-2" />
                            Mark as Received (GRN)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvertToBill(order.id)} className="rounded-lg">
                            <FileText className="size-4 mr-2" />
                            Create Purchase Bill
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status !== "cancelled" && order.status !== "received" && (
                            <DropdownMenuItem
                              className="text-orange-600 focus:text-orange-600 rounded-lg"
                              onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                            >
                              <XCircle className="size-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                          )}
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
                <ShoppingCart className="size-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-1">No purchase orders found</p>
                <p className="text-muted-foreground">Create your first purchase order to get started</p>
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
                    <ShoppingCart className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{order.orderNumber}</h3>
                    <p className="text-sm text-muted-foreground">{order.supplierName}</p>
                  </div>
                </div>
                <Badge className={cn("rounded-full px-3 py-1", getStatusColor(order.status))}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.orderDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Expected</p>
                  <p className="font-medium">
                    {new Date(order.expectedDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Items</p>
                  <p className="font-medium">{order.itemsCount} items</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Amount</p>
                  <p className="text-xl font-bold text-indigo-600">
                    ₹{order.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onViewOrder(order.id)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onEditOrder(order.id)}
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
                    <DropdownMenuItem onClick={() => handleConvertToGRN(order.id)} className="rounded-lg">
                      <Package className="size-4 mr-2" />
                      Create GRN
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleConvertToBill(order.id)} className="rounded-lg">
                      <FileText className="size-4 mr-2" />
                      Create Bill
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

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-border p-4">
          <p className="text-muted-foreground text-sm">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="rounded-xl">
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{orderToDelete?.orderNumber}</span>?
              This action cannot be undone and will remove all associated data.
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
