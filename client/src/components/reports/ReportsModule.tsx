import { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { ReportsOverview } from "./ReportsOverview";
import { useReportsDashboard } from "../../hooks/useReports";
import { toast } from "sonner";

export function ReportsModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboardResult, isLoading: dashboardLoading } = useReportsDashboard();
  const dashboardData = dashboardResult?.data;

  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname.split("/reports/")[1];
    if (!path) return "dashboard"; // Default to dashboard/overview
    return path;
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    // Map tab IDs to routes
    if (tab === "dashboard") navigate("/reports");
    else navigate(`/reports/${tab}`);
  };

  const handlePrint = () => {
    toast.info("Preparing report for printing...");
  };

  const handleExport = () => {
    toast.info("Exporting report data...");
  };

  return (
    <div className="min-h-full">
      <ReportsOverview
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        dashboardData={dashboardData}
        dashboardLoading={dashboardLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onPrint={handlePrint}
        onExport={handleExport}
      />
    </div>
  );
}