import { useState, useEffect } from "react";
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

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

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
        <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-[24px] animate-fade-in">
      {/* Header Card */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-[24px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
          <div className="flex items-start gap-[16px]">
            <div className="bg-primary/10 p-[12px] rounded-[12px]">
              <MIcon name="description" className="text-[24px] text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-[4px]">GSTR-1 Return</h2>
              <p className="text-body-sm font-medium text-muted-foreground">
                Statement of outward supplies of goods or services
              </p>
            </div>
          </div>
          <div className="flex gap-[8px]">
            <Button variant="outline" onClick={fetchGSTR1Data} className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
              <MIcon name="refresh" className="text-[18px]" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
              <MIcon name="download" className="text-[18px]" />
              Download JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-[24px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px]">
          <div className="space-y-[8px]">
            <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Return Period</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px] h-[40px] rounded-[8px] border-slate-200">
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
          <div className="flex items-center gap-[16px] text-body-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-[8px]">
              <MIcon name="event" className="text-[18px]" />
              <span>Due Date: 11th of next month</span>
            </div>
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 rounded-[6px] font-bold">
              Pending
            </Badge>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-[16px] border border-blue-200 dark:border-blue-900/50 shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-[12px] rounded-[12px]">
              <MIcon name="receipt" className="text-[24px] text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider mb-[4px]">Total Taxable Value</p>
          <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300">₹{totals.totalTaxable.toLocaleString("en-IN")}</h3>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-[16px] border border-emerald-200 dark:border-emerald-900/50 shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-emerald-100 dark:bg-emerald-900/40 p-[12px] rounded-[12px]">
              <MIcon name="trending_up" className="text-[24px] text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mb-[4px]">Total Tax Liability</p>
          <h3 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">₹{totals.totalTax.toLocaleString("en-IN")}</h3>
        </div>

        <div className="bg-violet-50 dark:bg-violet-950/20 rounded-[16px] border border-violet-200 dark:border-violet-900/50 shadow-sm p-[20px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-[12px]">
            <div className="bg-violet-100 dark:bg-violet-900/40 p-[12px] rounded-[12px]">
              <MIcon name="fact_check" className="text-[24px] text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-[12px] font-bold text-violet-600/80 dark:text-violet-400/80 uppercase tracking-wider mb-[4px]">Total Documents</p>
          <h3 className="text-3xl font-bold text-violet-700 dark:text-violet-300">
            {sections.reduce((sum, s) => sum + ((s.data as any).invoices || (s.data as any).notes || 0), 0)}
          </h3>
        </div>
      </div>

      {/* GSTR-1 Sections */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm overflow-hidden">
        <div className="p-[20px] pb-[16px] border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-2xl font-bold text-foreground">Return Sections</h3>
          <p className="text-[12px] font-medium text-muted-foreground mt-[4px]">Click on a section to view and edit details</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sections.map((section) => (
            <div
              key={section.code}
              className="p-[20px] hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
                <div className="flex items-center gap-[16px]">
                  <div className="bg-primary/10 p-[12px] rounded-[12px]">
                    <span className="text-body-sm font-bold text-primary">{section.code}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-[8px]">
                      <span className="font-bold text-foreground">{section.name}</span>
                      {section.mandatory && (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold bg-rose-50 text-rose-700 border-rose-200 rounded-[4px]">
                          Mandatory
                        </Badge>
                      )}
                    </div>
                    <p className="text-body-sm font-medium text-muted-foreground mt-[2px]">{section.description}</p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-[24px] md:justify-end">
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[2px]">Taxable Value</div>
                    <div className="font-mono text-body-sm font-bold text-foreground">
                      ₹{section.data.taxableValue.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[2px]">Total Tax</div>
                    <div className="font-mono text-body-sm font-bold text-emerald-600">
                      ₹{section.data.totalTax.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <MIcon name="chevron_right" className="text-[24px] text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-[16px] p-[24px]">
          <div className="flex gap-[16px]">
            <MIcon name="info" className="text-[24px] text-blue-600 dark:text-blue-400 flex-shrink-0 mt-[2px]" />
            <div>
              <h4 className="text-body font-bold text-blue-900 dark:text-blue-100 mb-[8px]">Filing Instructions</h4>
              <ul className="space-y-[4px] text-body-sm font-medium text-blue-700 dark:text-blue-300 list-disc list-inside">
                <li>Ensure all B2B invoices are uploaded</li>
                <li>Verify HSN summary is complete</li>
                <li>Validate all credit/debit notes</li>
                <li>Cross-check with books of accounts</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[16px] border border-border shadow-sm p-[24px]">
          <h4 className="text-body font-bold text-foreground mb-[16px]">Filing Actions</h4>
          <div className="space-y-[12px]">
            <Button variant="outline" className="w-full justify-start gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
              <MIcon name="check" className="text-[18px]" />
              Validate Return Data
            </Button>
            <Button
              className="w-full justify-start gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold"
              onClick={handleFileReturn}
            >
              <MIcon name="fact_check" className="text-[18px]" />
              File GSTR-1 Return
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
