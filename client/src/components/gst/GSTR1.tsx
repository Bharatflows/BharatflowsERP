import { useState, useEffect } from "react";
import { Download, FileText, ChevronRight, Check, Calendar, TrendingUp, Receipt, FileCheck, AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
import { toast } from "sonner";
import { gstService } from "../../services/modules.service";

interface GSTR1Section {
  invoices?: number;
  notes?: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess?: number;
  totalTax: number;
}

interface GSTR1Data {
  b2b: GSTR1Section;
  b2c: GSTR1Section;
  exports: GSTR1Section;
  cdnr: GSTR1Section;
}

export function GSTR1() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [gstr1Data, setGstr1Data] = useState<GSTR1Data>({
    b2b: { invoices: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
    b2c: { invoices: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
    exports: { invoices: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
    cdnr: { notes: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
  });

  const fetchGSTR1Data = async () => {
    setLoading(true);
    try {
      const [month, year] = selectedMonth.split('-');
      const response = await gstService.generateGSTR1({ month, year });

      if (response.success && response.data) {
        const data = response.data;
        setGstr1Data({
          b2b: {
            invoices: data.b2b?.count || 0,
            taxableValue: data.b2b?.taxableValue || 0,
            cgst: data.b2b?.cgst || 0,
            sgst: data.b2b?.sgst || 0,
            igst: data.b2b?.igst || 0,
            totalTax: (data.b2b?.cgst || 0) + (data.b2b?.sgst || 0) + (data.b2b?.igst || 0),
          },
          b2c: {
            invoices: data.b2c?.count || 0,
            taxableValue: data.b2c?.taxableValue || 0,
            cgst: data.b2c?.cgst || 0,
            sgst: data.b2c?.sgst || 0,
            igst: data.b2c?.igst || 0,
            totalTax: (data.b2c?.cgst || 0) + (data.b2c?.sgst || 0) + (data.b2c?.igst || 0),
          },
          exports: {
            invoices: data.exports?.count || 0,
            taxableValue: data.exports?.taxableValue || 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
          },
          cdnr: {
            notes: data.cdnr?.count || 0,
            taxableValue: data.cdnr?.taxableValue || 0,
            cgst: data.cdnr?.cgst || 0,
            sgst: data.cdnr?.sgst || 0,
            igst: data.cdnr?.igst || 0,
            totalTax: (data.cdnr?.cgst || 0) + (data.cdnr?.sgst || 0) + (data.cdnr?.igst || 0),
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch GSTR-1 data:", error);
      toast.error("Failed to load GSTR-1 data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGSTR1Data();
  }, [selectedMonth]);

  const sections = [
    {
      code: "4",
      name: "B2B Invoices",
      description: "Business to Business - Tax Invoice",
      data: gstr1Data.b2b,
      mandatory: true,
    },
    {
      code: "5",
      name: "B2C (Large) Invoices",
      description: "Business to Consumer - Invoice value > ₹2.5 Lakhs",
      data: gstr1Data.b2c,
      mandatory: false,
    },
    {
      code: "6A",
      name: "Exports",
      description: "Export Invoices",
      data: gstr1Data.exports,
      mandatory: false,
    },
    {
      code: "9B",
      name: "Credit/Debit Notes (Registered)",
      description: "Credit and Debit Notes issued to registered persons",
      data: gstr1Data.cdnr,
      mandatory: false,
    },
  ];

  const calculateTotal = () => {
    const totalTaxable = Object.values(gstr1Data).reduce(
      (sum, section) => sum + section.taxableValue,
      0
    );
    const totalTax = Object.values(gstr1Data).reduce(
      (sum, section) => sum + section.totalTax,
      0
    );
    return { totalTaxable, totalTax };
  };

  const totals = calculateTotal();

  const handleFileReturn = () => {
    toast.info("GSTR-1 filing will be initiated after validation");
  };

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
              <FileText className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">GSTR-1 Return</h2>
              <p className="text-muted-foreground text-sm">
                Statement of outward supplies of goods or services
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchGSTR1Data} className="gap-2 h-10">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2 h-10">
              <Download className="size-4" />
              Download JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="space-y-2">
            <Label>Return Period</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px] h-10">
                <SelectValue placeholder="Select month" />
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <span>Due Date: 11th of next month</span>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Pending
            </Badge>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <Receipt className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Taxable Value</p>
          <h3 className="text-2xl font-bold text-foreground">₹{totals.totalTaxable.toLocaleString("en-IN")}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <TrendingUp className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Tax Liability</p>
          <h3 className="text-2xl font-bold text-emerald-600">₹{totals.totalTax.toLocaleString("en-IN")}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-violet-50 p-2.5 rounded-lg">
              <FileCheck className="size-5 text-violet-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total Documents</p>
          <h3 className="text-2xl font-bold text-foreground">
            {sections.reduce((sum, s) => sum + ((s.data as any).invoices || (s.data as any).notes || 0), 0)}
          </h3>
        </div>
      </div>

      {/* GSTR-1 Sections */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-semibold text-foreground">Return Sections</h3>
          <p className="text-sm text-muted-foreground mt-1">Click on a section to view and edit details</p>
        </div>
        <div className="divide-y divide-border/50">
          {sections.map((section) => (
            <div
              key={section.code}
              className="p-5 hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <span className="text-sm font-bold text-primary">{section.code}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{section.name}</span>
                      {section.mandatory && (
                        <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                          Mandatory
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Taxable Value</div>
                    <div className="font-medium text-foreground">
                      ₹{section.data.taxableValue.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Tax</div>
                    <div className="font-medium text-emerald-600">
                      ₹{section.data.totalTax.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-blue-900 font-medium mb-2">Filing Instructions</h4>
              <ul className="space-y-1 text-blue-700 text-sm list-disc list-inside">
                <li>Ensure all B2B invoices are uploaded</li>
                <li>Verify HSN summary is complete</li>
                <li>Validate all credit/debit notes</li>
                <li>Cross-check with books of accounts</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5">
          <h4 className="font-medium text-foreground mb-4">Filing Actions</h4>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2 h-10">
              <Check className="size-4" />
              Validate Return Data
            </Button>
            <Button
              className="w-full justify-start gap-2 h-10"
              onClick={handleFileReturn}
            >
              <FileCheck className="size-4" />
              File GSTR-1 Return
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
