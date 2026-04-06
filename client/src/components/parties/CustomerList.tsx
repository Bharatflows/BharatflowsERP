import { useState, useMemo } from "react";
import {
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  Users,
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
import { useCustomers, useDeleteParty, partiesKeys } from "../../hooks/useParties";
import { useQueryClient } from "@tanstack/react-query";
import { TrustScoreBadge } from "./TrustScoreBadge";

interface Customer {
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
  creditLimit: number;
  status: "active" | "inactive";
}

interface CustomerListProps {
  onCreateNew: () => void;
  onEditCustomer: (id: string) => void;
  onViewLedger: (id: string, name: string) => void;
  hideStats?: boolean;
}

export function CustomerList({ onCreateNew, onEditCustomer, onViewLedger, hideStats = false }: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const queryClient = useQueryClient();

  // TanStack Query - automatic caching, loading states, and refetching
  const { data: customersData, isLoading: loading, isFetching, refetch } = useCustomers();
  const deleteMutation = useDeleteParty();

  // Map API response to component format
  const customers: Customer[] = useMemo(() => {
    const customersArray = customersData?.data || [];
    return customersArray.map((c: any) => ({
      id: c.id,
      name: c.name,
      businessName: c.name,
      gstin: c.gstin || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.billingAddress?.address || '',
      city: c.billingAddress?.city || '',
      state: c.billingAddress?.state || '',
      outstanding: Number(c.currentBalance) || 0,
      creditLimit: Number(c.creditLimit) || 0,
      status: (c.isActive ? 'active' : 'inactive') as "active" | "inactive"
    }));
  }, [customersData]);

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: partiesKeys.customers() });
    refetch();
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.businessName && customer.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.gstin && customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = filteredCustomers.reduce((sum, c) => sum + c.outstanding, 0);
  const activeCustomers = filteredCustomers.filter((c) => c.status === "active").length;
  const highOutstandingCustomers = filteredCustomers.filter((c) => c.outstanding > OUTSTANDING_THRESHOLDS.HIGH).length;

  // Export Columns
  const exportColumns = [
    { key: "name", label: "Customer Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "gstin", label: "GSTIN" },
    { key: "balance", label: "Balance", formatter: (val: number) => val ? `₹${val.toLocaleString()}` : '-' },
    { key: "creditLimit", label: "Credit Limit", formatter: (val: number) => val ? `₹${val.toLocaleString()}` : '-' },
    { key: "status", label: "Status" },
  ];

  const handleExportCSV = () => {
    exportToCSV(filteredCustomers, "customers_export", exportColumns);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredCustomers, "customers_export", exportColumns);
  };

  const handleExportPDF = () => {
    exportToPDF(filteredCustomers, "customers_export", exportColumns, "Customer List Report");
  };

  const columns = [
    {
      header: "Customer",
      cell: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{customer.name}</p>
            <p className="text-sm text-muted-foreground">{customer.gstin || 'No GSTIN'}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      cell: (customer: Customer) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PhoneCall className="size-3.5" />
            <span>{customer.phone || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-3.5" />
            <span className="truncate max-w-[150px]">{customer.email || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      cell: (customer: Customer) => (
        <div className="text-sm">
          <p className="text-foreground">{customer.city || '-'}</p>
          <p className="text-muted-foreground">{customer.state}</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (customer: Customer) => (
        <Badge
          className={cn(
            "rounded-full px-3 py-1 font-medium",
            customer.status === "active"
              ? "badge-paid"
              : "badge-draft"
          )}
        >
          {customer.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Trust Score",
      cell: (customer: Customer) => (
        <TrustScoreBadge partyId={customer.id} score={customer.creditLimit ? Math.min(100, Math.max(0, Math.round(customer.creditLimit / 1000))) : 75} size="sm" />
      ),
    },
    {
      header: "Outstanding",
      className: "text-right",
      cell: (customer: Customer) => (
        <span className={cn(
          "text-lg font-semibold",
          customer.outstanding > OUTSTANDING_THRESHOLDS.HIGH
            ? "text-rose-600"
            : customer.outstanding > 0
              ? "text-amber-600"
              : "text-emerald-600"
        )}>
          ₹{customer.outstanding.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (customer: Customer) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-edit"
            onClick={() => onEditCustomer(customer.id)}
          >
            <Edit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-view"
            onClick={() => onViewLedger(customer.id, customer.name)}
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
              <DropdownMenuItem onClick={() => onEditCustomer(customer.id)} className="rounded-lg">
                <Edit className="size-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewLedger(customer.id, customer.name)} className="rounded-lg">
                <Eye className="size-4 mr-2" />
                View Ledger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg">
                <PhoneCall className="size-4 mr-2" />
                Call Customer
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <Mail className="size-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive rounded-lg"
                onClick={() => handleDeleteClick(customer)}
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

  const renderMobileItem = (customer: Customer) => (
    <div
      key={customer.id}
      className="bg-white rounded-xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onViewLedger(customer.id, customer.name)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold shadow-sm">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{customer.name}</h3>
            <p className="text-sm text-muted-foreground">{customer.gstin || 'No GSTIN'}</p>
          </div>
        </div>
        <Badge
          className={cn(
            "rounded-full px-3 py-1",
            customer.status === "active"
              ? "badge-paid"
              : "badge-draft"
          )}
        >
          {customer.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Contact</p>
          <p className="font-medium">{customer.phone || '-'}</p>
          <p className="text-muted-foreground truncate">{customer.email || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Outstanding</p>
          <p className={cn(
            "text-xl font-bold",
            customer.outstanding > OUTSTANDING_THRESHOLDS.HIGH ? "text-rose-600" : customer.outstanding > 0 ? "text-amber-600" : "text-emerald-600"
          )}>
            ₹{customer.outstanding.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onEditCustomer(customer.id); }}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onViewLedger(customer.id, customer.name); }}
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
              onClick={() => handleDeleteClick(customer)}
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
            label="Total Customers"
            value={filteredCustomers.length}
            icon={Users}
            gradient="bg-gradient-to-br from-primary to-primary/80"
            shadowColor="shadow-primary/20"
          />
          <StatsCard
            label="Active"
            value={activeCustomers}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            shadowColor="shadow-emerald-500/20"
          />
          <StatsCard
            label="Total Receivable"
            value={Number(totalOutstanding).toLocaleString('en-IN')}
            prefix="₹"
            icon={TrendingDown}
            gradient="bg-gradient-to-br from-rose-500 to-pink-500"
            shadowColor="shadow-rose-500/20"
          />
          <StatsCard
            label="High Outstanding"
            value={highOutstandingCustomers}
            description="Above ₹50,000"
            icon={AlertCircle}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
            shadowColor="shadow-amber-500/20"
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
        data={filteredCustomers}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={loading}
        onRowClick={(customer) => onViewLedger(customer.id, customer.name)}
        emptyState={{
          title: "No customers found",
          description: "Get started by adding your first customer",
          icon: Users,
          action: (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Add Customer
            </Button>
          )
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{customerToDelete?.name}</span>?
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
