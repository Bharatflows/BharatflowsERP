import { useState } from "react";
import { GSTDashboard } from "./GSTDashboard";
import { GSTR1 } from "./GSTR1";
import { GSTR3B } from "./GSTR3B";
import { ITCLedger } from "./ITCLedger";
import { HSNSummary } from "./HSNSummary";
import { GSTPayments } from "./GSTPayments";
import { EInvoiceGeneration } from "./EInvoiceGeneration";
import { EWaybillTracking } from "./EWaybillTracking";
import { ModuleHeader } from "../ui/module-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { IndianRupee, Download, FileUp } from "lucide-react";
import { Button } from "../ui/button";

type Tab = "dashboard" | "gstr1" | "gstr3b" | "itc" | "hsn" | "payments" | "eway" | "einvoice";

interface GSTModuleProps {
  onBack?: () => void;
}

export function GSTModule({ onBack }: GSTModuleProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="p-4 md:p-6">
      <ModuleHeader
        title="GST Compliance Center"
        description="Manage GST returns, ITC, payments, e-invoices, and e-way bills"
        showBackButton={false}
        icon={<IndianRupee className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-2 text-right hidden md:block">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">GSTIN</p>
              <p className="text-lg font-bold text-primary">27AABCU9603R1ZM</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <FileUp className="size-4 mr-2" />
              File Return
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
              <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
              <TabsTrigger value="itc">ITC Ledger</TabsTrigger>
              <TabsTrigger value="hsn">HSN Summary</TabsTrigger>
              <TabsTrigger value="einvoice">E-Invoice</TabsTrigger>
              <TabsTrigger value="eway">E-Waybill</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <GSTDashboard onNavigate={(tab) => setActiveTab(tab as Tab)} />
          </TabsContent>

          <TabsContent value="gstr1" className="space-y-4">
            <GSTR1 />
          </TabsContent>

          <TabsContent value="gstr3b" className="space-y-4">
            <GSTR3B />
          </TabsContent>

          <TabsContent value="itc" className="space-y-4">
            <ITCLedger />
          </TabsContent>

          <TabsContent value="hsn" className="space-y-4">
            <HSNSummary />
          </TabsContent>

          <TabsContent value="einvoice" className="space-y-4">
            <EInvoiceGeneration />
          </TabsContent>

          <TabsContent value="eway" className="space-y-4">
            <EWaybillTracking />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <GSTPayments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}