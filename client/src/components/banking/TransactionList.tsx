import { useState, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  MoreHorizontal,
  Download,
  Filter,
  CreditCard,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  FileDown,
  Sheet,
  ChevronDown
} from "lucide-react";
import { DataTable } from "../ui/data-table";
import { StatsCard } from "../ui/stats-card";
import { ListFilters } from "../ui/ListFilters";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useBankingTransactions } from "../../hooks/useBanking";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { exportToCSV, exportToExcel, exportToPDF, formatCurrency, formatDate } from "../../lib/exportUtils";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "credit" | "debit";
  account: string;  // This might need mapping from accountName if API returns object
  status: "cleared" | "pending" | "failed";
  reference?: string;
  accountName?: string; // API might return this
}

export function TransactionList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: response, isLoading, refetch, isFetching } = useBankingTransactions();

  const transactions: Transaction[] = useMemo(() => {
    const data = (response as any)?.data || [];
    return data.map((txn: any) => ({
      id: txn.id,
      date: txn.date,
      description: txn.description,
      category: txn.category,
      amount: Number(txn.amount),
      type: (txn.type || "debit").toLowerCase(),
      account: txn.accountName || "Unknown Account",
      status: (txn.status || "cleared").toLowerCase(),
      reference: txn.reference
    }));
  }, [response]);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared": return "badge-success";
      case "pending": return "badge-pending";
      case "failed": return "badge-error";
      default: return "badge-draft";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "cleared": return <CheckCircle className="size-3" />;
      case "pending": return <AlertCircle className="size-3" />;
      case "failed": return <XCircle className="size-3" />;
      default: return null;
    }
  };

  const stats = {
    total: transactions.length,
    credit: transactions.filter(t => t.type === 'credit').length,
    debit: transactions.filter(t => t.type === 'debit').length,
    balance: transactions.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : -t.amount), 0)
  };

  const handleExportCSV = () => {
    const data = filteredTransactions.map(t => ({
      'Date': formatDate(t.date),
      'Description': t.description,
      'Account': t.account,
      'Category': t.category,
      'Type': t.type,
      'Amount': t.amount,
      'Status': t.status
    }));
    exportToCSV(data, 'Transactions', []);
  };

  const handleExportExcel = () => {
    const data = filteredTransactions.map(t => ({
      'Date': formatDate(t.date),
      'Description': t.description,
      'Account': t.account,
      'Category': t.category,
      'Type': t.type,
      'Amount': t.amount,
      'Status': t.status
    }));
    exportToExcel(data, 'Transactions', []);
  };

  const handleExportPDF = () => {
    const columns = ['Date', 'Description', 'Account', 'Category', 'Type', 'Amount', 'Status'];
    const data = filteredTransactions.map(t => [
      formatDate(t.date),
      t.description,
      t.account,
      t.category,
      t.type,
      formatCurrency(t.amount),
      t.status
    ]);
    exportToPDF({ title: 'Transaction Report', columns, data, filename: 'Transactions' });
  };

  const columns = [
    {
      header: "Description",
      cell: (txn: Transaction) => (
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full flex-shrink-0 flex items-center justify-center w-9 h-9",
            txn.type === 'credit' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
          )}>
            {txn.type === 'credit' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
          </div>
          <div>
            <p className="font-medium text-foreground truncate max-w-[200px]" title={txn.description}>{txn.description}</p>
            {txn.reference && <p className="text-xs text-muted-foreground">Ref: {txn.reference}</p>}
          </div>
        </div>
      )
    },
    {
      header: "Date",
      cell: (txn: Transaction) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-3.5" />
          {formatDate(txn.date)}
        </div>
      )
    },
    {
      header: "Account",
      className: "hidden md:table-cell",
      cell: (txn: Transaction) => (
        <span className="text-foreground">{txn.account}</span>
      )
    },
    {
      header: "Category",
      className: "hidden lg:table-cell",
      cell: (txn: Transaction) => (
        <Badge variant="outline" className="font-normal">{txn.category}</Badge>
      )
    },
    {
      header: "Amount",
      className: "text-right",
      cell: (txn: Transaction) => (
        <span className={cn("font-medium",
          txn.type === 'credit' ? "text-emerald-600" : "text-foreground"
        )}>
          {txn.type === 'credit' ? "+" : "-"}{formatCurrency(txn.amount)}
        </span>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cell: (txn: Transaction) => (
        <div className="flex justify-center">
          <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(txn.status))}>
            {getStatusIcon(txn.status)}
            {txn.status}
          </Badge>
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (txn: Transaction) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem className="rounded-lg">
              <FileText className="size-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
              <Download className="size-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const renderMobileItem = (txn: Transaction) => (
    <div
      key={txn.id}
      className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full flex-shrink-0 flex items-center justify-center w-10 h-10",
            txn.type === 'credit' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
          )}>
            {txn.type === 'credit' ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{txn.description}</h3>
            <p className="text-sm text-muted-foreground">{txn.account}</p>
          </div>
        </div>
        <Badge className={cn("rounded-full px-3 py-1", getStatusColor(txn.status))}>
          {txn.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Date</p>
          <p className="font-medium">{formatDate(txn.date)}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground mb-1">Amount</p>
          <p className={cn("font-medium",
            txn.type === 'credit' ? "text-emerald-600" : "text-foreground"
          )}>
            {txn.type === 'credit' ? "+" : "-"}{formatCurrency(txn.amount)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Category</p>
          <Badge variant="outline" className="font-normal">{txn.category}</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Transactions"
          value={stats.total}
          icon={FileText}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="Net Balance"
          value={formatCurrency(stats.balance)}
          icon={CreditCard}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="Money In"
          value={stats.credit}
          icon={ArrowDownLeft}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
        <StatsCard
          label="Money Out"
          value={stats.debit}
          icon={ArrowUpRight}
          gradient="bg-gradient-to-br from-rose-500 to-rose-600"
          shadowColor="shadow-rose-500/20"
        />
      </div>

      <ListFilters
        searchPlaceholder="Search transactions..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refetch}
        isFetching={isFetching}
        statusValue={typeFilter}
        onStatusChange={setTypeFilter}
        statusOptions={[
          { value: "credit", label: "Money In (Credit)" },
          { value: "debit", label: "Money Out (Debit)" },
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
        data={filteredTransactions}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={isLoading}
        emptyState={{
          title: "No transactions found",
          description: "Record your first transaction to get started",
          icon: CreditCard
        }}
      />
    </div>
  );
}
