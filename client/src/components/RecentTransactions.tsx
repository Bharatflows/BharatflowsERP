import { ArrowUpRight, ArrowDownRight, Eye, Download } from "lucide-react";
import { SmartCard } from "@/components/ui/SmartCard";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

interface Transaction {
  id: string;
  type: "sale" | "purchase" | "payment-in" | "payment-out";
  invoiceNumber: string;
  partyName: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue" | "partial";
}

import { useState, useEffect } from "react";
import { dashboardService } from "../services/modules.service";
import { Loader2 } from "lucide-react";

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response: any = await (dashboardService as any).getRecentTransactions();
        const data = response.data || response;
        setTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch recent transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const statusConfig = {
    paid: { label: "Paid", color: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
    pending: { label: "Pending", color: "bg-amber-100/50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    overdue: { label: "Overdue", color: "bg-rose-100/50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
    partial: { label: "Partial", color: "bg-blue-100/50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  };

  const typeConfig = {
    sale: { icon: ArrowUpRight, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    purchase: { icon: ArrowDownRight, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
    "payment-in": { icon: ArrowUpRight, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    "payment-out": { icon: ArrowDownRight, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
  };

  if (loading) {
    return (
      <SmartCard title="Recent Transactions">
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary-600" />
        </div>
      </SmartCard>
    );
  }

  return (
    <SmartCard
      title="Recent Transactions"
      action={
        <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium h-8">
          View All
        </Button>
      }
    >
      <div className="space-y-3">
        {transactions.length > 0 ? (
          transactions.map((transaction) => {
            const typeStyle = typeConfig[transaction.type] || typeConfig.sale;
            const TypeIcon = typeStyle.icon;
            const status = statusConfig[transaction.status] || statusConfig.pending;

            return (
              <div
                key={transaction.id}
                className="group flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-border-light dark:hover:border-slate-700 hover:bg-background-light dark:hover:bg-muted/50 transition-all duration-200 cursor-default"
              >
                {/* Icon */}
                <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", typeStyle.bg)}>
                  <TypeIcon className={cn("size-5", typeStyle.color)} />
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <p className="text-base font-semibold text-text-main-light dark:text-white truncate">
                      {transaction.partyName}
                    </p>
                    <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full border", status.color)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted-light dark:text-muted-foreground">
                    <span className="font-mono text-xs bg-muted px-1.5 rounded">{transaction.invoiceNumber}</span>
                    <span>•</span>
                    <span>{new Date(transaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="text-right">
                    <p className={cn(
                      "text-base font-bold tabular-nums",
                      transaction.type === "sale" || transaction.type === "payment-in"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-text-main-light dark:text-white"
                    )}>
                      {transaction.type === "sale" || transaction.type === "payment-in" ? "+" : "-"}
                      ₹{Number(transaction.amount).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-white dark:hover:bg-muted hover:shadow-sm">
                      <Eye className="size-4 text-text-muted-light dark:text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-white dark:hover:bg-muted hover:shadow-sm">
                      <Download className="size-4 text-text-muted-light dark:text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-background-light dark:bg-white/5 rounded-2xl border border-dashed border-border-light dark:border-white/10">
            <p className="text-text-muted-light text-sm">No recent transactions found.</p>
          </div>
        )}
      </div>
    </SmartCard>
  );
}