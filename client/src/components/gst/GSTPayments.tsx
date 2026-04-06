import { useState, useEffect } from "react";
import { Search, Plus, Download, CreditCard, CheckCircle, TrendingUp, IndianRupee, AlertCircle, Wallet, Loader2, RefreshCw } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { gstService } from "../../services/modules.service";

interface GSTPayment {
  id: string;
  challanNumber: string;
  date: string;
  period: string;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  interest: number;
  lateFee: number;
  penalty: number;
  total: number;
  status: "success" | "pending" | "failed";
  paymentMode: string;
}

interface PaymentSummary {
  totalPayments: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  grandTotal: number;
}

export function GSTPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<GSTPayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalPayments: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    grandTotal: 0,
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        gstService.getPayments(),
        gstService.getPaymentSummary(),
      ]);

      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data.items || []);
      }

      if (summaryRes.success && summaryRes.data) {
        setSummary({
          totalPayments: summaryRes.data.totalPayments || 0,
          totalCGST: summaryRes.data.totalCGST || 0,
          totalSGST: summaryRes.data.totalSGST || 0,
          totalIGST: summaryRes.data.totalIGST || 0,
          grandTotal: summaryRes.data.grandTotal || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch GST payments:", error);
      toast.error("Failed to load GST payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.challanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.period.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Use data from API or calculate from payments list
  const totalPaid = summary.grandTotal || payments.reduce((sum, p) => sum + Number(p.total), 0);
  const totalCGST = summary.totalCGST || payments.reduce((sum, p) => sum + Number(p.cgst), 0);
  const totalSGST = summary.totalSGST || payments.reduce((sum, p) => sum + Number(p.sgst), 0);

  const handleNewPayment = () => {
    toast.info("GST payment portal will open");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <CreditCard className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">GST Payments</h2>
              <p className="text-muted-foreground text-sm">
                View and manage your GST tax payments
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPayments} className="gap-2 h-10">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button onClick={handleNewPayment} className="gap-2 h-10">
              <Plus className="size-4" />
              Make Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <CheckCircle className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Paid</p>
          <h3 className="text-2xl font-bold text-emerald-600">
            ₹{totalPaid >= 100000 ? (totalPaid / 100000).toFixed(2) + 'L' : totalPaid.toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <TrendingUp className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">CGST Paid</p>
          <h3 className="text-2xl font-bold text-blue-600">
            ₹{totalCGST >= 100000 ? (totalCGST / 100000).toFixed(2) + 'L' : totalCGST.toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-violet-50 p-2.5 rounded-lg">
              <Wallet className="size-5 text-violet-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">SGST Paid</p>
          <h3 className="text-2xl font-bold text-violet-600">
            ₹{totalSGST >= 100000 ? (totalSGST / 100000).toFixed(2) + 'L' : totalSGST.toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <IndianRupee className="size-5 text-amber-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Transactions</p>
          <h3 className="text-2xl font-bold text-foreground">{payments.length}</h3>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by challan number or period..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background h-10"
            />
          </div>
          <Button variant="outline" className="gap-2 h-10">
            <Download className="size-4" />
            Export Payments
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Challan No.</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">CGST</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">SGST</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">IGST</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Interest</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Late Fee</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="text-center px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                    No GST payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className={cn(
                      "border-b border-border/50 hover:bg-muted/20 transition-colors",
                      index === filteredPayments.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{payment.challanNumber}</p>
                      <p className="text-xs text-muted-foreground">{payment.paymentMode}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">
                        {new Date(payment.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{payment.period}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-foreground">
                        ₹{Number(payment.cgst).toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-foreground">
                        ₹{Number(payment.sgst).toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-foreground">
                        ₹{Number(payment.igst).toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-foreground">
                        ₹{Number(payment.interest).toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm text-foreground">
                        ₹{Number(payment.lateFee).toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        ₹{Number(payment.total).toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <Badge
                          variant="outline"
                          className={cn("gap-1", getStatusColor(payment.status))}
                        >
                          {payment.status === "success" && <CheckCircle className="size-3" />}
                          {payment.status === "success" ? "Success" : payment.status}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">How to Make GST Payment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
            <div className="bg-blue-600 text-white size-8 rounded-full flex items-center justify-center mb-3 text-sm font-bold">
              1
            </div>
            <h4 className="text-foreground font-medium mb-2">Calculate Tax Liability</h4>
            <p className="text-sm text-muted-foreground">
              Review your GSTR-3B to determine the exact tax amount payable
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
            <div className="bg-emerald-600 text-white size-8 rounded-full flex items-center justify-center mb-3 text-sm font-bold">
              2
            </div>
            <h4 className="text-foreground font-medium mb-2">Generate Challan</h4>
            <p className="text-sm text-muted-foreground">
              Generate PMT-06 challan on GST Portal with payment details
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
            <div className="bg-amber-500 text-white size-8 rounded-full flex items-center justify-center mb-3 text-sm font-bold">
              3
            </div>
            <h4 className="text-foreground font-medium mb-2">Make Payment</h4>
            <p className="text-sm text-muted-foreground">
              Complete payment through Net Banking, NEFT, RTGS, or Over the Counter
            </p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-900 font-medium mb-2">Important Notes</h4>
            <ul className="space-y-1 text-amber-700 text-sm list-disc list-inside">
              <li>Payment must be made before filing GSTR-3B return</li>
              <li>Keep the CIN (Challan Identification Number) for reference</li>
              <li>Interest is charged at 18% per annum for delayed payment</li>
              <li>Late fee of ₹50 per day (₹20 for NIL return) for delayed filing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
