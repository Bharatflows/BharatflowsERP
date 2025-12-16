import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGRNs, useDeleteGRN, purchaseKeys } from "../../hooks/usePurchase";
import { useQueryClient } from "@tanstack/react-query";
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
  AlertCircle,
  Clock,
  XCircle,
  Package,
  Loader2,
  RefreshCw,
  ClipboardCheck,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface GoodsReceived {
  id: string;
  grnNumber: string;
  date: string;
  supplier: string;
  purchaseOrder?: string;
  items: number;
  receivedQty: number;
  orderedQty: number;
  status: "Draft" | "Partially Received" | "Fully Received" | "Quality Check" | "Rejected";
  warehouse: string;
  invoiceNumber?: string;
}

interface GoodsReceivedListProps {
  onCreateNew?: () => void;
  onViewGRN?: (id: string) => void;
  onEditGRN?: (id: string) => void;
  refreshKey?: number;
}

export function GoodsReceivedList({ onCreateNew, onViewGRN, onEditGRN }: GoodsReceivedListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [grnToDelete, setGrnToDelete] = useState<GoodsReceived | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TanStack Query - automatic caching, loading states, and refetching
  const { data: grnsData, isLoading: loading, isFetching, refetch } = useGRNs();
  const deleteMutation = useDeleteGRN();

  // Map API response to component format
  const grns: GoodsReceived[] = useMemo(() => {
    return (grnsData?.data || []).map((item: any) => {
      const totalOrdered = (item.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      const totalReceived = (item.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);

      return {
        id: item.id,
        grnNumber: item.grnNumber,
        date: item.grnDate,
        supplier: item.supplier?.name || "Unknown",
        purchaseOrder: item.referenceNumber,
        items: (item.items || []).length,
        receivedQty: totalReceived,
        orderedQty: totalOrdered,
        status: (item.status || 'Draft') as GoodsReceived['status'],
        warehouse: "Main Warehouse",
        invoiceNumber: item.referenceNumber
      };
    });
  }, [grnsData]);

  const handleConvertToBill = (id: string) => {
    navigate(`/purchase/bills/new?grnId=${id}`);
  };

  const handleDeleteClick = (grn: GoodsReceived) => {
    setGrnToDelete(grn);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (grnToDelete) {
      deleteMutation.mutate(grnToDelete.id);
      setDeleteDialogOpen(false);
      setGrnToDelete(null);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: purchaseKeys.grns() });
    refetch();
  };

  const filteredGRNs = grns.filter((grn) => {
    const matchesSearch =
      grn.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grn.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grn.purchaseOrder && grn.purchaseOrder.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || grn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: GoodsReceived["status"]) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
      case "Partially Received":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "Fully Received":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "Quality Check":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "Rejected":
        return "bg-red-100 text-red-700 hover:bg-red-100";
    }
  };

  const getStatusIcon = (status: GoodsReceived["status"]) => {
    switch (status) {
      case "Draft":
        return <FileText className="size-3" />;
      case "Partially Received":
        return <Clock className="size-3" />;
      case "Fully Received":
        return <CheckCircle className="size-3" />;
      case "Quality Check":
        return <AlertCircle className="size-3" />;
      case "Rejected":
        return <XCircle className="size-3" />;
    }
  };

  const stats = {
    total: grns.length,
    fullyReceived: grns.filter((g) => g.status === "Fully Received").length,
    partiallyReceived: grns.filter((g) => g.status === "Partially Received").length,
    qualityCheck: grns.filter((g) => g.status === "Quality Check").length,
    totalReceived: grns.reduce((sum, grn) => sum + grn.receivedQty, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading goods received notes...</p>
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
              <Package className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total GRNs</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.total}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Fully Received</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.fullyReceived}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Partial</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.partiallyReceived}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Quality Check</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.qualityCheck}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Received</span>
            </div>
            <h3 className="text-3xl font-bold">{stats.totalReceived.toLocaleString("en-IN")}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by GRN number, supplier, or PO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-11 rounded-xl">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Partially Received">Partially Received</SelectItem>
                <SelectItem value="Fully Received">Fully Received</SelectItem>
                <SelectItem value="Quality Check">Quality Check</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
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
              <th className="px-5 py-4 text-left font-semibold text-foreground">GRN Number</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Date</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Supplier</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Purchase Order</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Items</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Received/Ordered</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Warehouse</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Status</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGRNs.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Package className="size-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1">No goods received notes found</p>
                      <p className="text-muted-foreground">Create your first GRN to track received goods</p>
                    </div>
                    <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                      <Plus className="size-4" />
                      Create First GRN
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredGRNs.map((grn, idx) => (
                <tr
                  key={grn.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-slate-50/50 transition-all duration-200",
                    idx === filteredGRNs.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        <Package className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{grn.grnNumber}</p>
                        <p className="text-sm text-muted-foreground">{grn.invoiceNumber || 'No Invoice'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-foreground">{new Date(grn.date).toLocaleDateString("en-IN")}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{grn.supplier}</p>
                  </td>
                  <td className="px-5 py-4">
                    {grn.purchaseOrder ? (
                      <Badge variant="outline" className="rounded-full text-xs">
                        {grn.purchaseOrder}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-medium">{grn.items} items</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{grn.receivedQty}</span>
                        <span className="text-muted-foreground">/ {grn.orderedQty}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            grn.receivedQty >= grn.orderedQty ? "bg-emerald-500" :
                              grn.receivedQty > 0 ? "bg-amber-500" : "bg-slate-300"
                          )}
                          style={{ width: `${grn.orderedQty > 0 ? Math.min((grn.receivedQty / grn.orderedQty) * 100, 100) : 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {grn.orderedQty > 0 ? ((grn.receivedQty / grn.orderedQty) * 100).toFixed(0) : 0}% received
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Warehouse className="size-4 text-muted-foreground" />
                      <span className="text-sm">{grn.warehouse}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={cn("rounded-full px-3 py-1 font-medium", getStatusColor(grn.status))}>
                      <span className="flex items-center gap-1.5">
                        {getStatusIcon(grn.status)}
                        {grn.status}
                      </span>
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => onViewGRN?.(grn.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600"
                        onClick={() => onEditGRN?.(grn.id)}
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
                          <DropdownMenuItem onClick={() => onViewGRN?.(grn.id)} className="rounded-lg">
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditGRN?.(grn.id)} className="rounded-lg">
                            <Edit className="size-4 mr-2" />
                            Edit GRN
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="rounded-lg">
                            <CheckCircle className="size-4 mr-2" />
                            Mark Quality Approved
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvertToBill(grn.id)} className="rounded-lg">
                            <FileText className="size-4 mr-2" />
                            Create Purchase Bill
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <Download className="size-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive rounded-lg"
                            onClick={() => handleDeleteClick(grn)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete GRN
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
        {filteredGRNs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Package className="size-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-1">No goods received notes found</p>
                <p className="text-muted-foreground">Create your first GRN to track received goods</p>
              </div>
              <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                <Plus className="size-4" />
                Create First GRN
              </Button>
            </div>
          </div>
        ) : (
          filteredGRNs.map((grn) => (
            <div
              key={grn.id}
              className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
                    <Package className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{grn.grnNumber}</h3>
                    <p className="text-sm text-muted-foreground">{grn.supplier}</p>
                  </div>
                </div>
                <Badge className={cn("rounded-full px-3 py-1", getStatusColor(grn.status))}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(grn.status)}
                    {grn.status}
                  </span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">{new Date(grn.date).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Items</p>
                  <p className="font-medium">{grn.items} items</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Received/Ordered</p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{grn.receivedQty}</span>
                    <span className="text-muted-foreground">/ {grn.orderedQty}</span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Warehouse</p>
                  <p className="font-medium">{grn.warehouse}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      grn.receivedQty >= grn.orderedQty ? "bg-emerald-500" :
                        grn.receivedQty > 0 ? "bg-amber-500" : "bg-slate-300"
                    )}
                    style={{ width: `${grn.orderedQty > 0 ? Math.min((grn.receivedQty / grn.orderedQty) * 100, 100) : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {grn.orderedQty > 0 ? ((grn.receivedQty / grn.orderedQty) * 100).toFixed(0) : 0}% received
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onViewGRN?.(grn.id)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onEditGRN?.(grn.id)}
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
                    <DropdownMenuItem onClick={() => handleConvertToBill(grn.id)} className="rounded-lg">
                      <FileText className="size-4 mr-2" />
                      Create Bill
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg">
                      <Download className="size-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive rounded-lg"
                      onClick={() => handleDeleteClick(grn)}
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
            <AlertDialogTitle>Delete GRN</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{grnToDelete?.grnNumber}</span>?
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
