import { useState } from "react";
import { ProductionOverview } from "./ProductionOverview";
import { useProductionDashboard } from "../../hooks/useProduction";
import { toast } from "sonner";

export function ProductionModule() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboardResult, isLoading: dashboardLoading } = useProductionDashboard();
  const dashboardData = dashboardResult?.data;

  const handleCreateWorkOrder = () => {
    toast.info("Opening new work order form...");
  };

  const handleExport = () => {
    toast.info("Exporting production data...");
  };

  return (
    <div className="min-h-full">
      <ProductionOverview
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboardData={dashboardData}
        dashboardLoading={dashboardLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onCreateWorkOrder={handleCreateWorkOrder}
        onExport={handleExport}
      />
    </div>
  );
}
