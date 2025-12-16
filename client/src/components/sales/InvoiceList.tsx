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
} from "lucide-react";
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
  name: string;
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

  const getStatusColor = (status: string = '') => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
      case 'unpaid':
      case 'draft':
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100';
      case 'sent':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      case 'overdue':
        return 'bg-red-100 text-red-700 hover:bg-red-100';
      case 'partial':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100';
    }
  };

  const getStatusIcon = (status: string = '') => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'paid':
        return <CheckCircle className="size-3" />;
      case 'overdue':
        return <Clock className="size-3" />;
      default:
        return null;
    }
  };

  const handleView = (id: string) => {
    navigate(`/sales/invoices/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/sales/invoices/${id}/edit`);
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      toast.info(`Generating PDF for ${invoice.invoiceNumber}...`);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/sales/invoices/${invoice.id}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

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
    const customerName = invoice.customer?.name || invoice.customerName || 'Customer';

    if (!customerEmail) {
      toast.warning("Customer email not found. Opening email client...");
      window.open(
        `mailto:?subject=Invoice ${invoice.invoiceNumber}&body=Dear Customer,%0D%0A%0D%0APlease find attached invoice ${invoice.invoiceNumber} for ₹${(invoice.totalAmount || invoice.amount || 0).toLocaleString('en-IN')}.%0D%0A%0D%0AThank you for your business!`,
        '_blank'
      );
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send email');
      }

      toast.success(`Invoice sent to ${customerEmail}`);
      onRefresh();
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error(error.message || "Email server unavailable. Opening email client...");
      window.open(
        `mailto:${customerEmail}?subject=Invoice ${invoice.invoiceNumber}&body=Dear ${customerName},%0D%0A%0D%0APlease find attached invoice ${invoice.invoiceNumber} for ₹${(invoice.totalAmount || invoice.amount || 0).toLocaleString('en-IN')}.%0D%0A%0D%0AThank you for your business!`,
        '_blank'
      );
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <FileText className="size-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground mb-1">No invoices found</p>
            <p className="text-muted-foreground">Create your first invoice to get started</p>
          </div>
          <Button
            onClick={onCreateNew || (() => navigate('/sales/invoices/new'))}
            className="mt-2 gap-2 rounded-xl"
          >
            <Plus className="size-4" />
            Create First Invoice
          </Button>
        </div>
      </div>
    );
  }

  const totalValue = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || invoice.amount || 0), 0);
  const pendingCount = invoices.filter(i => i.status === 'unpaid' || i.status === 'sent' || i.status === 'partial').length;
  const paidCount = invoices.filter(i => i.status === 'paid').length;

  return (
    <div className="space-y-6">
      {/* Premium Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Invoices</span>
            </div>
            <h3 className="text-3xl font-bold">{invoices.length}</h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Total Value</span>
            </div>
            <h3 className="text-2xl font-bold">
              {totalValue >= 100000
                ? `₹${(totalValue / 100000).toFixed(1)}L`
                : `₹${totalValue.toLocaleString("en-IN")}`}
            </h3>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Pending</span>
            </div>
            <h3 className="text-3xl font-bold">{pendingCount}</h3>
            <p className="text-xs opacity-75 mt-1">Awaiting payment</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-teal-500/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="size-5 opacity-80" />
              <span className="text-sm font-medium opacity-90">Paid</span>
            </div>
            <h3 className="text-3xl font-bold">{paidCount}</h3>
            <p className="text-xs opacity-75 mt-1">Completed</p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2 rounded-xl" onClick={onRefresh}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr className="border-b border-border">
              <th className="px-5 py-4 text-left font-semibold text-foreground">Invoice #</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Customer</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Date</th>
              <th className="px-5 py-4 text-left font-semibold text-foreground">Due Date</th>
              <th className="px-5 py-4 text-right font-semibold text-foreground">Amount</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Status</th>
              <th className="px-5 py-4 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, idx) => (
              <tr
                key={invoice.id}
                className={cn(
                  "border-b border-border/50 hover:bg-slate-50/50 transition-all duration-200",
                  idx === invoices.length - 1 && "border-b-0"
                )}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                      <FileText className="size-4" />
                    </div>
                    <span className="font-medium text-primary">{invoice.invoiceNumber}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {invoice.customer?.name || invoice.customerName || 'Unknown Customer'}
                  </p>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {(invoice.invoiceDate || invoice.date)
                    ? new Date(invoice.invoiceDate || invoice.date!).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                    : '-'}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                    : '-'}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="text-lg font-semibold text-foreground">
                    ₹{(invoice.totalAmount || invoice.amount || 0).toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-center">
                    <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getStatusColor(invoice.status))}>
                      {getStatusIcon(invoice.status)}
                      {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
                    </Badge>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => handleView(invoice.id)}
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg hover:bg-purple-50 hover:text-purple-600"
                      onClick={() => handleEdit(invoice.id)}
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
                        <DropdownMenuItem onClick={() => handleView(invoice.id)} className="rounded-lg">
                          <Eye className="size-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(invoice.id)} className="rounded-lg">
                          <Edit className="size-4 mr-2" />
                          Edit Invoice
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDownload(invoice)} className="rounded-lg">
                          <Download className="size-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSend(invoice)} className="rounded-lg">
                          <Send className="size-4 mr-2" />
                          Send to Customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(invoice.id)}
                          className="text-destructive focus:text-destructive rounded-lg"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="font-medium text-primary">{invoice.invoiceNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {invoice.customer?.name || invoice.customerName || 'Unknown Customer'}
                  </p>
                </div>
              </div>
              <Badge className={cn("rounded-full px-3 py-1", getStatusColor(invoice.status))}>
                {(invoice.status || 'draft').charAt(0).toUpperCase() + (invoice.status || 'draft').slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Date</p>
                <p className="font-medium">
                  {new Date(invoice.invoiceDate || invoice.date || new Date()).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Amount</p>
                <p className="text-xl font-bold text-indigo-600">
                  ₹{(invoice.totalAmount || invoice.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => handleView(invoice.id)}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => handleEdit(invoice.id)}
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
                  <DropdownMenuItem onClick={() => handleDownload(invoice)} className="rounded-lg">
                    <Download className="size-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSend(invoice)} className="rounded-lg">
                    <Send className="size-4 mr-2" />
                    Send
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteId(invoice.id)}
                    className="text-destructive focus:text-destructive rounded-lg"
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
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
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