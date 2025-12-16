import { useState, useEffect } from "react";
import { Search, Download, Package, TrendingUp, Receipt, AlertCircle, Loader2 } from "lucide-react";
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
import { cn } from "../../lib/utils";
import { gstService } from "../../services/modules.service";

interface HSNData {
  hsn: string;
  description: string;
  uqc: string;
  totalQuantity: number;
  totalValue: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  rate: number;
}

export function HSNSummary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("12-2024");
  const [reportType, setReportType] = useState("outward");
  const [loading, setLoading] = useState(true);
  const [hsnData, setHsnData] = useState<HSNData[]>([]);

  useEffect(() => {
    const fetchHSNData = async () => {
      try {
        setLoading(true);
        const [month, year] = selectedMonth.split("-");
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString();

        const response = await gstService.getHSNSummary({ startDate, endDate });
        if (response.success && response.data) {
          // Transform API data to component format
          const transformedData: HSNData[] = (response.data || []).map((item: any) => ({
            hsn: item.hsnCode || 'UNCLASSIFIED',
            description: item.description || 'Product',
            uqc: item.uqc || 'PCS',
            totalQuantity: item.totalQuantity || 0,
            totalValue: item.totalValue || 0,
            taxableValue: item.taxableValue || 0,
            cgst: item.cgst || 0,
            sgst: item.sgst || 0,
            igst: item.igst || 0,
            rate: item.cgst > 0 ? Math.round((item.cgst / item.taxableValue) * 100) : 0
          }));
          setHsnData(transformedData);
        }
      } catch (error) {
        console.error("Failed to fetch HSN data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHSNData();
  }, [selectedMonth, reportType]);

  const filteredData = hsnData.filter((item) => {
    const matchesSearch =
      item.hsn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate totals
  const totals = filteredData.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.totalQuantity,
      value: acc.value + item.totalValue,
      taxableValue: acc.taxableValue + item.taxableValue,
      cgst: acc.cgst + item.cgst,
      sgst: acc.sgst + item.sgst,
      igst: acc.igst + item.igst,
    }),
    { quantity: 0, value: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 }
  );

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
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Package className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">HSN/SAC Summary</h2>
              <p className="text-muted-foreground text-sm">
                HSN-wise summary of outward/inward supplies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outward">Outward Supplies</SelectItem>
                  <SelectItem value="inward">Inward Supplies</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <Package className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total HSN Codes</p>
          <h3 className="text-2xl font-bold text-foreground">{filteredData.length}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <Receipt className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Quantity</p>
          <h3 className="text-2xl font-bold text-foreground">{totals.quantity.toLocaleString("en-IN")}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <TrendingUp className="size-5 text-amber-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Value</p>
          <h3 className="text-2xl font-bold text-foreground">₹{(totals.value / 100000).toFixed(2)}L</h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-violet-50 p-2.5 rounded-lg">
              <AlertCircle className="size-5 text-violet-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Tax</p>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{((totals.cgst + totals.sgst + totals.igst) / 100000).toFixed(2)}L
          </h3>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by HSN code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background h-10"
            />
          </div>
          <Button variant="outline" className="gap-2 h-10">
            <Download className="size-4" />
            Export HSN Summary
          </Button>
        </div>
      </div>

      {/* HSN Summary Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">HSN Code</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-center px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">UQC</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Value</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxable Value</th>
                <th className="text-center px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rate %</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">CGST</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">SGST</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">IGST</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={item.hsn}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/20 transition-colors",
                    index === filteredData.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground">{item.hsn}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground max-w-xs truncate" title={item.description}>
                      {item.description}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">{item.uqc}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm text-foreground">{item.totalQuantity}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm text-foreground">
                      ₹{item.totalValue.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-medium text-foreground">
                      ₹{item.taxableValue.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {item.rate * 2}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm text-foreground">₹{item.cgst.toLocaleString("en-IN")}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm text-foreground">₹{item.sgst.toLocaleString("en-IN")}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm text-foreground">₹{item.igst.toLocaleString("en-IN")}</p>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 border-border/50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-foreground">
                  Total for {getMonthName(selectedMonth)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  {totals.quantity.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  ₹{totals.value.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  ₹{totals.taxableValue.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  ₹{totals.cgst.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  ₹{totals.sgst.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                  ₹{totals.igst.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-900 font-medium mb-2">About HSN Summary</h4>
            <ul className="space-y-1 text-blue-700 text-sm list-disc list-inside">
              <li>HSN-wise summary is required to be furnished in GSTR-1</li>
              <li>For taxpayers with turnover up to ₹5 crores: 4-digit HSN code is mandatory</li>
              <li>For taxpayers with turnover above ₹5 crores: 6-digit HSN code is mandatory</li>
              <li>UQC stands for Unit Quantity Code as per GST system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
