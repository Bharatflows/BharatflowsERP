import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { salesService } from "../../services/sales.service";
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
        await salesService.deleteEstimate(estimateToDelete.id);
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
        const invoice = await salesService.convertEstimateToInvoice(id);
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
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "pending":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "rejected":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case "converted":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
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

  const getStatusLabel = (status: Estimate["status"]) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      case "converted":
        return "Converted";
      default:
        return status;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading estimates...</p>
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
              <FileText className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Estimates</span>
            </div>
            <h3 className="text-3xl font-bold">{filteredEstimates.length}</h3>
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
              {totalAmount >= 100000
                ? `₹${(totalAmount / 100000).toFixed(1)}L`
                : `₹${totalAmount.toLocaleString("en-IN")}`}
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
            <h3 className="text-3xl font-bold">{pendingCount}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Accepted</span>
            </div>
            <h3 className="text-3xl font-bold">{acceptedCount}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by estimate number or customer..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
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
              <th className="px-5 py-4 text-left font-semibold text-foreground">Estimate No.</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Customer</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Date</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Valid Until</th>
              <th className="px-5 py-4 text-right font-semibold text-foreground">Amount</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Status</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEstimates.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileText className="size-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1">No estimates found</p>
                      <p className="text-muted-foreground">Create your first estimate to get started</p>
                    </div>
                    <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                      <Plus className="size-4" />
                      Create First Estimate
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEstimates.map((estimate, idx) => (
                <tr
                  key={estimate.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-slate-50/50 transition-all duration-200",
                    idx === filteredEstimates.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        <FileText className="size-4" />
                      </div>
                      <p className="font-medium text-foreground">{estimate.estimateNumber}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{estimate.customer?.name || "Unknown"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-muted-foreground">
                      {new Date(estimate.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-muted-foreground">
                      {new Date(estimate.validUntil).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-lg font-semibold text-foreground">
                      ₹{Number(estimate.totalAmount).toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(estimate.status))}>
                        {getStatusIcon(estimate.status)}
                        {getStatusLabel(estimate.status)}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => onViewEstimate(estimate.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600"
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
                          <DropdownMenuItem onClick={() => toast.info("Downloading PDF...")} className="rounded-lg">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredEstimates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <FileText className="size-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-1">No estimates found</p>
                <p className="text-muted-foreground">Create your first estimate to get started</p>
              </div>
              <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                <Plus className="size-4" />
                Create First Estimate
              </Button>
            </div>
          </div>
        ) : (
          filteredEstimates.map((estimate) => (
            <div
              key={estimate.id}
              className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
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
                    {getStatusLabel(estimate.status)}
                  </span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">
                    {new Date(estimate.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Valid Until</p>
                  <p className="font-medium">
                    {new Date(estimate.validUntil).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Amount</p>
                  <p className="text-xl font-bold text-indigo-600">
                    ₹{Number(estimate.totalAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onViewEstimate(estimate.id)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onEditEstimate(estimate.id)}
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
                      Convert to Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Downloading PDF...")} className="rounded-lg">
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
            </div>
          ))
        )}
      </div>

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
