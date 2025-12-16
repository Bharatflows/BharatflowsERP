import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
  Search,
  Download,
  Filter,
  Eye,
  Send,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { reportsService } from "../../services/modules.service";
import { toast } from "sonner";

interface AgingDetail {
  invoiceNumber?: string;
  orderNumber?: string;
  customerName?: string;
  supplierName?: string;
  invoiceDate?: string;
  orderDate?: string;
  dueDate?: string;
  totalAmount: number;
  balanceAmount: number;
  daysOverdue?: number;
  daysAge?: number;
}

interface AgingSummary {
  current: number;
  days31to60: number;
  days61to90: number;
  over90: number;
}

interface AgingData {
  id: string;
  partyName: string;
  email?: string;
  totalOutstanding: number;
  current: number;
  days30to60: number;
  days60to90: number;
  over90: number;
  overdueAmount: number;
}

export function AgingReport() {
  const [reportType, setReportType] = useState<"receivables" | "payables">("receivables");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRange, setFilterRange] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [receivablesData, setReceivablesData] = useState<AgingData[]>([]);
  const [payablesData, setPayablesData] = useState<AgingData[]>([]);
  const [receivablesSummary, setReceivablesSummary] = useState<AgingSummary>({ current: 0, days31to60: 0, days61to90: 0, over90: 0 });
  const [payablesSummary, setPayablesSummary] = useState<AgingSummary>({ current: 0, days31to60: 0, days61to90: 0, over90: 0 });

  const fetchAgingData = async () => {
    setLoading(true);
    try {
      const [receivablesRes, payablesRes] = await Promise.all([
        reportsService.getAgingReceivables(),
        reportsService.getAgingPayables(),
      ]);

      if (receivablesRes.success && receivablesRes.data) {
        setReceivablesSummary(receivablesRes.data.summary || { current: 0, days31to60: 0, days61to90: 0, over90: 0 });
        // Group by customer
        const groupedReceivables = groupByParty(receivablesRes.data.details || [], 'customerName');
        setReceivablesData(groupedReceivables);
      }

      if (payablesRes.success && payablesRes.data) {
        setPayablesSummary(payablesRes.data.summary || { current: 0, days31to60: 0, days61to90: 0, over90: 0 });
        // Group by supplier
        const groupedPayables = groupByParty(payablesRes.data.details || [], 'supplierName');
        setPayablesData(groupedPayables);
      }
    } catch (error) {
      console.error("Failed to fetch aging report:", error);
      toast.error("Failed to load aging report");
    } finally {
      setLoading(false);
    }
  };

  // Group aging details by party name
  const groupByParty = (details: AgingDetail[], partyKey: string): AgingData[] => {
    const grouped: Record<string, AgingData> = {};

    details.forEach((item, index) => {
      const partyName = (item as any)[partyKey] || 'Unknown';
      const daysAge = item.daysOverdue || item.daysAge || 0;
      const balance = Number(item.balanceAmount);

      if (!grouped[partyName]) {
        grouped[partyName] = {
          id: `party-${index}`,
          partyName,
          email: '',
          totalOutstanding: 0,
          current: 0,
          days30to60: 0,
          days60to90: 0,
          over90: 0,
          overdueAmount: 0,
        };
      }

      grouped[partyName].totalOutstanding += balance;

      if (daysAge <= 30) {
        grouped[partyName].current += balance;
      } else if (daysAge <= 60) {
        grouped[partyName].days30to60 += balance;
        grouped[partyName].overdueAmount += balance;
      } else if (daysAge <= 90) {
        grouped[partyName].days60to90 += balance;
        grouped[partyName].overdueAmount += balance;
      } else {
        grouped[partyName].over90 += balance;
        grouped[partyName].overdueAmount += balance;
      }
    });

    return Object.values(grouped);
  };

  useEffect(() => {
    fetchAgingData();
  }, []);

  const data = reportType === "receivables" ? receivablesData : payablesData;
  const summary = reportType === "receivables" ? receivablesSummary : payablesSummary;

  const filteredData = data.filter((item) => {
    const matchesSearch = item.partyName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterRange === "all") return matchesSearch;
    if (filterRange === "current" && item.current > 0) return matchesSearch;
    if (filterRange === "30-60" && item.days30to60 > 0) return matchesSearch;
    if (filterRange === "60-90" && item.days60to90 > 0) return matchesSearch;
    if (filterRange === "90+" && item.over90 > 0) return matchesSearch;

    return false;
  });

  const stats = {
    totalOutstanding: summary.current + summary.days31to60 + summary.days61to90 + summary.over90,
    current: summary.current,
    days30to60: summary.days31to60,
    days60to90: summary.days61to90,
    over90: summary.over90,
    totalOverdue: summary.days31to60 + summary.days61to90 + summary.over90,
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">Aging Report</h2>
          <p className="text-muted-foreground text-sm">
            Track outstanding {reportType === "receivables" ? "receivables" : "payables"} by aging periods
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAgingData}>
            <RefreshCw className="size-4 mr-2" /> Refresh
          </Button>
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as "receivables" | "payables")}>
            <TabsList>
              <TabsTrigger value="receivables" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Receivables
              </TabsTrigger>
              <TabsTrigger value="payables" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Payables
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">Total Outstanding</div>
            <div className="text-xl font-semibold text-foreground">
              ₹{stats.totalOutstanding.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">Current (0-30)</div>
            <div className="text-xl font-semibold text-green-600">
              ₹{stats.current.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">30-60 Days</div>
            <div className="text-xl font-semibold text-orange-600">
              ₹{stats.days30to60.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">60-90 Days</div>
            <div className="text-xl font-semibold text-red-500">
              ₹{stats.days60to90.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">Over 90 Days</div>
            <div className="text-xl font-semibold text-red-600">
              ₹{stats.over90.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">Total Overdue</div>
            <div className="text-xl font-semibold text-red-600">
              ₹{stats.totalOverdue.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>
              {reportType === "receivables" ? "Accounts Receivable" : "Accounts Payable"} Aging
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${reportType === "receivables" ? "customers" : "suppliers"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRange} onValueChange={setFilterRange}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranges</SelectItem>
                <SelectItem value="current">Current (0-30)</SelectItem>
                <SelectItem value="30-60">30-60 Days</SelectItem>
                <SelectItem value="60-90">60-90 Days</SelectItem>
                <SelectItem value="90+">Over 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">
                    {reportType === "receivables" ? "Customer" : "Supplier"} Name
                  </TableHead>
                  <TableHead className="text-right">Total Outstanding</TableHead>
                  <TableHead className="text-right">Current (0-30)</TableHead>
                  <TableHead className="text-right">30-60 Days</TableHead>
                  <TableHead className="text-right">60-90 Days</TableHead>
                  <TableHead className="text-right">Over 90 Days</TableHead>
                  <TableHead className="text-right">Total Overdue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.partyName}</div>
                          {item.email && <div className="text-xs text-muted-foreground">{item.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{item.totalOutstanding.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.current > 0 ? `₹${item.current.toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right ${item.days30to60 > 0 ? "text-orange-600" : ""}`}>
                        {item.days30to60 > 0 ? `₹${item.days30to60.toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right ${item.days60to90 > 0 ? "text-red-600" : ""}`}>
                        {item.days60to90 > 0 ? `₹${item.days60to90.toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right ${item.over90 > 0 ? "text-red-700 font-semibold" : ""}`}>
                        {item.over90 > 0 ? `₹${item.over90.toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.overdueAmount > 0 ? (
                          <div>
                            <div className="font-semibold text-red-600">
                              ₹{item.overdueAmount.toLocaleString("en-IN")}
                            </div>
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                              {((item.overdueAmount / item.totalOutstanding) * 100).toFixed(0)}% overdue
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                            Up to date
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" title="View Statement">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.overdueAmount > 0 && (
                            <Button variant="ghost" size="icon" title="Send Reminder">
                              <Send className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm">
                <span className="font-semibold">{filteredData.filter(i => i.overdueAmount > 0).length}</span>
                {" "}{reportType === "receivables" ? "customers" : "suppliers"} have overdue payments
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total {reportType === "receivables" ? "customers" : "suppliers"}: {filteredData.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
