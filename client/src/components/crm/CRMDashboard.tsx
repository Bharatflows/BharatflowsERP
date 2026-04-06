import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import {
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
import { toast } from "sonner";
import { crmService } from "@/services/modules.service";
import { chartColors, CHART_PALETTE } from "@/lib/chartColors";

interface CRMDashboardProps {
  onViewLeads: () => void;
  hideStats?: boolean;
}

interface DashboardData {
  kpis: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    wonLeads: number;
    lostLeads: number;
    conversionRate: number;
    todayFollowups: number;
    recentActivities: number;
  };
  statusBreakdown: Record<string, number>;
  sourceBreakdown: { name: string; value: number }[];
  recentActivities: {
    id: string;
    type: string;
    subject: string;
    leadName: string;
    date: string;
  }[];
}

const COLORS = CHART_PALETTE;

export function CRMDashboard({ onViewLeads, hideStats = false }: CRMDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await crmService.getDashboard();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load CRM dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    conversionRate: 0,
    todayFollowups: 0,
    recentActivities: 0,
  };

  // Build conversion data from status breakdown
  const conversionData = [
    { name: "New", leads: kpis.newLeads },
    { name: "Qualified", leads: kpis.qualifiedLeads },
    { name: "Won", leads: kpis.wonLeads },
  ];

  const sourceData = (data?.sourceBreakdown || []).map((s, i) => ({
    ...s,
    color: COLORS[i % COLORS.length]
  }));

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CALL": return Phone;
      case "EMAIL": return Mail;
      case "MEETING": return Calendar;
      default: return Calendar;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "CALL": return chartColors.brand;
      case "EMAIL": return chartColors.success;
      case "MEETING": return chartColors.orange;
      default: return chartColors.purple;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {!hideStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Total Leads</CardDescription>
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Users className="size-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-2xl font-bold">{kpis.totalLeads}</p>
              <Button variant="link" className="p-0 h-auto mt-2" onClick={onViewLeads}>
                View All <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Won Deals</CardDescription>
                <div className="bg-success/10 p-2 rounded-lg">
                  <Target className="size-4 text-success" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-2xl font-bold">{kpis.wonLeads}</p>
              <p className="text-muted-foreground mt-2">{kpis.qualifiedLeads} qualified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Conversion Rate</CardDescription>
                <div className="bg-warning/10 p-2 rounded-lg">
                  <TrendingUp className="size-4 text-warning" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-2xl font-bold">{kpis.conversionRate}%</p>
              <p className="text-muted-foreground mt-2">
                {kpis.conversionRate >= 30 ? "Above average" : "Below average"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Follow-ups Today</CardDescription>
                <div className="bg-chart-4/10 p-2 rounded-lg">
                  <Calendar className="size-4 text-chart-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-2xl font-bold">{kpis.todayFollowups}</p>
              <p className="text-muted-foreground mt-2">Pending activities</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lead Status Overview</CardTitle>
            <CardDescription>Current lead distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke={chartColors.brand} strokeWidth={2} name="Lead Count" />
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

      {/* Recent Activities & Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.recentActivities || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent activities</p>
              ) : (
                data?.recentActivities.slice(0, 4).map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const color = getActivityColor(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                        <Icon className="size-4" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{activity.leadName}</p>
                        <p className="text-muted-foreground text-sm">{activity.subject}</p>
                        <span className="text-muted-foreground text-xs">
                          {new Date(activity.date).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Status Summary</CardTitle>
            <CardDescription>Current pipeline status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground font-medium">New Leads</p>
                  <Badge className="bg-blue-100 text-blue-800">{kpis.newLeads}</Badge>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${kpis.totalLeads > 0 ? (kpis.newLeads / kpis.totalLeads) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground font-medium">Qualified</p>
                  <Badge className="bg-purple-100 text-purple-800">{kpis.qualifiedLeads}</Badge>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${kpis.totalLeads > 0 ? (kpis.qualifiedLeads / kpis.totalLeads) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground font-medium">Won</p>
                  <Badge className="bg-green-100 text-green-800">{kpis.wonLeads}</Badge>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${kpis.totalLeads > 0 ? (kpis.wonLeads / kpis.totalLeads) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground font-medium">Lost</p>
                  <Badge className="bg-red-100 text-red-800">{kpis.lostLeads}</Badge>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${kpis.totalLeads > 0 ? (kpis.lostLeads / kpis.totalLeads) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
