import { useState } from "react";
import { BankingOverview } from "./BankingOverview";
import { useBankingDashboard } from "../../hooks/useBanking";
import { toast } from "sonner";

export function BankingModule() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboardResult, isLoading: dashboardLoading } = useBankingDashboard();
  const dashboardData = dashboardResult?.data;

  const handleCreateTransaction = () => {
    toast.info("Opening transaction form...");
  };

  const handleExport = () => {
    toast.info("Exporting banking data...");
  };

  return (
    <div className="min-h-full">
      <BankingOverview
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboardData={dashboardData}
        dashboardLoading={dashboardLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onCreateTransaction={handleCreateTransaction}
        onExport={handleExport}
      />
    </div>
  );
}
