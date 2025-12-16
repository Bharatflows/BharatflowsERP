import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { NotificationCenter } from "./NotificationCenter";
import { AlertRules } from "./AlertRules";
import { NotificationSettings } from "./NotificationSettings";

export function NotificationsModule() {
  const [activeTab, setActiveTab] = useState("center");

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-foreground mb-2">Notifications & Alerts</h1>
          <p className="text-muted-foreground">
            Stay updated with real-time alerts and business notifications
          </p>
        </div>

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
