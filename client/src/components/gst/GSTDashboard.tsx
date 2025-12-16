import { useState, useEffect } from "react";
import { ArrowRight, Calendar, AlertCircle, CheckCircle, Clock, TrendingUp, FileText, CreditCard, Wallet, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { gstService } from "../../services/modules.service";

interface GSTDashboardProps {
  onNavigate: (tab: string) => void;
}

interface GSTSummary {
  outputTax: number;
  inputTax: number;
  taxLiability: number;
  itcAvailable: number;
}

interface FilingStatus {
  return: string;
  period: string;
  dueDate: string;
  status: string;
  filedOn: string | null;
}

interface Deadline {
  return: string;
  period: string;
  dueDate: string;
  daysLeft: number;
}

interface Payment {
  challan: string;
  date: string;
  amount: number;
  type: string;
  status: string;
}

export function GSTDashboard({ onNavigate }: GSTDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState("");
  const [gstSummary, setGstSummary] = useState<GSTSummary>({
    outputTax: 0,
    inputTax: 0,
    taxLiability: 0,
    itcAvailable: 0,
  });
  const [filingStatus, setFilingStatus] = useState<FilingStatus[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await gstService.getDashboard();
        if (response.success && response.data) {
          const data = response.data;
          setCurrentMonth(data.currentMonth);
          setGstSummary(data.gstSummary);
          setFilingStatus(data.filingStatus);
          setUpcomingDeadlines(data.upcomingDeadlines);
          setRecentPayments(data.recentPayments || []);
        }
      } catch (error) {
        console.error("Failed to fetch GST dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case "filed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "overdue":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "filed":
        return <CheckCircle className="size-3" />;
      case "pending":
        return <Clock className="size-3" />;
      case "overdue":
        return <AlertCircle className="size-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Period Banner */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">Current Tax Period</p>
            <h2 className="text-3xl font-bold text-primary">{currentMonth}</h2>
          </div>
          <div className="bg-background p-3 rounded-xl shadow-sm border border-border/50">
            <Calendar className="size-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <TrendingUp className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Output Tax (Sales)</p>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{gstSummary.outputTax.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <Wallet className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Input Tax (Purchases)</p>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{gstSummary.inputTax.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <AlertCircle className="size-5 text-amber-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Tax Liability</p>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{gstSummary.taxLiability.toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-violet-50 p-2.5 rounded-lg">
              <CheckCircle className="size-5 text-violet-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">ITC Available</p>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{gstSummary.itcAvailable.toLocaleString("en-IN")}
          </h3>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Upcoming Deadlines
            </h3>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline, index) => (
              <div
                key={index}
                className="p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group bg-background/50"
                onClick={() => onNavigate(deadline.return.toLowerCase().replace("-", ""))}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{deadline.return}</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {deadline.daysLeft} days left
                    </Badge>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">
                    Period: <span className="text-foreground font-medium">{deadline.period}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Due: <span className="font-medium text-rose-600">{new Date(deadline.dueDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filing Status */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            Recent Filing Status
          </h3>
          <div className="space-y-3">
            {filingStatus.map((filing, index) => (
              <div key={index} className="p-4 border border-border/50 rounded-lg bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">{filing.return}</span>
                  <Badge
                    variant="outline"
                    className={cn("gap-1", getStatusColor(filing.status))}
                  >
                    {getStatusIcon(filing.status)}
                    {filing.status === "filed" ? "Filed" : "Pending"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-muted-foreground">Period: {filing.period}</p>
                  {filing.status === "filed" && filing.filedOn && (
                    <p className="text-muted-foreground">
                      Filed on: {new Date(filing.filedOn).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {filing.status === "pending" && (
                    <p className="text-muted-foreground">
                      Due: {new Date(filing.dueDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => onNavigate("gstr1")}
            >
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <FileText className="size-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">File GSTR-1</p>
                <p className="text-xs text-muted-foreground mt-0.5">Outward supplies</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => onNavigate("gstr3b")}
            >
              <div className="bg-emerald-50 p-2.5 rounded-lg">
                <FileText className="size-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">File GSTR-3B</p>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly return</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => onNavigate("itc")}
            >
              <div className="bg-amber-50 p-2.5 rounded-lg">
                <Wallet className="size-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">ITC Ledger</p>
                <p className="text-xs text-muted-foreground mt-0.5">Input tax credit</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
              onClick={() => onNavigate("payments")}
            >
              <div className="bg-violet-50 p-2.5 rounded-lg">
                <CreditCard className="size-5 text-violet-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Pay GST</p>
                <p className="text-xs text-muted-foreground mt-0.5">Make payment</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            Recent GST Payments
          </h3>
          <div className="space-y-3">
            {recentPayments.map((payment, index) => (
              <div key={index} className="p-4 border border-border/50 rounded-lg bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{payment.challan}</span>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
                  >
                    <CheckCircle className="size-3" />
                    Success
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">{payment.type}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {new Date(payment.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="font-bold text-emerald-600 text-lg">
                    ₹{payment.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-4 gap-2 text-primary hover:text-primary hover:bg-primary/5"
            onClick={() => onNavigate("payments")}
          >
            View All Payments
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
        <div className="flex gap-3">
          <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-900 font-medium mb-2">Important Reminders</h4>
            <ul className="space-y-1 text-amber-700 text-sm list-disc list-inside">
              <li>GSTR-1 for November 2024 is due on 11th December 2024</li>
              <li>GSTR-3B for November 2024 is due on 20th December 2024</li>
              <li>Ensure all invoices are properly recorded before filing</li>
              <li>Reconcile ITC claimed with GSTR-2B before filing GSTR-3B</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
