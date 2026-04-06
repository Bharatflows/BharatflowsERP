import { useState } from "react";

import { cn } from "../lib/utils";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { hasPermission } from "../lib/permissions";

interface NavItem {
  id: string;
  label: string;
  iconName: string;
  badge?: number;
}

interface DashboardSidebarProps {
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
  onLogout: () => void;
}

const mainNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", iconName: "space_dashboard" },
  { id: "sales", label: "Sales", iconName: "request_quote" },
  { id: "purchase", label: "Purchase", iconName: "shopping_cart" },
  { id: "expenses", label: "Expenses", iconName: "account_balance_wallet" },
  { id: "inventory", label: "Inventory", iconName: "inventory_2" },
  { id: "parties", label: "Parties", iconName: "groups" },
  { id: "hr", label: "HR & Payroll", iconName: "manage_accounts" },
  { id: "crm", label: "CRM", iconName: "track_changes" },
  { id: "production", label: "Production", iconName: "factory" },
  { id: "barcode", label: "Barcode", iconName: "qr_code_scanner" },
  { id: "documents", label: "Documents", iconName: "folder_open" },
  { id: "banking", label: "Banking", iconName: "account_balance" },
  { id: "gst", label: "GST", iconName: "currency_rupee" },
  { id: "analytics", label: "Analytics", iconName: "trending_up" },
  { id: "reports", label: "Reports", iconName: "bar_chart" },
  { id: "accounting", label: "Accounting", iconName: "menu_book" },
];

const bottomNavItems: NavItem[] = [
  { id: "notifications", label: "Notifications", iconName: "notifications", badge: 8 },
  // NOTE: Messages module hidden for launch - uncomment when ready
  // { id: "messages", label: "Messages", iconName: "chat", badge: 3 },
  { id: "settings", label: "Settings", iconName: "settings" },
];

export function DashboardSidebar({ activeModule, onModuleChange, onLogout }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const MIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={cn("material-icons-outlined", className)} style={{ fontSize: '24px' }}>
      {name}
    </span>
  );

  return (
    <div
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-[72px]" : "w-[256px]"
      )}
    >
      {/* Header */}
      <div className="p-[16px] flex items-center justify-between h-[64px]">
        {!isCollapsed && (
          <div className="flex items-center gap-[12px] cursor-pointer" onClick={() => onModuleChange("dashboard")}>
            <div className="bg-primary/10 p-[8px] rounded-[8px] shadow-sm flex items-center justify-center">
              <MIcon name="bolt" className="text-primary text-[20px]" />
            </div>
            <div>
              <h2 className="text-body font-bold text-foreground leading-tight">BharatFlow</h2>
              <p className="text-caption text-muted-foreground mt-[2px]">MSME OS</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="bg-primary/10 p-[8px] rounded-[8px] shadow-sm flex items-center justify-center mx-auto cursor-pointer" onClick={() => onModuleChange("dashboard")}>
            <MIcon name="bolt" className="text-primary text-[20px]" />
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-[16px] py-[16px] space-y-[8px] overflow-y-auto no-scrollbar">
        {mainNavItems.filter(item => hasPermission(user as any, item.id)).map((item) => {
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "w-full flex items-center gap-[12px] px-[12px] h-[48px] rounded-[8px] transition-all duration-200 text-body font-medium relative group",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-slate-100",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Active Indicator Line (Left) */}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[24px] bg-primary rounded-r-[4px]" />
              )}

              <MIcon name={item.iconName} className={cn("shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground dark:group-hover:text-muted-foreground")} />

              {!isCollapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <div className="bg-primary/10 text-primary text-[10px] font-bold px-[6px] py-[2px] rounded-[16px] flex items-center justify-center">
                  {item.badge}
                </div>
              )}

              {/* Collapsed Badge Indicator */}
              {isCollapsed && item.badge && (
                <div className="absolute top-[8px] right-[8px] size-[8px] bg-primary rounded-full border-2 border-sidebar" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Area */}
      <div className="p-[16px] space-y-[16px]">
        {/* Bottom Navigation Items */}
        <div className="space-y-[8px]">
          {bottomNavItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={item.id === 'settings' ? () => onModuleChange('settings') : undefined}
                className={cn(
                  "w-full flex items-center gap-[12px] px-[12px] h-[48px] rounded-[8px] transition-all duration-200 text-body font-medium relative group",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-slate-100",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <MIcon name={item.iconName} className={cn("shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground dark:group-hover:text-muted-foreground")} />
                {!isCollapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <div className="bg-primary/10 text-primary text-[10px] font-bold px-[6px] py-[2px] rounded-[16px] flex items-center justify-center">
                    {item.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Separator className="bg-slate-200 dark:bg-card" />

        {/* Bottom Actions */}
        <div className="space-y-[8px]">
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full flex items-center gap-[12px] px-[12px] h-[48px] rounded-[8px] transition-all duration-200 text-body font-medium text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-slate-100",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <MIcon name={isCollapsed ? "last_page" : "first_page"} className="shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left">Collapse</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-[12px] px-[12px] h-[48px] rounded-[8px] transition-all duration-200 text-body font-medium",
              "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <MIcon name="logout" className="shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}