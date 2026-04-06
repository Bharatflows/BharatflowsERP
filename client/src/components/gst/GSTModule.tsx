import { useState } from "react";
import { GSTOverview } from "./GSTOverview";
import { useGSTDashboard } from "../../hooks/useGST";
import { toast } from "sonner";

export function GSTModule() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboardResult, isLoading: dashboardLoading } = useGSTDashboard();
  const dashboardData = dashboardResult?.data;

  const handleFileReturn = () => {
    toast.info("Opening GST filing wizard...");
  };

  const handleExport = () => {
    toast.info("Exporting GST data...");
  };

  return (
    <div className="min-h-full">
      <GSTOverview
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboardData={dashboardData}
        dashboardLoading={dashboardLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onFileReturn={handleFileReturn}
        onExport={handleExport}
      />
    </div>
  );
}