import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Download, Mail, Eye } from "lucide-react";
import { toast } from "sonner";

export function PayslipGeneration() {
  const [selectedEmployee, setSelectedEmployee] = useState("EMP001");
  const [selectedMonth, setSelectedMonth] = useState("September 2024");

  const payslipData = {
    employeeId: "EMP001",
    name: "Rajesh Kumar",
    designation: "Sales Manager",
    department: "Sales",
    panNumber: "ABCDE1234F",
    bankAccount: "****7890",
    payPeriod: "September 2024",
    payDate: "30-Sep-2024",
    workingDays: 26,
    presentDays: 26,
    earnings: {
      basic: 35000,
      hra: 7000,
      conveyance: 1600,
      medical: 1250,
      special: 150,
      total: 45000,
    },
    deductions: {
      pf: 4200,
      esi: 675,
      tds: 0,
      advanceSalary: 0,
      total: 4875,
    },
    netSalary: 40125,
  };

  const handleDownload = () => {
    toast.success("Payslip downloaded successfully");
  };

  const handleEmail = () => {
    toast.success("Payslip sent to employee email");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMP001">Rajesh Kumar</SelectItem>
            <SelectItem value="EMP002">Priya Sharma</SelectItem>
            <SelectItem value="EMP003">Amit Patel</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="September 2024">Sep 2024</SelectItem>
            <SelectItem value="August 2024">Aug 2024</SelectItem>
            <SelectItem value="July 2024">Jul 2024</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleEmail}>
            <Mail className="size-4" />
            Email
          </Button>
          <Button className="gap-2" onClick={handleDownload}>
            <Download className="size-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Payslip Preview */}
      <Card>
        <CardHeader className="bg-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>BharatFlow MSME OS</CardTitle>
              <CardDescription className="text-white/90">
                Salary Slip - {payslipData.payPeriod}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-white">Pay Date</p>
              <p className="text-white">{payslipData.payDate}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Employee Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-muted-foreground">Employee ID</p>
              <p className="text-foreground">{payslipData.employeeId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Employee Name</p>
              <p className="text-foreground">{payslipData.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Designation</p>
              <p className="text-foreground">{payslipData.designation}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="text-foreground">{payslipData.department}</p>
            </div>
            <div>
              <p className="text-muted-foreground">PAN Number</p>
              <p className="text-foreground">{payslipData.panNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bank Account</p>
              <p className="text-foreground">{payslipData.bankAccount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Working Days</p>
              <p className="text-foreground">{payslipData.workingDays}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Present Days</p>
              <p className="text-foreground">{payslipData.presentDays}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Earnings and Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div>
              <h3 className="text-foreground mb-4">Earnings</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span className="text-foreground">
                    ₹{payslipData.earnings.basic.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">House Rent Allowance</span>
                  <span className="text-foreground">
                    ₹{payslipData.earnings.hra.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conveyance Allowance</span>
                  <span className="text-foreground">
                    ₹{payslipData.earnings.conveyance.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medical Allowance</span>
                  <span className="text-foreground">
                    ₹{payslipData.earnings.medical.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Special Allowance</span>
                  <span className="text-foreground">
                    ₹{payslipData.earnings.special.toLocaleString("en-IN")}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-foreground">Total Earnings</span>
                  <span className="text-foreground">
                    ₹{payslipData.earnings.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-foreground mb-4">Deductions</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provident Fund (PF)</span>
                  <span className="text-foreground">
                    ₹{payslipData.deductions.pf.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ESI</span>
                  <span className="text-foreground">
                    ₹{payslipData.deductions.esi.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax Deducted at Source</span>
                  <span className="text-foreground">
                    ₹{payslipData.deductions.tds.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advance Salary</span>
                  <span className="text-foreground">
                    ₹{payslipData.deductions.advanceSalary.toLocaleString("en-IN")}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-foreground">Total Deductions</span>
                  <span className="text-foreground">
                    ₹{payslipData.deductions.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Net Salary */}
          <div className="bg-primary text-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 mb-1">Net Salary Payable</p>
                <p className="text-white">
                  ₹{payslipData.netSalary.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/90">In Words</p>
                <p className="text-white">Forty Thousand One Hundred Twenty Five Only</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-muted-foreground">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p className="mt-2">
              For any queries, please contact HR Department at hr@company.com
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
          <CardDescription>Generate payslips for all employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.success("Payslips sent to all employees")}
            >
              <Mail className="size-4" />
              Email to All Employees
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.success("Payslips downloaded")}
            >
              <Download className="size-4" />
              Download All Payslips
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

