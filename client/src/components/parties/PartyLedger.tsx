import { useState } from "react";
import { ArrowLeft, Download, Calendar, FileText, Loader2, RefreshCw } from "lucide-react";
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
        return "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20";
      case "payment":
        return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20";
      case "purchase":
        return "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20";
      case "credit_note":
        return "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20";
      case "debit_note":
        return "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20";
      default:
        return "bg-gray-100 text-gray-800";
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
            <p className="text-[#ef4444]">
              ₹{totalDebit.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground">Total Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#10b981]">
              ₹{totalCredit.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground">Closing Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(closingBalance > 0 ? "text-[#ef4444]" : "text-[#10b981]")}>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8fafc] border-b border-border">
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
                    <tr key={`${transaction.reference}-${index}`} className="border-b border-border hover:bg-[#f8fafc]/50">
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
                        <p className={cn(transaction.debit > 0 ? "text-[#ef4444]" : "text-muted-foreground")}>
                          {transaction.debit > 0
                            ? transaction.debit.toLocaleString("en-IN")
                            : "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={cn(transaction.credit > 0 ? "text-[#10b981]" : "text-muted-foreground")}>
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
                <tfoot className="bg-[#f8fafc] border-t-2 border-border">
                  <tr>
                    <td colSpan={3} className="px-6 py-4">
                      <p className="text-foreground font-semibold">Total</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-[#ef4444] font-semibold">
                        {totalDebit.toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-[#10b981] font-semibold">
                        {totalCredit.toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={cn("font-semibold", closingBalance > 0 ? "text-[#ef4444]" : "text-[#10b981]")}>
                        {Math.abs(closingBalance).toLocaleString("en-IN")}
                      </p>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
