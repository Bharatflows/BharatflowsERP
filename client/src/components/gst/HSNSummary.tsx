import { useState, useEffect } from "react";
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

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

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
      <div className="flex items-center justify-center py-[48px]">
        <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-[24px] animate-fade-in p-[24px]">
      {/* Header Card */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-[24px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
          <div className="flex items-start gap-[16px]">
            <div className="bg-primary/10 p-[12px] rounded-[12px]">
              <MIcon name="category" className="text-[24px] text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-[4px]">HSN/SAC Summary</h2>
              <p className="text-body-sm font-medium text-muted-foreground">
                HSN-wise summary of outward/inward supplies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-[12px]">
            <div className="space-y-[6px]">
              <Label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px] h-[44px] rounded-[8px] border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outward">Outward Supplies</SelectItem>
                  <SelectItem value="inward">Inward Supplies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-[6px]">
              <Label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Tax Period</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] h-[44px] rounded-[8px] border-slate-200">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[16px]">
        <div className="bg-card rounded-[16px] border border-border shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-[10px] rounded-[10px]">
              <MIcon name="category" className="text-[20px] text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Total HSN Codes</p>
          <h3 className="text-3xl font-bold text-foreground">{filteredData.length}</h3>
        </div>

        <div className="bg-card rounded-[16px] border border-border shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-[10px] rounded-[10px]">
              <MIcon name="receipt_long" className="text-[20px] text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Total Quantity</p>
          <h3 className="text-3xl font-bold text-foreground">{totals.quantity.toLocaleString("en-IN")}</h3>
        </div>

        <div className="bg-card rounded-[16px] border border-border shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-[10px] rounded-[10px]">
              <MIcon name="trending_up" className="text-[20px] text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Total Value</p>
          <h3 className="text-3xl font-bold text-foreground">₹{(totals.value / 100000).toFixed(2)}L</h3>
        </div>

        <div className="bg-card rounded-[16px] border border-border shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-violet-50 dark:bg-violet-900/20 p-[10px] rounded-[10px]">
              <MIcon name="error_outline" className="text-[20px] text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Total Tax</p>
          <h3 className="text-3xl font-bold text-foreground">
            ₹{((totals.cgst + totals.sgst + totals.igst) / 100000).toFixed(2)}L
          </h3>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-[16px]">
        <div className="flex flex-col md:flex-row gap-[16px]">
          <div className="flex-1 relative">
            <MIcon name="search" className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground" />
            <Input
              placeholder="Search by HSN code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-[40px] h-[44px] rounded-[8px] border-slate-200"
            />
          </div>
          <Button variant="outline" className="gap-[8px] h-[44px] px-[24px] rounded-[8px] font-bold border-border">
            <MIcon name="download" className="text-[18px]" />
            Export HSN Summary
          </Button>
        </div>
      </div>

      {/* HSN Summary Table */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted dark:bg-slate-950 border-b border-border">
              <tr>
                <th className="text-left px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">HSN Code</th>
                <th className="text-left px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">Description</th>
                <th className="text-center px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">UQC</th>
                <th className="text-right px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">Qty</th>
                <th className="text-right px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">Total Value</th>
                <th className="text-right px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">Taxable Value</th>
                <th className="text-center px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">Rate %</th>
                <th className="text-right px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">CGST</th>
                <th className="text-right px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">SGST</th>
                <th className="text-right px-[24px] py-[16px] text-body-sm font-bold text-foreground dark:text-muted-foreground">IGST</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={item.hsn}
                  className={cn(
                    "border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors",
                    index === filteredData.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-[24px] py-[16px]">
                    <p className="text-body-sm font-bold text-foreground">{item.hsn}</p>
                  </td>
                  <td className="px-[24px] py-[16px]">
                    <p className="text-body-sm text-foreground dark:text-muted-foreground max-w-xs truncate" title={item.description}>
                      {item.description}
                    </p>
                  </td>
                  <td className="px-[24px] py-[16px] text-center">
                    <span className="text-[12px] font-bold text-muted-foreground bg-muted px-[8px] py-[4px] rounded-[6px]">{item.uqc}</span>
                  </td>
                  <td className="px-[24px] py-[16px] text-right">
                    <p className="text-body-sm text-foreground dark:text-muted-foreground font-medium">{item.totalQuantity}</p>
                  </td>
                  <td className="px-[24px] py-[16px] text-right">
                    <p className="text-body-sm text-foreground dark:text-muted-foreground font-medium">
                      ₹{item.totalValue.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-[24px] py-[16px] text-right">
                    <p className="text-body-sm font-bold text-foreground">
                      ₹{item.taxableValue.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-[24px] py-[16px] text-center">
                    <span className="text-[12px] font-bold text-primary bg-primary/10 px-[8px] py-[4px] rounded-[6px]">
                      {item.rate * 2}%
                    </span>
                  </td>
                  <td className="px-[24px] py-[16px] text-right">
                    <p className="text-body-sm text-foreground dark:text-muted-foreground">₹{item.cgst.toLocaleString("en-IN")}</p>
                  </td>
                  <td className="px-[24px] py-[16px] text-right">
                    <p className="text-body-sm text-foreground dark:text-muted-foreground">₹{item.sgst.toLocaleString("en-IN")}</p>
                  </td>
                  <td className="px-[24px] py-[16px] text-right">
                    <p className="text-body-sm text-foreground dark:text-muted-foreground">₹{item.igst.toLocaleString("en-IN")}</p>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted dark:bg-slate-950 border-t-2 border-border">
              <tr>
                <td colSpan={3} className="px-[24px] py-[16px] text-body-sm font-bold text-foreground">
                  Total for {getMonthName(selectedMonth)}
                </td>
                <td className="px-[24px] py-[16px] text-right text-body-sm font-bold text-foreground">
                  {totals.quantity.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right text-body-sm font-bold text-foreground">
                  ₹{totals.value.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right text-body-sm font-bold text-foreground">
                  ₹{totals.taxableValue.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px]"></td>
                <td className="px-[24px] py-[16px] text-right text-body-sm font-bold text-foreground">
                  ₹{totals.cgst.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right text-body-sm font-bold text-foreground">
                  ₹{totals.sgst.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right text-body-sm font-bold text-foreground">
                  ₹{totals.igst.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-[16px] p-[20px]">
        <div className="flex gap-[12px]">
          <MIcon name="error_outline" className="text-[20px] text-blue-600 dark:text-blue-400 flex-shrink-0 mt-[2px]" />
          <div>
            <h4 className="text-blue-900 dark:text-blue-300 font-bold mb-[8px]">About HSN Summary</h4>
            <ul className="space-y-[4px] text-blue-700 dark:text-blue-400/80 text-body-sm list-disc list-inside font-medium">
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
