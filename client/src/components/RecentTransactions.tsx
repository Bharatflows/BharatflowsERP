import { ArrowUpRight, ArrowDownRight, Eye, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
        const response = await dashboardService.getRecentTransactions();
        const data = response.data;
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
    paid: { label: "Paid", color: "bg-success-light text-success" },
    pending: { label: "Pending", color: "bg-warning-light text-warning" },
    overdue: { label: "Overdue", color: "bg-error-light text-error" },
    partial: { label: "Partial", color: "bg-info-light text-info" },
  };

  const typeConfig = {
    sale: { icon: ArrowUpRight, color: "text-success" },
    purchase: { icon: ArrowDownRight, color: "text-error" },
    "payment-in": { icon: ArrowUpRight, color: "text-success" },
    "payment-out": { icon: ArrowDownRight, color: "text-error" },
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((transaction) => {
              const TypeIcon = typeConfig[transaction.type]?.icon || ArrowUpRight;
              const status = statusConfig[transaction.status] || statusConfig.pending;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                >
                  {/* Icon */}
                  <div className={cn(
                    "p-2 rounded-lg",
                    transaction.type === "sale" || transaction.type === "payment-in"
                      ? "bg-success-light"
                      : "bg-error-light"
                  )}>
                    <TypeIcon
                      className={cn("size-5", typeConfig[transaction.type]?.color || "text-muted-foreground")}
                    />
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-foreground truncate">
                        {transaction.partyName}
                      </p>
                      <Badge className={cn("shrink-0", status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{transaction.invoiceNumber}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className={cn(
                      "font-medium",
                      transaction.type === "sale" || transaction.type === "payment-in"
                        ? "text-success"
                        : "text-error"
                    )}>
                      {transaction.type === "sale" || transaction.type === "payment-in" ? "+" : "-"}
                      ₹{Number(transaction.amount).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-8">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8">
                      <Download className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent transactions</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}