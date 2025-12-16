import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Package,
  FileText,
  IndianRupee,
  Users,
  Calendar,
  Bell,
  BellOff,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "critical" | "warning" | "info" | "success";
  category: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLink?: string;
  icon: any;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "critical",
      category: "Inventory",
      title: "Critical Stock Level",
      message: "Product A stock below minimum level (5 units remaining)",
      timestamp: "2024-09-20T10:30:00",
      read: false,
      actionLink: "/inventory",
      icon: Package,
    },
    {
      id: "2",
      type: "warning",
      category: "Payments",
      title: "Invoice Overdue",
      message: "Invoice INV-2024-089 overdue by 15 days (₹45,000)",
      timestamp: "2024-09-20T09:15:00",
      read: false,
      actionLink: "/sales",
      icon: IndianRupee,
    },
    {
      id: "3",
      type: "critical",
      category: "GST",
      title: "GSTR-1 Filing Due",
      message: "GSTR-1 filing due in 2 days (Sep 2024)",
      timestamp: "2024-09-20T08:00:00",
      read: false,
      actionLink: "/gst",
      icon: FileText,
    },
    {
      id: "4",
      type: "warning",
      category: "Inventory",
      title: "Low Stock Alert",
      message: "3 products below reorder level",
      timestamp: "2024-09-19T16:45:00",
      read: false,
      actionLink: "/inventory",
      icon: Package,
    },
    {
      id: "5",
      type: "info",
      category: "HR",
      title: "Leave Request Pending",
      message: "2 leave requests awaiting approval",
      timestamp: "2024-09-19T14:30:00",
      read: true,
      actionLink: "/hr",
      icon: Users,
    },
    {
      id: "6",
      type: "success",
      category: "Payments",
      title: "Payment Received",
      message: "Payment of ₹1,25,000 received from ABC Corp",
      timestamp: "2024-09-19T11:20:00",
      read: true,
      actionLink: "/payments",
      icon: CheckCircle,
    },
    {
      id: "7",
      type: "info",
      category: "CRM",
      title: "Follow-up Reminder",
      message: "5 follow-ups scheduled for today",
      timestamp: "2024-09-19T09:00:00",
      read: true,
      actionLink: "/crm",
      icon: Calendar,
    },
    {
      id: "8",
      type: "warning",
      category: "HR",
      title: "Payroll Due",
      message: "Salary processing due in 3 days",
      timestamp: "2024-09-18T10:00:00",
      read: true,
      actionLink: "/hr",
      icon: IndianRupee,
    },
  ]);

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const deleteAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="size-5 text-[#ef4444]" />;
      case "warning":
        return <AlertTriangle className="size-5 text-[#f97316]" />;
      case "info":
        return <Info className="size-5 text-[#2563eb]" />;
      case "success":
        return <CheckCircle className="size-5 text-[#10b981]" />;
      default:
        return <Bell className="size-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "critical":
        return <Badge className="bg-[#ef4444] text-white">Critical</Badge>;
      case "warning":
        return <Badge className="bg-[#f97316] text-white">Warning</Badge>;
      case "info":
        return <Badge className="bg-[#2563eb] text-white">Info</Badge>;
      case "success":
        return <Badge className="bg-[#10b981] text-white">Success</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.read
  );

  const criticalCount = notifications.filter(
    (n) => n.type === "critical" && !n.read
  ).length;
  const warningCount = notifications.filter(
    (n) => n.type === "warning" && !n.read
  ).length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Total Alerts</p>
                <p className="text-foreground">{notifications.length}</p>
              </div>
              <Bell className="size-8 text-[#2563eb]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Unread</p>
                <p className="text-foreground">{unreadCount}</p>
              </div>
              <BellOff className="size-8 text-[#f97316]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Critical</p>
                <p className="text-foreground text-[#ef4444]">{criticalCount}</p>
              </div>
              <AlertCircle className="size-8 text-[#ef4444]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">Warnings</p>
                <p className="text-foreground text-[#f97316]">{warningCount}</p>
              </div>
              <AlertTriangle className="size-8 text-[#f97316]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>All system alerts and updates</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteAll}
                className="text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <BellOff className="size-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-foreground mb-2">No notifications</p>
                  <p className="text-muted-foreground">
                    {filter === "unread"
                      ? "All caught up! No unread notifications."
                      : "You don't have any notifications yet."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all ${
                        notification.read
                          ? "bg-white"
                          : "bg-accent border-l-4 border-l-[#2563eb]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg flex-shrink-0 ${
                            notification.type === "critical"
                              ? "bg-[#ef4444]/10"
                              : notification.type === "warning"
                              ? "bg-[#f97316]/10"
                              : notification.type === "success"
                              ? "bg-[#10b981]/10"
                              : "bg-[#2563eb]/10"
                          }`}
                        >
                          <Icon
                            className={`size-6 ${
                              notification.type === "critical"
                                ? "text-[#ef4444]"
                                : notification.type === "warning"
                                ? "text-[#f97316]"
                                : notification.type === "success"
                                ? "text-[#10b981]"
                                : "text-[#2563eb]"
                            }`}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-foreground">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="size-2 rounded-full bg-[#2563eb]" />
                                )}
                              </div>
                              <p className="text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>
                            {getTypeBadge(notification.type)}
                          </div>

                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="outline">
                              {notification.category}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(
                                notification.timestamp
                              ).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex gap-2 mt-3">
                            {notification.actionLink && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() =>
                                  toast.success(
                                    `Navigating to ${notification.category}`
                                  )
                                }
                              >
                                <ExternalLink className="size-3" />
                                View Details
                              </Button>
                            )}
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark as Read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="size-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

