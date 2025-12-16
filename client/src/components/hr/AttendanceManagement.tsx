import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Search, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Attendance {
  employeeId: string;
  name: string;
  department: string;
  status: "present" | "absent" | "half-day" | "late" | "leave";
  checkIn?: string;
  checkOut?: string;
}

export function AttendanceManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Attendance[]>([
    {
      employeeId: "EMP001",
      name: "Rajesh Kumar",
      department: "Sales",
      status: "present",
      checkIn: "09:00 AM",
      checkOut: "06:00 PM",
    },
    {
      employeeId: "EMP002",
      name: "Priya Sharma",
      department: "Accounts",
      status: "present",
      checkIn: "09:15 AM",
      checkOut: "06:10 PM",
    },
    {
      employeeId: "EMP003",
      name: "Amit Patel",
      department: "Operations",
      status: "late",
      checkIn: "10:30 AM",
    },
    {
      employeeId: "EMP004",
      name: "Neha Gupta",
      department: "Sales",
      status: "leave",
    },
    {
      employeeId: "EMP005",
      name: "Rahul Verma",
      department: "Operations",
      status: "present",
      checkIn: "08:45 AM",
      checkOut: "05:50 PM",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const toggleAttendance = (employeeId: string, newStatus: Attendance["status"]) => {
    setAttendance(
      attendance.map((a) =>
        a.employeeId === employeeId ? { ...a, status: newStatus } : a
      )
    );
    toast.success("Attendance updated");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-[#10b981] text-white">
            <CheckCircle className="size-3 mr-1" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-[#ef4444] text-white">
            <XCircle className="size-3 mr-1" />
            Absent
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-[#f97316] text-white">
            <Clock className="size-3 mr-1" />
            Late
          </Badge>
        );
      case "half-day":
        return <Badge className="bg-[#8b5cf6] text-white">Half Day</Badge>;
      case "leave":
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;
  const leaveCount = attendance.filter((a) => a.status === "leave").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Present</p>
              <p className="text-foreground text-[#10b981]">{presentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Absent</p>
              <p className="text-foreground text-[#ef4444]">{absentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Late</p>
              <p className="text-foreground text-[#f97316]">{lateCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">On Leave</p>
              <p className="text-foreground">{leaveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Mark attendance for specific date</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            <div className="mt-4 text-center">
              <p className="text-muted-foreground">Selected Date</p>
              <p className="text-foreground">
                {selectedDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>
                  {attendance.length} employees
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="size-4" />
                  Export
                </Button>
                <Button
                  size="sm"
                  onClick={() => toast.success("Attendance marked for all")}
                >
                  Mark All Present
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden lg:table-cell">Check In</TableHead>
                    <TableHead className="hidden lg:table-cell">Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((emp) => (
                    <TableRow key={emp.employeeId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {emp.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-foreground">{emp.name}</p>
                            <p className="text-muted-foreground">{emp.employeeId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {emp.department}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {emp.checkIn || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {emp.checkOut || "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(emp.status)}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={emp.status}
                          onValueChange={(value) =>
                            toggleAttendance(emp.employeeId, value as Attendance["status"])
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="half-day">Half Day</SelectItem>
                            <SelectItem value="leave">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

