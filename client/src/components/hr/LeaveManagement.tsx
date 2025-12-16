import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { CheckCircle, XCircle, Clock, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

export function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: "L001",
      employeeId: "EMP002",
      employeeName: "Priya Sharma",
      leaveType: "Medical Leave",
      startDate: "2024-09-25",
      endDate: "2024-09-27",
      days: 3,
      reason: "Medical treatment",
      status: "pending",
    },
    {
      id: "L002",
      employeeId: "EMP004",
      employeeName: "Neha Gupta",
      leaveType: "Casual Leave",
      startDate: "2024-09-20",
      endDate: "2024-09-20",
      days: 1,
      reason: "Personal work",
      status: "approved",
    },
    {
      id: "L003",
      employeeId: "EMP001",
      employeeName: "Rajesh Kumar",
      leaveType: "Earned Leave",
      startDate: "2024-10-05",
      endDate: "2024-10-10",
      days: 6,
      reason: "Family vacation",
      status: "pending",
    },
  ]);

  const handleApprove = (leaveId: string) => {
    setLeaveRequests(
      leaveRequests.map((l) =>
        l.id === leaveId ? { ...l, status: "approved" as const } : l
      )
    );
    toast.success("Leave approved");
  };

  const handleReject = (leaveId: string) => {
    setLeaveRequests(
      leaveRequests.map((l) =>
        l.id === leaveId ? { ...l, status: "rejected" as const } : l
      )
    );
    toast.success("Leave rejected");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-[#10b981] text-white">
            <CheckCircle className="size-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-[#ef4444] text-white">
            <XCircle className="size-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-[#f97316] text-white">
            <Clock className="size-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = leaveRequests.filter((l) => l.status === "pending").length;
  const approvedCount = leaveRequests.filter((l) => l.status === "approved").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Pending Requests</p>
                <p className="text-foreground">{pendingCount}</p>
              </div>
              <Clock className="size-8 text-[#f97316]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Approved This Month</p>
                <p className="text-foreground">{approvedCount}</p>
              </div>
              <CheckCircle className="size-8 text-[#10b981]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Total Leave Days</p>
                <p className="text-foreground">
                  {leaveRequests.reduce((sum, l) => sum + l.days, 0)} days
                </p>
              </div>
              <CalendarIcon className="size-8 text-[#2563eb]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Manage employee leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead className="hidden md:table-cell">Start Date</TableHead>
                  <TableHead className="hidden md:table-cell">End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead className="hidden lg:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div>
                        <p className="text-foreground">{leave.employeeName}</p>
                        <p className="text-muted-foreground">{leave.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{leave.leaveType}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(leave.startDate).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(leave.endDate).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {leave.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell className="text-right">
                      {leave.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#10b981]"
                            onClick={() => handleApprove(leave.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#ef4444]"
                            onClick={() => handleReject(leave.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance Overview</CardTitle>
          <CardDescription>Available leave balance by employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Rajesh Kumar", "Priya Sharma", "Amit Patel"].map((emp, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-3">
                <p className="text-foreground">{emp}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-muted-foreground">Casual</p>
                    <p className="text-foreground">8</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Medical</p>
                    <p className="text-foreground">12</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Earned</p>
                    <p className="text-foreground">15</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

