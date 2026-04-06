import { useState } from "react";
import { CRMOverview } from "./CRMOverview";
import { useCRMDashboard } from "../../hooks/useCRM";
import { toast } from "sonner";

export function CRMModule() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboardResult, isLoading: dashboardLoading } = useCRMDashboard();
  const dashboardData = dashboardResult?.data;

  const handleCreateLead = () => {
    toast.info("Opening add lead form...");
  };

  const handleExport = () => {
    toast.info("Exporting CRM data...");
  };

  return (
    <div className="min-h-full">
      <CRMOverview
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboardData={dashboardData}
        dashboardLoading={dashboardLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onCreateLead={handleCreateLead}
        onExport={handleExport}
      />
    </div>
  );
}
