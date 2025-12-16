import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowRight,
  IndianRupee,
  AlertCircle,
  Landmark,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { bankingService } from "../../services/modules.service";

interface BankingDashboardProps {
  onNavigate: (tab: string) => void;
}

interface Account {
  id: string;
  name: string;
  number: string;
  balance: number;
  type: string;
  trend: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  accountName: string;
}

export function BankingDashboard({ onNavigate }: BankingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [accountBalances, setAccountBalances] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [overdueReminders, setOverdueReminders] = useState(0);
  const [cashFlow, setCashFlow] = useState({
    inflow: 0,
    outflow: 0,
    net: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await bankingService.getDashboard();

        if (response.success && response.data) {
          const { accounts, summary, recentTransactions: txns, overdueReminders: reminders } = response.data;

          setAccountBalances(accounts || []);
          setRecentTransactions(txns || []);
          setOverdueReminders(reminders || 0);

          // Calculate cash flow from transactions
          const inflow = (txns || [])
            .filter((t: Transaction) => t.type === 'credit')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
          const outflow = (txns || [])
            .filter((t: Transaction) => t.type === 'debit')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

          setCashFlow({
            inflow: inflow || summary?.bankBalance || 0,
            outflow: outflow || 0,
            net: summary?.totalBalance || (inflow - outflow),
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cash Flow Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <TrendingUp className="size-5 text-emerald-600" />
            </div>
            <p className="text-muted-foreground font-medium text-sm">Total Inflow (Nov)</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{cashFlow.inflow.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="size-3" />
            +12% vs last month
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-rose-50 p-2.5 rounded-lg">
              <TrendingDown className="size-5 text-rose-600" />
            </div>
            <p className="text-muted-foreground font-medium text-sm">Total Outflow (Nov)</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{cashFlow.outflow.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="size-3" />
            +5% vs last month
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <Wallet className="size-5 text-blue-600" />
            </div>
            <p className="text-muted-foreground font-medium text-sm">Net Cash Flow</p>
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            ₹{cashFlow.net.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Available for operations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balances */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              Account Balances
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("accounts")} className="gap-1 text-primary hover:text-primary hover:bg-primary/5">
              View All <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {accountBalances.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-full",
                    account.type === 'Credit' ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                  )}>
                    {account.type === 'Cash' ? <IndianRupee className="size-5" /> : <CreditCard className="size-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-semibold text-sm", account.balance < 0 ? "text-rose-600" : "text-foreground")}>
                    ₹{Math.abs(account.balance).toLocaleString("en-IN")} {account.balance < 0 ? "Dr" : "Cr"}
                  </p>
                  <p className="text-xs text-muted-foreground">Updated today</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Recent Transactions
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("transactions")} className="gap-1 text-primary hover:text-primary hover:bg-primary/5">
              View All <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/10 px-2 -mx-2 rounded-lg transition-colors">
                <div className="flex items-start gap-3">
                  <div className={cn("mt-1.5 size-2 rounded-full flex-shrink-0",
                    txn.type === 'credit' ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  <div>
                    <p className="font-medium text-foreground text-sm">{txn.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(txn.date).toLocaleDateString()} • {txn.accountName}</p>
                  </div>
                </div>
                <p className={cn("font-medium text-sm",
                  txn.type === 'credit' ? "text-emerald-600" : "text-foreground"
                )}>
                  {txn.type === 'credit' ? "+" : "-"}₹{txn.amount.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="size-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-900 font-medium mb-2">Pending Actions</h4>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              <li>Reconciliation pending for HDFC Current Account (last 5 days)</li>
              <li>3 cheques pending for clearance worth ₹45,000</li>
              <li>Loan EMI of ₹25,000 due on 28th Nov</li>
            </ul>
            <Button variant="outline" className="mt-4 bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900" onClick={() => onNavigate("reminders")}>
              View Reminders
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
          <h4 className="font-semibold text-foreground mb-4">Quick Actions</h4>
          <div className="space-y-2">
            <Button className="w-full justify-start hover:bg-muted/50" variant="outline" onClick={() => onNavigate("transactions")}>
              Add Expense / Income
            </Button>
            <Button className="w-full justify-start hover:bg-muted/50" variant="outline" onClick={() => onNavigate("accounts")}>
              Link New Bank Account
            </Button>
            <Button className="w-full justify-start hover:bg-muted/50" variant="outline" onClick={() => onNavigate("reconciliation")}>
              Start Reconciliation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
