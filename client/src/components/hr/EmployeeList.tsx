import { useState, useEffect } from "react";
import { hrService } from "../../services/modules.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Search,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
} from "lucide-react";
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
}

export function EmployeeList({ onEditEmployee }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await hrService.getAll();
      const mappedEmployees = (response.data || []).map((emp: any) => ({
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
      setEmployees(mappedEmployees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const departments = [
    "all",
    "Sales",
    "Operations",
    "Accounts",
    "Admin",
    "IT",
    "Marketing",
  ];

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      filterDepartment === "all" || employee.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || employee.status === filterStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleDelete = async (employeeId: string) => {
    try {
      await hrService.delete(employeeId);
      setEmployees(employees.filter((e) => e.id !== employeeId));
      toast.success("Employee removed successfully");
    } catch (error) {
      console.error("Failed to delete employee:", error);
      toast.error("Failed to delete employee");
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>All Employees</CardTitle>
            <CardDescription>
              {filteredEmployees.length} employees
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employees Table */}
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="hidden lg:table-cell">Contact</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="hidden md:table-cell">Designation</TableHead>
                <TableHead className="hidden xl:table-cell">Joining Date</TableHead>
                <TableHead className="hidden lg:table-cell">Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-white">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-foreground">{employee.name}</p>
                          <p className="text-muted-foreground">{employee.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-3" />
                          <span>{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="size-3" />
                          <span>{employee.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.department}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {employee.designation}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {new Date(employee.joiningDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      ₹{employee.salary.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          employee.status === "active"
                            ? "bg-[#10b981] text-white"
                            : "bg-[#6b7280] text-white"
                        }
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditEmployee(employee.id)}>
                            <Edit className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="size-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 border rounded-lg">
            <p className="text-muted-foreground">Total Active</p>
            <p className="text-foreground">
              {employees.filter((e) => e.status === "active").length}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-muted-foreground">Total Salary</p>
            <p className="text-foreground">
              ₹
              {employees
                .filter((e) => e.status === "active")
                .reduce((sum, e) => sum + e.salary, 0)
                .toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-muted-foreground">Departments</p>
            <p className="text-foreground">
              {new Set(employees.map((e) => e.department)).size}
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-muted-foreground">Avg Salary</p>
            <p className="text-foreground">
              ₹
              {Math.round(
                employees.reduce((sum, e) => sum + e.salary, 0) / employees.length
              ).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

