import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ModuleHeader } from "../ui/module-header";
import { HRDashboard } from "./HRDashboard";
import { EmployeeList } from "./EmployeeList";
import { AddEditEmployee } from "./AddEditEmployee";
import { AttendanceManagement } from "./AttendanceManagement";
import { LeaveManagement } from "./LeaveManagement";
import { PayrollProcessing } from "./PayrollProcessing";
import { PayslipGeneration } from "./PayslipGeneration";
import { Users, Plus, Download } from "lucide-react";
import { Button } from "../ui/button";

export function HRModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const handleEditEmployee = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setActiveTab("add");
  };

  const handleBackToList = () => {
    setSelectedEmployee(null);
    setActiveTab("employees");
  };

  return (
    <div className="p-4 md:p-6">
      <ModuleHeader
        title="HR & Payroll Management"
        description="Manage employees, attendance, leaves, and payroll processing"
        showBackButton={false}
        icon={<Users className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setActiveTab("add")}>
              <Plus className="size-4 mr-2" />
              Add Employee
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="add">Add Employee</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="leave">Leave</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="payslips">Payslips</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <HRDashboard
              onViewEmployees={() => setActiveTab("employees")}
              onViewAttendance={() => setActiveTab("attendance")}
            />
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <EmployeeList onEditEmployee={handleEditEmployee} />
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <AddEditEmployee
              employeeId={selectedEmployee}
              onBack={handleBackToList}
            />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <AttendanceManagement />
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            <LeaveManagement />
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <PayrollProcessing />
          </TabsContent>

          <TabsContent value="payslips" className="space-y-4">
            <PayslipGeneration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
