import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ModuleHeader } from "../ui/module-header";
import { CRMDashboard } from "./CRMDashboard";
import { LeadManagement } from "./LeadManagement";
import { OpportunityManagement } from "./OpportunityManagement";
import { ActivityTracking } from "./ActivityTracking";
import { SalesPipeline } from "./SalesPipeline";
import { UserCheck, Plus, Download } from "lucide-react";
import { Button } from "../ui/button";

export function CRMModule() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-4 md:p-6">
      <ModuleHeader
        title="CRM - Customer Relationship Management"
        description="Manage leads, opportunities, and customer interactions"
        showBackButton={false}
        icon={<UserCheck className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              Add Lead
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <CRMDashboard onViewLeads={() => setActiveTab("leads")} />
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <LeadManagement />
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <OpportunityManagement />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <SalesPipeline />
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <ActivityTracking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
