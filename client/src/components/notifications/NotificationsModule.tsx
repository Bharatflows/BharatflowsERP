import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { NotificationCenter } from "./NotificationCenter";
import { AlertRules } from "./AlertRules";
import { NotificationSettings } from "./NotificationSettings";
import { ModuleHeader } from "../ui/module-header";
import { Bell } from "lucide-react";

export function NotificationsModule() {
  const [activeTab, setActiveTab] = useState("center");

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-4 md:p-6">
        <ModuleHeader
          title="Notifications & Alerts"
          description="Stay updated with real-time alerts and business notifications"
          showBackButton={true}
          backTo="/dashboard"
          icon={<Bell className="size-5 text-primary" />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="center">Notification Center</TabsTrigger>
              <TabsTrigger value="rules">Alert Rules</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="center" className="mt-6">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <AlertRules />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
