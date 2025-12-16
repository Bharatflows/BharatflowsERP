import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ModuleHeader } from "../ui/module-header";
import { ProductionDashboard } from "./ProductionDashboard";
import { BillOfMaterials } from "./BillOfMaterials";
import { WorkOrders } from "./WorkOrders";
import { ProductionPlanning } from "./ProductionPlanning";
import { QualityControl } from "./QualityControl";
import { Factory, Plus, Download } from "lucide-react";
import { Button } from "../ui/button";

export function ProductionModule() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-4 md:p-6">
      <ModuleHeader
        title="Production & Manufacturing"
        description="Manage production orders, BOM, and manufacturing processes"
        showBackButton={false}
        icon={<Factory className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              New Work Order
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="bom">Bill of Materials</TabsTrigger>
              <TabsTrigger value="workorders">Work Orders</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="quality">Quality Control</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <ProductionDashboard onViewWorkOrders={() => setActiveTab("workorders")} />
          </TabsContent>

          <TabsContent value="bom" className="space-y-4">
            <BillOfMaterials />
          </TabsContent>

          <TabsContent value="workorders" className="space-y-4">
            <WorkOrders />
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <ProductionPlanning />
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <QualityControl />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
