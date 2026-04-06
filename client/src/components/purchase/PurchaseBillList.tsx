import { useState, useMemo } from "react";
import { usePurchaseBills, useDeletePurchaseBill, purchaseKeys } from "../../hooks/usePurchase";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  IndianRupee,
  Eye,
  Edit,
  MoreVertical,
  Download,
  Trash2,
  Plus,
  FileDown,
  Sheet,
  ChevronDown,
} from "lucide-react";
import { DataTable } from "../ui/data-table";
import { StatsCard } from "../ui/stats-card";
import { ListFilters } from "../ui/ListFilters";
import { exportToCSV, exportToExcel, exportToPDF, formatCurrency, formatDate } from "../../lib/exportUtils";
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
import { toast } from "sonner";
import { SmartCard } from "@/components/ui/SmartCard";

interface PurchaseBill {
  id: string;
  billNumber: string;
  supplierName: string;
  billDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
}

interface PurchaseBillListProps {
  onCreateNew?: () => void;
  onViewBill?: (id: string) => void;
  onEditBill?: (id: string) => void;
  hideStats?: boolean;
}

export function PurchaseBillList({
  onCreateNew,
  onViewBill,
  onEditBill,
  hideStats = false,
}: PurchaseBillListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: billsData, isLoading: loading, isFetching, refetch } = usePurchaseBills();
  const deleteMutation = useDeletePurchaseBill();

  // Robust array extraction — handles different API response shapes
  const bills: PurchaseBill[] = useMemo(() => {
    const extractArr = (resp: any): any[] => {
      if (!resp) return [];
      if (Array.isArray(resp)) return resp;
      for (const key of ['docs', 'data', 'items', 'bills']) {
        if (Array.isArray(resp[key])) return resp[key];
      }
      return [];
    };
    return extractArr(billsData).map((item: any) => ({
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

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          toast.success("Bill deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete bill");
        }
      });
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: purchaseKeys.bills() });
    refetch();
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "unpaid": return "bg-muted text-foreground hover:bg-muted";
      case "partial": return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "overdue": return "bg-red-100 text-red-700 hover:bg-red-100";
      default: return "bg-muted text-foreground hover:bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="size-3" />;
      case "unpaid": return <Clock className="size-3" />;
      case "partial": return <Clock className="size-3" />;
      case "overdue": return <XCircle className="size-3" />;
      default: return <FileText className="size-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Paid";
      case "unpaid": return "Unpaid";
      case "partial": return "Partial";
      case "overdue": return "Overdue";
      default: return status;
    }
  };

  // Stats
  const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const unpaidCount = bills.filter(b => (b.status || '').toLowerCase() !== "paid").length;
  const paidCount = bills.filter(b => (b.status || '').toLowerCase() === "paid").length;

  const handleExportCSV = () => {
    const data = filteredBills.map(b => ({
      'Bill #': b.billNumber,
      'Supplier': b.supplierName,
      'Date': formatDate(b.billDate),
      'Due Date': formatDate(b.dueDate),
      'Amount': b.amount,
      'Paid': b.paidAmount,
      'Status': b.status
    }));
    exportToCSV(data, 'PurchaseBills');
  };

  const handleExportExcel = () => {
    const data = filteredBills.map(b => ({
      'Bill #': b.billNumber,
      'Supplier': b.supplierName,
      'Date': formatDate(b.billDate),
      'Due Date': formatDate(b.dueDate),
      'Amount': b.amount,
      'Paid': b.paidAmount,
      'Status': b.status
    }));
    exportToExcel(data, 'PurchaseBills');
  };

  const handleExportPDF = () => {
    const columns = ['Bill #', 'Supplier', 'Date', 'Due Date', 'Amount', 'Paid', 'Status'];
    const data = filteredBills.map(b => [
      b.billNumber,
      b.supplierName,
      formatDate(b.billDate),
      formatDate(b.dueDate),
      formatCurrency(b.amount),
      formatCurrency(b.paidAmount),
      b.status
    ]);
    exportToPDF({ title: 'Purchase Bills', columns, data, filename: 'PurchaseBills' });
  };

  const columns = [
    {
      header: "Bill Details",
      cell: (bill: PurchaseBill) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            <Receipt className="size-4" />
          </div>
          <div>
            <p className="font-medium text-foreground">{bill.billNumber}</p>
          </div>
        </div>
      )
    },
    {
      header: "Supplier",
      cell: (bill: PurchaseBill) => (
        <p className="font-medium text-foreground">{bill.supplierName}</p>
      )
    },
    {
      header: "Dates",
      cell: (bill: PurchaseBill) => (
        <div className="text-sm">
          <p className="text-foreground">{formatDate(bill.billDate)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(bill.dueDate)} (Due)</p>
        </div>
      )
    },
    {
      header: "Amount",
      className: "text-right",
      cell: (bill: PurchaseBill) => (
        <p className="text-sm font-semibold text-foreground">
          {formatCurrency(bill.amount)}
        </p>
      )
    },
    {
      header: "Balance",
      className: "text-right",
      cell: (bill: PurchaseBill) => (
        <p className={cn(
          "text-sm font-semibold",
          bill.amount - bill.paidAmount > 0 ? "text-rose-600" : "text-emerald-600"
        )}>
          {formatCurrency(bill.amount - bill.paidAmount)}
        </p>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cell: (bill: PurchaseBill) => (
        <div className="flex justify-center">
          <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1 capitalize", getStatusColor(bill.status))}>
            {getStatusIcon(bill.status)}
            {getStatusLabel(bill.status)}
          </Badge>
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (bill: PurchaseBill) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => onViewBill?.(bill.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => onEditBill?.(bill.id)}
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
              <DropdownMenuItem onClick={() => onViewBill?.(bill.id)} className="rounded-lg">
                <Eye className="size-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditBill?.(bill.id)} className="rounded-lg">
                <Edit className="size-4 mr-2" />
                Edit Bill
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
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
                onClick={() => setDeleteId(bill.id)}
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

  const renderMobileItem = (bill: PurchaseBill) => (
    <SmartCard
      key={bill.id}
      title={bill.supplierName}
      subtitle={bill.billNumber}
      density="compact"
      action={
        <Badge className={cn("rounded-full px-2 py-0.5 capitalize", getStatusColor(bill.status))}>
          {getStatusIcon(bill.status)}
          <span className="ml-1">{getStatusLabel(bill.status)}</span>
        </Badge>
      }
      onClick={() => onViewBill?.(bill.id)}
      footer={
        <div className="flex items-center justify-between text-xs text-muted-foreground w-full mt-2 pt-2 border-t border-border/50">
          <div className="flex flex-col">
            <span>{formatDate(bill.billDate)}</span>
            <span className="text-2xs text-rose-500">Due: {formatDate(bill.dueDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">
              {formatCurrency(bill.amount)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2"
              onClick={(e) => { e.stopPropagation(); setDeleteId(bill.id); }}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      }
    >
      <div className="text-sm text-muted-foreground flex justify-between items-center">
        <span>Balance:</span>
        <span className={cn(
          "font-medium",
          bill.amount - bill.paidAmount > 0 ? "text-rose-600" : "text-emerald-600"
        )}>
          {formatCurrency(bill.amount - bill.paidAmount)}
        </span>
      </div>
    </SmartCard>
  );

  // Flat layout — matches GoodsReceivedList pattern exactly
  return (
    <div className="space-y-6">
      {!hideStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Bills"
            value={bills.length}
            icon={FileText}
            gradient="bg-gradient-to-br from-primary to-primary/80"
            shadowColor="shadow-primary/20"
            compact
          />
          <StatsCard
            label="Total Amount"
            value={formatCurrency(totalAmount)}
            icon={IndianRupee}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            shadowColor="shadow-emerald-500/20"
            compact
          />
          <StatsCard
            label="Unpaid"
            value={unpaidCount}
            icon={Clock}
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
            shadowColor="shadow-amber-500/20"
            compact
          />
          <StatsCard
            label="Paid"
            value={paidCount}
            icon={CheckCircle}
            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
            shadowColor="shadow-teal-500/20"
            compact
          />
        </div>
      )}

      <ListFilters
        searchPlaceholder="Search by bill#, supplier..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefresh}
        isFetching={isFetching}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: "paid", label: "Paid" },
          { value: "unpaid", label: "Unpaid" },
          { value: "partial", label: "Partial" },
          { value: "overdue", label: "Overdue" },
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
        data={filteredBills}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={loading}
        onRowClick={(bill) => onViewBill?.(bill.id)}
        emptyState={{
          title: "No purchase bills found",
          description: "Record vendor bills to track payables, due dates, and expenses",
          icon: Receipt,
          action: onCreateNew ? (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Create First Bill
            </Button>
          ) : undefined
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Bill?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{bills.find(b => b.id === deleteId)?.billNumber}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
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
