import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { estimatesService } from "../../services/modules.service";
import { toast } from "sonner";
import type { Estimate } from "../../types";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Plus,
  ArrowRightCircle,
  FileDown,
  Sheet,
  ChevronDown,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { ListFilters } from "@/components/ui/ListFilters";
import { formatCurrency, formatDate, exportToCSV, exportToExcel, exportToPDF } from "../../lib/exportUtils";
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
import { Skeleton } from "../ui/skeleton";

interface EstimateListProps {
  estimates: Estimate[];
  onCreateNew: () => void;
  onViewEstimate: (id: string) => void;
  onEditEstimate: (id: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function EstimateList({ estimates, onCreateNew, onViewEstimate, onEditEstimate, onRefresh, isLoading = false }: EstimateListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<Estimate | null>(null);

  const handleDeleteClick = (estimate: Estimate) => {
    setEstimateToDelete(estimate);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (estimateToDelete) {
      try {
        await estimatesService.delete(estimateToDelete.id);
        toast.success("Estimate deleted successfully");
        onRefresh?.();
      } catch (error) {
        console.error("Failed to delete estimate:", error);
        toast.error("Failed to delete estimate");
      }
      setDeleteDialogOpen(false);
      setEstimateToDelete(null);
    }
  };

  const handleConvert = async (id: string) => {
    if (window.confirm("Are you sure you want to convert this estimate to an invoice?")) {
      try {
        const response = await estimatesService.convert(id);
        const invoice = response.data;
        toast.success("Estimate converted to invoice successfully");
        if (invoice && invoice.id) {
          navigate(`/sales/invoices/${invoice.id}/edit`);
        }
        onRefresh?.();
      } catch (error) {
        console.error("Failed to convert estimate:", error);
        toast.error("Failed to convert estimate");
      }
    }
  };

  const getStatusColor = (status: Estimate["status"]) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "converted":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-muted text-foreground border-slate-200";
    }
  };

