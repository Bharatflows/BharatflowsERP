import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
    RefreshCw,
    Loader2,
    Calendar,
    TrendingUp,
    TrendingDown,
    Download
} from "lucide-react";
import { Input } from "../ui/input";
import { reportsService } from "@/services/modules.service";
import { toast } from "sonner";
import { ModuleHeader } from "../ui/module-header";
import { cn } from "@/lib/utils";

interface LedgerEntry {
    id: string;
    name: string;
    amount: number;
    groupName: string;
}

interface ProfitLossData {
    income: LedgerEntry[];
    expense: LedgerEntry[];
    totals: {
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
    };
}

export function ProfitLoss() {
    const [data, setData] = useState<ProfitLossData | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), 3, 1).toISOString().split("T")[0] // April 1
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await reportsService.getProfitLoss({ startDate, endDate });
            if (res.success) {
                setData(res.data);
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
    }, [startDate, endDate]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount); // Removed Math.abs to show negatives if any
    };

    const handleExport = () => {
        if (!data) return;
        const lines = [
            "PROFIT & LOSS STATEMENT",
            `Period: ${startDate} to ${endDate}`,
            "",
            "INCOME",
            ...data.income.map((e) => `  ${e.name},${e.amount}`),
            `Total Income,${data.totals.totalIncome}`,
            "",
            "EXPENSES",
            ...data.expense.map((e) => `  ${e.name},${e.amount}`),
            `Total Expenses,${data.totals.totalExpense}`,
            "",
            `NET ${data.totals.netProfit >= 0 ? "PROFIT" : "LOSS"},${Math.abs(data.totals.netProfit)}`,
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

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading P&L...</span>
            </div>
        );
    }

    // Default empty state if no data
    const safeData = data || { income: [], expense: [], totals: { totalIncome: 0, totalExpense: 0, netProfit: 0 } };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <ModuleHeader
                title="Profit & Loss Statement"
                description="Income vs Expenses for the selected period"
                showBackButton={true}
                backTo="/accounting"
                icon={<TrendingUp className="size-5 text-primary" />}
                actions={
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-muted p-1.5 rounded-lg border">
                            <Calendar className="h-4 w-4 text-muted-foreground ml-1" />
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-32 h-7 p-0 border-0 bg-transparent text-sm"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-32 h-7 p-0 border-0 bg-transparent text-sm"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData} className="bg-background hover:bg-muted">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport} className="bg-background hover:bg-muted">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                        <TrendingUp className="size-16 rotate-12" />
                    </div>
                    <CardContent className="p-6 relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <TrendingUp className="size-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-white/90">Total Income</span>
                        </div>
                        <h3 className="text-4xl font-bold tracking-tight">{formatCurrency(safeData.totals.totalIncome)}</h3>
                        <p className="text-xs text-white/70 mt-4">Revenue from all operations</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-rose-500 to-red-600 text-white group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                        <TrendingDown className="size-16 -rotate-12" />
                    </div>
                    <CardContent className="p-6 relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <TrendingDown className="size-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-white/90">Total Expenses</span>
                        </div>
                        <h3 className="text-4xl font-bold tracking-tight">{formatCurrency(safeData.totals.totalExpense)}</h3>
                        <p className="text-xs text-white/70 mt-4">Operational and non-operational costs</p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "relative overflow-hidden border-0 shadow-lg text-white group transition-all duration-300",
                    safeData.totals.netProfit >= 0
                        ? "bg-gradient-to-br from-primary to-primary/80"
                        : "bg-gradient-to-br from-red-600 to-orange-600"
                )}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                        <RefreshCw className="size-16" />
                    </div>
                    <CardContent className="p-6 relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                {safeData.totals.netProfit >= 0 ? <TrendingUp className="size-5 text-white" /> : <TrendingDown className="size-5 text-white" />}
                            </div>
                            <span className="text-sm font-medium text-white/90">
                                Net {safeData.totals.netProfit >= 0 ? "Profit" : "Loss"}
                            </span>
                        </div>
                        <h3 className="text-4xl font-bold tracking-tight">{formatCurrency(safeData.totals.netProfit)}</h3>
                        <p className="text-xs text-white/70 mt-4">Bottom line performance</p>
                    </CardContent>
                </Card>
            </div>

            {/* P&L Statement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income */}
                <Card>
                    <CardHeader className="bg-success/10 border-b border-success/20">
                        <CardTitle className="text-emerald-700 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Income
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {safeData.income.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">No income entries</div>
                        ) : (
                            <div className="divide-y">
                                {safeData.income.map((entry) => (
                                    <div key={entry.id} className="flex justify-between p-4 hover:bg-muted/20">
                                        <div className="flex flex-col">
                                            <span>{entry.name}</span>
                                            <span className="text-xs text-muted-foreground">{entry.groupName}</span>
                                        </div>
                                        <span className="font-mono font-medium text-emerald-600">
                                            {formatCurrency(entry.amount)}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between p-4 bg-success/10 font-bold">
                                    <span>Total Income</span>
                                    <span className="font-mono text-emerald-700">{formatCurrency(safeData.totals.totalIncome)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Expenses */}
                <Card>
                    <CardHeader className="bg-destructive/10 border-b border-destructive/20">
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <TrendingDown className="h-5 w-5" />
                            Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {safeData.expense.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">No expense entries</div>
                        ) : (
                            <div className="divide-y">
                                {safeData.expense.map((entry) => (
                                    <div key={entry.id} className="flex justify-between p-4 hover:bg-muted/20">
                                        <div className="flex flex-col">
                                            <span>{entry.name}</span>
                                            <span className="text-xs text-muted-foreground">{entry.groupName}</span>
                                        </div>
                                        <span className="font-mono font-medium text-destructive">
                                            {formatCurrency(entry.amount)}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between p-4 bg-destructive/10 font-bold">
                                    <span>Total Expenses</span>
                                    <span className="font-mono text-destructive">{formatCurrency(safeData.totals.totalExpense)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Net Result */}
            <Card className={cn(
                "border-0 shadow-lg relative overflow-hidden text-white rounded-2xl",
                safeData.totals.netProfit >= 0 ? "bg-gradient-to-r from-emerald-600 to-teal-700" : "bg-gradient-to-r from-rose-600 to-red-700"
            )}>
                <CardContent className="p-8 flex justify-between items-center relative z-10">
                    <div className="space-y-1">
                        <span className="text-white/70 text-sm font-medium uppercase tracking-wider">Financial Performance</span>
                        <h2 className="text-2xl font-bold italic">
                            Net {safeData.totals.netProfit >= 0 ? "Profit" : "Loss"} for the Period
                        </h2>
                    </div>
                    <span className="text-5xl font-black font-mono">
                        {formatCurrency(safeData.totals.netProfit)}
                    </span>
                </CardContent>
                <div className="absolute top-0 right-0 h-full w-1/3 bg-white/10 -skew-x-12 transform translate-x-1/2" />
            </Card>
        </div>
    );
}

export default ProfitLoss;
