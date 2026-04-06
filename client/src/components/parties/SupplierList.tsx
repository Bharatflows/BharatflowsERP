import { useState, useMemo } from "react";
import {
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  Building2,
  PhoneCall,
  Mail,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileDown,
  Sheet,
  ChevronDown,
} from "lucide-react";
import { DataTable } from "../ui/data-table";
import { StatsCard } from "../ui/stats-card";
import { ListFilters } from "../ui/ListFilters";
import { exportToCSV, exportToExcel, exportToPDF } from "../../lib/exportUtils";
import { OUTSTANDING_THRESHOLDS } from "../../config/business.config";
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
import { useSuppliers, useDeleteParty, partiesKeys } from "../../hooks/useParties";
import { useQueryClient } from "@tanstack/react-query";

interface Supplier {
  id: string;
  name: string;
  businessName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  outstanding: number;
  status: "active" | "inactive";
}

interface SupplierListProps {
  onCreateNew: () => void;
  onEditSupplier: (id: string) => void;
  onViewLedger: (id: string, name: string) => void;
  hideStats?: boolean;
}

export function SupplierList({ onCreateNew, onEditSupplier, onViewLedger, hideStats = false }: SupplierListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const queryClient = useQueryClient();

  // TanStack Query
  const { data: suppliersData, isLoading: loading, isFetching, refetch } = useSuppliers();
  const deleteMutation = useDeleteParty();

  // Map API response to component format
  const suppliers: Supplier[] = useMemo(() => {
    const suppliersArray = suppliersData?.data || [];
    return suppliersArray.map((s: any) => ({
      id: s.id,
      name: s.name,
      businessName: s.name,
      gstin: s.gstin || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.billingAddress?.address || '',
      city: s.billingAddress?.city || '',
      state: s.billingAddress?.state || '',
      outstanding: Number(s.currentBalance) || 0,
      status: (s.isActive ? 'active' : 'inactive') as "active" | "inactive"
    }));
  }, [suppliersData]);

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (supplierToDelete) {
      deleteMutation.mutate(supplierToDelete.id);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: partiesKeys.suppliers() });
    refetch();
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.businessName && supplier.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.phone && supplier.phone.includes(searchQuery)) ||
      (supplier.gstin && supplier.gstin.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPayable = filteredSuppliers.reduce((sum, s) => sum + s.outstanding, 0);
  const activeSuppliers = filteredSuppliers.filter((s) => s.status === "active").length;
  const highOutstandingSuppliers = filteredSuppliers.filter((s) => s.outstanding > OUTSTANDING_THRESHOLDS.HIGH).length;

  // Export Columns
  const exportColumns = [
    { key: "name", label: "Supplier Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "gstin", label: "GSTIN" },
    { key: "balance", label: "Payable", formatter: (val: number) => val ? `₹${val.toLocaleString()}` : '-' },
    { key: "status", label: "Status" },
  ];

  const handleExportCSV = () => {
    exportToCSV(filteredSuppliers, "suppliers_export", exportColumns);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredSuppliers, "suppliers_export", exportColumns);
  };

  const handleExportPDF = () => {
    exportToPDF(filteredSuppliers, "suppliers_export", exportColumns, "Supplier List Report");
  };

  const columns = [
    {
      header: "Supplier",
      cell: (supplier: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{supplier.name}</p>
            <p className="text-sm text-muted-foreground">{supplier.gstin || 'No GSTIN'}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      cell: (supplier: Supplier) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PhoneCall className="size-3.5" />
            <span>{supplier.phone || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-3.5" />
            <span className="truncate max-w-[150px]">{supplier.email || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      cell: (supplier: Supplier) => (
        <div className="text-sm">
          <p className="text-foreground">{supplier.city || '-'}</p>
          <p className="text-muted-foreground">{supplier.state}</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (supplier: Supplier) => (
        <Badge
          className={cn(
            "rounded-full px-3 py-1 font-medium",
            supplier.status === "active"
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" // Kept specific colors if desired, or use badge-paid
              : "bg-muted text-muted-foreground hover:bg-muted"
          )}
        >
          {supplier.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Payable",
      className: "text-right",
      cell: (supplier: Supplier) => (
        <span className={cn(
          "text-lg font-semibold",
          supplier.outstanding > OUTSTANDING_THRESHOLDS.HIGH
            ? "text-rose-600"
            : supplier.outstanding > 0
              ? "text-amber-600"
              : "text-emerald-600"
        )}>
          ₹{supplier.outstanding.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (supplier: Supplier) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-edit"
            onClick={() => onEditSupplier(supplier.id)}
          >
            <Edit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-view"
            onClick={() => onViewLedger(supplier.id, supplier.name)}
          >
            <Eye className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={() => onEditSupplier(supplier.id)} className="rounded-lg">
                <Edit className="size-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewLedger(supplier.id, supplier.name)} className="rounded-lg">
                <Eye className="size-4 mr-2" />
                View Ledger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg">
                <PhoneCall className="size-4 mr-2" />
                Call Supplier
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <Mail className="size-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive rounded-lg"
                onClick={() => handleDeleteClick(supplier)}
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

  const renderMobileItem = (supplier: Supplier) => (
    <div
      key={supplier.id}
      className="bg-white rounded-xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onViewLedger(supplier.id, supplier.name)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold shadow-sm">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{supplier.name}</h3>
            <p className="text-sm text-muted-foreground">{supplier.gstin || 'No GSTIN'}</p>
          </div>
        </div>
        <Badge
          className={cn(
            "rounded-full px-3 py-1",
            supplier.status === "active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-muted text-muted-foreground"
          )}
        >
          {supplier.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Contact</p>
          <p className="font-medium">{supplier.phone || '-'}</p>
          <p className="text-muted-foreground truncate">{supplier.email || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Payable</p>
          <p className={cn(
            "text-xl font-bold",
            supplier.outstanding > OUTSTANDING_THRESHOLDS.HIGH ? "text-rose-600" : supplier.outstanding > 0 ? "text-amber-600" : "text-emerald-600"
          )}>
            ₹{supplier.outstanding.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onEditSupplier(supplier.id); }}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onViewLedger(supplier.id, supplier.name); }}
        >
          Ledger
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
              onClick={() => handleDeleteClick(supplier)}
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
            label="Total Suppliers"
            value={filteredSuppliers.length}
            icon={Building2}
            gradient="bg-gradient-to-br from-primary to-primary/80"
            shadowColor="shadow-primary/20"
          />
          <StatsCard
            label="Active"
            value={activeSuppliers}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            shadowColor="shadow-emerald-500/20"
          />
          <StatsCard
            label="Total Payable"
            value={Number(totalPayable).toLocaleString('en-IN')}
            prefix="₹"
            icon={TrendingDown}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500" // Changed from original to match payable meaning (amber/orange)
            shadowColor="shadow-amber-500/20"
          />
          <StatsCard
            label="High Outstanding"
            value={highOutstandingSuppliers}
            description="Above ₹50,000"
            icon={AlertCircle}
            gradient="bg-gradient-to-br from-rose-500 to-pink-500"
            shadowColor="shadow-rose-500/20"
          />
        </div>
      )}

      {/* List Filters */}
      <ListFilters
        searchPlaceholder="Search by name, business, phone, or GSTIN..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={handleRefresh}
        isFetching={isFetching}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
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
        data={filteredSuppliers}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={loading}
        onRowClick={(supplier) => onViewLedger(supplier.id, supplier.name)}
        emptyState={{
          title: "No suppliers found",
          description: "Get started by adding your first supplier",
          icon: Building2,
          action: (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Add Supplier
            </Button>
          )
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{supplierToDelete?.name}</span>?
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
