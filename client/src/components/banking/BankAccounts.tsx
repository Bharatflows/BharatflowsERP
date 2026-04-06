import { useState, useEffect } from "react";
import { bankingService } from "../../services/modules.service";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  type: "Savings" | "Current" | "Credit" | "Cash";
  balance: number;
  status: "active" | "inactive";
  lastReconciled?: string;
}

export function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await bankingService.getAll();
      const mappedAccounts = (response.data || []).map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        bankName: acc.bankName || "N/A",
        accountNumber: acc.accountNumber || "N/A",
        ifsc: acc.ifsc || "N/A",
        type: acc.type || "Current",
        balance: Number(acc.balance),
        status: (acc.status || "active").toLowerCase(),
        lastReconciled: acc.lastReconciled ? new Date(acc.lastReconciled).toISOString().split('T')[0] : "Never",
      }));
      setAccounts(mappedAccounts);
    } catch (error) {
      console.error("Failed to fetch bank accounts:", error);
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<BankAccount>>({
    type: "Current",
    status: "active",
  });

  const handleAddAccount = async () => {
    if (!newAccount.name || !newAccount.balance) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const accountData = {
        name: newAccount.name,
        bankName: newAccount.bankName || "N/A",
        accountNumber: newAccount.accountNumber || "N/A",
        ifsc: newAccount.ifsc || "N/A",
        type: newAccount.type || "Current",
        balance: Number(newAccount.balance),
        status: "active",
      };

      await bankingService.create(accountData);
      toast.success("Bank account added successfully");
      setIsAddDialogOpen(false);
      setNewAccount({ type: "Current", status: "active" });
      fetchAccounts();
    } catch (error: any) {
      console.error("Failed to add bank account:", error);
      toast.error(error.message || "Failed to add bank account");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-[16px] border border-border shadow-sm p-[24px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
          <div className="flex items-start gap-[16px]">
            <div className="bg-primary/10 p-[12px] rounded-[12px]">
              <MIcon name="account_balance" className="text-[24px] text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-[4px]">Bank Accounts</h2>
              <p className="text-body-sm font-medium text-muted-foreground">
                Manage your business bank accounts and cash ledgers
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold">
                <MIcon name="add" className="text-[18px]" /> Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bank Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Account Name (Alias)</Label>
                  <Input
                    placeholder="e.g. Main HDFC Account"
                    value={newAccount.name || ""}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <Select
                      value={newAccount.type}
                      onValueChange={(val: any) => setNewAccount({ ...newAccount, type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Current">Current Account</SelectItem>
                        <SelectItem value="Savings">Savings Account</SelectItem>
                        <SelectItem value="Credit">CC / OD Account</SelectItem>
                        <SelectItem value="Cash">Cash Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Opening Balance (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newAccount.balance || ""}
                      onChange={(e) => setNewAccount({ ...newAccount, balance: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {newAccount.type !== 'Cash' && (
                  <>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        placeholder="e.g. HDFC Bank"
                        value={newAccount.bankName || ""}
                        onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          placeholder="Account Number"
                          value={newAccount.accountNumber || ""}
                          onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IFSC Code</Label>
                        <Input
                          placeholder="IFSC Code"
                          value={newAccount.ifsc || ""}
                          onChange={(e) => setNewAccount({ ...newAccount, ifsc: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddAccount}>Add Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-card rounded-[16px] border border-border shadow-sm p-[24px] hover:shadow-md transition-all group relative overflow-hidden"
          >
            {/* Gradient Overlay based on type */}
            <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br to-transparent rounded-bl-full opacity-10 pointer-events-none",
              account.type === 'Cash' ? "from-blue-500" :
                account.type === 'Credit' ? "from-amber-500" :
                  "from-violet-500"
            )} />

            <div className="flex justify-between items-start mb-[16px] relative z-10">
              <div className="flex items-center gap-[16px]">
                <div className={cn("p-[12px] rounded-[12px]",
                  account.type === 'Cash' ? "bg-blue-50 dark:bg-blue-900/40" :
                    account.type === 'Credit' ? "bg-amber-50 dark:bg-amber-900/40" :
                      "bg-violet-50 dark:bg-violet-900/40"
                )}>
                  {account.type === 'Cash' ? (
                    <MIcon name="account_balance_wallet" className={cn("text-[24px]",
                      account.type === 'Cash' ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400"
                    )} />
                  ) : (
                    <MIcon name="account_balance" className={cn("text-[24px]",
                      account.type === 'Credit' ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400"
                    )} />
                  )}
                </div>
                <div>
                  <h3 className="text-h3 font-bold text-foreground mb-[4px]">{account.name}</h3>
                  <p className="text-body-sm font-medium text-muted-foreground">{account.bankName} • {account.type}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-[32px] w-[32px] rounded-[8px]">
                    <MIcon name="more_vert" className="text-[18px] text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[12px] border-border p-[8px] min-w-[160px]">
                  <DropdownMenuItem className="rounded-[8px] text-body-sm font-medium text-foreground dark:text-muted-foreground gap-[8px] px-[12px] py-[8px] cursor-pointer">
                    <MIcon name="edit" className="text-[16px] text-muted-foreground" /> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 rounded-[8px] text-body-sm font-medium gap-[8px] px-[12px] py-[8px] cursor-pointer focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20">
                    <MIcon name="delete" className="text-[16px]" /> Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-[20px] relative z-10">
              <div>
                <p className="text-body-sm font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Available Balance</p>
                <h2 className={cn("text-3xl font-bold", account.balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                  ₹{Math.abs(account.balance).toLocaleString("en-IN")}
                  <span className="text-body font-medium text-muted-foreground ml-[8px]">
                    {account.balance >= 0 ? 'Cr' : 'Dr'}
                  </span>
                </h2>
              </div>

              {account.type !== 'Cash' && (
                <div className="p-[16px] bg-muted dark:bg-slate-950 border border-border rounded-[12px] space-y-[12px]">
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-muted-foreground font-medium">Account No</span>
                    <div className="flex items-center gap-[8px]">
                      <span className="font-mono text-foreground dark:text-muted-foreground font-bold bg-card px-[8px] py-[4px] rounded-[6px] border border-border">{account.accountNumber}</span>
                      <Button variant="ghost" size="icon" className="h-[24px] w-[24px]" onClick={() => copyToClipboard(account.accountNumber)}>
                        <MIcon name="content_copy" className="text-[14px] text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-body-sm">
                    <span className="text-muted-foreground font-medium">IFSC</span>
                    <div className="flex items-center gap-[8px]">
                      <span className="font-mono text-foreground dark:text-muted-foreground font-bold bg-card px-[8px] py-[4px] rounded-[6px] border border-border">{account.ifsc}</span>
                      <Button variant="ghost" size="icon" className="h-[24px] w-[24px]" onClick={() => copyToClipboard(account.ifsc)}>
                        <MIcon name="content_copy" className="text-[14px] text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[12px] font-medium text-muted-foreground pt-[16px] border-t border-border">
                <div className="flex items-center gap-[6px]">
                  <MIcon name="check_circle" className="text-[14px] text-emerald-600 dark:text-emerald-500" />
                  Last Reconciled: {account.lastReconciled}
                </div>
                <Badge variant="outline" className={cn("gap-[4px] px-[8px] py-[2px] rounded-[6px] text-[10px] font-bold tracking-wider",
                  account.status === 'active' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-muted text-muted-foreground border-border"
                )}>
                  <div className={cn("w-[6px] h-[6px] rounded-full", account.status === 'active' ? "bg-emerald-600 dark:bg-emerald-500" : "bg-slate-500")} />
                  {account.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
