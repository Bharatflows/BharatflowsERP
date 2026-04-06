import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ModuleHeader } from "../ui/module-header";
import { GSTAnalytics } from "./GSTAnalytics";
import { ProfitLossAnalysis } from "./ProfitLossAnalysis";
import { CashFlowForecast } from "./CashFlowForecast";
import { SalesFunnel } from "./SalesFunnel";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

type TabType = "gst" | "profitloss" | "cashflow" | "salesfunnel";

export function AnalyticsModule() {
  const [activeTab, setActiveTab] = useState<TabType>("gst");

  return (
    <div className="p-[24px]">
      <ModuleHeader
        title="Business Analytics"
        description="Insights and trends to drive your business decisions"
        showBackButton={true}
        backTo="/dashboard"
        icon={<MIcon name="trending_up" className="text-[20px] text-primary" />}
        actions={
          <div className="flex items-center gap-[8px]">
            <Button variant="outline" size="sm" className="gap-[8px] h-[32px] px-[12px] rounded-[8px] font-bold border-border">
              <MIcon name="download" className="text-[16px]" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="space-y-[24px]">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <div className="overflow-x-auto pb-[8px]">
            <TabsList className="inline-flex w-auto bg-muted/50 p-[4px] rounded-[12px]">
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
