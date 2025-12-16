import { useState, useEffect } from "react";
import { bankingService } from "../../services/modules.service";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "credit" | "debit";
  account: string;
  status: "cleared" | "pending" | "failed";
  reference?: string;
}

export function TransactionList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await bankingService.getTransactions();
      const mappedTransactions = (response.data || []).map((txn: any) => ({
        id: txn.id,
        date: new Date(txn.date).toLocaleDateString("en-IN"),
        description: txn.description,
        category: txn.category,
        amount: Number(txn.amount),
        type: (txn.type || "debit").toLowerCase(),
        account: txn.accountName || "Unknown Account",
        status: (txn.status || "cleared").toLowerCase(),
        reference: txn.reference
      }));
      setTransactions(mappedTransactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.account.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search description, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="credit">Money In (Credit)</SelectItem>
              <SelectItem value="debit">Money Out (Debit)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Calendar className="size-4" />
            This Month
          </Button>

          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Date</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Description</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Account</th>
                <th className="text-left px-6 py-4 text-muted-foreground font-medium">Category</th>
                <th className="text-right px-6 py-4 text-muted-foreground font-medium">Amount</th>
                <th className="text-center px-6 py-4 text-muted-foreground font-medium">Status</th>
                <th className="text-center px-6 py-4 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-border hover:bg-[#f8fafc] group">
                  <td className="px-6 py-4 text-foreground whitespace-nowrap">
                    {txn.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full flex-shrink-0",
                        txn.type === 'credit' ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"
                      )}>
                        {txn.type === 'credit' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                      </div>
                      <div>
                        <p className="text-foreground font-medium truncate max-w-[200px]" title={txn.description}>{txn.description}</p>
                        {txn.reference && <p className="text-xs text-muted-foreground">Ref: {txn.reference}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {txn.account}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="font-normal bg-gray-100 text-gray-600">
                      {txn.category}
                    </Badge>
                  </td>
                  <td className={cn("px-6 py-4 text-right font-semibold",
                    txn.type === 'credit' ? "text-[#16a34a]" : "text-foreground"
                  )}>
                    {txn.type === 'credit' ? "+" : "-"}₹{txn.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className={cn(
                      txn.status === 'cleared' ? "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]" :
                        txn.status === 'pending' ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]" :
                          "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
                    )}>
                      {txn.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Transaction</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <div className="bg-gray-100 p-4 rounded-full inline-block mb-3">
              <Filter className="size-6" />
            </div>
            <p>No transactions found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
