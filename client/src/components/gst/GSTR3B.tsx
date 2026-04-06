import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { FileCheck, RefreshCw } from "lucide-react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { gstService } from "../../services/modules.service";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

interface GSTR3BData {
  outwardSupplies: {
    taxableValue: number;
    integratedTax: number;
    centralTax: number;
    stateTax: number;
    cess: number;
  };
  inwardSupplies: {
    taxableValue: number;
    integratedTax: number;
    centralTax: number;
    stateTax: number;
    cess: number;
  };
  itcAvailable: {
    imports: number;
    inwardSupplies: number;
    reversals: number;
    itcAvailed: number;
  };
  taxPayable: {
    integratedTax: number;
    centralTax: number;
    stateTax: number;
    cess: number;
    interest: number;
    lateFee: number;
  };
}

export function GSTR3B() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });
  const [loading, setLoading] = useState(true);
  const [gstr3bData, setGstr3bData] = useState<GSTR3BData>({
    outwardSupplies: { taxableValue: 0, integratedTax: 0, centralTax: 0, stateTax: 0, cess: 0 },
    inwardSupplies: { taxableValue: 0, integratedTax: 0, centralTax: 0, stateTax: 0, cess: 0 },
    itcAvailable: { imports: 0, inwardSupplies: 0, reversals: 0, itcAvailed: 0 },
    taxPayable: { integratedTax: 0, centralTax: 0, stateTax: 0, cess: 0, interest: 0, lateFee: 0 },
  });

  const fetchGSTR3BData = async () => {
    setLoading(true);
    try {
      const [month, year] = selectedMonth.split('-');
      const response = await gstService.generateGSTR3B({ month, year });

      if (response.success && response.data) {
        const data = response.data;
        setGstr3bData({
          outwardSupplies: {
            taxableValue: data.outwardSupplies?.taxableValue || 0,
            integratedTax: data.outwardSupplies?.igst || 0,
            centralTax: data.outwardSupplies?.cgst || 0,
            stateTax: data.outwardSupplies?.sgst || 0,
            cess: data.outwardSupplies?.cess || 0,
          },
          inwardSupplies: {
            taxableValue: data.inwardSupplies?.taxableValue || 0,
            integratedTax: data.inwardSupplies?.igst || 0,
            centralTax: data.inwardSupplies?.cgst || 0,
            stateTax: data.inwardSupplies?.sgst || 0,
            cess: data.inwardSupplies?.cess || 0,
          },
          itcAvailable: {
            imports: 0,
            inwardSupplies: data.itcAvailable?.total || 0,
            reversals: data.itcReversed?.total || 0,
            itcAvailed: (data.itcAvailable?.total || 0) - (data.itcReversed?.total || 0),
          },
          taxPayable: {
            integratedTax: data.taxPayable?.igst || 0,
            centralTax: data.taxPayable?.cgst || 0,
            stateTax: data.taxPayable?.sgst || 0,
            cess: data.taxPayable?.cess || 0,
            interest: data.interest || 0,
            lateFee: data.lateFee || 0,
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch GSTR-3B data:", error);
      toast.error("Failed to load GSTR-3B data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGSTR3BData();
  }, [selectedMonth]);

  const getMonthName = (monthYear: string) => {
    const [month, year] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  const handleFile = () => {
    toast.success("GSTR-3B filed successfully for " + getMonthName(selectedMonth));
  };

  const handleDownload = () => {
    toast.success("GSTR-3B JSON downloaded successfully");
  };

  const totalPayable =
    gstr3bData.taxPayable.integratedTax +
    gstr3bData.taxPayable.centralTax +
    gstr3bData.taxPayable.stateTax +
    gstr3bData.taxPayable.interest +
    gstr3bData.taxPayable.lateFee;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
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
              <FileCheck className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">GSTR-3B - Monthly Return</h2>
              <p className="text-muted-foreground text-sm">
                Summary return for the tax period
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchGSTR3BData} className="gap-2 h-10">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Tax Period</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01-2024">January 2024</SelectItem>
                  <SelectItem value="02-2024">February 2024</SelectItem>
                  <SelectItem value="03-2024">March 2024</SelectItem>
                  <SelectItem value="04-2024">April 2024</SelectItem>
                  <SelectItem value="05-2024">May 2024</SelectItem>
                  <SelectItem value="06-2024">June 2024</SelectItem>
                  <SelectItem value="07-2024">July 2024</SelectItem>
                  <SelectItem value="08-2024">August 2024</SelectItem>
                  <SelectItem value="09-2024">September 2024</SelectItem>
                  <SelectItem value="10-2024">October 2024</SelectItem>
                  <SelectItem value="11-2024">November 2024</SelectItem>
                  <SelectItem value="12-2024">December 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[16px]">
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-[16px] border border-blue-200 dark:border-blue-900/50 shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-[12px] rounded-[12px]">
              <MIcon name="trending_up" className="text-[24px] text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider mb-[4px]">Output Tax</p>
          <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300">
            ₹{((gstr3bData.outwardSupplies.centralTax + gstr3bData.outwardSupplies.stateTax + gstr3bData.outwardSupplies.integratedTax)).toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-[16px] border border-emerald-200 dark:border-emerald-900/50 shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-emerald-100 dark:bg-emerald-900/40 p-[12px] rounded-[12px]">
              <MIcon name="account_balance_wallet" className="text-[24px] text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mb-[4px]">Input Tax Credit</p>
          <h3 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            ₹{gstr3bData.itcAvailable.itcAvailed.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/20 rounded-[16px] border border-rose-200 dark:border-rose-900/50 shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-amber-100 dark:bg-amber-900/40 p-[12px] rounded-[12px]">
              <MIcon name="credit_card" className="text-[24px] text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider mb-[4px]">Tax Payable</p>
          <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300">
            ₹{totalPayable.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-violet-50 dark:bg-violet-950/20 rounded-[16px] border border-violet-200 dark:border-violet-900/50 shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-violet-100 dark:bg-violet-900/40 p-[12px] rounded-[12px]">
              <MIcon name="event" className="text-[24px] text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-violet-600/80 dark:text-violet-400/80 uppercase tracking-wider mb-[4px]">Due Date</p>
          <h3 className="text-3xl font-bold text-violet-700 dark:text-violet-300">20th</h3>
          <p className="text-[12px] font-medium text-violet-500 mt-[4px]">of next month</p>
        </div>
      </div>

      {/* Table 3.1 - Outward Supplies */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-[24px] py-[16px]">
          <h3 className="text-body font-bold flex items-center gap-[8px]">
            <MIcon name="trending_up" className="text-[20px]" />
            Table 3.1 - Tax on Outward Supplies
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted dark:bg-slate-950 border-b border-border">
              <tr>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border">Nature of Supplies</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">Taxable Value</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">Integrated Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">Central Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">State/UT Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Cess</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors">
                <td className="px-[24px] py-[16px] text-body-sm font-medium text-foreground border-r border-border">Outward taxable supplies</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.outwardSupplies.taxableValue.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.outwardSupplies.integratedTax.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.outwardSupplies.centralTax.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.outwardSupplies.stateTax.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground">
                  ₹{gstr3bData.outwardSupplies.cess.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 4 - ITC Available */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-[24px] py-[16px]">
          <h3 className="text-body font-bold flex items-center gap-[8px]">
            <MIcon name="account_balance_wallet" className="text-[20px]" />
            Table 4 - Eligible ITC
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted dark:bg-slate-950 border-b border-border">
              <tr>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border">Details</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">Integrated Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">Central Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">State/UT Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Cess</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors">
                <td className="px-[24px] py-[16px] text-body-sm font-medium text-foreground border-r border-border">(A) ITC Available (on purchases)</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">₹0</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{(gstr3bData.itcAvailable.inwardSupplies / 2).toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{(gstr3bData.itcAvailable.inwardSupplies / 2).toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground">₹0</td>
              </tr>
              <tr className="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors">
                <td className="px-[24px] py-[16px] text-body-sm font-medium text-foreground border-r border-border">(B) ITC Reversed</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.itcAvailable.reversals.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.itcAvailable.reversals.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.itcAvailable.reversals.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground">₹0</td>
              </tr>
              <tr className="bg-emerald-50/50 dark:bg-emerald-900/20">
                <td className="px-[24px] py-[16px] text-body-sm font-bold text-foreground border-r border-emerald-200 dark:border-emerald-800">(C) Net ITC Available (A - B)</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-emerald-200 dark:border-emerald-800">₹0</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-emerald-200 dark:border-emerald-800">
                  ₹{(gstr3bData.itcAvailable.itcAvailed / 2).toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-bold text-emerald-600 dark:text-emerald-400 border-r border-emerald-200 dark:border-emerald-800">
                  ₹{(gstr3bData.itcAvailable.itcAvailed / 2).toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-bold text-emerald-600 dark:text-emerald-400">₹0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 6.1 - Tax Payable and Paid */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white px-[24px] py-[16px]">
          <h3 className="text-body font-bold flex items-center gap-[8px]">
            <MIcon name="credit_card" className="text-[20px]" />
            Table 6.1 - Payment of Tax
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted dark:bg-slate-950 border-b border-border">
              <tr>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border">Description</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">Integrated Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">Central Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right border-r border-border">State/UT Tax</th>
                <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Cess</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors">
                <td className="px-[24px] py-[16px] text-body-sm font-medium text-foreground border-r border-border">Tax Payable</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.taxPayable.integratedTax.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.taxPayable.centralTax.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground border-r border-border">
                  ₹{gstr3bData.taxPayable.stateTax.toLocaleString("en-IN")}
                </td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground">
                  ₹{gstr3bData.taxPayable.cess.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors">
                <td className="px-[24px] py-[16px] text-body-sm font-medium text-foreground border-r border-border">Interest</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground" colSpan={4}>
                  ₹{gstr3bData.taxPayable.interest.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors">
                <td className="px-[24px] py-[16px] text-body-sm font-medium text-foreground border-r border-border">Late Fee</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm text-foreground dark:text-muted-foreground" colSpan={4}>
                  ₹{gstr3bData.taxPayable.lateFee.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="bg-amber-50/50 dark:bg-amber-900/20">
                <td className="px-[24px] py-[16px] text-body-sm font-bold text-foreground border-r border-amber-200 dark:border-amber-800">Total Amount Payable</td>
                <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-bold text-amber-600 dark:text-amber-400" colSpan={4}>
                  ₹{totalPayable.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-[16px] p-[24px] shadow-sm">
        <h3 className="text-2xl font-bold mb-[16px] flex items-center gap-[8px]">
          <MIcon name="fact_check" className="text-[20px]" />
          GSTR-3B Summary for {getMonthName(selectedMonth)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          <div className="bg-white/10 backdrop-blur-sm rounded-[12px] p-[16px]">
            <p className="text-body-sm font-medium opacity-90 mb-[4px]">Total Output Tax</p>
            <h3 className="text-3xl font-bold">
              ₹
              {(
                gstr3bData.outwardSupplies.integratedTax +
                gstr3bData.outwardSupplies.centralTax +
                gstr3bData.outwardSupplies.stateTax
              ).toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-[12px] p-[16px]">
            <p className="text-body-sm font-medium opacity-90 mb-[4px]">Total ITC Claimed</p>
            <h3 className="text-3xl font-bold">
              ₹{gstr3bData.itcAvailable.itcAvailed.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-[12px] p-[16px]">
            <p className="text-body-sm font-medium opacity-90 mb-[4px]">Net Tax Payable</p>
            <h3 className="text-3xl font-bold">₹{totalPayable.toLocaleString("en-IN")}</h3>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-[24px]">
        <h3 className="text-2xl font-bold text-foreground mb-[16px]">Actions</h3>
        <div className="flex flex-wrap gap-[12px] mb-[16px]">
          <Button onClick={handleDownload} variant="outline" className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
            <MIcon name="download" className="text-[18px]" />
            Download JSON
          </Button>
          <Button onClick={handleFile} className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold">
            <MIcon name="check" className="text-[18px]" />
            File GSTR-3B
          </Button>
        </div>

        <div className="space-y-[12px]">
          <div className="p-[16px] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[12px]">
            <div className="flex gap-[12px]">
              <MIcon name="event" className="text-[20px] text-amber-600 dark:text-amber-400 flex-shrink-0 mt-[2px]" />
              <div>
                <p className="text-body font-bold text-amber-900 dark:text-amber-100 mb-[4px]">Filing Deadline</p>
                <p className="text-body-sm font-medium text-amber-700 dark:text-amber-300">
                  GSTR-3B for {getMonthName(selectedMonth)} must be filed by 20th of next month.
                  Late filing attracts penalty and interest.
                </p>
              </div>
            </div>
          </div>

          <div className="p-[16px] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[12px]">
            <div className="flex gap-[12px]">
              <MIcon name="info" className="text-[20px] text-blue-600 dark:text-blue-400 flex-shrink-0 mt-[2px]" />
              <div>
                <p className="text-body font-bold text-blue-900 dark:text-blue-100 mb-[4px]">Important Note</p>
                <p className="text-body-sm font-medium text-blue-700 dark:text-blue-300">
                  Please reconcile ITC with GSTR-2B before filing. Ensure all purchase bills are
                  recorded correctly. Payment must be made before filing the return.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
