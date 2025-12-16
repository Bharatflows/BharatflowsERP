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
    TrendingUp,
    TrendingDown,
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

export function ProfitLoss() {
    const [entries, setEntries] = useState<TrialBalanceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), 3, 1).toISOString().split("T")[0] // April 1
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await accountingService.getTrialBalance(endDate);
            if (res.success) {
                setEntries(res.data?.entries || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load P&L data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [endDate]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    // Group by Income and Expense
    const incomeEntries = entries.filter((e) => e.groupType === "INCOME");
    const expenseEntries = entries.filter((e) => e.groupType === "EXPENSE");

    const totalIncome = incomeEntries.reduce((sum, e) => sum + (e.credit - e.debit), 0);
    const totalExpense = expenseEntries.reduce((sum, e) => sum + (e.debit - e.credit), 0);
    const netProfitLoss = totalIncome - totalExpense;

    const handleExport = () => {
        const lines = [
            "PROFIT & LOSS STATEMENT",
            `Period: ${startDate} to ${endDate}`,
            "",
            "INCOME",
            ...incomeEntries.map((e) => `  ${e.ledgerName},${e.credit - e.debit}`),
            `Total Income,${totalIncome}`,
            "",
            "EXPENSES",
            ...expenseEntries.map((e) => `  ${e.ledgerName},${e.debit - e.credit}`),
            `Total Expenses,${totalExpense}`,
            "",
            `NET ${netProfitLoss >= 0 ? "PROFIT" : "LOSS"},${Math.abs(netProfitLoss)}`,
        ];

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `profit_loss_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("P&L exported");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading P&L...</span>
            </div>
        );
    }

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
                        <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>
                        <p className="text-muted-foreground">
                            Income vs Expenses for the period
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                            <span className="text-sm text-green-600">Income</span>
                        </div>
                        <p className="text-3xl font-bold text-green-700 mt-2">
                            {formatCurrency(totalIncome)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                            <span className="text-sm text-red-600">Expenses</span>
                        </div>
                        <p className="text-3xl font-bold text-red-700 mt-2">
                            {formatCurrency(totalExpense)}
                        </p>
                    </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${netProfitLoss >= 0 ? "from-emerald-50 to-emerald-100/50 border-emerald-200" : "from-rose-50 to-rose-100/50 border-rose-200"}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            {netProfitLoss >= 0 ? (
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            ) : (
                                <TrendingDown className="h-6 w-6 text-rose-600" />
                            )}
                            <span className={`text-sm ${netProfitLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                Net {netProfitLoss >= 0 ? "Profit" : "Loss"}
                            </span>
                        </div>
                        <p className={`text-3xl font-bold mt-2 ${netProfitLoss >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatCurrency(netProfitLoss)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* P&L Statement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income */}
                <Card>
                    <CardHeader className="bg-green-50 border-b border-green-100">
                        <CardTitle className="text-green-700 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Income
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {incomeEntries.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">No income entries</div>
                        ) : (
                            <div className="divide-y">
                                {incomeEntries.map((entry) => (
                                    <div key={entry.ledgerId} className="flex justify-between p-4 hover:bg-muted/20">
                                        <span>{entry.ledgerName}</span>
                                        <span className="font-mono font-medium text-green-700">
                                            {formatCurrency(entry.credit - entry.debit)}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between p-4 bg-green-50 font-bold">
                                    <span>Total Income</span>
                                    <span className="font-mono text-green-700">{formatCurrency(totalIncome)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Expenses */}
                <Card>
                    <CardHeader className="bg-red-50 border-b border-red-100">
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {expenseEntries.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">No expense entries</div>
                        ) : (
                            <div className="divide-y">
                                {expenseEntries.map((entry) => (
                                    <div key={entry.ledgerId} className="flex justify-between p-4 hover:bg-muted/20">
                                        <span>{entry.ledgerName}</span>
                                        <span className="font-mono font-medium text-red-700">
                                            {formatCurrency(entry.debit - entry.credit)}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between p-4 bg-red-50 font-bold">
                                    <span>Total Expenses</span>
                                    <span className="font-mono text-red-700">{formatCurrency(totalExpense)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Net Result */}
            <Card className={netProfitLoss >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}>
                <CardContent className="p-6 flex justify-between items-center">
                    <span className="text-xl font-bold">
                        Net {netProfitLoss >= 0 ? "Profit" : "Loss"} for the Period
                    </span>
                    <span className={`text-3xl font-bold font-mono ${netProfitLoss >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {formatCurrency(netProfitLoss)}
                    </span>
                </CardContent>
            </Card>
        </div>
    );
}

export default ProfitLoss;
