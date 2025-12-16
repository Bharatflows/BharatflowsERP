import { useState, useEffect } from "react";
import { Download, FileText, Check, Calendar, AlertCircle, TrendingUp, Wallet, CreditCard, FileCheck, Loader2, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <TrendingUp className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Output Tax</p>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{((gstr3bData.outwardSupplies.centralTax + gstr3bData.outwardSupplies.stateTax + gstr3bData.outwardSupplies.integratedTax)).toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <Wallet className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Input Tax Credit</p>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{gstr3bData.itcAvailable.itcAvailed.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <CreditCard className="size-5 text-amber-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Tax Payable</p>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{totalPayable.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-violet-50 p-2.5 rounded-lg">
              <Calendar className="size-5 text-violet-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Due Date</p>
          <h3 className="text-2xl font-bold text-foreground">20th</h3>
          <p className="text-xs text-muted-foreground mt-1">of next month</p>
        </div>
      </div>

      {/* Table 3.1 - Outward Supplies */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="size-5" />
            Table 3.1 - Tax on Outward Supplies
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nature of Supplies</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxable Value</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Integrated Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Central Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">State/UT Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cess</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">Outward taxable supplies</td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.outwardSupplies.taxableValue.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.outwardSupplies.integratedTax.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.outwardSupplies.centralTax.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.outwardSupplies.stateTax.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.outwardSupplies.cess.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 4 - ITC Available */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Wallet className="size-5" />
            Table 4 - Eligible ITC
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Integrated Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Central Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">State/UT Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cess</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">(A) ITC Available (on purchases)</td>
                <td className="px-6 py-4 text-right text-sm text-foreground">₹0</td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{(gstr3bData.itcAvailable.inwardSupplies / 2).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{(gstr3bData.itcAvailable.inwardSupplies / 2).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">₹0</td>
              </tr>
              <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">(B) ITC Reversed</td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.itcAvailable.reversals.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.itcAvailable.reversals.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.itcAvailable.reversals.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">₹0</td>
              </tr>
              <tr className="bg-emerald-50/50">
                <td className="px-6 py-4 text-sm font-semibold text-foreground">(C) Net ITC Available (A - B)</td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">₹0</td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                  ₹{(gstr3bData.itcAvailable.itcAvailed / 2).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                  ₹{(gstr3bData.itcAvailable.itcAvailed / 2).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">₹0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 6.1 - Tax Payable and Paid */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white px-6 py-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="size-5" />
            Table 6.1 - Payment of Tax
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Integrated Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Central Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">State/UT Tax</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cess</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">Tax Payable</td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.taxPayable.integratedTax.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.taxPayable.centralTax.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.taxPayable.stateTax.toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4 text-right text-sm text-foreground">
                  ₹{gstr3bData.taxPayable.cess.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">Interest</td>
                <td className="px-6 py-4 text-right text-sm text-foreground" colSpan={4}>
                  ₹{gstr3bData.taxPayable.interest.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">Late Fee</td>
                <td className="px-6 py-4 text-right text-sm text-foreground" colSpan={4}>
                  ₹{gstr3bData.taxPayable.lateFee.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr className="bg-amber-50/50">
                <td className="px-6 py-4 text-sm font-semibold text-foreground">Total Amount Payable</td>
                <td className="px-6 py-4 text-right text-sm font-bold text-amber-600" colSpan={4}>
                  ₹{totalPayable.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileCheck className="size-5" />
          GSTR-3B Summary for {getMonthName(selectedMonth)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Output Tax</p>
            <h3 className="text-2xl font-bold">
              ₹
              {(
                gstr3bData.outwardSupplies.integratedTax +
                gstr3bData.outwardSupplies.centralTax +
                gstr3bData.outwardSupplies.stateTax
              ).toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total ITC Claimed</p>
            <h3 className="text-2xl font-bold">
              ₹{gstr3bData.itcAvailable.itcAvailed.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Net Tax Payable</p>
            <h3 className="text-2xl font-bold">₹{totalPayable.toLocaleString("en-IN")}</h3>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <Button onClick={handleDownload} variant="outline" className="gap-2 h-10">
            <Download className="size-4" />
            Download JSON
          </Button>
          <Button onClick={handleFile} className="gap-2 h-10">
            <Check className="size-4" />
            File GSTR-3B
          </Button>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <div className="flex gap-3">
              <Calendar className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-900 font-medium mb-1">Filing Deadline</p>
                <p className="text-amber-700 text-sm">
                  GSTR-3B for {getMonthName(selectedMonth)} must be filed by 20th of next month.
                  Late filing attracts penalty and interest.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-900 font-medium mb-1">Important Note</p>
                <p className="text-blue-700 text-sm">
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
