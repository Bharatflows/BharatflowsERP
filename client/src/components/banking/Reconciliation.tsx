import { useState, useEffect } from "react";
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

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
        {name}
    </span>
);

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

    const [statementLines, setStatementLines] = useState<StatementLine[]>([]);

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
        <div className="p-[24px] space-y-[24px]">
            {/* Header & Account Selection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[16px] bg-card p-[24px] rounded-[16px] border border-border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-[4px]">Bank Reconciliation</h2>
                    <p className="text-body-sm font-medium text-muted-foreground">Match your bank statement with system records</p>
                </div>
                <div className="flex gap-[12px]">
                    {loading ? (
                        <div className="flex items-center gap-[8px] text-muted-foreground text-body-sm font-medium">
                            <MIcon name="autorenew" className="text-[16px] animate-spin" />
                            Loading accounts...
                        </div>
                    ) : (
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                            <SelectTrigger className="w-[250px] h-[40px] rounded-[8px] border-border focus:ring-primary/20 bg-muted dark:bg-slate-950 font-medium text-body-sm">
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[12px] border-border">
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id} className="rounded-[8px] focus:bg-muted dark:focus:bg-slate-900 cursor-pointer text-body-sm font-medium">
                                        {account.name} - **** {account.accountNumber?.slice(-4)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button variant="outline" onClick={handleUpload} className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
                        <MIcon name="upload" className="text-[18px]" /> Upload Statement
                    </Button>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
                <div className="bg-card p-[24px] rounded-[16px] border border-border shadow-sm md:col-span-2">
                    <div className="flex justify-between items-end mb-[16px]">
                        <div>
                            <h3 className="text-h3 font-bold text-foreground mb-[4px]">Reconciliation Progress</h3>
                            <p className="text-body-sm font-medium text-muted-foreground">November 2024 Statement</p>
                        </div>
                        <span className="text-3xl font-black text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-[8px] rounded-full mb-[8px]" />
                    <p className="text-body-sm font-medium text-muted-foreground text-right">{matchedLines} of {totalLines} transactions matched</p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-[24px] rounded-[16px] flex flex-col justify-center items-center text-center">
                    <MIcon name="check_circle" className="text-[32px] text-emerald-600 dark:text-emerald-500 mb-[8px]" />
                    <h3 className="text-body font-bold text-emerald-800 dark:text-emerald-300">System Balance</h3>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 my-[4px]">₹12,50,000</p>
                    <p className="text-body-sm font-medium text-emerald-600 dark:text-emerald-500 flex items-center gap-[4px]">Matches statement balance</p>
                </div>
            </div>

            {/* Reconciliation Table */}
            <div className="bg-card rounded-[16px] border border-border shadow-sm overflow-hidden">
                <div className="p-[16px] border-b border-border flex justify-between items-center bg-muted dark:bg-slate-950">
                    <h3 className="text-h3 font-bold text-foreground">Statement Lines</h3>
                    <Button size="sm" onClick={handleAutoReconcile} disabled={isReconciling} className="gap-[8px] h-[32px] px-[12px] rounded-[8px] font-bold">
                        <MIcon name="autorenew" className={cn("text-[16px]", isReconciling && "animate-spin")} />
                        Auto Match
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted dark:bg-slate-950 border-b border-border">
                            <tr>
                                <th className="px-[24px] py-[16px] text-body-sm font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-[24px] py-[16px] text-body-sm font-bold text-muted-foreground uppercase tracking-wider">Bank Description</th>
                                <th className="px-[24px] py-[16px] text-body-sm font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                                <th className="px-[24px] py-[16px] text-body-sm font-bold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                                <th className="px-[24px] py-[16px] text-body-sm font-bold text-muted-foreground uppercase tracking-wider">System Match</th>
                                <th className="px-[24px] py-[16px] text-body-sm font-bold text-muted-foreground uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statementLines.map((line) => (
                                <tr key={line.id} className={cn(
                                    "border-b border-border transition-colors",
                                    line.status === 'unmatched' ? "bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "hover:bg-muted/50 dark:hover:bg-muted/50"
                                )}>
                                    <td className="px-[24px] py-[16px] text-body-sm font-medium text-foreground">{line.date}</td>
                                    <td className="px-[24px] py-[16px] text-body-sm text-foreground">{line.description}</td>
                                    <td className={cn(
                                        "px-[24px] py-[16px] text-right font-mono text-body-sm font-bold",
                                        line.type === 'credit' ? "text-emerald-600 dark:text-emerald-400" : "text-foreground dark:text-muted-foreground"
                                    )}>
                                        {line.type === 'credit' ? "+" : "-"}₹{line.amount.toLocaleString("en-IN")}
                                    </td>
                                    <td className="px-[24px] py-[16px] text-center">
                                        {line.status === 'matched' ? (
                                            <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-none px-[8px] py-[2px] rounded-[6px] text-[10px] font-bold tracking-wider hover:bg-emerald-50 dark:hover:bg-emerald-900/20">MATCHED</Badge>
                                        ) : (
                                            <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-none px-[8px] py-[2px] rounded-[6px] text-[10px] font-bold tracking-wider hover:bg-amber-100 dark:hover:bg-amber-900/30">UNMATCHED</Badge>
                                        )}
                                    </td>
                                    <td className="px-[24px] py-[16px]">
                                        {line.status === 'matched' ? (
                                            <div className="flex items-center gap-[6px] text-body-sm font-medium text-muted-foreground">
                                                <MIcon name="description" className="text-[14px]" />
                                                <span>Linked to tx #{line.matchId}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic text-[12px] font-medium">No match found</span>
                                        )}
                                    </td>
                                    <td className="px-[24px] py-[16px] text-center">
                                        {line.status === 'unmatched' && (
                                            <Button size="sm" variant="outline" className="h-[28px] px-[12px] rounded-[6px] text-[12px] font-bold border-border hover:bg-muted">Find Match</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[12px] p-[16px] flex gap-[12px]">
                <MIcon name="info" className="text-[20px] text-blue-600 dark:text-blue-400 flex-shrink-0 mt-[2px]" />
                <div>
                    <h4 className="text-body font-bold text-blue-900 dark:text-blue-100 mb-[4px]">Reconciliation Tips</h4>
                    <p className="text-body-sm font-medium text-blue-700 dark:text-blue-300">
                        Regular reconciliation ensures your books match your bank statement.
                        Use the "Auto Match" feature to automatically link transactions based on amount and date.
                        For unmatched items, check if you forgot to record a transaction or if there are bank fees.
                    </p>
                </div>
            </div>
        </div>
    );
}

