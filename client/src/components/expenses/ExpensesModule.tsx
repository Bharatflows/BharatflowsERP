import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ModuleHeader } from "../ui/module-header";
import { ExpensesDashboard } from "./ExpensesDashboard";
import { ExpenseList } from "./ExpenseList";
import { AddEditExpense } from "./AddEditExpense";
import { ExpenseCategories } from "./ExpenseCategories";
import { VendorPayments } from "./VendorPayments";
import { ExpenseReports } from "./ExpenseReports";
import { IndianRupee, Plus, Download } from "lucide-react";
import { Button } from "../ui/button";

export function ExpensesModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);

  const handleEditExpense = (expenseId: string) => {
    setSelectedExpense(expenseId);
    setActiveTab("add");
  };

  const handleBackToList = () => {
    setSelectedExpense(null);
    setActiveTab("list");
  };

  return (
    <div className="p-4 md:p-6">
      <ModuleHeader
        title="Expense Management"
        description="Track and manage business expenses, vendors, and payments"
        showBackButton={false}
        icon={<IndianRupee className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setActiveTab("add")}>
              <Plus className="size-4 mr-2" />
              Add Expense
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="list">Expenses</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="vendors">Vendor Payments</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <ExpensesDashboard onViewExpenses={() => setActiveTab("list")} />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <ExpenseList onEditExpense={handleEditExpense} />
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <AddEditExpense
              expenseId={selectedExpense}
              onBack={handleBackToList}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <ExpenseCategories />
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <VendorPayments />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ExpenseReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
