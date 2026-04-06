import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSalesOrders, useDeleteSalesOrder, useUpdateSalesOrder, salesKeys } from "../../hooks/useSales";
import { useQueryClient } from "@tanstack/react-query";
import { salesOrdersService } from "../../services/modules.service";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle,
  Clock,
  Package,
  XCircle,
  IndianRupee,
  Truck,
  ArrowRightCircle,
  Download,
  Eye,
  Edit,
  MoreVertical,
  Trash2,
  Plus,
  FileDown,
  ChevronDown,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { ListFilters } from "@/components/ui/ListFilters";
import { exportToCSV, exportToExcel, exportToPDF, formatCurrency, formatDate } from "../../lib/exportUtils";
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
import type { SalesOrder } from "../../types";
import { SmartCard } from "@/components/ui/SmartCard";

interface SalesOrderListProps {
  salesOrders?: SalesOrder[];
  onCreateNew?: () => void;
  onViewOrder?: (id: string) => void;
  onEditOrder?: (id: string) => void;
  onCreateDeliveryChallan?: (orderId: string) => void;
  onRefresh?: () => void;
  hideStats?: boolean;
}

export function SalesOrderList({
  salesOrders: propSalesOrders,
  onCreateNew,
  onViewOrder,
  onEditOrder,
  onCreateDeliveryChallan,
  onRefresh,
  hideStats = false
}: SalesOrderListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<SalesOrder | null>(null);

  // TanStack Query
  const { data: ordersData, isLoading, isFetching, refetch } = useSalesOrders();
  const deleteMutation = useDeleteSalesOrder();
  // const updateStatusMutation = useUpdateSalesOrder(); // Unused

  // Map API response
  const rawData: any = ordersData;
  const rawOrders = propSalesOrders || rawData?.data?.orders || rawData?.data || rawData || [];
  const sourceOrders = Array.isArray(rawOrders) ? rawOrders : [];
  const orders: (SalesOrder & { customerName?: string })[] = sourceOrders.map((order: any) => ({
    ...order,
    customerName: order.customer?.name || 'Unknown',
    totalAmount: Number(order.totalAmount || 0)
  }));

  const handleDeleteClick = (order: SalesOrder) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setOrderToDelete(null);
        }
      });
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
    refetch();
    onRefresh?.();
  };

  const handleConvertToChallan = async (id: string) => {
    if (window.confirm("Are you sure you want to create a Delivery Challan from this order?")) {
      try {
        await salesOrdersService.convertToChallan(id);
        toast.success("Delivery Challan created successfully");
        onCreateDeliveryChallan?.(id);
        handleRefresh();
      } catch (error) {
        console.error("Failed to create challan:", error);
        toast.error("Failed to create delivery challan");
      }
    }
  };

  const handleConvert = async (id: string) => {
    if (window.confirm("Are you sure you want to convert this sales order to an invoice?")) {
      try {
        const response = await salesOrdersService.convert(id);
        const invoice = response.data;
        toast.success("Sales order converted to invoice successfully");
        if (invoice && invoice.id) {
          navigate(`/sales/invoices/${invoice.id}/edit`);
        }
        handleRefresh();
      } catch (error) {
        console.error("Failed to convert sales order:", error);
        toast.error("Failed to convert sales order");
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const s = order.status?.toLowerCase() || "";
    const matchesStatus = statusFilter === "all" || s === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string | undefined) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "draft": return "badge-draft";
      case "confirmed": return "badge-sent";
      case "partially fulfilled": return "badge-partial";
      case "fulfilled": return "badge-paid";
      case "cancelled": return "badge-cancelled";
      default: return "badge-draft";
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "draft": return <FileText className="size-3" />;
      case "confirmed": return <CheckCircle className="size-3" />;
      case "partially fulfilled": return <Clock className="size-3" />;
      case "fulfilled": return <Package className="size-3" />;
      case "cancelled": return <XCircle className="size-3" />;
      default: return null;
    }
  };

  // Stats
  const totalOrders = orders.length;
  // const confirmedOrders = orders.filter((o) => o.status?.toLowerCase() === "confirmed").length;
  const pendingOrders = orders.filter((o) => o.status?.toLowerCase() === "draft" || o.status?.toLowerCase() === "pending").length;
  // const partialOrders = orders.filter((o) => o.status?.toLowerCase() === "partially fulfilled").length;
  const fulfilledOrders = orders.filter((o) => o.status?.toLowerCase() === "fulfilled").length;
  const totalValue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);

  const stats = {
    total: totalOrders,
    pending: pendingOrders,
    delivered: fulfilledOrders,
    totalValue: totalValue
  };

  const handleExportCSV = () => {
    const data = filteredOrders.map(o => ({
      'Order #': o.orderNumber,
      'Customer': o.customer?.name,
      'Date': formatDate(o.orderDate),
      'Amount': o.totalAmount,
      'Status': o.status
    }));
    exportToCSV(data, 'SalesOrders');
  };

  const handleExportExcel = () => {
    // Reusing same data logic
    const data = filteredOrders.map(o => ({
      'Order #': o.orderNumber,
      'Customer': o.customer?.name,
      'Date': formatDate(o.orderDate),
      'Amount': o.totalAmount,
      'Status': o.status
    }));
    exportToExcel(data, 'SalesOrders');
  };

  const handleExportPDF = () => {
    const columns = ['Order #', 'Customer', 'Date', 'Amount', 'Status'];
    const data = filteredOrders.map(o => [
      o.orderNumber,
      o.customer?.name || '-',
      formatDate(o.orderDate),
      formatCurrency(Number(o.totalAmount)),
      o.status
    ]);
    exportToPDF({ title: 'Sales Orders', columns, data, filename: 'SalesOrders' });
  };

  const columns: any[] = [
    {
      header: "Order Number",
      accessorKey: "orderNumber",
      cell: (order: SalesOrder) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            <FileText className="size-4" />
          </div>
          <span className="font-medium text-foreground">{order.orderNumber}</span>
        </div>
      )
    },
    {
      header: "Customer",
      id: "customer",
      cell: (order: SalesOrder & { customerName?: string }) => (
        <span className="font-medium text-foreground">{order.customerName || order.customer?.name || "Unknown"}</span>
      )
    },
    {
      header: "Date",
      accessorKey: "orderDate",
      cell: (order: SalesOrder) => (
        <span className="text-muted-foreground">{formatDate(order.orderDate)}</span>
      )
    },
    {
      header: "Items",
      className: "text-center",
      cell: (order: SalesOrder) => (
        <span className="text-foreground">{order.items?.length || 0} items</span>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cell: (order: SalesOrder) => (
        <div className="flex justify-center">
          <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(order.status))}>
            {getStatusIcon(order.status)}
            {order.status}
          </Badge>
        </div>
      )
    },
    {
      header: "Amount",
      className: "text-right",
      accessorKey: "totalAmount",
      cell: (order: SalesOrder) => (
        <span className="text-lg font-semibold text-foreground">
          {formatCurrency(Number(order.totalAmount))}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (order: SalesOrder) => (
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
                View Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditOrder?.(order.id)} className="rounded-lg">
                <Edit className="size-4 mr-2" />
                Edit Order
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleConvert(order.id)} className="rounded-lg">
                <ArrowRightCircle className="size-4 mr-2" />
                Convert to Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleConvertToChallan(order.id)} className="rounded-lg">
                <Truck className="size-4 mr-2" />
                Convert to Challan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleConvertToChallan(order.id)} className="rounded-lg">
                <Truck className="size-4 mr-2" />
                Convert to Challan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
                <FileDown className="size-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateDeliveryChallan?.(order.id)} className="rounded-lg">
                <Truck className="size-4 mr-2" />
                Create Challan
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
      )
    }
  ];

  const renderMobileItem = (row: SalesOrder & { customerName?: string }) => (
    <SmartCard
      title={row.customerName || row.customer?.name || "Unknown Customer"}
      subtitle={row.orderNumber}
      density="compact"
      action={
        <Badge variant="outline" className={cn("capitalize px-2 py-0.5", getStatusColor(row.status))}>
          {row.status}
        </Badge>
      }
      onClick={() => onViewOrder?.(row.id)}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Date</span>
            <span className="text-sm font-medium">{formatDate(row.orderDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">
              {formatCurrency(row.totalAmount)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditOrder?.(row.id)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeleteClick(row)} className="text-destructive focus:text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      }
    >
      <div className="text-sm text-muted-foreground">
        {/* Content */}
      </div>
    </SmartCard>
  );

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1 pb-2">
        <StatsCard
          label="Total Orders"
          value={stats.total}
          icon={FileText}
          className="p-4"
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          className="p-4"
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          shadowColor="shadow-amber-500/20"
        />
        <StatsCard
          label="Delivered"
          value={stats.delivered}
          icon={CheckCircle}
          className="p-4"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
        <StatsCard
          label="Total Value"
          value={formatCurrency(stats.totalValue)}
          icon={IndianRupee}
          className="p-4"
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
      </div>

      <ListFilters
        searchPlaceholder="Search orders..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: "all", label: "All Status" },
          { value: "pending", label: "Pending" },
          { value: "confirmed", label: "Confirmed" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        onRefresh={handleRefresh}
        isFetching={isLoading}
        className="border-none p-0 shadow-none bg-transparent"
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
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ListFilters>

      <DataTable
        data={filteredOrders}
        columns={columns as any}
        mobileRenderer={renderMobileItem}
        isLoading={isLoading}
        onRowClick={(row) => onViewOrder?.(row.id)}
        emptyState={{
          title: "No sales orders found",
          description: "Create your first sales order to get started",
          icon: FileText,
          action: onCreateNew ? (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Create First Order
            </Button>
          ) : undefined
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{orderToDelete?.orderNumber}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
