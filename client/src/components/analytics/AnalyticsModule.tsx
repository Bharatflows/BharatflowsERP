import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ModuleHeader } from "../ui/module-header";
import { GSTAnalytics } from "./GSTAnalytics";
import { ProfitLossAnalysis } from "./ProfitLossAnalysis";
import { CashFlowForecast } from "./CashFlowForecast";
import { SalesFunnel } from "./SalesFunnel";
import { TrendingUp, Download } from "lucide-react";
import { Button } from "../ui/button";

type TabType = "gst" | "profitloss" | "cashflow" | "salesfunnel";

export function AnalyticsModule() {
  const [activeTab, setActiveTab] = useState<TabType>("gst");

  return (
    <div className="p-4 md:p-6">
      <ModuleHeader
        title="Business Analytics"
        description="Insights and trends to drive your business decisions"
        showBackButton={false}
        icon={<TrendingUp className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="gst">GST Analytics</TabsTrigger>
              <TabsTrigger value="profitloss">P&L Analysis</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
              <TabsTrigger value="salesfunnel">Sales Funnel</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="gst" className="space-y-4">
            <GSTAnalytics />
          </TabsContent>

          <TabsContent value="profitloss" className="space-y-4">
            <ProfitLossAnalysis />
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <CashFlowForecast />
          </TabsContent>

          <TabsContent value="salesfunnel" className="space-y-4">
            <SalesFunnel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
