import { useState } from "react";
import { SettingsDashboard } from "./SettingsDashboard";
import { BusinessProfile } from "./BusinessProfile";
import { AppConfiguration } from "./AppConfiguration";
import { UserManagement } from "./UserManagement";
import { MyProfile } from "./MyProfile";
import { SecurityAudit } from "./SecurityAudit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Settings,
  Building2,
  Sliders,
  Users,
  UserCog,
  Shield,
} from "lucide-react";

type Tab = "dashboard" | "business" | "configuration" | "users" | "profile" | "security";

interface SettingsModuleProps {
  onBack?: () => void;
}

export function SettingsModule({ onBack }: SettingsModuleProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/50 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Settings & Configuration</h1>
            <p className="text-muted-foreground text-sm">
              Manage your business profile, users, and application settings
            </p>
          </div>
          <div className="bg-primary/10 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2 text-primary">
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">BharatFlow v1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="h-full flex flex-col">
          <div className="bg-card border-b border-border/50 px-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2 bg-muted/20 p-1 rounded-xl mb-8">
              <TabsTrigger
                value="dashboard"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="business"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Business Profile
              </TabsTrigger>
              <TabsTrigger
                value="app-config"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                App Config
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Users & Roles
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                My Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Security
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto bg-muted/10">
            <TabsContent value="dashboard" className="m-0 h-full">
              <SettingsDashboard onNavigate={(tab) => setActiveTab(tab as Tab)} />
            </TabsContent>

            <TabsContent value="business" className="m-0 h-full">
              <BusinessProfile />
            </TabsContent>

            <TabsContent value="configuration" className="m-0 h-full">
              <AppConfiguration />
            </TabsContent>

            <TabsContent value="users" className="m-0 h-full">
              <UserManagement />
            </TabsContent>

            <TabsContent value="profile" className="m-0 h-full">
              <MyProfile />
            </TabsContent>

            <TabsContent value="security" className="m-0 h-full">
              <SecurityAudit />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
