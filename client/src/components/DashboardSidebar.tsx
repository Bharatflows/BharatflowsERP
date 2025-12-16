import { useState } from "react";
import {
  Zap,
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  IndianRupee,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  TrendingUp,
  CreditCard,
  UserCog,
  Target,
  Scan,
  Bell,
  Factory,
  FolderOpen,
  Moon,
  Sun,
  BookOpen
} from "lucide-react";
import { cn } from "../lib/utils";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { hasPermission } from "../lib/permissions";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DashboardSidebarProps {
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
  onLogout: () => void;
}

const mainNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales", icon: FileText },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "expenses", label: "Expenses", icon: CreditCard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "parties", label: "Parties", icon: Users },
  { id: "hr", label: "HR & Payroll", icon: UserCog },
  { id: "crm", label: "CRM", icon: Target },
  { id: "production", label: "Production", icon: Factory },
  { id: "barcode", label: "Barcode", icon: Scan },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "gst", label: "GST", icon: IndianRupee },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "accounting", label: "Accounting", icon: BookOpen },
];

const bottomNavItems: NavItem[] = [
  { id: "notifications", label: "Notifications", icon: Bell, badge: 8 },
  // NOTE: Messages module hidden for launch - uncomment when ready
  // { id: "messages", label: "Messages", icon: MessageSquare, badge: 3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar({ activeModule, onModuleChange, onLogout }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between h-16 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-sm">
              <Zap className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground">BharatFlow</h2>
              <p className="text-xs text-muted-foreground">MSME OS</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-sm mx-auto">
            <Zap className="size-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.filter(item => hasPermission(user as any, item.id)).map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("size-5 flex-shrink-0 transition-colors", isActive ? "text-primary" : "")} />
              {!isCollapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Bottom Navigation */}
      <div className="px-3 py-4 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("size-5 flex-shrink-0", isActive ? "text-primary" : "")} />
              {!isCollapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {item.badge && (
                <span className={cn(
                  "bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full",
                  isCollapsed && "absolute -top-1 -right-1 size-4 flex items-center justify-center p-0 text-[10px]"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
            "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="size-5 flex-shrink-0" />
          ) : (
            <Moon className="size-5 flex-shrink-0" />
          )}
          {!isCollapsed && (
            <span className="flex-1 text-left">
              {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-2"
          )}
        >
          {isCollapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          {!isCollapsed && <span className="flex-1 text-left">Collapse</span>}
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
            "text-destructive hover:bg-destructive/10",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="size-5 flex-shrink-0" />
          {!isCollapsed && <span className="flex-1 text-left">Logout</span>}
        </button>
      </div>
    </div>
  );
}