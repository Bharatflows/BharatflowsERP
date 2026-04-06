import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
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
import { IndianRupee, Download, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface PayrollEntry {
  employeeId: string;
  name: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  grossSalary: number;
  pf: number;
  esi: number;
  tds: number;
  deductions: number;
  netSalary: number;
  status: "pending" | "processed" | "paid";
}

export function PayrollProcessing() {
  const [selectedMonth, setSelectedMonth] = useState("September 2024");
  const [payroll, setPayroll] = useState<PayrollEntry[]>([
    {
      employeeId: "EMP001",
      name: "Rajesh Kumar",
      basicSalary: 35000,
      hra: 7000,
      allowances: 3000,
      grossSalary: 45000,
      pf: 4200,
      esi: 675,
      tds: 0,
      deductions: 4875,
      netSalary: 40125,
      status: "processed",
    },
    {
      employeeId: "EMP002",
      name: "Priya Sharma",
      basicSalary: 30000,
      hra: 6000,
      allowances: 2000,
      grossSalary: 38000,
      pf: 3600,
      esi: 570,
      tds: 0,
      deductions: 4170,
      netSalary: 33830,
      status: "processed",
    },
    {
      employeeId: "EMP003",
      name: "Amit Patel",
      basicSalary: 25000,
      hra: 5000,
      allowances: 2000,
      grossSalary: 32000,
      pf: 3000,
      esi: 480,
      tds: 0,
      deductions: 3480,
      netSalary: 28520,
      status: "processed",
    },
  ]);

  const handleProcessPayroll = () => {
    setPayroll(
      payroll.map((p) => ({
        ...p,
        status: "processed" as const,
      }))
    );
    toast.success("Payroll processed successfully");
  };

  const handleMarkPaid = (employeeId: string) => {
    setPayroll(
      payroll.map((p) =>
        p.employeeId === employeeId ? { ...p, status: "paid" as const } : p
      )
    );
    toast.success("Payment marked as completed");
  };

  const totalGrossSalary = payroll.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalDeductions = payroll.reduce((sum, p) => sum + p.deductions, 0);
  const totalNetSalary = payroll.reduce((sum, p) => sum + p.netSalary, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-success text-white">
            <CheckCircle className="size-3 mr-1" />
            Paid
          </Badge>
        );
      case "processed":
        return <Badge className="bg-primary text-white">Processed</Badge>;
      case "pending":
        return <Badge className="bg-warning text-white">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Gross Salary</p>
                <p className="text-foreground">
                  ₹{totalGrossSalary.toLocaleString("en-IN")}
                </p>
              </div>
              <IndianRupee className="size-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Total Deductions</p>
                <p className="text-foreground text-error">
                  ₹{totalDeductions.toLocaleString("en-IN")}
                </p>
              </div>
              <IndianRupee className="size-8 text-error" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Net Payable</p>
                <p className="text-foreground text-success">
                  ₹{totalNetSalary.toLocaleString("en-IN")}
                </p>
              </div>
              <IndianRupee className="size-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Employees</p>
                <p className="text-foreground">{payroll.length}</p>
              </div>
              <CheckCircle className="size-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Payroll Processing</CardTitle>
              <CardDescription>Process salary for all employees</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="September 2024">Sep 2024</SelectItem>
                  <SelectItem value="August 2024">Aug 2024</SelectItem>
                  <SelectItem value="July 2024">Jul 2024</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="size-4" />
                Export
              </Button>
              <Button className="gap-2" onClick={handleProcessPayroll}>
                <Send className="size-4" />
                Process All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right hidden md:table-cell">HRA</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Allowances</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.map((entry) => (
                  <TableRow key={entry.employeeId}>
                    <TableCell>
                      <div>
                        <p className="text-foreground">{entry.name}</p>
                        <p className="text-muted-foreground">{entry.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{entry.basicSalary.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      ₹{entry.hra.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      ₹{entry.allowances.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{entry.grossSalary.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right text-error hidden lg:table-cell">
                      ₹{entry.deductions.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      ₹{entry.netSalary.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell className="text-right">
                      {entry.status === "processed" && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkPaid(entry.employeeId)}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total Summary */}
          <div className="mt-4 p-4 bg-accent rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-muted-foreground mb-1">Total Gross</p>
                <p className="text-foreground">
                  ₹{totalGrossSalary.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Total Deductions</p>
                <p className="text-foreground text-error">
                  -₹{totalDeductions.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Total Net Payable</p>
                <p className="text-foreground text-success">
                  ₹{totalNetSalary.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deduction Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Deduction Breakdown</CardTitle>
          <CardDescription>Statutory deductions summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-muted-foreground mb-2">Total PF</p>
              <p className="text-foreground">
                ₹{payroll.reduce((sum, p) => sum + p.pf, 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-muted-foreground mb-2">Total ESI</p>
              <p className="text-foreground">
                ₹{payroll.reduce((sum, p) => sum + p.esi, 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-muted-foreground mb-2">Total TDS</p>
              <p className="text-foreground">
                ₹{payroll.reduce((sum, p) => sum + p.tds, 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

