import { useState, useEffect } from "react";
import { bankingService } from "../../services/modules.service";
import {
  Plus,
  MoreVertical,
  CreditCard,
  Landmark,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  Wallet,
} from "lucide-react";
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
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Landmark className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Bank Accounts</h2>
              <p className="text-muted-foreground text-sm">
                Manage your business bank accounts and cash ledgers
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-10">
                <Plus className="size-4" /> Add Account
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-card rounded-xl border border-border/50 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden"
          >
            {/* Gradient Overlay based on type */}
            <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br to-transparent rounded-bl-full opacity-10 pointer-events-none",
              account.type === 'Cash' ? "from-blue-500" :
                account.type === 'Credit' ? "from-amber-500" :
                  "from-violet-500"
            )} />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl",
                  account.type === 'Cash' ? "bg-blue-50" :
                    account.type === 'Credit' ? "bg-amber-50" :
                      "bg-violet-50"
                )}>
                  {account.type === 'Cash' ? (
                    <Wallet className={cn("size-6",
                      account.type === 'Cash' ? "text-blue-600" : "text-violet-600"
                    )} />
                  ) : (
                    <Landmark className={cn("size-6",
                      account.type === 'Credit' ? "text-amber-600" : "text-violet-600"
                    )} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{account.name}</h3>
                  <p className="text-sm text-muted-foreground">{account.bankName} • {account.type}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="size-4 mr-2" /> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="size-4 mr-2" /> Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-5 relative z-10">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Available Balance</p>
                <h2 className={cn("text-3xl font-bold tracking-tight", account.balance < 0 ? "text-rose-600" : "text-foreground")}>
                  ₹{Math.abs(account.balance).toLocaleString("en-IN")}
                  <span className="text-base font-normal text-muted-foreground ml-2">
                    {account.balance >= 0 ? 'Cr' : 'Dr'}
                  </span>
                </h2>
              </div>

              {account.type !== 'Cash' && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Account No</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-foreground bg-background px-2 py-0.5 rounded border border-border/50">{account.accountNumber}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(account.accountNumber)}>
                        <Copy className="size-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">IFSC</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-foreground bg-background px-2 py-0.5 rounded border border-border/50">{account.ifsc}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(account.ifsc)}>
                        <Copy className="size-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="size-3.5 text-emerald-600" />
                  Last Reconciled: {account.lastReconciled}
                </div>
                <Badge variant="outline" className={cn("gap-1",
                  account.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"
                )}>
                  <div className={cn("size-1.5 rounded-full", account.status === 'active' ? "bg-emerald-600" : "bg-gray-500")} />
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
