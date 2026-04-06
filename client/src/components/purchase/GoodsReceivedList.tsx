import { useState, useMemo } from "react";
import { useGRNs, useDeleteGRN, purchaseKeys } from "../../hooks/usePurchase";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Edit,
  MoreVertical,
  Plus,
  Download,
  FileDown,
  Sheet,
  ChevronDown,
  RefreshCw,
  FileCheck
} from "lucide-react";
import { DataTable } from "../ui/data-table";
import { StatsCard } from "../ui/stats-card";
import { ListFilters } from "../ui/ListFilters";
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
import { exportToCSV, exportToExcel, exportToPDF, formatDate } from "../../lib/exportUtils";

interface GRN {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  receivedDate: string;
  status: "received" | "partial" | "quality_check" | "returned";
  itemsCount: number;
  receivedQuantity: number;
}

interface GoodsReceivedListProps {
  onCreateNew?: () => void;
  onViewGRN?: (id: string) => void;
  onEditGRN?: (id: string) => void;
  hideStats?: boolean;
}

export function GoodsReceivedList({
  onCreateNew,
  onViewGRN,
  onEditGRN,
  hideStats = false,
}: GoodsReceivedListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: grnsData, isLoading: loading, isFetching, refetch } = useGRNs();
  const deleteMutation = useDeleteGRN();

  const grns: GRN[] = useMemo(() => {
    const extractArr = (resp: any): any[] => {
      if (!resp) return [];
      if (Array.isArray(resp)) return resp;
      for (const key of ['docs', 'data', 'items', 'grns']) {
        if (Array.isArray(resp[key])) return resp[key];
      }
      return [];
    };
    return extractArr(grnsData).map((grn: any) => ({
      id: grn.id,
      grnNumber: grn.grnNumber,
      poNumber: grn.purchaseOrder?.orderNumber || 'No PO',
      supplierName: grn.supplier?.name || 'Unknown Supplier',
      receivedDate: grn.receivedDate,
      status: (grn.status || 'received').toLowerCase(),
      itemsCount: (grn.items || []).length,
      receivedQuantity: (grn.items || []).reduce((sum: number, item: any) => sum + Number(item.receivedQuantity || 0), 0)
    }));
  }, [grnsData]);

  const filteredGRNs = grns.filter((grn) => {
    const matchesSearch =
      grn.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grn.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grn.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || grn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received": return "badge-paid";
      case "partial": return "badge-partial";
      case "quality_check": return "badge-draft";
      case "returned": return "badge-cancelled";
      default: return "badge-draft";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received": return <CheckCircle className="size-3" />;
      case "partial": return <Package className="size-3" />;
      case "quality_check": return <AlertCircle className="size-3" />;
      case "returned": return <Trash2 className="size-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "received": return "Fully Received";
      case "partial": return "Partial";
      case "quality_check": return "Quality Check";
      case "returned": return "Returned";
      default: return status;
    }
  };

  const stats = {
    total: grns.length,
    fullyReceived: grns.filter((g) => g.status === "received").length,
    partialReceived: grns.filter((g) => g.status === "partial").length,
    qualityCheck: grns.filter((g) => g.status === "quality_check").length,
    totalQtyReceived: grns.reduce((sum, g) => sum + g.receivedQuantity, 0)
  };

  const handleExportCSV = () => {
    const data = filteredGRNs.map(grn => ({
      'GRN #': grn.grnNumber,
      'PO #': grn.poNumber,
      'Supplier': grn.supplierName,
      'Date': formatDate(grn.receivedDate),
      'Items': grn.itemsCount,
      'Status': getStatusLabel(grn.status)
    }));
    exportToCSV(data, 'GRNs');
  };

  const handleExportExcel = () => {
    const data = filteredGRNs.map(grn => ({
      'GRN #': grn.grnNumber,
      'PO #': grn.poNumber,
      'Supplier': grn.supplierName,
      'Date': formatDate(grn.receivedDate),
      'Items': grn.itemsCount,
      'Status': getStatusLabel(grn.status)
    }));
    exportToExcel(data, 'GRNs');
  };

  const handleExportPDF = () => {
    const columns = ['GRN #', 'PO #', 'Supplier', 'Date', 'Items', 'Status'];
    const data = filteredGRNs.map(grn => [
      grn.grnNumber,
      grn.poNumber,
      grn.supplierName,
      formatDate(grn.receivedDate),
      grn.itemsCount,
      getStatusLabel(grn.status)
    ]);
    exportToPDF({ title: 'Goods Received Notes', columns, data, filename: 'GRNs' });
  };

  const columns = [
    {
      header: "GRN Details",
      cell: (grn: GRN) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            <Package className="size-4" />
          </div>
          <div>
            <p className="font-medium text-foreground">{grn.grnNumber}</p>
          </div>
        </div>
      )
    },
    {
      header: "PO Number",
      cell: (grn: GRN) => (
        <p className="font-medium text-foreground">{grn.poNumber}</p>
      )
    },
    {
      header: "Supplier",
      cell: (grn: GRN) => (
        <p className="font-medium text-foreground">{grn.supplierName}</p>
      )
    },
    {
      header: "Received Date",
      cell: (grn: GRN) => (
        <p className="text-foreground">
          {formatDate(grn.receivedDate)}
        </p>
      )
    },
    {
      header: "Items",
      className: "text-center",
      cell: (grn: GRN) => (
        <p className="font-medium text-foreground">{grn.itemsCount} items</p>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cell: (grn: GRN) => (
        <div className="flex justify-center">
          <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(grn.status))}>
            {getStatusIcon(grn.status)}
            {getStatusLabel(grn.status)}
          </Badge>
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (grn: GRN) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => onViewGRN?.(grn.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg"
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
              <DropdownMenuItem className="rounded-lg" onClick={handleExportPDF}>
                <Download className="size-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive rounded-lg"
                onClick={() => handleDelete(grn.id)}
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

  const renderMobileItem = (grn: GRN) => (
    <div
      key={grn.id}
      className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onViewGRN?.(grn.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold shadow-sm">
            <Package className="size-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{grn.grnNumber}</h3>
            <p className="text-sm text-muted-foreground">{grn.supplierName}</p>
          </div>
        </div>
        <Badge className={cn("rounded-full px-3 py-1", getStatusColor(grn.status))}>
          <span className="flex items-center gap-1">
            {getStatusIcon(grn.status)}
            {getStatusLabel(grn.status)}
          </span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Received Date</p>
          <p className="font-medium">{formatDate(grn.receivedDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">PO Number</p>
          <p className="font-medium">{grn.poNumber}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Items</p>
          <p className="font-medium">{grn.itemsCount} items</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Received Qty</p>
          <p className="font-medium">{grn.receivedQuantity}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onViewGRN?.(grn.id); }}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onEditGRN?.(grn.id); }}
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
            <DropdownMenuItem
              className="text-destructive focus:text-destructive rounded-lg"
              onClick={() => handleDelete(grn.id)}
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
      {!hideStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            label="Total GRNs"
            value={stats.total}
            icon={FileCheck}
            gradient="bg-gradient-to-br from-primary to-primary/80"
            shadowColor="shadow-primary/20"
            compact
          />
          <StatsCard
            label="Fully Received"
            value={stats.fullyReceived}
            icon={CheckCircle}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            shadowColor="shadow-emerald-500/20"
            compact
          />
          <StatsCard
            label="Partial"
            value={stats.partialReceived}
            icon={Package}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
            shadowColor="shadow-amber-500/20"
            compact
          />
          <StatsCard
            label="Quality Check"
            value={stats.qualityCheck}
            icon={AlertCircle}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            shadowColor="shadow-primary/20"
            compact
          />
          <StatsCard
            label="Total Received"
            value={stats.totalQtyReceived}
            icon={Package}
            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
            shadowColor="shadow-teal-500/20"
            compact
          />
        </div>
      )}

      <ListFilters
        searchPlaceholder="Search by GRN#, PO#, or supplier..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={refetch}
        isFetching={isFetching}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: "received", label: "Fully Received" },
          { value: "partial", label: "Partial" },
          { value: "quality_check", label: "Quality Check" },
          { value: "returned", label: "Returned" },
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
        data={filteredGRNs}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={loading}
        onRowClick={(grn) => onViewGRN?.(grn.id)}
        emptyState={{
          title: "No GRNs found",
          description: "Create your first GRN to get started",
          icon: Package,
          action: onCreateNew ? (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Create First GRN
            </Button>
          ) : undefined
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GRN?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{grns.find(g => g.id === deleteId)?.grnNumber}</span>?
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
