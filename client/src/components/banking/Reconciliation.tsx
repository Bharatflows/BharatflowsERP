import { useState, useEffect } from "react";
import {
    CheckCircle,
    AlertCircle,
    Upload,
    ArrowRight,
    RefreshCw,
    FileText,
    Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { bankingService } from "../../services/modules.service";

interface StatementLine {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    status: "matched" | "unmatched";
    matchId?: string;
}

interface Account {
    id: string;
    name: string;
    accountNumber: string;
    balance: number;
}

export function Reconciliation() {
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isReconciling, setIsReconciling] = useState(false);

    // Load accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await bankingService.getAll();
                const accountsData = response?.data || [];
                if (accountsData.length > 0) {
                    setAccounts(accountsData);
                    setSelectedAccountId(accountsData[0].id);
                }
            } catch (error) {
                console.error("Failed to load accounts:", error);
                toast.error("Failed to load bank accounts");
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    // Get selected account details
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    // Mock Data
    const statementLines: StatementLine[] = [
        {
            id: "s1",
            date: "2024-11-24",
            description: "NEFT CR-SHARMA TRADERS",
            amount: 45000,
            type: "credit",
            status: "matched",
            matchId: "t1",
        },
        {
            id: "s2",
            date: "2024-11-23",
            description: "ACH DR-RENTAL AGREEMENT",
            amount: 25000,
            type: "debit",
            status: "matched",
            matchId: "t2",
        },
        {
            id: "s3",
            date: "2024-11-22",
            description: "UPI-PAYTM-MERCHANT",
            amount: 1250,
            type: "debit",
            status: "unmatched",
        },
        {
            id: "s4",
            date: "2024-11-21",
            description: "CASH DEPOSIT-BRANCH",
            amount: 10000,
            type: "credit",
            status: "matched",
            matchId: "t5",
        },
    ];

    const totalLines = statementLines.length;
    const matchedLines = statementLines.filter(l => l.status === "matched").length;
    const progress = Math.round((matchedLines / totalLines) * 100);

    const handleUpload = () => {
        toast.info("Statement upload functionality would open here");
    };

    const handleAutoReconcile = () => {
        setIsReconciling(true);
        setTimeout(() => {
            setIsReconciling(false);
            toast.success("Auto-reconciliation complete. 1 new match found.");
        }, 2000);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header & Account Selection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-border">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Bank Reconciliation</h2>
                    <p className="text-muted-foreground">Match your bank statement with system records</p>
                </div>
                <div className="flex gap-3">
                    {loading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Loading accounts...
                        </div>
                    ) : (
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.name} - **** {account.accountNumber?.slice(-4)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button variant="outline" onClick={handleUpload}>
                        <Upload className="size-4 mr-2" /> Upload Statement
                    </Button>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-border md:col-span-2">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="font-medium text-foreground">Reconciliation Progress</h3>
                            <p className="text-sm text-muted-foreground">November 2024 Statement</p>
                        </div>
                        <span className="text-2xl font-bold text-[#2563eb]">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 mb-2" />
                    <p className="text-sm text-muted-foreground text-right">{matchedLines} of {totalLines} transactions matched</p>
                </div>

                <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-6 rounded-xl flex flex-col justify-center items-center text-center">
                    <CheckCircle className="size-8 text-[#16a34a] mb-2" />
                    <h3 className="font-semibold text-[#15803d]">System Balance</h3>
                    <p className="text-2xl font-bold text-[#15803d] my-1">₹12,50,000</p>
                    <p className="text-sm text-[#166534]">Matches matched balance</p>
                </div>
            </div>

            {/* Reconciliation Table */}
            <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex justify-between items-center bg-[#f8fafc]">
                    <h3 className="font-medium">Statement Lines</h3>
                    <Button size="sm" onClick={handleAutoReconcile} disabled={isReconciling}>
                        <RefreshCw className={cn("size-4 mr-2", isReconciling && "animate-spin")} />
                        Auto Match
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#f8fafc] border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-3 text-muted-foreground font-medium">Date</th>
                                <th className="text-left px-6 py-3 text-muted-foreground font-medium">Bank Description</th>
                                <th className="text-right px-6 py-3 text-muted-foreground font-medium">Amount</th>
                                <th className="text-center px-6 py-3 text-muted-foreground font-medium">Status</th>
                                <th className="text-left px-6 py-3 text-muted-foreground font-medium">System Match</th>
                                <th className="text-center px-6 py-3 text-muted-foreground font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statementLines.map((line) => (
                                <tr key={line.id} className={cn("border-b border-border", line.status === 'unmatched' ? "bg-[#fff7ed]" : "bg-white")}>
                                    <td className="px-6 py-4 text-foreground">{line.date}</td>
                                    <td className="px-6 py-4 text-foreground font-medium">{line.description}</td>
                                    <td className={cn("px-6 py-4 text-right font-semibold", line.type === 'credit' ? "text-[#16a34a]" : "text-foreground")}>
                                        {line.type === 'credit' ? "+" : "-"}₹{line.amount.toLocaleString("en-IN")}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {line.status === 'matched' ? (
                                            <Badge className="bg-[#dcfce7] text-[#166534] hover:bg-[#dcfce7] shadow-none border-none">Matched</Badge>
                                        ) : (
                                            <Badge className="bg-[#ffedd5] text-[#9a3412] hover:bg-[#ffedd5] shadow-none border-none">Unmatched</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {line.status === 'matched' ? (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <FileText className="size-3" />
                                                <span>Linked to transaction #{line.matchId}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">No match found</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {line.status === 'unmatched' && (
                                            <Button size="sm" variant="outline" className="h-8">Find Match</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-4 flex gap-3">
                <AlertCircle className="size-5 text-[#0284c7] flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-medium text-[#0369a1]">Reconciliation Tips</h4>
                    <p className="text-sm text-[#0c4a6e] mt-1">
                        Regular reconciliation ensures your books match your bank statement.
                        Use the "Auto Match" feature to automatically link transactions based on amount and date.
                        For unmatched items, check if you forgot to record a transaction or if there are bank fees.
                    </p>
                </div>
            </div>
        </div>
    );
}

