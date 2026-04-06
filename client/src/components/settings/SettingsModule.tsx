/**
 * Settings Module - Redesigned
 * 
 * Modern two-column layout with grouped sidebar navigation
 * based on reference design.
 */

import { useState } from "react";
import { SettingsSidebar, SETTINGS_NAV, type SettingsPage } from "./SettingsSidebar";
import { GeneralSettings } from "./GeneralSettings";
import { BusinessProfile } from "./BusinessProfile";
import { AppConfiguration } from "./AppConfiguration";
import { UserManagement } from "./UserManagement";
import { MyProfile } from "./MyProfile";
import { SecurityAudit } from "./SecurityAudit";
import { DataIntegrityDashboard } from "./DataIntegrityDashboard";
import { BranchSettings } from "./BranchSettings";
import { FinancialYearSettings } from "./FinancialYearSettings";
import { ApprovalQueue } from "./ApprovalQueue";
import { SubscriptionPlans } from "./SubscriptionPlans";
import { PaymentGatewaySettings } from "./PaymentGatewaySettings";
import { DocumentNumberSettings } from "./DocumentNumberSettings";
import { Settings, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";

interface SettingsModuleProps {
  onBack?: () => void;
}

// Page titles for breadcrumb
const PAGE_TITLES: Record<SettingsPage, string> = {
  profile: "My Profile",
  general: "General",
  notifications: "Notifications",
  business: "Business Profile",
  branches: "Branches",
  financialyear: "Financial Year",
  appconfig: "App Settings",
  docnumbers: "Document Numbers",
  approvals: "Approvals",
  users: "Users & Roles",
  security: "Audit Logs",
  integrity: "Data Integrity",
  subscription: "Subscription",
  payments: "Payment Gateways",
};

export default function SettingsModule({ onBack }: SettingsModuleProps) {
  const [activePage, setActivePage] = useState<SettingsPage>("general");

  const renderContent = () => {
    switch (activePage) {
      case "profile":
        return <MyProfile />;
      case "general":
      case "notifications":
        return <GeneralSettings />;
      case "business":
        return <BusinessProfile />;
      case "branches":
        return <BranchSettings />;
      case "financialyear":
        return <FinancialYearSettings />;
      case "appconfig":
        return <AppConfiguration />;
      case "docnumbers":
        return <DocumentNumberSettings />;
      case "approvals":
        return <ApprovalQueue />;
      case "users":
        return <UserManagement />;
      case "security":
        return <SecurityAudit />;
      case "integrity":
        return <DataIntegrityDashboard />;
      case "subscription":
        return <SubscriptionPlans />;
      case "payments":
        return <PaymentGatewaySettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Breadcrumb */}
      <div className="px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Settings</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{PAGE_TITLES[activePage]}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation - Desktop */}
        <div className="hidden md:block">
          <SettingsSidebar activePage={activePage} onNavigate={setActivePage} />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden p-4 border-b bg-muted/20">
          <select
            value={activePage}
            onChange={(e) => setActivePage(e.target.value as SettingsPage)}
            className="w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm"
          >
            {SETTINGS_NAV.flatMap((category) => [
              <optgroup key={category.id} label={category.label}>
                {category.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>,
            ])}
          </select>
        </div>

        {/* Main Content */}
        <ScrollArea className="flex-1">
          <main className="p-6 md:p-8">
            {renderContent()}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}

// Named export for compatibility
export { SettingsModule };
