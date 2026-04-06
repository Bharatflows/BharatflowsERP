import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deliveryChallansService } from "../../services/modules.service";
import { toast } from "sonner";
import type { DeliveryChallan } from "../../types";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Truck,
  FileText,
  Package,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  ArrowRightCircle,
  XCircle,
  FileDown,
  Sheet,
  ChevronDown
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { ListFilters } from "@/components/ui/ListFilters";
import { exportToCSV, exportToExcel, exportToPDF, formatDate } from "../../lib/exportUtils";
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

interface DeliveryChallanListProps {
  challans: DeliveryChallan[];
  onCreateNew: () => void;
  onViewChallan: (id: string) => void;
  onEditChallan: (id: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function DeliveryChallanList({
  challans,
  onCreateNew,
  onViewChallan,
  onEditChallan,
  onRefresh,
  isLoading = false
}: DeliveryChallanListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState<DeliveryChallan | null>(null);

  const safeChallans = challans || [];

  const handleDeleteClick = (challan: DeliveryChallan) => {
    setChallanToDelete(challan);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (challanToDelete) {
      try {
        await deliveryChallansService.delete(challanToDelete.id);
        toast.success("Delivery challan deleted successfully");
        onRefresh?.();
      } catch (error) {
        console.error("Failed to delete delivery challan:", error);
        toast.error("Failed to delete delivery challan");
      }
      setDeleteDialogOpen(false);
      setChallanToDelete(null);
    }
  };

  const handleConvert = async (id: string) => {
    if (window.confirm("Are you sure you want to convert this delivery challan to an invoice?")) {
      try {
        const response = await deliveryChallansService.convert(id);
        toast.success("Delivery challan converted to invoice successfully");
        const invoice = response?.data || response;
        if (invoice && (invoice as any).id) {
          navigate(`/sales/invoices/${(invoice as any).id}/edit`);
        }
        onRefresh?.();
      } catch (error) {
        console.error("Failed to convert delivery challan:", error);
        toast.error("Failed to convert delivery challan");
      }
    }
  };

  const getStatusColor = (status: DeliveryChallan["status"]) => {
    switch (status) {
      case "Delivered": return "badge-paid";
      case "In Transit": return "badge-partial";
      case "Returned": return "badge-overdue";
      case "Dispatched": return "badge-sent";
      default: return "badge-draft";
    }
  };

  const getStatusIcon = (status: DeliveryChallan["status"]) => {
    switch (status) {
      case "Delivered": return <CheckCircle className="size-3" />;
      case "In Transit": return <Truck className="size-3" />;
      case "Returned": return <XCircle className="size-3" />;
      case "Dispatched": return <Package className="size-3" />;
      default: return <Clock className="size-3" />;
    }
  };

  const filteredChallans = safeChallans.filter((challan) => {
    const matchesSearch =
      challan.challanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (challan.customer?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || challan.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: safeChallans.length,
    dispatched: safeChallans.filter((c) => c.status?.toLowerCase() === "dispatched").length,
    inTransit: safeChallans.filter((c) => c.status?.toLowerCase() === "in transit").length,
    delivered: safeChallans.filter((c) => c.status?.toLowerCase() === "delivered").length,
  };

  const handleExportCSV = () => {
    const data = filteredChallans.map(c => ({
      'Challan #': c.challanNumber,
      'Customer': c.customer?.name || 'Unknown',
      'Date': formatDate(c.date),
      'Sales Order': c.salesOrder?.orderNumber || '-',
      'Items': c.items?.length || 0,
      'Total Qty': c.totalQuantity || 0,
      'Status': c.status
    }));
    exportToCSV(data, 'DeliveryChallans');
  };

  const handleExportExcel = () => {
    const data = filteredChallans.map(c => ({
      'Challan #': c.challanNumber,
      'Customer': c.customer?.name || 'Unknown',
      'Date': formatDate(c.date),
      'Sales Order': c.salesOrder?.orderNumber || '-',
      'Items': c.items?.length || 0,
      'Total Qty': c.totalQuantity || 0,
      'Status': c.status
    }));
    exportToExcel(data, 'DeliveryChallans');
  };

  const handleExportPDF = () => {
    const columns = ['Challan #', 'Customer', 'Date', 'Sales Order', 'Items', 'Total Qty', 'Status'];
    const data = filteredChallans.map(c => [
      c.challanNumber,
      c.customer?.name || 'Unknown',
      formatDate(c.date),
      c.salesOrder?.orderNumber || '-',
      c.items?.length || 0,
      c.totalQuantity || 0,
      c.status
    ]);
    exportToPDF({ title: 'Delivery Challans', columns, data, filename: 'DeliveryChallans' });
  };

  const columns = [
    {
      header: "Challan No.",
      cell: (challan: DeliveryChallan) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            <Truck className="size-4" />
          </div>
          <span className="font-medium text-foreground">{challan.challanNumber}</span>
        </div>
      )
    },
    {
      header: "Customer",
      cell: (challan: DeliveryChallan) => (
        <span className="font-medium text-foreground">{challan.customer?.name || "Unknown"}</span>
      )
    },
    {
      header: "Date",
      cell: (challan: DeliveryChallan) => (
        <span className="text-muted-foreground">{formatDate(challan.date)}</span>
      )
    },
    {
      header: "Sales Order",
      cell: (challan: DeliveryChallan) => (
        <span className="text-muted-foreground">{challan.salesOrder?.orderNumber || "-"}</span>
      )
    },
    {
      header: "Items",
      className: "text-center",
      cell: (challan: DeliveryChallan) => (
        <span className="text-foreground">{challan.items?.length || 0}</span>
      )
    },
    {
      header: "Qty",
      className: "text-center",
      cell: (challan: DeliveryChallan) => (
        <span className="text-foreground font-medium">{challan.totalQuantity || 0}</span>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cell: (challan: DeliveryChallan) => (
        <div className="flex justify-center">
          <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(challan.status))}>
            {getStatusIcon(challan.status)}
            {challan.status}
          </Badge>
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (challan: DeliveryChallan) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-view"
            onClick={() => onViewChallan(challan.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-edit"
            onClick={() => onEditChallan(challan.id)}
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
              <DropdownMenuItem onClick={() => onViewChallan(challan.id)} className="rounded-lg">
                <Eye className="size-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditChallan(challan.id)} className="rounded-lg">
                <Edit className="size-4 mr-2" />
                Edit Challan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info("Tracking shipment...")} className="rounded-lg">
                <Truck className="size-4 mr-2" />
                Track Shipment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleConvert(challan.id)} className="rounded-lg">
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
                onClick={() => handleDeleteClick(challan)}
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

  const renderMobileItem = (challan: DeliveryChallan) => (
    <div
      key={challan.id}
      className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onViewChallan(challan.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold shadow-sm">
            <Truck className="size-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{challan.challanNumber}</h3>
            <p className="text-sm text-muted-foreground">{challan.customer?.name || "Unknown"}</p>
          </div>
        </div>
        <Badge className={cn("rounded-full px-3 py-1", getStatusColor(challan.status))}>
          <span className="flex items-center gap-1">
            {getStatusIcon(challan.status)}
            {challan.status}
          </span>
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Date</p>
          <p className="font-medium">{formatDate(challan.date)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Items</p>
          <p className="font-medium">{challan.items?.length || 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Qty</p>
          <p className="font-medium">{challan.totalQuantity || 0}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onViewChallan(challan.id); }}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onEditChallan(challan.id); }}
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
            <DropdownMenuItem onClick={() => toast.info("Tracking shipment...")} className="rounded-lg">
              <Truck className="size-4 mr-2" />
              Track Shipment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleConvert(challan.id)} className="rounded-lg">
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
              onClick={() => handleDeleteClick(challan)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Challans"
          value={stats.total}
          icon={FileText}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="Dispatched"
          value={stats.dispatched}
          icon={Package}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="In Transit"
          value={stats.inTransit}
          icon={Truck}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          shadowColor="shadow-amber-500/20"
        />
        <StatsCard
          label="Delivered"
          value={stats.delivered}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
      </div>

      <ListFilters
        searchPlaceholder="Search by challan number or customer..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={onRefresh}
        statusOptions={[
          { value: "Draft", label: "Draft" },
          { value: "Dispatched", label: "Dispatched" },
          { value: "In Transit", label: "In Transit" },
          { value: "Delivered", label: "Delivered" },
          { value: "Returned", label: "Returned" },
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
              <FileDown className="size-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ListFilters>

      <DataTable
        data={filteredChallans}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={isLoading}
        onRowClick={(challan) => onViewChallan(challan.id)}
        emptyState={{
          title: "No delivery challans found",
          description: "Create your first delivery challan to get started",
          icon: Truck,
          action: (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Create First Challan
            </Button>
          )
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Challan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{challanToDelete?.challanNumber}</span>?
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
