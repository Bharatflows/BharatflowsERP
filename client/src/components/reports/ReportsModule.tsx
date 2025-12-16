import { useState } from "react";
import { ReportsDashboard } from "./ReportsDashboard";
import { SalesReports } from "./SalesReports";
import { PurchaseReports } from "./PurchaseReports";
import { GSTReports } from "./GSTReports";
import { InventoryReports } from "./InventoryReports";
import { FinancialReports } from "./FinancialReports";
import { AgingReport } from "./AgingReport";
import { PartyStatement } from "./PartyStatement";
import { ModuleHeader } from "../ui/module-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BarChart3, Download, Printer } from "lucide-react";
import { Button } from "../ui/button";

type Tab =
  | "dashboard"
  | "sales"
  | "purchase"
  | "gst"
  | "inventory"
  | "financial"
  | "aging"
  | "statement";

interface ReportsModuleProps {
  onBack?: () => void;
}

export function ReportsModule({ onBack }: ReportsModuleProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="p-4 md:p-6">
      <ModuleHeader
        title="Business Reports & Analytics"
        description="Comprehensive insights into your business performance"
        showBackButton={false}
        icon={<BarChart3 className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-2 text-right hidden md:block">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Net Profit (YTD)</p>
              <p className="text-lg font-bold text-primary">₹8,45,000.00</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Printer className="size-4 mr-2" />
              Print
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dashboard">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchase">Purchase</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="aging">Aging</TabsTrigger>
              <TabsTrigger value="statement">Party Statement</TabsTrigger>
              <TabsTrigger value="gst">GST</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <ReportsDashboard onNavigate={(tab) => setActiveTab(tab as Tab)} />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <SalesReports />
          </TabsContent>

          <TabsContent value="purchase" className="space-y-4">
            <PurchaseReports />
          </TabsContent>

          <TabsContent value="gst" className="space-y-4">
            <GSTReports />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventoryReports />
          </TabsContent>

          <TabsContent value="aging" className="space-y-4">
            <AgingReport />
          </TabsContent>

          <TabsContent value="statement" className="space-y-4">
            <PartyStatement />
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <FinancialReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}