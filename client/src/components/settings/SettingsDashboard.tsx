import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { settingsService } from "../../services/modules.service";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

interface SettingsDashboardProps {
  onNavigate: (tab: string) => void;
}

export function SettingsDashboard({ onNavigate }: SettingsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await settingsService.getDashboardStats();
        if (response.success) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch settings dashboard data:", error);
        toast.error("Failed to load settings dashboard statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const settingsSections = [
    {
      id: "business",
      title: "Business Profile",
      description: "Manage company details, GST info, and branding",
      icon: "business",
      color: "text-primary",
      bgColor: "bg-primary/10",
      items: ["Business Details", "Tax Information", "Branding & Logo", "Bank Details"],
      status: "complete" as const,
    },
    {
      id: "configuration",
      title: "App Configuration",
      description: "Module settings, features, and workflows",
      icon: "tune",
      color: "text-cyan-600 dark:text-cyan-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
      items: ["Module Control", "Feature Toggles", "Approval Workflows", "Preferences"],
      status: "incomplete" as const,
    },
    {
      id: "users",
      title: "Users & Roles",
      description: "Manage team members and permissions",
      icon: "group",
      color: "text-emerald-600 dark:text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      items: ["User Management", "Roles & Permissions", "Access Control", "Team Settings"],
      status: "complete" as const,
    },
    {
      id: "profile",
      title: "My Profile",
      description: "Personal settings and preferences",
      icon: "manage_accounts",
      color: "text-amber-600 dark:text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      items: ["Profile Info", "Notifications", "Language & Region", "Theme"],
      status: "complete" as const,
    },
    {
      id: "security",
      title: "Security & Audit",
      description: "Security settings and activity logs",
      icon: "security",
      color: "text-rose-600 dark:text-rose-500",
      bgColor: "bg-rose-50 dark:bg-rose-950",
      items: ["2FA Authentication", "Login History", "Audit Logs", "Device Management"],
      status: "complete" as const,
    },
    {
      id: "integrity",
      title: "Data Integrity",
      description: "Monitor system health and database consistency",
      icon: "verified_user",
      color: "text-indigo-600 dark:text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      items: ["Database Health", "Docker Status", "Record Counts", "Missing Relations"],
      status: "complete" as const,
    },
  ];

  const quickStats = [
    { label: "Active Users", value: data?.quickStats?.activeUsers || "...", icon: "group", color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Active Modules", value: data?.quickStats?.activeModules || "...", icon: "bolt", color: "text-cyan-600 dark:text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
    { label: "Storage Used", value: data?.quickStats?.storageUsed || "...", icon: "database", color: "text-amber-600 dark:text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Security Score", value: data?.quickStats?.securityScore || "...", icon: "security", color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-[48px]">
        <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-[24px] space-y-[24px] animate-fade-in">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        {quickStats.map((stat, index) => {
          return (
            <Card key={index} className="border border-border shadow-sm bg-card rounded-[12px]">
              <CardContent className="pt-[24px] px-[24px] pb-[24px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-[4px] text-body-sm font-medium">{stat.label}</p>
                    <p className={`text-[24px] font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-[12px] rounded-[12px]`}>
                    <MIcon name={stat.icon} className={`text-[24px] ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settings Categories */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-[16px]">Settings Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
          {settingsSections.map((section) => {
            return (
              <Card key={section.id} className="hover:shadow-md transition-all cursor-pointer border border-border shadow-sm bg-card group rounded-[16px]">
                <CardHeader className="pb-[12px] p-[24px]">
                  <div className="flex items-start justify-between">
                    <div className={`${section.bgColor} p-[12px] rounded-[12px] mb-[12px] group-hover:scale-110 transition-transform`}>
                      <MIcon name={section.icon} className={`text-[24px] ${section.color}`} />
                    </div>
                    {section.status === "complete" ? (
                      <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-[4px] rounded-[4px] py-[2px] px-[8px] text-[11px] font-bold">
                        <MIcon name="check_circle" className="text-[12px]" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-[4px] rounded-[4px] py-[2px] px-[8px] text-[11px] font-bold">
                        <MIcon name="error_outline" className="text-[12px]" />
                        Review
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-body font-bold text-foreground">{section.title}</CardTitle>
                  <CardDescription className="text-body-sm font-medium text-muted-foreground mt-[4px]">{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-[24px] pb-[24px]">
                  <div className="space-y-[8px] mb-[24px]">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-[8px] text-muted-foreground font-medium">
                        <div className="h-[6px] w-[6px] rounded-full bg-primary/40"></div>
                        <span className="text-[12px]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => onNavigate(section.id)}
                    variant="outline"
                    className="w-full hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-colors rounded-[8px] h-[40px] font-bold border-border"
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
      <Card className="border border-border shadow-sm bg-card rounded-[16px]">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-[16px] p-[24px]">
          <CardTitle className="text-body text-foreground font-bold">Recent Activity</CardTitle>
          <CardDescription className="text-body-sm font-medium text-muted-foreground">Latest changes to settings and configuration</CardDescription>
        </CardHeader>
        <CardContent className="pt-[24px] p-[24px]">
          <div className="space-y-[16px]">
            {data?.recentActivity?.length > 0 ? (
              data.recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-[16px] pb-[16px] border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="bg-primary/10 p-[8px] rounded-[8px] mt-[2px]">
                    <MIcon name="notifications" className="text-[16px] text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-bold text-body-sm">{activity.action}</p>
                    <p className="text-muted-foreground font-medium text-[12px] mt-[4px]">
                      by {activity.user} • {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-[16px] text-muted-foreground font-medium text-body-sm italic">No recent activity logs found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

