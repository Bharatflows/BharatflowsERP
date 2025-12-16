import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  IndianRupee,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HRDashboardProps {
  onViewEmployees: () => void;
  onViewAttendance: () => void;
}

const attendanceTrend = [
  { month: "Apr", present: 92, absent: 8 },
  { month: "May", present: 94, absent: 6 },
  { month: "Jun", present: 90, absent: 10 },
  { month: "Jul", present: 93, absent: 7 },
  { month: "Aug", present: 95, absent: 5 },
  { month: "Sep", present: 91, absent: 9 },
];

const departmentData = [
  { name: "Sales", value: 8, color: "#2563eb" },
  { name: "Operations", value: 12, color: "#10b981" },
  { name: "Accounts", value: 4, color: "#f97316" },
  { name: "Admin", value: 3, color: "#8b5cf6" },
  { name: "Others", value: 3, color: "#ec4899" },
];

const recentActivities = [
  {
    id: "1",
    type: "leave",
    employee: "Priya Sharma",
    action: "Leave Request - Medical Leave",
    date: "2024-09-20",
    status: "pending",
  },
  {
    id: "2",
    type: "joining",
    employee: "Amit Kumar",
    action: "New Employee Joined - Sales Team",
    date: "2024-09-18",
    status: "completed",
  },
  {
    id: "3",
    type: "attendance",
    employee: "Rahul Verma",
    action: "Late Arrival - 10:30 AM",
    date: "2024-09-19",
    status: "noted",
  },
  {
    id: "4",
    type: "leave",
    employee: "Neha Gupta",
    action: "Leave Request - Casual Leave",
    date: "2024-09-17",
    status: "approved",
  },
];

const upcomingEvents = [
  { event: "Salary Disbursement", date: "2024-09-30", type: "payroll" },
  { event: "Performance Review", date: "2024-10-05", type: "review" },
  { event: "Team Building Event", date: "2024-10-10", type: "event" },
];

export function HRDashboard({ onViewEmployees, onViewAttendance }: HRDashboardProps) {
  const totalEmployees = 30;
  const presentToday = 27;
  const absentToday = 3;
  const pendingLeaves = 5;
  const attendancePercentage = (presentToday / totalEmployees) * 100;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Employees</CardDescription>
              <div className="bg-[#2563eb]/10 p-2 rounded-lg">
                <Users className="size-4 text-[#2563eb]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <p className="text-foreground">{totalEmployees}</p>
              <span className="text-[#10b981] flex items-center gap-1 pb-1">
                <TrendingUp className="size-3" />
                +2 this month
              </span>
            </div>
            <Button
              variant="link"
              className="p-0 h-auto mt-2"
              onClick={onViewEmployees}
            >
              View All
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Present Today</CardDescription>
              <div className="bg-[#10b981]/10 p-2 rounded-lg">
                <UserCheck className="size-4 text-[#10b981]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <p className="text-foreground">{presentToday}</p>
              <span className="text-muted-foreground pb-1">
                ({attendancePercentage.toFixed(0)}%)
              </span>
            </div>
            <Button
              variant="link"
              className="p-0 h-auto mt-2"
              onClick={onViewAttendance}
            >
              Mark Attendance
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Absent Today</CardDescription>
              <div className="bg-[#ef4444]/10 p-2 rounded-lg">
                <UserX className="size-4 text-[#ef4444]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{absentToday}</p>
            <p className="text-muted-foreground mt-2">
              {absentToday} employees on leave
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Pending Approvals</CardDescription>
              <div className="bg-[#f97316]/10 p-2 rounded-lg">
                <AlertCircle className="size-4 text-[#f97316]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{pendingLeaves}</p>
            <p className="text-muted-foreground mt-2">Leave requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Monthly attendance percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Present %"
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Absent %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest HR activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "leave"
                        ? "bg-[#f97316]/10"
                        : activity.type === "joining"
                        ? "bg-[#10b981]/10"
                        : "bg-[#2563eb]/10"
                    }`}
                  >
                    {activity.type === "leave" ? (
                      <Calendar className="size-4 text-[#f97316]" />
                    ) : activity.type === "joining" ? (
                      <Users className="size-4 text-[#10b981]" />
                    ) : (
                      <Clock className="size-4 text-[#2563eb]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">{activity.employee}</p>
                    <p className="text-muted-foreground">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString("en-IN")}
                      </span>
                      <Badge
                        variant={
                          activity.status === "approved"
                            ? "default"
                            : activity.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          activity.status === "approved"
                            ? "bg-[#10b981] text-white"
                            : activity.status === "pending"
                            ? "bg-[#f97316] text-white"
                            : ""
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events & Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Important dates and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-foreground">{event.event}</p>
                      <p className="text-muted-foreground">
                        {new Date(event.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        event.type === "payroll"
                          ? "bg-[#10b981]/10"
                          : event.type === "review"
                          ? "bg-[#2563eb]/10"
                          : "bg-[#f97316]/10"
                      }`}
                    >
                      {event.type === "payroll" ? (
                        <IndianRupee
                          className={`size-4 ${
                            event.type === "payroll"
                              ? "text-[#10b981]"
                              : "text-[#2563eb]"
                          }`}
                        />
                      ) : (
                        <Calendar
                          className={`size-4 ${
                            event.type === "review"
                              ? "text-[#2563eb]"
                              : "text-[#f97316]"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Month Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Attendance</span>
                <span className="text-foreground">93.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Leaves</span>
                <span className="text-foreground">12 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Joinings</span>
                <span className="text-foreground">2 employees</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Resignations</span>
                <span className="text-foreground">0</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-foreground">Payroll Amount</span>
                <span className="text-foreground">₹8,50,000</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
