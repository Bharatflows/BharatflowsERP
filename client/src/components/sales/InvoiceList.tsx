import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  MoreVertical,
  Plus,
  FileText,
  IndianRupee,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  FileDown,
  Sheet,
  ChevronDown
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { SmartCard } from "@/components/ui/SmartCard";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { ListFilters } from "@/components/ui/ListFilters";
import { exportToCSV, exportToExcel, exportToPDF } from "../../lib/exportUtils";
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
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  customer?: { name: string; email?: string };
  date?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount?: number;
  totalAmount?: number;
  status: string;
  items?: number | any[];
  name?: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  onCreateNew?: () => void;
}

export function InvoiceList({ invoices, onDelete, onRefresh, isLoading = false, onCreateNew }: InvoiceListProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string = '') => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'unpaid':
      case 'draft':
        return 'bg-muted text-foreground border-slate-200';
      case 'sent':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'partial':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-muted text-foreground border-slate-200';
    }
  };

  const getStatusIcon = (status: string = '') => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'paid': return <CheckCircle className="size-3" />;
      case 'unpaid':
      case 'draft': return <Clock className="size-3" />;
      case 'sent': return <Send className="size-3" />;
      case 'overdue': return <Clock className="size-3" />;
      default: return null;
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      toast.info(`Generating PDF for ${invoice.invoiceNumber}...`);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/sales/invoices/${invoice.id}/pdf`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${invoice.invoiceNumber}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download PDF. Please try viewing the invoice first.");
    }
  };

  const handleSend = async (invoice: Invoice) => {
    const customerEmail = invoice.customer?.email;
    if (!customerEmail) {
      toast.warning("Customer email not found. Opening email client...");
      window.open(`mailto:?subject=Invoice ${invoice.invoiceNumber}`, '_blank');
      return;
    }
    try {
      toast.info(`Sending ${invoice.invoiceNumber} to ${customerEmail}...`);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/sales/invoices/${invoice.id}/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to send email');
      toast.success(`Invoice sent to ${customerEmail}`);
      onRefresh();
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error(error.message || "Email server unavailable. Opening email client...");
      window.open(`mailto:${customerEmail}?subject=Invoice ${invoice.invoiceNumber}`, '_blank');
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchSearch =
      (invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (invoice.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter;

    return matchSearch && matchStatus;
  });

  const revenueInvoices = statusFilter === 'all'
    ? filteredInvoices.filter(i => !['draft', 'cancelled'].includes(i.status.toLowerCase()))
    : filteredInvoices;

  const totalAmount = revenueInvoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.amount || 0), 0);
  const paidCount = filteredInvoices.filter((i) => i.status.toLowerCase() === "paid").length;
  const overdueCount = filteredInvoices.filter((i) => i.status.toLowerCase() === "overdue").length;

  const handleExportCSV = () => {
    const data = filteredInvoices.map(i => ({
      'Invoice #': i.invoiceNumber,
      'Customer': i.customerName || i.customer?.name || 'Unknown',
      'Date': i.date || i.invoiceDate ? new Date(i.date || i.invoiceDate || '').toLocaleDateString() : '-',
      'Due Date': i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '-',
      'Amount': i.totalAmount || i.amount || 0,
      'Status': i.status
    }));
    exportToCSV(data, 'Invoices');
  };

  const handleExportExcel = () => {
    const data = filteredInvoices.map(i => ({
      'Invoice #': i.invoiceNumber,
      'Customer': i.customerName || i.customer?.name || 'Unknown',
      'Date': i.date || i.invoiceDate ? new Date(i.date || i.invoiceDate || '').toLocaleDateString() : '-',
      'Due Date': i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '-',
      'Amount': i.totalAmount || i.amount || 0,
      'Status': i.status
    }));
    exportToExcel(data, 'Invoices');
  };

  const handleExportPDF = () => {
    const columns = ['Invoice #', 'Customer', 'Date', 'Due Date', 'Amount', 'Status'];
    const data = filteredInvoices.map(i => [
      i.invoiceNumber,
      i.customerName || i.customer?.name || 'Unknown',
      i.date || i.invoiceDate ? new Date(i.date || i.invoiceDate || '').toLocaleDateString() : '-',
      i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '-',
      `₹${(i.totalAmount || i.amount || 0).toLocaleString()}`,
      i.status
    ]);
    exportToPDF({ title: 'Invoices', columns, data, filename: 'Invoices' });
  };

  const columns = [
    {
      header: "Invoice No.",
      cell: (invoice: Invoice) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            <FileText className="size-4" />
          </div>
          <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>
        </div>
      )
    },
    {
      header: "Customer",
      cell: (invoice: Invoice) => (
        <span className="font-medium text-foreground">{invoice.customerName || invoice.customer?.name || "Unknown Customer"}</span>
      )
    },
    {
      header: "Date",
      cell: (invoice: Invoice) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {invoice.date || invoice.invoiceDate ? new Date(invoice.date || invoice.invoiceDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
        </span>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cell: (invoice: Invoice) => (
        <div className="flex justify-center">
          <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-medium gap-1 capitalize", getStatusColor(invoice.status))}>
            {getStatusIcon(invoice.status)}
            {invoice.status}
          </Badge>
        </div>
      )
    },
    {
      header: "Amount",
      className: "text-right",
      cell: (invoice: Invoice) => (
        <span className="text-lg font-semibold text-foreground">
          ₹{(invoice.totalAmount || invoice.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (invoice: Invoice) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-view"
            onClick={(e) => { e.stopPropagation(); navigate(`/sales/invoices/${invoice.id}`); }}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-lg action-edit"
            onClick={(e) => { e.stopPropagation(); navigate(`/sales/invoices/${invoice.id}/edit`); }}
          >
            <Edit className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sales/invoices/${invoice.id}`); }} className="rounded-lg">
                <Eye className="size-4 mr-2" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/sales/invoices/${invoice.id}/edit`); }} className="rounded-lg">
                <Edit className="size-4 mr-2" /> Edit Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(invoice); }} className="rounded-lg">
                <Download className="size-4 mr-2" /> Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSend(invoice); }} className="rounded-lg">
                <Send className="size-4 mr-2" /> Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive rounded-lg"
                onClick={(e) => { e.stopPropagation(); setDeleteId(invoice.id); }}
              >
                <Trash2 className="size-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const renderMobileItem = (invoice: Invoice) => (
    <SmartCard
      title={invoice.customerName || invoice.customer?.name || "Unknown Customer"}
      subtitle={invoice.invoiceNumber}
      action={
        <Badge variant="outline" className={cn("capitalize px-2 py-0.5", getStatusColor(invoice.status))}>
          {invoice.status}
        </Badge>
      }
      onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-lg font-bold text-primary">
            ₹{(invoice.totalAmount || invoice.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => { e.stopPropagation(); navigate(`/sales/invoices/${invoice.id}/edit`); }}>
              <Edit className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(invoice); }}>Download PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSend(invoice); }}>Send Email</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(invoice.id); }} className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      }
    >
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{invoice.date || invoice.invoiceDate ? new Date(invoice.date || invoice.invoiceDate).toLocaleDateString() : "-"}</span>
        {invoice.dueDate && <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>}
      </div>
    </SmartCard>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Invoices"
          value={invoices.length}
          icon={FileText}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="Total Revenue"
          value={totalAmount >= 10000000
            ? `${(totalAmount / 10000000).toFixed(2)}Cr`
            : totalAmount >= 100000
              ? `${(totalAmount / 100000).toFixed(2)}L`
              : totalAmount.toLocaleString("en-IN")}
          prefix="₹"
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
        <StatsCard
          label="Paid"
          value={paidCount}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          shadowColor="shadow-teal-500/20"
        />
        <StatsCard
          label="Overdue"
          value={overdueCount}
          icon={Clock}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
          shadowColor="shadow-red-500/20"
        />
      </div>

      <ListFilters
        searchPlaceholder="Search invoices..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={onRefresh}
        isFetching={isLoading}
        statusOptions={[
          { value: "all", label: "All Status" },
          { value: "draft", label: "Draft" },
          { value: "sent", label: "Sent" },
          { value: "paid", label: "Paid" },
          { value: "overdue", label: "Overdue" },
          { value: "cancelled", label: "Cancelled" },
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
        data={filteredInvoices}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={isLoading}
        onRowClick={(invoice) => navigate(`/sales/invoices/${invoice.id}`)}
        emptyState={{
          title: "No invoices found",
          description: searchQuery ? "Try adjusting your filters" : "Create your first invoice to get started",
          icon: FileText,
          action: onCreateNew ? (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Create First Invoice
            </Button>
          ) : undefined
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)} className="rounded-xl">Cancel</AlertDialogCancel>
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