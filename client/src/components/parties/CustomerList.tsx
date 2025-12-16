import { useState, useMemo } from "react";
import { Search, Filter, Download, Eye, Edit, Trash2, MoreVertical, Plus, Users, PhoneCall, Mail, Loader2, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
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
import { useCustomers, useDeleteParty, partiesKeys } from "../../hooks/useParties";
import { useQueryClient } from "@tanstack/react-query";

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
}

export function CustomerList({ onCreateNew, onEditCustomer, onViewLedger }: CustomerListProps) {
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
  const highOutstandingCustomers = filteredCustomers.filter((c) => c.outstanding > 50000).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading customers...</p>
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
              <Users className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Customers</span>
            </div>
            <h3 className="text-3xl font-bold">{filteredCustomers.length}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Active</span>
            </div>
            <h3 className="text-3xl font-bold">{activeCustomers}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Receivable</span>
            </div>
            <h3 className="text-2xl font-bold">₹{totalOutstanding.toLocaleString("en-IN")}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">High Outstanding</span>
            </div>
            <h3 className="text-3xl font-bold">{highOutstandingCustomers}</h3>
            <p className="text-xs opacity-75 mt-1">Above ₹50,000</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, business, phone, or GSTIN..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
              <th className="px-5 py-4 text-left font-semibold text-foreground">Customer</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Contact</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Location</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Status</th>
              <th className="px-5 py-4 text-right font-semibold text-foreground">Outstanding</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="size-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1">No customers found</p>
                      <p className="text-muted-foreground">Get started by adding your first customer</p>
                    </div>
                    <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                      <Plus className="size-4" />
                      Add Customer
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer, idx) => (
                <tr
                  key={customer.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-slate-50/50 transition-all duration-200",
                    idx === filteredCustomers.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.gstin || 'No GSTIN'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                        <PhoneCall className="size-3.5" />
                        <span>{customer.phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                        <Mail className="size-3.5" />
                        <span className="truncate max-w-[150px]">{customer.email || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm">
                      <p className="text-foreground">{customer.city || '-'}</p>
                      <p className="text-muted-foreground">{customer.state}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 font-medium",
                        customer.status === "active"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {customer.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={cn(
                      "text-lg font-semibold",
                      customer.outstanding > 50000
                        ? "text-rose-600"
                        : customer.outstanding > 0
                          ? "text-amber-600"
                          : "text-emerald-600"
                    )}>
                      ₹{customer.outstanding.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => onEditCustomer(customer.id)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600"
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
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
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
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
                  customer.outstanding > 50000 ? "text-rose-600" : customer.outstanding > 0 ? "text-amber-600" : "text-emerald-600"
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
                onClick={() => onEditCustomer(customer.id)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => onViewLedger(customer.id, customer.name)}
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
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
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