  const getStatusIcon = (status: Estimate["status"]) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="size-3" />;
      case "pending":
        return <Clock className="size-3" />;
      case "rejected":
        return <XCircle className="size-3" />;
      case "converted":
        return <ArrowRightCircle className="size-3" />;
      default:
        return null;
    }
  };

  const filteredEstimates = estimates.filter((estimate) => {
    const matchesSearch =
      estimate.estimateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (estimate.customer?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || estimate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredEstimates.reduce((sum, est) => sum + Number(est.totalAmount), 0);
  const pendingCount = filteredEstimates.filter((e) => e.status?.toLowerCase() === "pending").length;
  const acceptedCount = filteredEstimates.filter((e) => e.status?.toLowerCase() === "accepted").length;

  const handleExportCSV = () => {
    const dataToExport = filteredEstimates.map(est => ({
      'Estimate Number': est.estimateNumber,
      'Customer': est.customer?.name || 'Unknown',
      'Date': formatDate(est.date),
      'Valid Until': formatDate(est.validUntil),
      'Amount': est.totalAmount,
      'Status': est.status,
    }));
    exportToCSV(dataToExport, 'Estimates_Export');
  };

  const handleExportExcel = () => {
    const dataToExport = filteredEstimates.map(est => ({
      'Estimate Number': est.estimateNumber,
      'Customer': est.customer?.name || 'Unknown',
      'Date': formatDate(est.date),
      'Valid Until': formatDate(est.validUntil),
      'Amount': est.totalAmount,
      'Status': est.status,
    }));
    exportToExcel(dataToExport, 'Estimates_Export');
  };

  const handleExportPDF = () => {
    const columns = ['Estimate Number', 'Customer', 'Date', 'Valid Until', 'Amount', 'Status'];
    const data = filteredEstimates.map(est => [
      est.estimateNumber,
      est.customer?.name || 'Unknown',
      formatDate(est.date),
      formatDate(est.validUntil),
      formatCurrency(est.totalAmount),
      est.status
    ]);
    exportToPDF({ title: 'Estimates List', columns, data, filename: 'Estimates_Export' });
  };

  // Column Definitions
  const columns = [
    {
      header: "Estimate No.",
      cell: (estimate: Estimate) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            <FileText className="size-4" />
          </div>
          <span className="font-medium text-primary">{estimate.estimateNumber}</span>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (estimate: Estimate) => (
        <span className="font-medium text-foreground">
          {estimate.customer?.name || "Unknown"}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (estimate: Estimate) => (
        <span className="text-muted-foreground">
          {formatDate(estimate.date)}
        </span>
      ),
    },
    {
      header: "Valid Until",
      cell: (estimate: Estimate) => (
        <span className="text-muted-foreground">
          {formatDate(estimate.validUntil)}
        </span>
      ),
    },
    {
      header: "Amount",
      className: "text-right",
      cell: (estimate: Estimate) => (
        <span className="text-lg font-semibold text-foreground">
          {formatCurrency(estimate.totalAmount)}
        </span>
      ),
    },
    {
      header: "Status",
      className: "text-center",
      cell: (estimate: Estimate) => (
        <div className="flex justify-center">
          <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(estimate.status))}>
            {getStatusIcon(estimate.status)}
            {(estimate.status || 'draft').charAt(0).toUpperCase() + (estimate.status || 'draft').slice(1)}
          </Badge>
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (estimate: Estimate) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-view"
            onClick={() => onViewEstimate(estimate.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-edit"
            onClick={() => onEditEstimate(estimate.id)}
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
              <DropdownMenuItem onClick={() => onViewEstimate(estimate.id)} className="rounded-lg">
                <Eye className="size-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditEstimate(estimate.id)} className="rounded-lg">
                <Edit className="size-4 mr-2" />
                Edit Estimate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleConvert(estimate.id)} className="rounded-lg">
                <ArrowRightCircle className="size-4 mr-2" />
                Convert to Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF()} className="rounded-lg">
                <Download className="size-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive rounded-lg"
                onClick={() => handleDeleteClick(estimate)}
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
  const renderMobileItem = (estimate: Estimate) => (
    <div
      key={estimate.id}
      className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onViewEstimate(estimate.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold shadow-sm">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{estimate.estimateNumber}</h3>
            <p className="text-sm text-muted-foreground">{estimate.customer?.name || "Unknown"}</p>
          </div>
        </div>
        <Badge className={cn("rounded-full px-3 py-1", getStatusColor(estimate.status))}>
          <span className="flex items-center gap-1">
            {getStatusIcon(estimate.status)}
            {(estimate.status || 'draft').charAt(0).toUpperCase() + (estimate.status || 'draft').slice(1)}
          </span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Date</p>
          <p className="font-medium">
            {formatDate(estimate.date)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Valid Until</p>
          <p className="font-medium">
            {formatDate(estimate.validUntil)}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground mb-1">Amount</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(estimate.totalAmount)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onViewEstimate(estimate.id); }}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onEditEstimate(estimate.id); }}
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
            <DropdownMenuItem onClick={() => handleConvert(estimate.id)} className="rounded-lg">
              <ArrowRightCircle className="size-4 mr-2" />
              Convert
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
              <Download className="size-4 mr-2" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive rounded-lg"
              onClick={() => handleDeleteClick(estimate)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Estimates"
          value={filteredEstimates.length}
          icon={FileText}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="Total Value"
          value={totalAmount >= 10000000
            ? `${(totalAmount / 10000000).toFixed(2)}Cr`
            : totalAmount >= 100000
              ? `${(totalAmount / 100000).toFixed(2)}L`
              : totalAmount.toLocaleString("en-IN")}
          prefix="₹"
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
        <StatsCard
          label="Pending"
          value={pendingCount}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          shadowColor="shadow-amber-500/20"
        />
        <StatsCard
          label="Accepted"
          value={acceptedCount}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          shadowColor="shadow-teal-500/20"
        />
      </div>

      {/* Filters */}
      <ListFilters
        searchPlaceholder="Search by estimate number or customer..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={onRefresh}
        statusOptions={[
          { value: "pending", label: "Pending" },
          { value: "accepted", label: "Accepted" },
          { value: "rejected", label: "Rejected" },
          { value: "converted", label: "Converted" },
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
        data={filteredEstimates}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={isLoading}
        onRowClick={(estimate) => onViewEstimate(estimate.id)}
        emptyState={{
          title: "No estimates found",
          description: "Create your first estimate to get started",
          icon: FileText,
          action: (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Create First Estimate
            </Button>
          ),
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{estimateToDelete?.estimateNumber}</span>?
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
