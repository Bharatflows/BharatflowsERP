import { useState } from "react";
import { BankingDashboard } from "./BankingDashboard";
import { BankAccounts } from "./BankAccounts";
import { TransactionList } from "./TransactionList";
import { Reconciliation } from "./Reconciliation";
import { PaymentReminders } from "./PaymentReminders";
import { ModuleHeader } from "../ui/module-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Landmark, Plus, Download } from "lucide-react";
import { Button } from "../ui/button";

type Tab = "dashboard" | "accounts" | "transactions" | "reconciliation" | "reminders";

interface BankingModuleProps {
  onBack?: () => void;
}

export function BankingModule({ onBack }: BankingModuleProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="p-4 md:p-6">
      <ModuleHeader
        title="Banking & Cash Flow"
        description="Manage accounts, track cash flow, and reconcile transactions"
        showBackButton={false}
        icon={<Landmark className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-2 text-right hidden md:block">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Liquidity</p>
              <p className="text-lg font-bold text-primary">₹24,50,000.00</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <BankingDashboard onNavigate={(tab) => setActiveTab(tab as Tab)} />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <BankAccounts />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <TransactionList />
          </TabsContent>

          <TabsContent value="reconciliation" className="space-y-4">
            <Reconciliation />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <PaymentReminders />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
