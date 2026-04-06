import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { bankingService } from "../../services/modules.service";

interface Reminder {
  id: string;
  partyName: string;
  amount: number;
  dueDate: string;
  type: "receivable" | "payable";
  status: "overdue" | "upcoming" | "paid";
  description: string;
  lastReminded?: string;
}

export function PaymentReminders() {
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const fetchReminders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params: { type?: string; status?: string } = {};
      if (activeTab !== "all") {
        params.type = activeTab;
      }
      const response = await bankingService.getReminders(params);
      if (response.data) {
        setReminders(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch payment reminders:", error);
      toast.error("Failed to load payment reminders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [activeTab]);

  const filteredReminders = reminders.filter((r) => {
    if (activeTab === "all") return true;
    return r.type === activeTab;
  });

  const totalReceivables = reminders
    .filter((r) => r.type === "receivable" && r.status !== "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPayables = reminders
    .filter((r) => r.type === "payable" && r.status !== "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const overdueCount = reminders.filter(r => r.status === 'overdue').length;
  const receivableCount = reminders.filter(r => r.type === 'receivable' && r.status !== 'paid').length;
  const payableCount = reminders.filter(r => r.type === 'payable' && r.status !== 'paid').length;

  const handleSendReminder = async (id: string, partyName: string) => {
    setSendingReminder(id);
    try {
      await bankingService.sendReminder(id);
      toast.success(`Reminder sent to ${partyName}`);
      fetchReminders(true);
    } catch (error) {
      console.error("Failed to send reminder:", error);
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setMarkingPaid(id);
    try {
      await bankingService.updateReminder(id, { status: "paid" });
      toast.success("Marked as paid");
      fetchReminders(true);
    } catch (error) {
      console.error("Failed to mark as paid:", error);
      toast.error("Failed to mark as paid");
    } finally {
      setMarkingPaid(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Bell className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Payment Reminders</h2>
              <p className="text-muted-foreground text-sm">
                Track and manage your receivables and payables
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReminders(true)}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Total Receivables</p>
              <h3 className="text-2xl font-bold text-emerald-600">₹{totalReceivables.toLocaleString("en-IN")}</h3>
              <p className="text-xs text-muted-foreground mt-1">{receivableCount} invoice(s) pending</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl">
              <TrendingUp className="size-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Total Payables</p>
              <h3 className="text-2xl font-bold text-rose-600">₹{totalPayables.toLocaleString("en-IN")}</h3>
              <p className="text-xs text-muted-foreground mt-1">{payableCount} bill(s) due</p>
            </div>
            <div className="bg-rose-50 p-3 rounded-xl">
              <TrendingDown className="size-6 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Overdue Items</p>
              <h3 className="text-2xl font-bold text-amber-600">{overdueCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl">
              <AlertCircle className="size-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center">
              <TabsList className="bg-background">
                <TabsTrigger value="all" className="gap-2">
                  <IndianRupee className="size-4" />
                  All Reminders
                </TabsTrigger>
                <TabsTrigger value="receivable" className="gap-2">
                  <TrendingUp className="size-4" />
                  Receivables
                </TabsTrigger>
                <TabsTrigger value="payable" className="gap-2">
                  <TrendingDown className="size-4" />
                  Payables
                </TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Calendar className="size-4" />
                View Calendar
              </Button>
            </div>
          </Tabs>
        </div>

        <div className="divide-y divide-border/50">
          {filteredReminders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-muted/30 p-4 rounded-full inline-block mb-4">
                <Bell className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-foreground font-medium mb-2">No reminders found</h3>
              <p className="text-muted-foreground text-sm mb-4">All caught up! No pending payments.</p>
            </div>
          ) : (
            filteredReminders.map((reminder) => (
              <div key={reminder.id} className="p-5 hover:bg-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn("mt-1 p-2.5 rounded-xl flex-shrink-0",
                    reminder.type === 'receivable' ? "bg-emerald-50" : "bg-rose-50"
                  )}>
                    {reminder.type === 'receivable' ? (
                      <TrendingUp className="size-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="size-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{reminder.partyName}</h4>
                      <Badge variant="outline" className={cn(
                        "gap-1",
                        reminder.status === 'overdue'
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : reminder.status === 'paid'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {reminder.status === 'overdue' ? (
                          <>
                            <AlertCircle className="size-3" />
                            Overdue
                          </>
                        ) : reminder.status === 'paid' ? (
                          <>
                            <CheckCircle className="size-3" />
                            Paid
                          </>
                        ) : (
                          <>
                            <Clock className="size-3" />
                            Due: {new Date(reminder.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{reminder.description || "Payment reminder"}</p>
                    {reminder.lastReminded && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                        <Bell className="size-3" />
                        Last reminded: {new Date(reminder.lastReminded).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={cn("font-bold text-lg",
                      reminder.type === 'receivable' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      ₹{reminder.amount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{reminder.type}</p>
                  </div>

                  {reminder.status !== 'paid' && (
                    <div className="flex gap-2">
                      {reminder.type === 'receivable' ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 h-9"
                            onClick={() => handleSendReminder(reminder.id, reminder.partyName)}
                            disabled={sendingReminder === reminder.id}
                          >
                            {sendingReminder === reminder.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Mail className="size-4" />
                            )}
                            <span className="hidden md:inline">Remind</span>
                          </Button>
                          <Button
                            size="sm"
                            className="gap-2 h-9 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleMarkPaid(reminder.id)}
                            disabled={markingPaid === reminder.id}
                          >
                            {markingPaid === reminder.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <CheckCircle className="size-4" />
                            )}
                            <span className="hidden md:inline">Received</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-2 h-9"
                          onClick={() => handleMarkPaid(reminder.id)}
                          disabled={markingPaid === reminder.id}
                        >
                          {markingPaid === reminder.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle className="size-4" />
                          )}
                          <span className="hidden md:inline">Mark Paid</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-900 font-medium mb-2">Payment Tips</h4>
            <ul className="space-y-1 text-blue-700 text-sm list-disc list-inside">
              <li>Send gentle reminders 3-5 days before the due date</li>
              <li>Follow up on overdue payments within 24-48 hours</li>
              <li>Maintain good relationships by offering flexible payment options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
