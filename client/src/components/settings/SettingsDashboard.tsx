import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Building2,
  Sliders,
  Users,
  UserCog,
  Shield,
  Bell,
  CreditCard,
  Palette,
  Globe,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "../ui/badge";

interface SettingsDashboardProps {
  onNavigate: (tab: string) => void;
}

export function SettingsDashboard({ onNavigate }: SettingsDashboardProps) {
  const settingsSections = [
    {
      id: "business",
      title: "Business Profile",
      description: "Manage company details, GST info, and branding",
      icon: Building2,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      items: ["Business Details", "Tax Information", "Branding & Logo", "Bank Details"],
      status: "complete" as const,
    },
    {
      id: "configuration",
      title: "App Configuration",
      description: "Module settings, features, and workflows",
      icon: Sliders,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      items: ["Module Control", "Feature Toggles", "Approval Workflows", "Preferences"],
      status: "incomplete" as const,
    },
    {
      id: "users",
      title: "Users & Roles",
      description: "Manage team members and permissions",
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      items: ["User Management", "Roles & Permissions", "Access Control", "Team Settings"],
      status: "complete" as const,
    },
    {
      id: "profile",
      title: "My Profile",
      description: "Personal settings and preferences",
      icon: UserCog,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      items: ["Profile Info", "Notifications", "Language & Region", "Theme"],
      status: "complete" as const,
    },
    {
      id: "security",
      title: "Security & Audit",
      description: "Security settings and activity logs",
      icon: Shield,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      items: ["2FA Authentication", "Login History", "Audit Logs", "Device Management"],
      status: "complete" as const,
    },
  ];

  const quickStats = [
    { label: "Active Users", value: "8", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Modules", value: "7/9", icon: Zap, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Storage Used", value: "2.4 GB", icon: Database, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Security Score", value: "95%", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const recentActivity = [
    { action: "Business GST details updated", user: "Admin", time: "2 hours ago" },
    { action: "New user 'Rahul Kumar' added", user: "Admin", time: "5 hours ago" },
    { action: "Invoice module configuration changed", user: "Manager", time: "1 day ago" },
    { action: "Security settings updated", user: "Admin", time: "2 days ago" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border border-border/50 shadow-sm bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm font-medium">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settings Sections */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Settings Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="hover:shadow-md transition-all cursor-pointer border border-border/50 shadow-sm bg-card group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`${section.bgColor} p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    {section.status === "complete" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Review
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40"></div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => onNavigate(section.id)}
                    variant="outline"
                    className="w-full hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    Configure
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border border-border/50 shadow-sm bg-card">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <CardDescription>Latest changes to settings and configuration</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="bg-indigo-50 p-2 rounded-lg mt-0.5">
                  <Bell className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-medium text-sm">{activity.action}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
