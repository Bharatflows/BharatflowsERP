import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Users,
  Target,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  CheckCircle,
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

interface CRMDashboardProps {
  onViewLeads: () => void;
}

const conversionData = [
  { month: "Apr", leads: 45, converted: 12 },
  { month: "May", leads: 52, converted: 15 },
  { month: "Jun", leads: 48, converted: 14 },
  { month: "Jul", leads: 60, converted: 18 },
  { month: "Aug", leads: 55, converted: 20 },
  { month: "Sep", leads: 68, converted: 25 },
];

const sourceData = [
  { name: "Website", value: 35, color: "#2563eb" },
  { name: "Referral", value: 28, color: "#10b981" },
  { name: "Social Media", value: 22, color: "#f97316" },
  { name: "Direct", value: 15, color: "#8b5cf6" },
];

export function CRMDashboard({ onViewLeads }: CRMDashboardProps) {
  // Custom tooltip for theme-aware styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name} : {entry.value}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Leads</CardDescription>
              <div className="bg-[#2563eb]/10 p-2 rounded-lg">
                <Users className="size-4 text-[#2563eb]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">68</p>
            <Button variant="link" className="p-0 h-auto mt-2" onClick={onViewLeads}>
              View All <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Opportunities</CardDescription>
              <div className="bg-[#10b981]/10 p-2 rounded-lg">
                <Target className="size-4 text-[#10b981]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">₹15.2L</p>
            <p className="text-muted-foreground mt-2">25 active deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Conversion Rate</CardDescription>
              <div className="bg-[#f97316]/10 p-2 rounded-lg">
                <TrendingUp className="size-4 text-[#f97316]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">36.8%</p>
            <p className="text-muted-foreground mt-2">+5% vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Follow-ups Today</CardDescription>
              <div className="bg-[#8b5cf6]/10 p-2 rounded-lg">
                <Calendar className="size-4 text-[#8b5cf6]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">12</p>
            <p className="text-muted-foreground mt-2">Pending activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lead Conversion Trend</CardTitle>
            <CardDescription>Monthly leads vs conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#2563eb" strokeWidth={2} name="Leads" />
                <Line type="monotone" dataKey="converted" stroke="#10b981" strokeWidth={2} name="Converted" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Where leads come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Hot Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "call", lead: "ABC Corp", activity: "Called regarding quotation", time: "2 hours ago", icon: Phone },
                { type: "email", lead: "XYZ Ltd", activity: "Sent proposal email", time: "4 hours ago", icon: Mail },
                { type: "meeting", lead: "PQR Industries", activity: "Product demo completed", time: "1 day ago", icon: Calendar },
                { type: "call", lead: "LMN Traders", activity: "Follow-up call scheduled", time: "2 days ago", icon: Phone },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-lg ${activity.type === "call" ? "bg-[#2563eb]/10" :
                      activity.type === "email" ? "bg-[#10b981]/10" : "bg-[#f97316]/10"
                    }`}>
                    <activity.icon className={`size-4 ${activity.type === "call" ? "text-[#2563eb]" :
                        activity.type === "email" ? "text-[#10b981]" : "text-[#f97316]"
                      }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">{activity.lead}</p>
                    <p className="text-muted-foreground">{activity.activity}</p>
                    <span className="text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hot Leads</CardTitle>
            <CardDescription>High-priority opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { company: "ABC Corp", contact: "Rajesh Kumar", value: 250000, stage: "Negotiation", score: 95 },
                { company: "XYZ Ltd", contact: "Priya Sharma", value: 180000, stage: "Proposal", score: 85 },
                { company: "PQR Industries", contact: "Amit Patel", value: 320000, stage: "Demo", score: 80 },
              ].map((lead, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground">{lead.company}</p>
                    <Badge className="bg-[#10b981] text-white">{lead.score}%</Badge>
                  </div>
                  <p className="text-muted-foreground">{lead.contact}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">₹{lead.value.toLocaleString("en-IN")}</span>
                    <Badge variant="outline">{lead.stage}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
