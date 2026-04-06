import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { notificationsService, searchService } from "../services/modules.service";
import { CalendarDrawer } from "./calendar/CalendarDrawer";
import { cn } from "../lib/utils";
import { CompanySelector } from "./CompanySelector";

import {
  Bell, User, LogOut,
  ChevronDown, ChevronLeft, Search, Moon, Sun, Menu
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent
} from "./ui/sheet";

interface DashboardHeaderProps {
  onOpenCommandPalette?: () => void;
  isMobile?: boolean;
  onMenuClick?: () => void;
  hideMenuButton?: boolean;
}

export function DashboardHeader({ onOpenCommandPalette, isMobile, onMenuClick, hideMenuButton }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationsService.getAll({ limit: 10 });
        const data = (response.data as any)?.notifications || response.data;
        const notifs = Array.isArray(data) ? data : [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: any) => !n.read).length);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    if (notificationDrawerOpen) {
      fetchNotifications();
    }
    // Initial fetch
    fetchNotifications();
  }, [notificationDrawerOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchFocused) {
        searchRef.current?.blur();
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSearchFocused]);

  // Handle Search Logic (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const response = await searchService.globalSearch(searchQuery);
          if (response.success) {
            setSearchResults(response.data || []);
            setShowResults(true);
          }
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <header
        className={cn(
          "h-full flex items-center justify-between w-full",
          "bg-transparent"
        )}
      >
        {/* LEFT ZONE */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Mobile Menu Button */}
          {isMobile && !hideMenuButton && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
              <Menu className="size-6 text-foreground" />
            </Button>
          )}

          {/* Universal Company Selector */}
          <CompanySelector />
        </div>

        {/* CENTER ZONE - Command Center */}
        <div className="flex-1 max-w-2xl px-8 hidden md:block">
          <div
            className={cn(
              "flex items-center w-full h-11 rounded-xl px-4 gap-3 transition-all duration-300",
              "bg-muted/40 border border-transparent",
              isSearchFocused && "bg-background border-primary shadow-sm ring-1 ring-primary/20"
            )}
            onClick={() => searchRef.current?.focus()}
          >
            <Search className={cn("size-4 shrink-0 transition-colors", isSearchFocused ? "text-primary" : "text-muted-foreground")} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search everything... (Press '/')"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  setIsSearchFocused(false);
                  setShowResults(false);
                }, 200);
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Global Search"
            />
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-muted text-2xs font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-14 left-0 right-0 mx-auto max-w-2xl w-full bg-popover rounded-xl shadow-lg border border-border overflow-hidden z-toast">
                <div className="p-4 text-sm text-muted-foreground">Showing results...</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT ZONE - Action Tray */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => setNotificationDrawerOpen(true)}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full" />
            )}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
          >
            {resolvedTheme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 rounded-full hover:bg-muted transition-colors outline-none">
                <div className="size-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-background">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden xl:block text-left pr-2">
                  <p className="text-sm font-semibold leading-none">{user?.name?.split(' ')[0]}</p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground hidden xl:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <User className="size-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="size-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Notifications Sheet */}
      <Sheet open={notificationDrawerOpen} onOpenChange={setNotificationDrawerOpen}>
        <SheetContent side="right" className="min-w-[100vw] sm:min-w-[550px] lg:min-w-[600px] p-0 overflow-hidden flex flex-col [&>button]:hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border">
            <Button variant="ghost" size="icon" onClick={() => setNotificationDrawerOpen(false)} className="rounded-full hover:bg-muted size-9">
              <ChevronLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-brand-primary" />
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Calendar Drawer (Now uses its own internal Sheet or we pass a prop if needed,
          but based on previous file, CalendarDrawer manages its own rendering if isOpen is true,
          we just need to update CalendarDrawer to use Sheet as well.
          Here we just keep the component usage consistent.)
      */}
      <CalendarDrawer
        isOpen={calendarDrawerOpen}
        onClose={() => setCalendarDrawerOpen(false)}
      />
    </>
  );
}
