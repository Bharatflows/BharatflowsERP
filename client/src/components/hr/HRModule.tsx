import { useState } from "react";
import { HROverview } from "./HROverview";
import { AddEditEmployee } from "./AddEditEmployee";
import { useHRDashboard } from "../../hooks/useHR";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export function HRModule() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboardResult, isLoading: dashboardLoading } = useHRDashboard();
  const dashboardData = dashboardResult?.data;

  const handleCreateEmployee = () => {
    setSelectedEmployeeId(null);
    setShowAddEmployee(true);
  };

  const handleEditEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setShowAddEmployee(true);
  };

  const handleCloseDialog = () => {
    setSelectedEmployeeId(null);
    setShowAddEmployee(false);
  };

  const handleExport = () => {
    toast.info("Exporting HR data...");
  };

  return (
    <div className="min-h-full">
      <HROverview
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboardData={dashboardData}
        dashboardLoading={dashboardLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onCreateEmployee={handleCreateEmployee}
        onExport={handleExport}
      />

      {/* Add/Edit Employee Dialog */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {selectedEmployeeId ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <AddEditEmployee
            employeeId={selectedEmployeeId}
            onBack={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
