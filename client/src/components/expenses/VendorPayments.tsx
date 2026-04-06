import { useState, useEffect } from "react";
import { expensesService } from "../../services/modules.service";
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
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search, IndianRupee, AlertCircle, CheckCircle, Clock, CreditCard, Download, Filter, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface VendorPayment {
  id: string;
  vendor: string;
  totalDue: number;
  paid: number;
  pending: number;
  lastPayment: string;
  status: "current" | "overdue" | "paid";
  expenseIds?: string[];
  paymentTerms?: string;
}

export function VendorPayments() {
  const [vendors, setVendors] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorPayment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await expensesService.getVendorPayments();
      if (response.success) {
        setVendors(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch vendor payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMakePayment = (vendor: VendorPayment) => {
    setSelectedVendor(vendor);
    setPaymentAmount(vendor.pending.toString());
    setIsPaymentOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedVendor || !paymentAmount || !paymentMethod) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      const amount = parseFloat(paymentAmount);
      const response = await expensesService.recordVendorPayment({
        vendor: selectedVendor.vendor,
        amount,
        paymentMethod,
      });

      if (response.success) {
        toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded successfully`);
        setIsPaymentOpen(false);
        setSelectedVendor(null);
        setPaymentAmount("");
        setPaymentMethod("");
        fetchVendors(); // Refresh data
      }
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
            <CheckCircle className="size-3" />
            Paid
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1">
            <AlertCircle className="size-3" />
            Overdue
          </Badge>
        );
      case "current":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
            <Clock className="size-3" />
            Current
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalDue = vendors.reduce((sum, v) => sum + v.totalDue, 0);
  const totalPaid = vendors.reduce((sum, v) => sum + v.paid, 0);
  const totalPending = vendors.reduce((sum, v) => sum + v.pending, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading vendor payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-xl">
            <CreditCard className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Vendor Payments</h2>
            <p className="text-muted-foreground text-sm">
              Track and manage payments to your vendors
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <IndianRupee className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Due</p>
          <h3 className="text-2xl font-bold text-foreground">₹{totalDue.toLocaleString("en-IN")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{vendors.length} vendors</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <CheckCircle className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Paid</p>
          <h3 className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString("en-IN")}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {((totalPaid / totalDue) * 100).toFixed(0)}% of total
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <AlertCircle className="size-5 text-amber-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Pending Payments</p>
          <h3 className="text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString("en-IN")}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {vendors.filter((v) => v.pending > 0).length} vendors
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              className="pl-9 bg-background h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 h-10">
              <Filter className="size-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 h-10">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Vendor Payments Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/50">
              <TableRow>
                <TableHead className="font-medium text-muted-foreground">Vendor</TableHead>
                <TableHead className="font-medium text-muted-foreground">Payment Terms</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Total Due</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Paid</TableHead>
                <TableHead className="font-medium text-muted-foreground text-right">Pending</TableHead>
                <TableHead className="hidden lg:table-cell font-medium text-muted-foreground">Last Payment</TableHead>
                <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-medium text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor, index) => (
                <TableRow
                  key={vendor.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/20 transition-colors",
                    index === filteredVendors.length - 1 && "border-b-0"
                  )}
                >
                  <TableCell>
                    <div>
                      <p className="text-foreground font-medium">{vendor.vendor}</p>
                      <p className="text-xs text-muted-foreground">{vendor.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted font-normal">{vendor.paymentTerms}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    ₹{vendor.totalDue.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    ₹{vendor.paid.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-amber-600">
                    ₹{vendor.pending.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {vendor.lastPayment !== "—"
                      ? new Date(vendor.lastPayment).toLocaleDateString("en-IN")
                      : "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                  <TableCell className="text-right">
                    {vendor.pending > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleMakePayment(vendor)}
                        className="h-8"
                      >
                        Pay Now
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment to {selectedVendor?.vendor}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted rounded-lg space-y-2 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vendor:</span>
                <span className="text-foreground font-medium">{selectedVendor?.vendor}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending Amount:</span>
                <span className="text-amber-600 font-bold">
                  ₹{selectedVendor?.pending.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payAmount">Payment Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="payAmount"
                  type="number"
                  className="pl-7"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="debit">Debit Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitPayment}>Record Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
