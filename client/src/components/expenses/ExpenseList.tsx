import { useState, useMemo } from "react";
import {
  FileText,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Download,
  Plus,
  FileDown,
  Sheet,
  ChevronDown,
  CreditCard,
  IndianRupee,
  CheckCheck
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
import { useExpenses, useDeleteExpense, useApproveExpense, useMarkAsPaid } from "../../hooks/useExpenses";
import { useFYOptions } from "../../hooks/useFinancialYears";

interface Expense {
  id: string;
  expenseNumber?: string;
  date: string;
  description: string;
  category: string;
  vendor: string;
  amount: number;
  paymentMethod: string;
  status: "paid" | "pending" | "approved";
  receiptUrl?: string;
  notes?: string;
}

interface ExpenseListProps {
  onEditExpense: (expenseId: string) => void;
  onCreateNew?: () => void;
}

export function ExpenseList({ onEditExpense, onCreateNew }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fyFilter, setFyFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { options: fyOptions } = useFYOptions();

  // Data fetching hooks
  const { data: expensesData, isLoading: loading, isFetching, refetch } = useExpenses();
  const deleteMutation = useDeleteExpense();
  const approveMutation = useApproveExpense();
  const markPaidMutation = useMarkAsPaid();

  // Map API response to component format
  const expenses: Expense[] = useMemo(() => {
    const expensesArray = (expensesData?.data as any) || [];
    return expensesArray.map((exp: any) => ({
      id: exp.id,
      expenseNumber: exp.expenseNumber,
      date: exp.date,
      description: exp.description,
      category: exp.category,
      vendor: exp.vendor || '',
      amount: Number(exp.amount),
      paymentMethod: exp.paymentMethod || '',
      status: (exp.status || 'pending').toLowerCase(),
      receiptUrl: exp.receiptUrl,
      notes: exp.notes
    }));
  }, [expensesData]);

  const categories = useMemo(() =>
    ["Rent", "Salaries", "Utilities", "Transport", "Marketing", "Office Supplies", "Business Meals", ...new Set(expenses.map(e => e.category))].filter((v, i, a) => a.indexOf(v) === i && v !== "all"),
    [expenses]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleMarkPaid = (id: string) => {
    markPaidMutation.mutate(id);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.expenseNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    // Note: FY filtering would ideally be server-side or require checking date ranges
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "badge-paid";
      case "pending": return "badge-draft"; // Using draft styling for pending
      case "approved": return "badge-sent"; // Using sent styling for approved
      default: return "badge-draft";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="size-3" />;
      case "pending": return <Clock className="size-3" />;
      case "approved": return <CheckCheck className="size-3" />; // Double check for approved
      default: return null;
    }
  };

  const stats = {
    total: expenses.length,
    pending: expenses.filter(e => e.status === "pending").length,
    approved: expenses.filter(e => e.status === "approved").length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
  };

  const handleExportCSV = () => {
    const data = filteredExpenses.map(e => ({
      'Expense #': e.expenseNumber || '-',
      'Date': formatDate(e.date),
      'Description': e.description,
      'Category': e.category,
      'Vendor': e.vendor,
      'Amount': e.amount,
      'Status': e.status
    }));
    exportToCSV(data, 'Expenses');
  };

  const handleExportExcel = () => {
    const data = filteredExpenses.map(e => ({
      'Expense #': e.expenseNumber || '-',
      'Date': formatDate(e.date),
      'Description': e.description,
      'Category': e.category,
      'Vendor': e.vendor,
      'Amount': e.amount,
      'Status': e.status
    }));
    exportToExcel(data, 'Expenses');
  };

  const handleExportPDF = () => {
    const columns = ['Expense #', 'Date', 'Description', 'Category', 'Vendor', 'Amount', 'Status'];
    const data = filteredExpenses.map(e => [
      e.expenseNumber || '-',
      formatDate(e.date),
      e.description,
      e.category,
      e.vendor,
      formatCurrency(e.amount),
      e.status
    ]);
    exportToPDF({ title: 'Expenses Report', columns, data, filename: 'Expenses' });
  };

  const columns = [
    {
      header: "Expense Info",
      cell: (expense: Expense) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            <FileText className="size-4" />
          </div>
          <div>
            <p className="text-foreground font-medium">{expense.description}</p>
            <p className="text-muted-foreground text-xs font-mono">{expense.expenseNumber || expense.id.slice(0, 8)}</p>
          </div>
        </div>
      )
    },
    {
      header: "Date",
      cell: (expense: Expense) => (
        <span className="text-muted-foreground">{formatDate(expense.date)}</span>
      )
    },
    {
      header: "Category",
      cell: (expense: Expense) => (
        <Badge variant="outline" className="font-normal">{expense.category}</Badge>
      )
    },
    {
      header: "Vendor",
      className: "hidden lg:table-cell",
      cell: (expense: Expense) => (
        <span className="text-foreground">{expense.vendor}</span>
      )
    },
    {
      header: "Amount",
      className: "text-right",
      cell: (expense: Expense) => (
        <span className="text-foreground font-medium">{formatCurrency(expense.amount)}</span>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cell: (expense: Expense) => (
        <div className="flex justify-center">
          <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(expense.status))}>
            {getStatusIcon(expense.status)}
            {expense.status === "paid" ? "Paid" : expense.status === "approved" ? "Approved" : "Pending"}
          </Badge>
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (expense: Expense) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEditExpense(expense.id)}
          >
            <Edit className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => onEditExpense(expense.id)} className="rounded-lg">
                <Edit className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <FileText className="size-4 mr-2" />
                View Receipt
              </DropdownMenuItem>

              {expense.status === "pending" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleApprove(expense.id)} className="rounded-lg text-blue-600 focus:text-blue-700">
                    <CheckCheck className="size-4 mr-2" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkPaid(expense.id)} className="rounded-lg text-emerald-600 focus:text-emerald-700">
                    <CheckCircle className="size-4 mr-2" />
                    Mark as Paid
                  </DropdownMenuItem>
                </>
              )}
              {expense.status === "approved" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleMarkPaid(expense.id)} className="rounded-lg text-emerald-600 focus:text-emerald-700">
                    <CheckCircle className="size-4 mr-2" />
                    Mark as Paid
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive rounded-lg" onClick={() => handleDelete(expense.id)}>
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const renderMobileItem = (expense: Expense) => (
    <div
      key={expense.id}
      className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onEditExpense(expense.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{expense.description}</h3>
            <p className="text-sm text-muted-foreground">{expense.vendor}</p>
          </div>
        </div>
        <Badge className={cn("rounded-full px-3 py-1", getStatusColor(expense.status))}>
          {expense.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Date</p>
          <p className="font-medium">{formatDate(expense.date)}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground mb-1">Amount</p>
          <p className="font-medium">{formatCurrency(expense.amount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Category</p>
          <Badge variant="outline" className="font-normal">{expense.category}</Badge>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        {expense.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl"
            onClick={(e) => { e.stopPropagation(); handleApprove(expense.id); }}
          >
            Approve
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onEditExpense(expense.id); }}
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
            <DropdownMenuItem className="text-destructive rounded-lg" onClick={() => handleDelete(expense.id)}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Expenses"
          value={stats.total}
          icon={FileText}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          shadowColor="shadow-amber-500/20"
        />
        <StatsCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
        <StatsCard
          label="Total Value"
          value={formatCurrency(stats.totalAmount)}
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
      </div>

      <ListFilters
        searchPlaceholder="Search expenses..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refetch}
        isFetching={isFetching}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: "paid", label: "Paid" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
        ]}
      >
        {/* Category filter */}
        <div className="w-[160px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-11 rounded-xl">
                <span className="truncate">
                  {categoryFilter === "all" ? "Categories" : categoryFilter}
                </span>
                <ChevronDown className="size-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-xl max-h-[300px] overflow-auto">
              <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                All Categories
              </DropdownMenuItem>
              {categories.map(cat => (
                <DropdownMenuItem key={cat} onClick={() => setCategoryFilter(cat)}>
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* FY filter */}
        <div className="w-[140px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-11 rounded-xl">
                <span className="truncate">
                  {fyOptions.find(opt => opt.value === fyFilter)?.label?.split(' ')[0] || "All Years"}
                </span>
                <ChevronDown className="size-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[140px] rounded-xl">
              <DropdownMenuItem onClick={() => setFyFilter("all")}>
                All Years
              </DropdownMenuItem>
              {fyOptions.map(fy => (
                <DropdownMenuItem key={fy.value} onClick={() => setFyFilter(fy.value)}>
                  {fy.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Export dropdown */}
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
        data={filteredExpenses}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={loading}
        onRowClick={(expense) => onEditExpense(expense.id)}
        emptyState={{
          title: "No expenses found",
          description: "Record your first expense to get started",
          icon: CreditCard,
          action: onCreateNew ? (
            <Button onClick={onCreateNew} className="rounded-xl">
              <Plus className="size-4 mr-2" />
              Record Expense
            </Button>
          ) : undefined
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense?
              This action cannot be undone.
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
    </div >
  );
}
