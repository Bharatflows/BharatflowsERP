import { useState, useEffect } from "react";
import { Search, Download, TrendingUp, TrendingDown, Wallet, Receipt, FileText, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { gstService } from "../../services/modules.service";

interface ITCTransaction {
  id: string;
  date: string;
  documentNumber: string;
  supplierName: string;
  type: "credit" | "debit";
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  description: string;
}

export function ITCLedger() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("12-2024");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ITCTransaction[]>([]);
  const [summary, setSummary] = useState({
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    totalITC: 0
  });

  useEffect(() => {
    const fetchITCData = async () => {
      try {
        setLoading(true);
        const [month, year] = selectedMonth.split("-");
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString();

        const response = await gstService.getITCLedger({ startDate, endDate });
        if (response.success && response.data) {
          const { entries, summary: apiSummary } = response.data;

          // Transform API data to component format
          const transformedEntries: ITCTransaction[] = (entries || []).map((entry: any) => ({
            id: entry.id,
            date: entry.documentDate,
            documentNumber: entry.documentNumber,
            supplierName: entry.supplierName || "Unknown Supplier",
            type: entry.netITC >= 0 ? "credit" : "debit",
            cgst: entry.cgst,
            sgst: entry.sgst,
            igst: entry.igst,
            total: entry.netITC,
            description: `Purchase Bill - ${entry.supplierGSTIN || 'Unregistered'}`
          }));

          setTransactions(transformedEntries);
          setSummary({
            totalCGST: apiSummary?.totalCGST || 0,
            totalSGST: apiSummary?.totalSGST || 0,
            totalIGST: apiSummary?.totalIGST || 0,
            totalITC: apiSummary?.totalITC || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch ITC data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchITCData();
  }, [selectedMonth]);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate totals from actual data
  const totalCredit = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.total, 0);

  const totalDebit = Math.abs(
    transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.total, 0)
  );

  const netITC = summary.totalITC || (totalCredit - totalDebit);
  const totalCGST = summary.totalCGST;
  const totalSGST = summary.totalSGST;
  const totalIGST = summary.totalIGST;

  const getMonthName = (monthYear: string) => {
    const [month, year] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
              <Wallet className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Input Tax Credit (ITC) Ledger</h2>
              <p className="text-muted-foreground text-sm">
                Track your eligible input tax credit from purchases
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Tax Period</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11-2024">November 2024</SelectItem>
                  <SelectItem value="10-2024">October 2024</SelectItem>
                  <SelectItem value="09-2024">September 2024</SelectItem>
                  <SelectItem value="08-2024">August 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <TrendingUp className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">ITC Credit</p>
          <h3 className="text-2xl font-bold text-emerald-600">₹{(totalCredit / 100000).toFixed(2)}L</h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-rose-50 p-2.5 rounded-lg">
              <TrendingDown className="size-5 text-rose-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">ITC Reversed</p>
          <h3 className="text-2xl font-bold text-rose-600">₹{(totalDebit / 1000).toFixed(2)}K</h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <Wallet className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Net ITC Available</p>
          <h3 className="text-2xl font-bold text-blue-600">₹{(netITC / 100000).toFixed(2)}L</h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-violet-50 p-2.5 rounded-lg">
              <Receipt className="size-5 text-violet-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Transactions</p>
          <h3 className="text-2xl font-bold text-foreground">{transactions.length}</h3>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Tax Component Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-blue-700 text-sm font-medium mb-1">CGST</p>
            <h3 className="text-xl font-bold text-blue-700">
              ₹{totalCGST.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-emerald-700 text-sm font-medium mb-1">SGST</p>
            <h3 className="text-xl font-bold text-emerald-700">
              ₹{totalSGST.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-amber-700 text-sm font-medium mb-1">IGST</p>
            <h3 className="text-xl font-bold text-amber-700">
              ₹{totalIGST.toLocaleString("en-IN")}
            </h3>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by document number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background h-10"
            />
          </div>
          <Button variant="outline" className="gap-2 h-10">
            <Download className="size-4" />
            Export Ledger
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Document</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Supplier</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">CGST</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">SGST</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">IGST</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total ITC</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn, index) => (
                <tr
                  key={txn.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/20 transition-colors",
                    index === filteredTransactions.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">
                      {new Date(txn.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground">{txn.documentNumber}</p>
                    <p className="text-xs text-muted-foreground">{txn.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{txn.supplierName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1",
                        txn.type === "credit"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      )}
                    >
                      {txn.type === "credit" ? (
                        <>
                          <TrendingUp className="size-3" />
                          Credit
                        </>
                      ) : (
                        <>
                          <TrendingDown className="size-3" />
                          Reversal
                        </>
                      )}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        txn.type === "credit" ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      ₹{txn.cgst.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        txn.type === "credit" ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      ₹{txn.sgst.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        txn.type === "credit" ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      ₹{txn.igst.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        txn.type === "credit" ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      ₹{txn.total.toLocaleString("en-IN")}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 border-border/50">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-sm font-semibold text-foreground">
                  Total for {getMonthName(selectedMonth)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  ₹{totalCGST.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  ₹{totalSGST.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  ₹{totalIGST.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                  ₹{netITC.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
