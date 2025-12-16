import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Download,
  Search,
  Calendar,
  Send,
  FileText,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { Label } from "../ui/label";
import { partiesService, reportsService } from "../../services/modules.service";
import { toast } from "sonner";

interface Transaction {
  date: string;
  type: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface PartyInfo {
  id: string;
  name: string;
  type: string;
  gstin?: string;
  email?: string;
  phone?: string;
  billingAddress?: { city?: string; state?: string } | null;
}

interface StatementData {
  party: {
    name: string;
    type: string;
    gstin?: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  openingBalance: number;
  closingBalance: number;
  transactions: Transaction[];
}

export function PartyStatement() {
  const [selectedParty, setSelectedParty] = useState<string>("");
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [loadingParties, setLoadingParties] = useState(true);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [parties, setParties] = useState<PartyInfo[]>([]);
  const [statementData, setStatementData] = useState<StatementData | null>(null);

  // Fetch parties on mount
  useEffect(() => {
    const fetchParties = async () => {
      setLoadingParties(true);
      try {
        const response = await partiesService.getAll();
        if (response.success && response.data) {
          const allParties = Array.isArray(response.data)
            ? response.data
            : (response.data as any).items || [];
          setParties(allParties);
        }
      } catch (error) {
        console.error("Failed to fetch parties:", error);
        toast.error("Failed to load parties");
      } finally {
        setLoadingParties(false);
      }
    };
    fetchParties();
  }, []);

  const handleGenerateStatement = async () => {
    if (!selectedParty) return;

    setLoadingStatement(true);
    try {
      const response = await reportsService.getPartyStatement(selectedParty, {
        startDate: fromDate,
        endDate: toDate,
      });

      if (response.success && response.data) {
        setStatementData(response.data);
      } else {
        toast.error("Failed to generate statement");
      }
    } catch (error) {
      console.error("Failed to fetch party statement:", error);
      toast.error("Failed to generate statement");
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleEmailStatement = () => {
    toast.info("Email functionality coming soon");
  };

  const party = parties.find((p) => p.id === selectedParty);

  const summary = statementData ? {
    openingBalance: statementData.openingBalance,
    totalDebit: statementData.transactions.reduce((sum, t) => sum + (t.debit || 0), 0),
    totalCredit: statementData.transactions.reduce((sum, t) => sum + (t.credit || 0), 0),
    closingBalance: statementData.closingBalance,
  } : { openingBalance: 0, totalDebit: 0, totalCredit: 0, closingBalance: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-foreground mb-1">Party Statement</h2>
        <p className="text-muted-foreground text-sm">
          Generate detailed transaction statements for customers and suppliers
        </p>
      </div>

      {/* Filters Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Generate Statement</CardTitle>
          <CardDescription>Select party and date range to generate statement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Select Party *</Label>
              <Select value={selectedParty} onValueChange={setSelectedParty} disabled={loadingParties}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingParties ? "Loading..." : "Choose customer or supplier"} />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name} ({party.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateStatement}
              disabled={!selectedParty || loadingStatement}
              className="bg-primary"
            >
              {loadingStatement ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate Statement
            </Button>
            <Button variant="outline" disabled={!selectedParty || !statementData} onClick={handleEmailStatement}>
              <Send className="h-4 w-4 mr-2" />
              Email to Party
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loadingStatement && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}

      {/* Party Info & Statement */}
      {statementData && party && !loadingStatement && (
        <>
          {/* Party Info Card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{statementData.party.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {statementData.party.type}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {statementData.party.gstin && (
                      <div>
                        <span className="text-muted-foreground">GSTIN:</span>
                        <span className="ml-2 font-mono">{statementData.party.gstin}</span>
                      </div>
                    )}
                    {party.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2">{party.phone}</span>
                      </div>
                    )}
                    {party.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{party.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">Opening Balance</div>
                    <div className="text-2xl font-semibold text-foreground">
                      ₹{summary.openingBalance.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-3 rounded-xl">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">Total Debit</div>
                    <div className="text-2xl font-semibold text-foreground">
                      ₹{summary.totalDebit.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">Total Credit</div>
                    <div className="text-2xl font-semibold text-foreground">
                      ₹{summary.totalCredit.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">Closing Balance</div>
                    <div className="text-2xl font-semibold text-blue-600">
                      ₹{summary.closingBalance.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-primary p-3 rounded-xl">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Statement period: {new Date(fromDate).toLocaleDateString("en-IN")} to{" "}
                {new Date(toDate).toLocaleDateString("en-IN")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statementData.transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No transactions found for this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {statementData.transactions.map((txn, index) => (
                          <TableRow key={index}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(txn.date).toLocaleDateString("en-IN")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  txn.type === "Invoice" || txn.type === "Purchase"
                                    ? "bg-red-50 text-red-700 border-red-300"
                                    : txn.type === "Payment"
                                      ? "bg-green-50 text-green-700 border-green-300"
                                      : "bg-gray-50 text-gray-700 border-gray-300"
                                }
                              >
                                {txn.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{txn.reference}</TableCell>
                            <TableCell className="text-right text-red-600">
                              {txn.debit > 0 ? `₹${txn.debit.toLocaleString("en-IN")}` : "-"}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {txn.credit > 0 ? `₹${txn.credit.toLocaleString("en-IN")}` : "-"}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{txn.balance.toLocaleString("en-IN")}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Summary Row */}
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell colSpan={3} className="text-right">
                            Total
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ₹{summary.totalDebit.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            ₹{summary.totalCredit.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            ₹{summary.closingBalance.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!selectedParty && !loadingStatement && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-foreground mb-2">No Party Selected</h3>
            <p className="text-muted-foreground">
              Please select a customer or supplier to view their statement
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
