import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Send,
  Copy,
  FileCheck,
  FileX,
  FileClock,
  Loader2,
} from "lucide-react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import { gstService } from "../../services/modules.service";
import { toast } from "sonner";

interface EInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  gstin?: string;
  invoiceValue: number;
  irn?: string;
  ackNumber?: string;
  ackDate?: string;
  signedQR?: string;
  status: string;
  errorMessage?: string;
}

export function EInvoiceGeneration() {
  const [loading, setLoading] = useState(true);
  const [eInvoices, setEInvoices] = useState<EInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<EInvoice | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEInvoices = async () => {
    setLoading(true);
    try {
      const response = await gstService.getEInvoices();
      if (response.success && response.data) {
        setEInvoices(response.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch e-invoices:", error);
      toast.error("Failed to load e-invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEInvoices();
  }, []);

  const filteredInvoices = eInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.irn && invoice.irn.toLowerCase().includes(searchQuery.toLowerCase()));
    const normalizedStatus = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).toLowerCase();
    const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "generated":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "generated":
        return <CheckCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      case "failed":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handleViewDetails = (invoice: EInvoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsDialogOpen(true);
  };

  const handleCancelEInvoice = (invoice: EInvoice) => {
    setSelectedInvoice(invoice);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedInvoice) return;

    setActionLoading(true);
    try {
      const response = await gstService.cancelEInvoice(selectedInvoice.id, cancelReason);
      if (response.success) {
        toast.success("E-Invoice cancelled successfully");
        fetchEInvoices();
      } else {
        toast.error(response.message || "Failed to cancel e-invoice");
      }
    } catch (error) {
      console.error("Failed to cancel e-invoice:", error);
      toast.error("Failed to cancel e-invoice");
    } finally {
      setActionLoading(false);
      setIsCancelDialogOpen(false);
      setCancelReason("");
    }
  };

  const stats = {
    total: eInvoices.length,
    generated: eInvoices.filter((i) => i.status.toLowerCase() === "generated").length,
    pending: eInvoices.filter((i) => i.status.toLowerCase() === "pending").length,
    failed: eInvoices.filter((i) => i.status.toLowerCase() === "failed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-xl">
            <FileText className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">E-Invoice (IRN) Generation</h2>
            <p className="text-muted-foreground text-sm">
              Generate and manage GST E-Invoices with IRN and QR codes
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <FileText className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total E-Invoices</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <FileCheck className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Generated</p>
          <h3 className="text-2xl font-bold text-emerald-600">{stats.generated}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <FileClock className="size-5 text-amber-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Pending</p>
          <h3 className="text-2xl font-bold text-amber-600">{stats.pending}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-rose-50 p-2.5 rounded-lg">
              <FileX className="size-5 text-rose-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Failed</p>
          <h3 className="text-2xl font-bold text-rose-600">{stats.failed}</h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-900 font-medium mb-1">E-Invoice Information</p>
              <p className="text-blue-700">
                E-Invoicing is mandatory for businesses with turnover &gt; ₹5 Cr. IRN (Invoice Reference Number) is generated by IRP (Invoice Registration Portal) and is valid for validation.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice, customer, or IRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All E-Invoices
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Pending")}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Generated")}>
                  Generated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Failed")}>
                  Failed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Cancelled")}>
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="h-10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* E-Invoices Table */}
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-muted/30 border-b border-border/50">
                <TableHead className="font-medium text-muted-foreground">Invoice Number</TableHead>
                <TableHead className="font-medium text-muted-foreground">Date</TableHead>
                <TableHead className="font-medium text-muted-foreground">Customer</TableHead>
                <TableHead className="font-medium text-muted-foreground">GSTIN</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="font-medium text-muted-foreground">IRN Number</TableHead>
                <TableHead className="font-medium text-muted-foreground">Ack Number</TableHead>
                <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-medium text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No e-invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/20 border-b border-border/50">
                    <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-foreground">{invoice.customerName}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground">{invoice.gstin || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">₹{Number(invoice.invoiceValue).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      {invoice.irn ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs truncate max-w-[100px] text-muted-foreground">
                            {invoice.irn.substring(0, 12)}...
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-muted"
                            onClick={() => navigator.clipboard.writeText(invoice.irn!)}
                          >
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {invoice.ackNumber ? (
                        <span className="font-mono text-xs text-muted-foreground">{invoice.ackNumber}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1", getStatusColor(invoice.status))}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </Badge>
                      {invoice.errorMessage && (
                        <div className="text-xs text-rose-600 mt-1">{invoice.errorMessage}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {invoice.status.toLowerCase() === "pending" && (
                            <DropdownMenuItem>
                              <Send className="h-4 w-4 mr-2" />
                              Generate E-Invoice
                            </DropdownMenuItem>
                          )}
                          {invoice.status.toLowerCase() === "failed" && (
                            <DropdownMenuItem>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Retry Generation
                            </DropdownMenuItem>
                          )}
                          {invoice.status.toLowerCase() === "generated" && (
                            <>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                Download JSON
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCancelEInvoice(invoice)} className="text-rose-600 focus:text-rose-600">
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel E-Invoice
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>E-Invoice Details</DialogTitle>
            <DialogDescription>Complete IRN and acknowledgment information</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Invoice Number</Label>
                  <div className="font-medium mt-1">{selectedInvoice.invoiceNumber}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={cn("gap-1", getStatusColor(selectedInvoice.status))}>
                      {getStatusIcon(selectedInvoice.status)}
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Customer</Label>
                  <div className="font-medium mt-1">{selectedInvoice.customerName}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">GSTIN</Label>
                  <div className="font-mono text-sm mt-1">{selectedInvoice.gstin || '-'}</div>
                </div>
                {selectedInvoice.irn && (
                  <>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">IRN Number</Label>
                      <div className="font-mono text-sm break-all bg-muted/50 p-3 rounded-lg mt-1 border border-border/50">
                        {selectedInvoice.irn}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Acknowledgment Number</Label>
                      <div className="font-mono text-sm mt-1">{selectedInvoice.ackNumber}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Acknowledgment Date</Label>
                      <div className="text-sm mt-1">
                        {selectedInvoice.ackDate &&
                          new Date(selectedInvoice.ackDate).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Valid Until</Label>
                      <div className="text-sm mt-1">
                        {selectedInvoice.ackDate &&
                          new Date(new Date(selectedInvoice.ackDate).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">QR Code</Label>
                      <div className="text-sm mt-1">{selectedInvoice.signedQR || "Not generated"}</div>
                    </div>
                  </>
                )}
              </div>
              {selectedInvoice.status === "Generated" && (
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <FileText className="h-4 w-4" />
                    Download JSON
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel E-Invoice</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this e-invoice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cancellation Reason *</Label>
              <Textarea
                placeholder="Enter reason for cancellation (minimum 15 characters)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                E-Invoice can only be cancelled within 24 hours of generation. This action cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelReason.length < 15}
            >
              Cancel E-Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}