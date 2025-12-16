import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
    RefreshCw,
    Loader2,
    ArrowLeft,
    Download,
    Calendar,
    Building,
    Wallet,
    PiggyBank,
} from "lucide-react";
import { Input } from "../ui/input";
import { accountingService } from "@/services/modules.service";
import { toast } from "sonner";

interface TrialBalanceEntry {
    ledgerId: string;
    ledgerName: string;
    groupType: string;
    debit: number;
    credit: number;
}

export function BalanceSheet() {
    const [entries, setEntries] = useState<TrialBalanceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await accountingService.getTrialBalance(asOfDate);
            if (res.success) {
                setEntries(res.data?.entries || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load Balance Sheet data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [asOfDate]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    // Group entries
    const assetEntries = entries.filter((e) => e.groupType === "ASSET");
    const liabilityEntries = entries.filter((e) => e.groupType === "LIABILITY");
    const equityEntries = entries.filter((e) => e.groupType === "EQUITY");
    const incomeEntries = entries.filter((e) => e.groupType === "INCOME");
    const expenseEntries = entries.filter((e) => e.groupType === "EXPENSE");

    // Calculate totals
    const totalAssets = assetEntries.reduce((sum, e) => sum + (e.debit - e.credit), 0);
    const totalLiabilities = liabilityEntries.reduce((sum, e) => sum + (e.credit - e.debit), 0);
    const totalEquity = equityEntries.reduce((sum, e) => sum + (e.credit - e.debit), 0);
    const totalIncome = incomeEntries.reduce((sum, e) => sum + (e.credit - e.debit), 0);
    const totalExpense = expenseEntries.reduce((sum, e) => sum + (e.debit - e.credit), 0);
    const retainedEarnings = totalIncome - totalExpense;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + retainedEarnings;

    const handleExport = () => {
        const lines = [
            "BALANCE SHEET",
            `As of: ${asOfDate}`,
            "",
            "ASSETS",
            ...assetEntries.map((e) => `  ${e.ledgerName},${e.debit - e.credit}`),
            `Total Assets,${totalAssets}`,
            "",
            "LIABILITIES",
            ...liabilityEntries.map((e) => `  ${e.ledgerName},${e.credit - e.debit}`),
            `Total Liabilities,${totalLiabilities}`,
            "",
            "EQUITY",
            ...equityEntries.map((e) => `  ${e.ledgerName},${e.credit - e.debit}`),
            `  Retained Earnings (P&L),${retainedEarnings}`,
            `Total Equity,${totalEquity + retainedEarnings}`,
            "",
            `TOTAL LIABILITIES & EQUITY,${totalLiabilitiesAndEquity}`,
        ];

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `balance_sheet_${asOfDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Balance Sheet exported");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading Balance Sheet...</span>
            </div>
        );
    }

    // Check if balanced
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/accounting">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Balance Sheet</h1>
                        <p className="text-muted-foreground">
                            Assets = Liabilities + Equity
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                            className="w-40 border-0 bg-transparent"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Balance Check */}
            <Card className={isBalanced ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isBalanced ? (
                            <span className="text-green-700">✓ Balance Sheet is balanced</span>
                        ) : (
                            <span className="text-red-700">⚠ Balance Sheet is NOT balanced</span>
                        )}
                    </div>
                    <div className="flex gap-8 text-sm">
                        <div>
                            <span className="text-muted-foreground mr-2">Assets:</span>
                            <span className="font-bold">{formatCurrency(totalAssets)}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground mr-2">Liabilities + Equity:</span>
                            <span className="font-bold">{formatCurrency(totalLiabilitiesAndEquity)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Balance Sheet Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Assets */}
                <Card>
                    <CardHeader className="bg-blue-50 border-b border-blue-100">
                        <CardTitle className="text-blue-700 flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Assets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {assetEntries.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">No asset entries</div>
                        ) : (
                            <div className="divide-y">
                                {assetEntries.map((entry) => (
                                    <div key={entry.ledgerId} className="flex justify-between p-4 hover:bg-muted/20">
                                        <span>{entry.ledgerName}</span>
                                        <span className="font-mono font-medium">
                                            {formatCurrency(entry.debit - entry.credit)}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between p-4 bg-blue-50 font-bold text-blue-700">
                                    <span>Total Assets</span>
                                    <span className="font-mono">{formatCurrency(totalAssets)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Side - Liabilities & Equity */}
                <div className="space-y-6">
                    {/* Liabilities */}
                    <Card>
                        <CardHeader className="bg-red-50 border-b border-red-100">
                            <CardTitle className="text-red-700 flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Liabilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {liabilityEntries.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">No liability entries</div>
                            ) : (
                                <div className="divide-y">
                                    {liabilityEntries.map((entry) => (
                                        <div key={entry.ledgerId} className="flex justify-between p-4 hover:bg-muted/20">
                                            <span>{entry.ledgerName}</span>
                                            <span className="font-mono font-medium">
                                                {formatCurrency(entry.credit - entry.debit)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between p-4 bg-red-50 font-bold text-red-700">
                                        <span>Total Liabilities</span>
                                        <span className="font-mono">{formatCurrency(totalLiabilities)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Equity */}
                    <Card>
                        <CardHeader className="bg-purple-50 border-b border-purple-100">
                            <CardTitle className="text-purple-700 flex items-center gap-2">
                                <PiggyBank className="h-5 w-5" />
                                Equity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {equityEntries.map((entry) => (
                                    <div key={entry.ledgerId} className="flex justify-between p-4 hover:bg-muted/20">
                                        <span>{entry.ledgerName}</span>
                                        <span className="font-mono font-medium">
                                            {formatCurrency(entry.credit - entry.debit)}
                                        </span>
                                    </div>
                                ))}
                                {/* Retained Earnings from P&L */}
                                <div className="flex justify-between p-4 hover:bg-muted/20 italic">
                                    <span>Retained Earnings (P&L)</span>
                                    <span className={`font-mono font-medium ${retainedEarnings >= 0 ? "text-green-700" : "text-red-700"}`}>
                                        {formatCurrency(retainedEarnings)}
                                    </span>
                                </div>
                                <div className="flex justify-between p-4 bg-purple-50 font-bold text-purple-700">
                                    <span>Total Equity</span>
                                    <span className="font-mono">{formatCurrency(totalEquity + retainedEarnings)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total L&E */}
                    <Card className="bg-muted">
                        <CardContent className="p-4 flex justify-between items-center font-bold">
                            <span>Total Liabilities & Equity</span>
                            <span className="font-mono text-xl">{formatCurrency(totalLiabilitiesAndEquity)}</span>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default BalanceSheet;
