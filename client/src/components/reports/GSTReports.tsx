import { useState, useEffect } from "react";
import { Download, Filter, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { gstService } from "../../services/gst.service";
import { toast } from "sonner";
import { formatCurrency } from "../../lib/exportUtils";

export function GSTReports() {
  const [period, setPeriod] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [gstr1Data, setGstr1Data] = useState<any>(null);
  const [gstr3bData, setGstr3bData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const month = (period.getMonth() + 1).toString();
      const year = period.getFullYear().toString();

      const [gstr1, gstr3b] = await Promise.all([
        gstService.getGSTR1Summary(month, year),
        gstService.getGSTR3BSummary(month, year)
      ]);

      setGstr1Data(gstr1);
      setGstr3bData(gstr3b);
    } catch (error) {
      console.error("Failed to fetch GST reports:", error);
      toast.error("Failed to fetch GST data");
    } finally {
      setLoading(false);
    }
  };

  const gstr1Total = gstr1Data ?
    (gstr1Data.b2b?.reduce((acc: number, curr: any) => acc + curr.tax, 0) || 0) +
    (gstr1Data.b2cl?.reduce((acc: number, curr: any) => acc + curr.tax, 0) || 0) +
    (gstr1Data.b2cs?.reduce((acc: number, curr: any) => acc + curr.tax, 0) || 0)
    : 0;

  // Simplified extraction from GSTR3B summary structure
  const outTaxable = gstr3bData?.outwardSupplies?.taxable || 0;
  const outTax = gstr3bData?.outwardSupplies?.tax || 0;
  const inTax = gstr3bData?.eligibleITC?.tax || 0;
  const netPayable = Math.max(0, outTax - inTax);

  if (loading) {
    return <div className="p-6">Loading GST Reports...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">GST Reports</h2>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {period.toLocaleString('default', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" /> Export All
          </Button>
        </div>
      </div>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Output Tax (Sales)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(outTax)}</div>
            <div className="text-xs text-muted-foreground mt-1 grid grid-cols-2 gap-2">
              <span>Taxable: {formatCurrency(outTaxable)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Input Tax Credit (Purchases)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(inTax)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              From Eligible Purchases
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(netPayable)}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated Liability</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>GSTR-1 Summary (Outward)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm">B2B Invoices</span>
              <span className="font-medium">
                {formatCurrency(gstr1Data?.b2b?.reduce((acc: number, curr: any) => acc + curr.taxable, 0) || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm">B2C Large Invoices</span>
              <span className="font-medium">
                {formatCurrency(gstr1Data?.b2cl?.reduce((acc: number, curr: any) => acc + curr.taxable, 0) || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm">B2C Small Invoices</span>
              <span className="font-medium">
                {formatCurrency(gstr1Data?.b2cs?.reduce((acc: number, curr: any) => acc + curr.taxable, 0) || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold">Total Tax Liability</span>
              <span className="font-bold text-blue-600">{formatCurrency(gstr1Total)}</span>
            </div>
            <Button className="w-full mt-2" variant="secondary">View Detailed GSTR-1 Report</Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>GSTR-3B Summary (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm">Total Outward Supplies</span>
              <span className="font-medium">{formatCurrency(outTaxable)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm">Eligible ITC</span>
              <span className="font-medium text-green-600">{formatCurrency(inTax)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm">Reverse Charge Tax</span>
              <span className="font-medium">₹0</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-semibold">Net Tax Payable</span>
              <span className="font-bold text-red-600">{formatCurrency(netPayable)}</span>
            </div>
            <Button className="w-full mt-2" variant="secondary">View Detailed GSTR-3B Report</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
