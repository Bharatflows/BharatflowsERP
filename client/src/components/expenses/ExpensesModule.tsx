import { useState } from "react";
import { AddEditExpense } from "./AddEditExpense";
import { ExpensesOverview } from "./ExpensesOverview";
import { useExpenseDashboard } from "../../hooks/useExpenses";
import { toast } from "sonner";

export function ExpensesModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: dashboardResult, isLoading: dashboardLoading } = useExpenseDashboard();
  const dashboardData = dashboardResult?.data;

  const handleCreateExpense = () => {
    setView("create");
    setSelectedExpenseId(null);
  };

  const handleEditExpense = (expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setView("edit");
  };

  const handleBackToList = () => {
    setSelectedExpenseId(null);
    setView("list");
  };

  const handleExport = () => {
    toast.info("Exporting expenses data...");
  };

  return (
    <div className="min-h-full">
      {view === "list" ? (
        <ExpensesOverview
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dashboardData={dashboardData}
          dashboardLoading={dashboardLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onCreateExpense={handleCreateExpense}
          onEditExpense={handleEditExpense}
          onExport={handleExport}
        />
      ) : (
        <div className="p-6">
          <AddEditExpense
            expenseId={selectedExpenseId}
            onBack={handleBackToList}
          />
        </div>
      )}
    </div>
  );
}
