import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Settings, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface AlertRule {
  id: string;
  name: string;
  category: string;
  condition: string;
  threshold: string;
  enabled: boolean;
  channels: string[];
}

export function AlertRules() {
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: "1",
      name: "Low Stock Alert",
      category: "Inventory",
      condition: "Stock quantity below",
      threshold: "10 units",
      enabled: true,
      channels: ["In-App", "Email"],
    },
    {
      id: "2",
      name: "Invoice Overdue",
      category: "Payments",
      condition: "Invoice overdue by",
      threshold: "7 days",
      enabled: true,
      channels: ["In-App", "Email", "SMS"],
    },
    {
      id: "3",
      name: "GST Filing Reminder",
      category: "GST",
      condition: "Filing due in",
      threshold: "3 days",
      enabled: true,
      channels: ["In-App", "Email"],
    },
    {
      id: "4",
      name: "Large Sale Alert",
      category: "Sales",
      condition: "Sale amount above",
      threshold: "₹1,00,000",
      enabled: true,
      channels: ["In-App"],
    },
    {
      id: "5",
      name: "Payment Received",
      category: "Payments",
      condition: "Payment received",
      threshold: "Any amount",
      enabled: false,
      channels: ["In-App", "Email"],
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success("Alert rule updated");
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
    toast.success("Alert rule deleted");
  };

  return (
    <div className="space-y-6">
      {/* Alert Rules List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>
                Configure automated alerts for important events
              </CardDescription>
            </div>
            <Button className="gap-2" onClick={() => toast.success("Add rule dialog opened")}>
              <Plus className="size-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 border rounded-lg ${rule.enabled ? "bg-white" : "bg-accent/50"
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-foreground">{rule.name}</p>
                      <Badge variant="outline">{rule.category}</Badge>
                      {!rule.enabled && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">
                      {rule.condition} {rule.threshold}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Channels:</span>
                      {rule.channels.map((channel, idx) => (
                        <Badge
                          key={idx}
                          className={
                            channel === "Email"
                              ? "bg-info text-white"
                              : channel === "SMS"
                                ? "bg-success text-white"
                                : "bg-warning text-white"
                          }
                        >
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <Button variant="ghost" size="sm">
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create New Rule */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Alert Rule</CardTitle>
          <CardDescription>
            Set up custom alerts based on business conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input id="ruleName" placeholder="e.g., High Value Sale Alert" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="gst">GST</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">Below</SelectItem>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="overdue">Overdue by</SelectItem>
                  <SelectItem value="duein">Due in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold Value</Label>
              <Input id="threshold" placeholder="e.g., 10, ₹50000, 7 days" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notification Channels</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="inapp" defaultChecked />
                  <Label htmlFor="inapp">In-App</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="email" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="sms" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Button onClick={() => toast.success("Alert rule created")}>
                Create Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predefined Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Templates</CardTitle>
          <CardDescription>
            Quick setup with predefined alert templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Critical Stock Alert", category: "Inventory" },
              { name: "High Value Purchase", category: "Purchase" },
              { name: "Payment Delay Alert", category: "Payments" },
              { name: "Leave Approval Pending", category: "HR" },
              { name: "GST Return Due", category: "GST" },
              { name: "Customer Follow-up", category: "CRM" },
            ].map((template, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <p className="text-foreground">{template.name}</p>
                <Badge variant="outline">{template.category}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => toast.success(`Template "${template.name}" applied`)}
                >
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

