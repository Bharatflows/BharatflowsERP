import { useState, useMemo } from "react";
import {
  Users,
  Briefcase,
  IndianRupee,
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Search,
  Filter,
  Download,
  Plus,
  FileDown,
  Sheet,
  ChevronDown,
  UserCheck,
  UserX
} from "lucide-react";
import { DataTable } from "../ui/data-table";
import { StatsCard } from "../ui/stats-card";
import { ListFilters } from "../ui/ListFilters";
import { exportToCSV, exportToExcel, exportToPDF, formatCurrency, formatDate } from "../../lib/exportUtils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { cn } from "../../lib/utils";
import { useEmployees, useDeleteEmployee } from "../../hooks/useHR";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  status: "active" | "inactive";
  employeeId: string;
}

interface EmployeeListProps {
  onEditEmployee: (employeeId: string) => void;
  onCreateNew?: () => void;
}

export function EmployeeList({ onEditEmployee, onCreateNew }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // TanStack Query
  const { data: employeesData, isLoading: loading, isFetching, refetch } = useEmployees();
  const deleteMutation = useDeleteEmployee();

  // Map API response
  const employees: Employee[] = useMemo(() => {
    const data = (employeesData?.data as any) || [];
    return data.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate,
      salary: Number(emp.salary),
      status: (emp.status || 'active').toLowerCase(),
      employeeId: emp.employeeId
    }));
  }, [employeesData]);

  const departments = useMemo(() =>
    ["Sales", "Operations", "Accounts", "Admin", "IT", "Marketing", ...new Set(employees.map(e => e.department))].filter((v, i, a) => a.indexOf(v) === i && v !== "all"),
    [employees]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    totalSalary: employees.filter((e) => e.status === "active").reduce((sum, e) => sum + e.salary, 0),
    departments: new Set(employees.map((e) => e.department)).size,
  };

  const handleExportCSV = () => {
    const data = filteredEmployees.map(e => ({
      'Name': e.name,
      'Employee ID': e.employeeId,
      'Email': e.email,
      'Phone': e.phone,
      'Department': e.department,
      'Designation': e.designation,
      'Joining Date': formatDate(e.joiningDate),
      'Salary': e.salary,
      'Status': e.status
    }));
    exportToCSV(data, 'Employees');
  };

  const handleExportExcel = () => {
    const data = filteredEmployees.map(e => ({
      'Name': e.name,
      'Employee ID': e.employeeId,
      'Email': e.email,
      'Phone': e.phone,
      'Department': e.department,
      'Designation': e.designation,
      'Joining Date': formatDate(e.joiningDate),
      'Salary': e.salary,
      'Status': e.status
    }));
    exportToExcel(data, 'Employees');
  };

  const handleExportPDF = () => {
    const columns = ['Name', 'ID', 'Department', 'Designation', 'Date', 'Salary', 'Status'];
    const data = filteredEmployees.map(e => [
      e.name,
      e.employeeId,
      e.department,
      e.designation,
      formatDate(e.joiningDate),
      formatCurrency(e.salary),
      e.status
    ]);
    exportToPDF({ title: 'Employee List', columns, data, filename: 'Employees' });
  };

  const columns = [
    {
      header: "Employee",
      cell: (employee: Employee) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-medium">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-foreground font-medium">{employee.name}</p>
            <p className="text-muted-foreground text-xs">{employee.employeeId}</p>
          </div>
        </div>
      )
    },
    {
      header: "Contact",
      className: "hidden lg:table-cell",
      cell: (employee: Employee) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Mail className="size-3" />
            <span className="truncate max-w-[150px]">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Phone className="size-3" />
            <span>{employee.phone}</span>
          </div>
        </div>
      )
    },
    {
      header: "Department",
      cell: (employee: Employee) => (
        <Badge variant="outline" className="font-normal">{employee.department}</Badge>
      )
    },
    {
      header: "Designation",
      className: "hidden md:table-cell",
      cell: (employee: Employee) => (
        <span className="text-foreground">{employee.designation}</span>
      )
    },
    {
      header: "Joining Date",
      className: "hidden xl:table-cell",
      cell: (employee: Employee) => (
        <span className="text-muted-foreground">{formatDate(employee.joiningDate)}</span>
      )
    },
    {
      header: "Salary",
      className: "hidden lg:table-cell text-right",
      cell: (employee: Employee) => (
        <span className="text-foreground font-medium">{formatCurrency(employee.salary)}</span>
      )
    },
    {
      header: "Status",
      className: "text-center",
      cell: (employee: Employee) => (
        <div className="flex justify-center">
          <Badge
            className={cn(
              "rounded-full px-3 py-0.5",
              employee.status === "active"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-muted text-foreground hover:bg-muted"
            )}
          >
            {employee.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
      )
    },
    {
      header: "Actions",
      className: "text-center",
      cell: (employee: Employee) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEditEmployee(employee.id)}
          >
            <Edit className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => onEditEmployee(employee.id)} className="rounded-lg">
                <Edit className="size-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg">
                <Eye className="size-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg" onClick={() => toast.success(`Sending email to ${employee.email}`)}>
                <Mail className="size-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive rounded-lg" onClick={() => handleDelete(employee.id)}>
                <Trash2 className="size-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const renderMobileItem = (employee: Employee) => (
    <div
      key={employee.id}
      className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => onEditEmployee(employee.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-medium">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-foreground">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">{employee.designation}</p>
          </div>
        </div>
        <Badge
          className={cn(
            "rounded-full px-3 py-0.5",
            employee.status === "active"
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-muted text-foreground hover:bg-muted"
          )}
        >
          {employee.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Department</p>
          <p className="font-medium">{employee.department}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground mb-1">Salary</p>
          <p className="font-medium">{formatCurrency(employee.salary)}</p>
        </div>
        <div className="col-span-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-3" />
            <span className="truncate">{employee.email}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onEditEmployee(employee.id); }}
        >
          Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem className="rounded-lg">
              <Eye className="size-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive rounded-lg" onClick={() => handleDelete(employee.id)}>
              <Trash2 className="size-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Employees"
          value={stats.total}
          icon={Users}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
        <StatsCard
          label="Active"
          value={stats.active}
          icon={UserCheck}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          shadowColor="shadow-emerald-500/20"
        />
        <StatsCard
          label="Departments"
          value={stats.departments}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          shadowColor="shadow-amber-500/20"
        />
        <StatsCard
          label="Total Monthly Salary"
          value={formatCurrency(stats.totalSalary)}
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-primary to-primary/80"
          shadowColor="shadow-primary/20"
        />
      </div>

      <ListFilters
        searchPlaceholder="Search employees by name, ID, or email..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refetch}
        isFetching={isFetching}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
      >
        <div key="dept-filter" className="w-[160px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-11 rounded-xl">
                <span className="truncate">
                  {departmentFilter === "all" ? "Departments" : departmentFilter}
                </span>
                <ChevronDown className="size-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-xl">
              <DropdownMenuItem onClick={() => setDepartmentFilter("all")}>
                All Departments
              </DropdownMenuItem>
              {departments.map(dept => (
                <DropdownMenuItem key={dept} onClick={() => setDepartmentFilter(dept)}>
                  {dept}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-11 rounded-xl">
              <Download className="size-4" />
              Export
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={handleExportCSV} className="rounded-lg">
              <FileDown className="size-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel} className="rounded-lg">
              <Sheet className="size-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
              <FileDown className="size-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ListFilters>

      <DataTable
        data={filteredEmployees}
        columns={columns}
        mobileRenderer={renderMobileItem}
        isLoading={loading}
        onRowClick={(employee) => onEditEmployee(employee.id)}
        emptyState={{
          title: "No employees found",
          description: "Add your first employee to get started",
          icon: Users,
          action: onCreateNew ? (
            <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
              <Plus className="size-4" />
              Add Employee
            </Button>
          ) : undefined
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">{employees.find(e => e.id === deleteId)?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
