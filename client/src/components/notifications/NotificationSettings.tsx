import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { toast } from "sonner";

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inapp">In-App Notifications</Label>
                <p className="text-muted-foreground">
                  Show notifications within the application
                </p>
              </div>
              <Switch id="inapp" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email">Email Notifications</Label>
                <p className="text-muted-foreground">
                  Receive alerts via email
                </p>
              </div>
              <Switch id="email" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms">SMS Notifications</Label>
                <p className="text-muted-foreground">
                  Receive critical alerts via SMS
                </p>
              </div>
              <Switch id="sms" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound">Sound Alerts</Label>
                <p className="text-muted-foreground">
                  Play sound for notifications
                </p>
              </div>
              <Switch id="sound" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Update your contact details for notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notifEmail">Email Address</Label>
            <Input
              id="notifEmail"
              type="email"
              placeholder="your@email.com"
              defaultValue="admin@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notifPhone">Phone Number</Label>
            <Input
              id="notifPhone"
              placeholder="+91 98765 43210"
              defaultValue="+91 98765 43210"
            />
          </div>

          <Button onClick={() => toast.success("Contact information updated")}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Category Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Category Preferences</CardTitle>
          <CardDescription>
            Enable or disable notifications by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: "inventory", label: "Inventory Alerts", desc: "Stock levels, reorder alerts" },
              { id: "sales", label: "Sales Notifications", desc: "New orders, invoice updates" },
              { id: "payments", label: "Payment Alerts", desc: "Received payments, overdue invoices" },
              { id: "gst", label: "GST Reminders", desc: "Filing deadlines, compliance alerts" },
              { id: "hr", label: "HR Notifications", desc: "Leave requests, payroll reminders" },
              { id: "crm", label: "CRM Updates", desc: "Follow-ups, lead activities" },
            ].map((category) => (
              <div key={category.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={category.id}>{category.label}</Label>
                    <p className="text-muted-foreground">{category.desc}</p>
                  </div>
                  <Switch id={category.id} defaultChecked />
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set hours when you don't want to be disturbed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Label htmlFor="quietHours">Enable Quiet Hours</Label>
            <Switch id="quietHours" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietStart">Start Time</Label>
              <Input id="quietStart" type="time" defaultValue="22:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietEnd">End Time</Label>
              <Input id="quietEnd" type="time" defaultValue="08:00" />
            </div>
          </div>

          <p className="text-muted-foreground">
            Only critical alerts will be shown during quiet hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

