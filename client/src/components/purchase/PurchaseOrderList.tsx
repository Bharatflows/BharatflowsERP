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
  ArrowRightCircle,
  FileDown,
  Sheet,
  ChevronDown,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  FileText,
  IndianRupee, // Ensuring IndianRupee is imported for StatsCard
} from "lucide-react";
import { DataTable } from "../ui/data-table";
import { ListFilters } from "../ui/ListFilters";
import { exportToCSV, exportToExcel, exportToPDF } from "../../lib/exportUtils";
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
import { StatsCard, StatsCardSkeleton } from "../ui/stats-card";
import { Skeleton } from "../ui/skeleton";

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
  onCreateNew?: () => void;
  onViewOrder?: (id: string) => void;
  onEditOrder?: (id: string) => void;
  hideStats?: boolean;
}

export function PurchaseOrderList({
  onCreateNew,
  onViewOrder,
  onEditOrder,
  hideStats = false,
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

  // Robust array extraction — handles different API response shapes
  const orders: PurchaseOrder[] = (() => {
    const extractArr = (resp: any): any[] => {
      if (!resp) return [];
      if (Array.isArray(resp)) return resp;
      for (const key of ['docs', 'data', 'items', 'orders']) {
        if (Array.isArray(resp[key])) return resp[key];
      }
      return [];
    };
    return extractArr(ordersData).map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      supplierName: order.supplier?.name || 'Unknown Supplier',
      orderDate: order.orderDate,
      expectedDate: order.expectedDate || order.orderDate,
      amount: Number(order.totalAmount || 0),
      status: (order.status || 'draft').toLowerCase(),
      itemsCount: (order.items || []).length
    }));
  })();

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
        return "badge-draft";
      case "sent":
        return "badge-sent";
      case "received":
        return "badge-paid";
      case "partial":
        return "badge-partial";
      case "cancelled":
        return "badge-cancelled";
      default:
        return "badge-draft";
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

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
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

  const handleExportCSV = () => {
    const dataToExport = filteredOrders.map(o => ({
      'Order Number': o.orderNumber,
      'Supplier': o.supplierName,
      'Order Date': new Date(o.orderDate).toLocaleDateString("en-IN"),
      'Expected Date': new Date(o.expectedDate).toLocaleDateString("en-IN"),
      'Amount': o.amount,
      'Status': o.status
    }));
    exportToCSV(dataToExport, 'PurchaseOrders_Export');
  };

  const handleExportExcel = () => {
    const dataToExport = filteredOrders.map(o => ({
      'Order Number': o.orderNumber,
      'Supplier': o.supplierName,
      'Order Date': new Date(o.orderDate).toLocaleDateString("en-IN"),
      'Expected Date': new Date(o.expectedDate).toLocaleDateString("en-IN"),
      'Amount': o.amount,
      'Status': o.status
    }));
    exportToExcel(dataToExport, 'PurchaseOrders_Export');
  };

  const handleExportPDF = () => {
    const columns = ['Order Number', 'Supplier', 'Order Date', 'Expected Date', 'Amount', 'Status'];
    const data = filteredOrders.map(o => [
      o.orderNumber,
      o.supplierName,
      new Date(o.orderDate).toLocaleDateString("en-IN"),
      new Date(o.expectedDate).toLocaleDateString("en-IN"),
      formatCurrency(o.amount),
      o.status
    ]);
    exportToPDF({ title: 'Purchase Orders', columns, data, filename: 'PurchaseOrders_Export' });
  };

  // Column Definitions
  const columns = [
    {
      header: "Order Details",
      cell: (order: PurchaseOrder) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            <ShoppingCart className="size-4" />
          </div>
          <div>
            <p className="font-medium text-foreground">{order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">{order.itemsCount} items</p>
          </div>
        </div>
      ),
    },
    {
      header: "Supplier",
      cell: (order: PurchaseOrder) => (
        <p className="font-medium text-foreground">{order.supplierName}</p>
      ),
    },
    {
      header: "Order Date",
      cell: (order: PurchaseOrder) => (
        <p className="text-foreground">
          {new Date(order.orderDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      ),
    },
    {
      header: "Expected Date",
      cell: (order: PurchaseOrder) => (
        <p className="text-foreground">
          {new Date(order.expectedDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      ),
    },
    {
      header: "Amount",
      className: "text-right",
      cell: (order: PurchaseOrder) => (
        <p className="text-lg font-semibold text-foreground">
          {formatCurrency(order.amount)}
        </p>
      ),
    },
    {
      header: "Status",
      className: "text-center",
      cell: (order: PurchaseOrder) => (
        <div className="flex justify-center">
          <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(order.status))}>
            {getStatusIcon(order.status)}
            {(order.status || 'draft').charAt(0).toUpperCase() + (order.status || 'draft').slice(1)}
          </Badge>
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (order: PurchaseOrder) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-view"
            onClick={() => onViewOrder?.(order.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-edit"
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
              <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
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
      ),
    },
  ];

  // Mobile Renderer
  const renderMobileItem = (order: PurchaseOrder) => (
    <div
      key={order.id}
      className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onViewOrder?.(order.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold shadow-sm">
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
            {(order.status || 'draft').charAt(0).toUpperCase() + (order.status || 'draft').slice(1)}
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
          <p className="text-xl font-bold text-primary">
            {formatCurrency(order.amount)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onViewOrder?.(order.id); }}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onEditOrder?.(order.id); }}
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
  );

  return (
    <div className="space-y-6">
      {/* Premium Summary Cards */}
      {!hideStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Orders"
            value={totalOrders}
            icon={ShoppingCart}
            gradient="bg-gradient-to-br from-primary to-primary/80"
            shadowColor="shadow-primary/20"
          />
          <StatsCard
            label="Total Value"
            value={totalValue >= 10000000
              ? `${(totalValue / 10000000).toFixed(2)}Cr`
              : totalValue >= 100000
                ? `${(totalValue / 100000).toFixed(2)}L`
                : formatCurrency(totalValue)}
            prefix=""
            icon={IndianRupee}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            shadowColor="shadow-emerald-500/20"
          />
          <StatsCard
            label="Pending"
            value={pendingOrders}
            icon={Clock}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
            shadowColor="shadow-amber-500/20"
          />
          <StatsCard
            label="Received"
            value={receivedOrders}
            icon={CheckCircle}
            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
            shadowColor="shadow-teal-500/20"
          />
        </div>
      )}

      {/* List Filters */}
      <ListFilters
        searchPlaceholder="Search by order number or supplier..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={handleRefresh}
        isFetching={isFetching}
        statusOptions={[
          { value: "draft", label: "Draft" },
          { value: "sent", label: "Sent" },
          { value: "received", label: "Received" },
          { value: "partial", label: "Partial" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-11 rounded-xl">
              <Download className="size-4" />
              Export
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={handleExportCSV} className="rounded-lg">
              <FileDown className="size-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel} className="rounded-lg">
              <Sheet className="size-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
              <FileText className="size-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ListFilters>

      <DataTable
        data={filteredOrders}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={loading}
        onRowClick={(order) => onViewOrder?.(order.id)}
        emptyState={{
          title: "No purchase orders found",
          description: "Create your first purchase order to get started",
          icon: ShoppingCart,
          action: (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Create First Order
            </Button>
          ),
        }}
      />

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
