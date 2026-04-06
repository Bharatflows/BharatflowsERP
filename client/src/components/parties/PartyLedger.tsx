import { useState } from "react";
import { ArrowLeft, Download, Calendar, FileText, Loader2, RefreshCw, X, Maximize2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";
import { usePartyLedger } from "../../hooks/useParties";

interface Transaction {
  date: string;
  type: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface PartyLedgerProps {
  partyId: string;
  partyName: string;
  partyType: "customer" | "supplier";
  onBack: () => void;
}

export function PartyLedger({ partyId, partyName, partyType, onBack }: PartyLedgerProps) {
  // Default date range: last 3 months
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [appliedFromDate, setAppliedFromDate] = useState(fromDate);
  const [appliedToDate, setAppliedToDate] = useState(toDate);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Fetch real data from backend API
  const { data, isLoading, isFetching, error, refetch } = usePartyLedger(partyId, {
    startDate: appliedFromDate,
    endDate: appliedToDate
  });

  const handleApplyFilter = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const getTransactionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      "invoice": "Invoice",
      "payment": "Payment",
      "credit_note": "Credit Note",
      "debit_note": "Debit Note",
      "Invoice": "Invoice",
      "Payment": "Payment",
      "Purchase": "Purchase"
    };
    return typeMap[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const typeLower = type.toLowerCase();
    switch (typeLower) {
      case "invoice":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "payment":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "purchase":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "credit_note":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "debit_note":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Extract data from API response
  const ledgerData = data?.data;
  const transactions: Transaction[] = ledgerData?.transactions || [];
  const openingBalance = ledgerData?.openingBalance || 0;
  const closingBalance = ledgerData?.closingBalance || 0;

  const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading ledger...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <h2 className="text-foreground">{partyName} - Ledger</h2>
        </div>
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-3">
            <FileText className="size-12 text-destructive/50" />
            <p className="text-foreground mb-1">Failed to load ledger</p>
            <p className="text-muted-foreground text-sm">
              {(error as any)?.message || "An error occurred"}
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-foreground">{partyName} - Ledger</h2>
            <p className="text-muted-foreground">
              {partyType === "customer" ? "Customer" : "Supplier"} Account Statement
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground">Total Debit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              ₹{totalDebit.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground">Total Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-emerald-600">
              ₹{totalCredit.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground">Closing Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(closingBalance > 0 ? "text-destructive" : "text-emerald-600")}>
              ₹{Math.abs(closingBalance).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button className="gap-2" onClick={handleApplyFilter} disabled={isFetching}>
              {isFetching && <Loader2 className="size-4 animate-spin" />}
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex gap-4 items-start relative pb-4 px-4">
            <div className={cn("overflow-x-auto transition-all duration-300", selectedTx ? "hidden lg:block lg:flex-1" : "w-full")}>
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 text-muted-foreground">Date</th>
                    <th className="text-left px-6 py-4 text-muted-foreground">Type</th>
                    <th className="text-left px-6 py-4 text-muted-foreground">Reference</th>
                    <th className="text-right px-6 py-4 text-muted-foreground">Debit (₹)</th>
                    <th className="text-right px-6 py-4 text-muted-foreground">Credit (₹)</th>
                    <th className="text-right px-6 py-4 text-muted-foreground">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="size-12 text-muted-foreground/50" />
                          <div>
                            <p className="text-foreground mb-1">No transactions found</p>
                            <p className="text-muted-foreground">
                              Transactions will appear here when invoices or payments are recorded
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction, index) => (
                      <tr
                        key={`${transaction.reference}-${index}`}
                        className={cn(
                          "border-b border-border transition-colors cursor-pointer group",
                          selectedTx?.reference === transaction.reference
                            ? "bg-orange-50/50 dark:bg-orange-900/20 border-l-4 border-l-orange-500"
                            : "hover:bg-background/50 border-l-4 border-l-transparent"
                        )}
                        onClick={() => {
                          if (selectedTx?.reference === transaction.reference) setSelectedTx(null);
                          else setSelectedTx(transaction);
                        }}
                      >
                        <td className="px-6 py-4">
                          <p className="text-foreground">
                            {new Date(transaction.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={cn("border", getTransactionTypeColor(transaction.type))}
                          >
                            {getTransactionTypeLabel(transaction.type)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground">{transaction.reference}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className={cn(transaction.debit > 0 ? "text-destructive" : "text-muted-foreground")}>
                            {transaction.debit > 0
                              ? transaction.debit.toLocaleString("en-IN")
                              : "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className={cn(transaction.credit > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                            {transaction.credit > 0
                              ? transaction.credit.toLocaleString("en-IN")
                              : "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-foreground">
                            {transaction.balance.toLocaleString("en-IN")}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot className="bg-muted border-t-2 border-border">
                    <tr>
                      <td colSpan={3} className="px-6 py-4">
                        <p className="text-foreground font-semibold">Total</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-destructive font-semibold">
                          {totalDebit.toLocaleString("en-IN")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-emerald-600 font-semibold">
                          {totalCredit.toLocaleString("en-IN")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={cn("font-semibold", closingBalance > 0 ? "text-destructive" : "text-emerald-600")}>
                          {Math.abs(closingBalance).toLocaleString("en-IN")}
                        </p>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Contextual Detail Panel */}
            {selectedTx && (
              <div className="w-full lg:w-[380px] shrink-0 bg-card border border-orange-200 dark:border-orange-900/50 rounded-lg shadow-sm sticky top-4 flex flex-col h-[600px] overflow-hidden animate-in slide-in-from-right-8 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted dark:bg-card border-orange-100 dark:border-orange-900/30">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-orange-500" />
                    <h3 className="font-bold text-foreground">
                      {selectedTx.reference || "Transaction"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSelectedTx(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                      <Badge variant="outline" className={cn("capitalize px-2 py-0.5", getTransactionTypeColor(selectedTx.type))}>
                        {getTransactionTypeLabel(selectedTx.type)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                      <p className="font-medium text-foreground">{new Date(selectedTx.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted dark:bg-card p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground mb-1">Debit Amount</p>
                      <p className={cn("text-lg font-bold font-mono", selectedTx.debit > 0 ? "text-destructive" : "text-muted-foreground")}>
                        ₹{selectedTx.debit.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="bg-muted dark:bg-card p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground mb-1">Credit Amount</p>
                      <p className={cn("text-lg font-bold font-mono", selectedTx.credit > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                        ₹{selectedTx.credit.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex items-center justify-between border border-orange-100 dark:border-orange-900/30">
                    <span className="font-semibold text-orange-800 dark:text-orange-200">Running Balance</span>
                    <span className="font-mono text-lg font-bold text-foreground">
                      ₹{selectedTx.balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Fixed Footer Actions */}
                <div className="p-4 border-t border-border bg-muted dark:bg-card grid grid-cols-1 gap-3 shrink-0">
                  <Button variant="outline" className="w-full">
                    <Download className="size-4 mr-2" /> Download Receipt
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
