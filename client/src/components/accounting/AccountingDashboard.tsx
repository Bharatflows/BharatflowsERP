import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    TrendingUp,
    TrendingDown,
    BookOpen,
    FileText,
    RefreshCw,
    Loader2,
    Plus,
    ArrowRight,
    Building,
    Wallet,
    Receipt,
    PiggyBank,
    DollarSign,
} from "lucide-react";
import { accountingService } from "@/services/modules.service";
import { toast } from "sonner";

interface TrialBalanceData {
    entries: {
        ledgerId: string;
        ledgerName: string;
        ledgerCode: string;
        groupName: string;
        groupType: string;
        debit: number;
        credit: number;
    }[];
    totals: { debit: number; credit: number };
}

interface Voucher {
    id: string;
    voucherNumber: string;
    date: string;
    type: string;
    narration: string;
    postings: {
        ledger: { name: string };
        amount: number;
        type: string;
    }[];
}

export function AccountingDashboard() {
    const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(null);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tbRes, vouchersRes] = await Promise.all([
                accountingService.getTrialBalance(),
                accountingService.getVouchers(),
            ]);

            if (tbRes.success) setTrialBalance(tbRes.data);
            if (vouchersRes.success) setVouchers(vouchersRes.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load accounting data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSeedDefaults = async () => {
        setSeeding(true);
        try {
            await accountingService.seedDefaults();
            toast.success("Default Chart of Accounts created!");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to seed defaults");
        } finally {
            setSeeding(false);
        }
    };

    // Calculate summary by account type
    const getSummaryByType = (type: string) => {
        if (!trialBalance) return 0;
        return trialBalance.entries
            .filter((e) => e.groupType === type)
            .reduce((sum, e) => sum + (e.debit - e.credit), 0);
    };

    const assetTotal = getSummaryByType("ASSET");
    const liabilityTotal = Math.abs(getSummaryByType("LIABILITY"));
    const incomeTotal = Math.abs(getSummaryByType("INCOME"));
    const expenseTotal = getSummaryByType("EXPENSE");
    const netProfit = incomeTotal - expenseTotal;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(Math.abs(amount));
    };

    const getVoucherTypeColor = (type: string) => {
        switch (type) {
            case "SALES":
                return "bg-green-100 text-green-700";
            case "PURCHASE":
                return "bg-blue-100 text-blue-700";
            case "RECEIPT":
                return "bg-emerald-100 text-emerald-700";
            case "PAYMENT":
                return "bg-red-100 text-red-700";
            case "JOURNAL":
                return "bg-purple-100 text-purple-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading accounting dashboard...</span>
            </div>
        );
    }

    // Check if Chart of Accounts exists
    const hasData = trialBalance && trialBalance.entries.length > 0;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Accounting
                    </h1>
                    <p className="text-muted-foreground">
                        Double-entry ledger system with real-time financial insights
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    {!hasData && (
                        <Button onClick={handleSeedDefaults} disabled={seeding}>
                            {seeding ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Setup Chart of Accounts
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Assets */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="bg-blue-500 p-2 rounded-lg">
                                <Building className="h-5 w-5 text-white" />
                            </div>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-sm text-blue-600 mt-3 font-medium">Total Assets</p>
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(assetTotal)}</p>
                    </CardContent>
                </Card>

                {/* Liabilities */}
                <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="bg-red-500 p-2 rounded-lg">
                                <Wallet className="h-5 w-5 text-white" />
                            </div>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                        <p className="text-sm text-red-600 mt-3 font-medium">Total Liabilities</p>
                        <p className="text-2xl font-bold text-red-700">{formatCurrency(liabilityTotal)}</p>
                    </CardContent>
                </Card>

                {/* Income */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="bg-green-500 p-2 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <Receipt className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-sm text-green-600 mt-3 font-medium">Total Income</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(incomeTotal)}</p>
                    </CardContent>
                </Card>

                {/* Expenses */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="bg-orange-500 p-2 rounded-lg">
                                <PiggyBank className="h-5 w-5 text-white" />
                            </div>
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                        </div>
                        <p className="text-sm text-orange-600 mt-3 font-medium">Total Expenses</p>
                        <p className="text-2xl font-bold text-orange-700">{formatCurrency(expenseTotal)}</p>
                    </CardContent>
                </Card>

                {/* Net Profit/Loss */}
                <Card className={`bg-gradient-to-br ${netProfit >= 0 ? "from-emerald-50 to-emerald-100/50 border-emerald-200" : "from-rose-50 to-rose-100/50 border-rose-200"}`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className={`${netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"} p-2 rounded-lg`}>
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            {netProfit >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-rose-500" />
                            )}
                        </div>
                        <p className={`text-sm mt-3 font-medium ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {netProfit >= 0 ? "Net Profit" : "Net Loss"}
                        </p>
                        <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatCurrency(netProfit)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Recent Vouchers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link to="/accounting/chart-of-accounts">
                            <Button variant="outline" className="w-full justify-between">
                                Chart of Accounts
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/accounting/vouchers">
                            <Button variant="outline" className="w-full justify-between">
                                Journal Vouchers
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/accounting/trial-balance">
                            <Button variant="outline" className="w-full justify-between">
                                Trial Balance
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/accounting/profit-loss">
                            <Button variant="outline" className="w-full justify-between">
                                Profit & Loss
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/accounting/balance-sheet">
                            <Button variant="outline" className="w-full justify-between">
                                Balance Sheet
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Vouchers */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Recent Vouchers
                        </CardTitle>
                        <CardDescription>Latest journal entries and transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {vouchers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No vouchers yet</p>
                                <p className="text-sm">Create invoices or bills to see ledger postings</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {vouchers.slice(0, 5).map((voucher) => (
                                    <div
                                        key={voucher.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge className={getVoucherTypeColor(voucher.type)} variant="secondary">
                                                {voucher.type}
                                            </Badge>
                                            <div>
                                                <p className="font-medium">{voucher.voucherNumber}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {voucher.narration || "No description"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                {formatCurrency(
                                                    voucher.postings.reduce(
                                                        (sum, p) => (p.type === "DEBIT" ? sum + Number(p.amount) : sum),
                                                        0
                                                    )
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(voucher.date).toLocaleDateString("en-IN")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {vouchers.length > 5 && (
                                    <Link to="/accounting/vouchers">
                                        <Button variant="link" className="w-full">
                                            View all {vouchers.length} vouchers →
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Trial Balance Preview */}
            {hasData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Trial Balance Summary
                            </span>
                            <Link to="/accounting/trial-balance">
                                <Button variant="outline" size="sm">
                                    View Full <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 font-medium">Account</th>
                                        <th className="text-left py-2 font-medium">Type</th>
                                        <th className="text-right py-2 font-medium text-green-600">Debit</th>
                                        <th className="text-right py-2 font-medium text-red-600">Credit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trialBalance?.entries.slice(0, 8).map((entry) => (
                                        <tr key={entry.ledgerId} className="border-b border-dashed">
                                            <td className="py-2">{entry.ledgerName}</td>
                                            <td className="py-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {entry.groupType}
                                                </Badge>
                                            </td>
                                            <td className="py-2 text-right font-mono text-green-600">
                                                {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                                            </td>
                                            <td className="py-2 text-right font-mono text-red-600">
                                                {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold border-t-2">
                                        <td colSpan={2} className="py-2">TOTAL</td>
                                        <td className="py-2 text-right font-mono text-green-600">
                                            {formatCurrency(trialBalance?.totals.debit || 0)}
                                        </td>
                                        <td className="py-2 text-right font-mono text-red-600">
                                            {formatCurrency(trialBalance?.totals.credit || 0)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default AccountingDashboard;
