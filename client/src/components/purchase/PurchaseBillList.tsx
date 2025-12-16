import { useState, useMemo } from "react";
import { usePurchaseBills, useDeletePurchaseBill, purchaseKeys } from "../../hooks/usePurchase";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  IndianRupee,
  Loader2,
  RefreshCw,
  TrendingDown,
  Wallet,
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

interface PurchaseBill {
  id: string;
  billNumber: string;
  supplierName: string;
  billDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: "paid" | "unpaid" | "partial" | "overdue";
  paymentStatus: string;
}

interface PurchaseBillListProps {
  onCreateNew: () => void;
  onViewBill: (id: string) => void;
  onEditBill: (id: string) => void;
}

export function PurchaseBillList({
  onCreateNew,
  onViewBill,
  onEditBill,
}: PurchaseBillListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<PurchaseBill | null>(null);
  const queryClient = useQueryClient();

  // TanStack Query - automatic caching, loading states, and refetching
  const { data: billsData, isLoading: loading, isFetching, refetch } = usePurchaseBills();
  const deleteMutation = useDeletePurchaseBill();

  // Map API response to component format
  const bills: PurchaseBill[] = useMemo(() => {
    return (billsData?.data || []).map((item: any) => ({
      id: item.id,
      billNumber: item.billNumber,
      supplierName: item.supplier?.name || "Unknown",
      billDate: item.billDate,
      dueDate: item.dueDate || item.billDate,
      amount: Number(item.totalAmount),
      paidAmount: Number(item.amountPaid || 0),
      status: (item.status || 'open').toLowerCase(),
      paymentStatus: item.status
    }));
  }, [billsData]);

  const handleDeleteClick = (bill: PurchaseBill) => {
    setBillToDelete(bill);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (billToDelete) {
      deleteMutation.mutate(billToDelete.id);
      setDeleteDialogOpen(false);
      setBillToDelete(null);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: purchaseKeys.bills() });
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "unpaid":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "partial":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "overdue":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="size-3" />;
      case "unpaid":
        return <Clock className="size-3" />;
      case "partial":
        return <Clock className="size-3" />;
      case "overdue":
        return <XCircle className="size-3" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "unpaid":
        return "Unpaid";
      case "partial":
        return "Partial";
      case "overdue":
        return "Overdue";
      default:
        return status;
    }
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
  const totalPending = totalAmount - totalPaid;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading purchase bills...</p>
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
              <span className="text-sm font-medium opacity-90">Total Bills</span>
            </div>
            <h3 className="text-3xl font-bold">{totalBills}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Amount</span>
            </div>
            <h3 className="text-2xl font-bold">
              {totalAmount >= 100000
                ? `₹${(totalAmount / 100000).toFixed(1)}L`
                : `₹${totalAmount.toLocaleString("en-IN")}`}
            </h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Paid</span>
            </div>
            <h3 className="text-2xl font-bold">
              {totalPaid >= 100000
                ? `₹${(totalPaid / 100000).toFixed(1)}L`
                : `₹${totalPaid.toLocaleString("en-IN")}`}
            </h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Pending</span>
            </div>
            <h3 className="text-2xl font-bold">
              {totalPending >= 100000
                ? `₹${(totalPending / 100000).toFixed(1)}L`
                : `₹${totalPending.toLocaleString("en-IN")}`}
            </h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by bill number or supplier..."
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
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
              <th className="px-5 py-4 text-left font-semibold text-foreground">Bill Number</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Supplier</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Bill Date</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Due Date</th>
              <th className="px-5 py-4 text-right font-semibold text-foreground">Amount</th>
              <th className="px-5 py-4 text-right font-semibold text-foreground">Balance</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Status</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileText className="size-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-1">No purchase bills found</p>
                      <p className="text-muted-foreground">Create your first purchase bill to get started</p>
                    </div>
                    <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                      <Plus className="size-4" />
                      Create First Bill
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBills.map((bill, idx) => (
                <tr
                  key={bill.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-slate-50/50 transition-all duration-200",
                    idx === filteredBills.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        <Receipt className="size-4" />
                      </div>
                      <p className="font-medium text-foreground">{bill.billNumber}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{bill.supplierName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-foreground">
                      {new Date(bill.billDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-foreground">
                      {new Date(bill.dueDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-lg font-semibold text-foreground">
                      ₹{bill.amount.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className={cn(
                      "text-lg font-semibold",
                      bill.amount - bill.paidAmount > 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      ₹{(bill.amount - bill.paidAmount).toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(bill.status))}>
                        {getStatusIcon(bill.status)}
                        {getStatusLabel(bill.status)}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => onViewBill(bill.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600"
                        onClick={() => onEditBill(bill.id)}
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
                          <DropdownMenuItem onClick={() => onViewBill(bill.id)} className="rounded-lg">
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditBill(bill.id)} className="rounded-lg">
                            <Edit className="size-4 mr-2" />
                            Edit Bill
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <Download className="size-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="rounded-lg">
                            <CheckCircle className="size-4 mr-2" />
                            Record Payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive rounded-lg"
                            onClick={() => handleDeleteClick(bill)}
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
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <FileText className="size-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-1">No purchase bills found</p>
                <p className="text-muted-foreground">Create your first purchase bill to get started</p>
              </div>
              <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                <Plus className="size-4" />
                Create First Bill
              </Button>
            </div>
          </div>
        ) : (
          filteredBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
                    <Receipt className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{bill.billNumber}</h3>
                    <p className="text-sm text-muted-foreground">{bill.supplierName}</p>
                  </div>
                </div>
                <Badge className={cn("rounded-full px-3 py-1", getStatusColor(bill.status))}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(bill.status)}
                    {getStatusLabel(bill.status)}
                  </span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Bill Date</p>
                  <p className="font-medium">
                    {new Date(bill.billDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Due Date</p>
                  <p className="font-medium">
                    {new Date(bill.dueDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Amount</p>
                  <p className="text-xl font-bold text-foreground">
                    ₹{bill.amount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Balance</p>
                  <p className={cn(
                    "text-xl font-bold",
                    bill.amount - bill.paidAmount > 0 ? "text-rose-600" : "text-emerald-600"
                  )}>
                    ₹{(bill.amount - bill.paidAmount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onViewBill(bill.id)}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => onEditBill(bill.id)}
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
                    <DropdownMenuItem className="rounded-lg">
                      <CheckCircle className="size-4 mr-2" />
                      Record Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg">
                      <Download className="size-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive rounded-lg"
                      onClick={() => handleDeleteClick(bill)}
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

      {/* Pagination */}
      {filteredBills.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-border p-4">
          <p className="text-muted-foreground text-sm">
            Showing {filteredBills.length} of {bills.length} bills
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="rounded-xl">
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled className="rounded-xl">
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{billToDelete?.billNumber}</span>?
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
