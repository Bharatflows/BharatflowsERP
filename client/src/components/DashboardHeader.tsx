import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { partiesService, productsService, notificationsService } from "../services/modules.service";
import { salesService } from "../services/sales.service";
import { useSafeErrorLog } from "../contexts/ErrorLogContext";

import {
  Search, Bell, User, LogOut, Settings, Building,
  ArrowLeft, X, FileText, Package, Users, Receipt,
  TrendingUp, Bug, Trash2, XCircle
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { errors, clearErrors } = useSafeErrorLog();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock data for search


  // Get company data from user context
  const companyData = user?.company || {
    id: '',
    businessName: 'My Business',
    gstin: 'Not Set',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: ''
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationsService.getAll({ limit: 5 });
        const data = (response.data as any)?.notifications || response.data;
        const notifs = Array.isArray(data) ? data : [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: any) => !n.read).length);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  // Determine if we should show back button
  const showBackButton = location.pathname !== '/dashboard';

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        try {
          const query = searchQuery.toLowerCase();
          const results: any[] = [];

          // Parallel API calls for search
          const [invoicesRes, partiesRes, productsRes] = await Promise.allSettled([
            salesService.getInvoices({ search: query, limit: 5 }),
            partiesService.getAll({ search: query, limit: 5 }),
            productsService.getAll({ search: query, limit: 5 })
          ]);

          // Process Invoices
          if (invoicesRes.status === 'fulfilled' && invoicesRes.value) {
            const invoicesData = invoicesRes.value as any;
            const invoices = Array.isArray(invoicesData.data)
              ? invoicesData.data
              : Array.isArray(invoicesData) ? invoicesData : [];

            invoices.forEach((inv: any) => {
              results.push({
                type: 'invoice',
                id: inv.id,
                number: inv.invoiceNumber,
                customer: inv.customer?.name || 'Unknown',
                amount: inv.totalAmount
              });
            });
          }

          // Process Parties
          if (partiesRes.status === 'fulfilled' && partiesRes.value.data) {
            const parties = Array.isArray(partiesRes.value.data)
              ? partiesRes.value.data
              : (partiesRes.value.data as any).parties || [];

            parties.forEach((party: any) => {
              results.push({
                type: 'party',
                id: party.id,
                name: party.name,
                gstin: party.gstin,
                balance: party.currentBalance
              });
            });
          }

          // Process Products
          if (productsRes.status === 'fulfilled' && productsRes.value.data) {
            const products = Array.isArray(productsRes.value.data)
              ? productsRes.value.data
              : (productsRes.value.data as any).products || [];

            products.forEach((prod: any) => {
              results.push({
                type: 'product',
                id: prod.id,
                name: prod.name,
                code: prod.code,
                stock: prod.currentStock
              });
            });
          }

          setSearchResults(results);
          setShowSearchResults(true);
        } catch (error) {
          console.error("Search failed:", error);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="size-4 text-blue-600" />;
      case 'product': return <Package className="size-4 text-green-600" />;
      case 'party': return <Users className="size-4 text-purple-600" />;
      case 'expense': return <Receipt className="size-4 text-orange-600" />;
      default: return <Search className="size-4" />;
    }
  };

  const handleResultClick = (result: any) => {
    setShowSearchResults(false);
    setSearchQuery('');

    // Navigate based on type
    switch (result.type) {
      case 'invoice':
        navigate(`/sales/invoices/${result.id}`);
        break;
      case 'product':
        navigate(`/inventory/products/${result.id}`);
        break;
      case 'party':
        navigate(`/parties/${result.id}`);
        break;
      case 'expense':
        navigate(`/expenses/${result.id}`);
        break;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <header className="h-16 bg-card border-b border-border px-4 flex items-center justify-between sticky top-0 z-50">
      {/* Left Section - Logo + Back Button */}
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="size-9 p-0 text-muted-foreground hover:text-foreground"
            title="Go back"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="size-5 text-primary" />
          </div>
          <span className="hidden md:block font-semibold text-foreground">BharatFlow</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl mx-4 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search invoices, products, parties... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            className="pl-10 pr-10 h-10 bg-muted/50 border-transparent focus:bg-card focus:border-primary/20 transition-all rounded-lg"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto shadow-lg border-border z-50 rounded-lg">
            {searchResults.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleResultClick(result)}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                  >
                    {getResultIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-foreground truncate">
                          {result.number || result.name || result.category}
                        </p>
                        <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0 h-5">
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {result.customer || result.code || result.gstin || result.date}
                      </p>
                      {(result.amount || result.stock || result.balance) && (
                        <p className="text-xs font-medium text-primary mt-1">
                          {result.amount && `₹${result.amount.toLocaleString('en-IN')}`}
                          {result.stock && `Stock: ${result.stock}`}
                          {result.balance && `Balance: ₹${result.balance.toLocaleString('en-IN')}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching for invoices, products, or parties</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Right Section - Notifications & User */}
      <div className="flex items-center gap-2">
        {/* Error Log Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="relative size-9 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary">
              <Bug className={`size-5 ${errors.length > 0 ? 'text-destructive' : ''}`} />
              {errors.length > 0 && (
                <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full border-2 border-card" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center justify-between">
                <span>Console Errors ({errors.length})</span>
                <Button variant="outline" size="sm" onClick={clearErrors} disabled={errors.length === 0}>
                  <Trash2 className="size-4 mr-2" /> Clear
                </Button>
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              {errors.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bug className="size-12 mx-auto mb-2 opacity-20" />
                  <p>No errors captured yet.</p>
                </div>
              ) : (
                errors.map(err => (
                  <div key={err.id} className="p-3 rounded-lg border bg-destructive/5 border-destructive/20 text-sm">
                    <div className="flex items-start gap-2">
                      <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium text-destructive truncate">{err.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{err.source}</p>
                        {err.stack && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">View Stack</summary>
                            <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto whitespace-pre-wrap">
                              {err.stack}
                            </pre>
                          </details>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2 text-right">
                          {new Date(err.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative size-9 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full border-2 border-card" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-lg shadow-lg border-border">
            <DropdownMenuLabel className="flex items-center justify-between p-4 pb-2">
              <span className="font-semibold">Notifications</span>
              <button className="text-xs text-primary hover:underline font-medium">
                Mark all read
              </button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-secondary"
                  onClick={() => navigate('/notifications')}
                >
                  <div className="flex items-start justify-between w-full">
                    <p className="font-medium text-sm text-foreground">{notification.title}</p>
                    {notification.unread && (
                      <div className="size-2 bg-primary rounded-full mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                  <span className="text-[10px] text-muted-foreground mt-1">{notification.time}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="justify-center text-primary cursor-pointer text-sm font-medium py-3 focus:bg-secondary"
              onClick={() => navigate('/notifications')}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-9 px-2 hover:bg-secondary">
              <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/10">
                <User className="size-4 text-primary" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium text-foreground leading-none">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground leading-none mt-1">{companyData.businessName}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-lg shadow-lg border-border">
            <DropdownMenuLabel className="p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-4 py-2 uppercase tracking-wider">
              Business Profile
            </DropdownMenuLabel>
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 text-sm">
                <Building className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{companyData.businessName}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6 mt-0.5">GSTIN: {companyData.gstin}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer py-2.5 focus:bg-secondary"
              onClick={() => navigate('/settings')}
            >
              <User className="mr-2 size-4 text-muted-foreground" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2.5 focus:bg-secondary"
              onClick={() => navigate('/settings')}
            >
              <Building className="mr-2 size-4 text-muted-foreground" />
              Business Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2.5 focus:bg-secondary"
              onClick={() => navigate('/settings')}
            >
              <Settings className="mr-2 size-4 text-muted-foreground" />
              App Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer py-2.5 focus:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

