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
  Loader2,
  Plus,
  ArrowRightCircle,
  XCircle,
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

interface DeliveryChallanListProps {
  challans: DeliveryChallan[];
  onCreateNew: () => void;
  onViewChallan: (id: string) => void;
  onEditChallan: (id: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function DeliveryChallanList({ challans, onCreateNew, onViewChallan, onEditChallan, onRefresh, isLoading = false }: DeliveryChallanListProps) {
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
      case "Delivered":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "In Transit":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "Returned":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case "Dispatched":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      default: // Draft
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    }
  };

  const getStatusIcon = (status: DeliveryChallan["status"]) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="size-3" />;
      case "In Transit":
        return <Truck className="size-3" />;
      case "Returned":
        return <XCircle className="size-3" />;
      case "Dispatched":
        return <Package className="size-3" />;
      default:
        return <Clock className="size-3" />;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading delivery challans...</p>
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
              <span className="text-sm font-medium opacity-90">Total Challans</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.total}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Package className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Dispatched</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.dispatched}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">In Transit</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.inTransit}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Delivered</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.delivered}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by challan number or customer..."
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
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Dispatched">Dispatched</SelectItem>
                <SelectItem value="In Transit">In Transit</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
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
              <th className="px-5 py-4 text-left font-semibold text-foreground">Challan No.</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Customer</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Date</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Sales Order</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Items</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Qty</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Status</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChallans.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Truck className="size-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1">No delivery challans found</p>
                      <p className="text-muted-foreground">Create your first delivery challan to get started</p>
                    </div>
                    <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                      <Plus className="size-4" />
                      Create First Challan
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredChallans.map((challan, idx) => (
                <tr
                  key={challan.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-slate-50/50 transition-all duration-200",
                    idx === filteredChallans.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        <Truck className="size-4" />
                      </div>
                      <span className="font-medium text-foreground">{challan.challanNumber}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{challan.customer?.name || "Unknown"}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(challan.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {challan.salesOrder?.orderNumber || "-"}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-foreground">{challan.items?.length || 0}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-foreground font-medium">{challan.totalQuantity || 0}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(challan.status))}>
                        {getStatusIcon(challan.status)}
                        {challan.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => onViewChallan(challan.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600"
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredChallans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Truck className="size-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-1">No delivery challans found</p>
                <p className="text-muted-foreground">Create your first delivery challan to get started</p>
              </div>
              <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                <Plus className="size-4" />
                Create First Challan
              </Button>
            </div>
          </div>
        ) : (
          filteredChallans.map((challan) => (
            <div
              key={challan.id}
              className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
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
                  <p className="font-medium">
                    {new Date(challan.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
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
                  onClick={() => onViewChallan(challan.id)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onEditChallan(challan.id)}
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
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
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
