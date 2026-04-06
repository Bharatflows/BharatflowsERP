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
    CheckCircle,
} from "lucide-react";
import { accountingService } from "@/services/modules.service";
import { toast } from "sonner";
import { ModuleHeader } from "../ui/module-header";
import { cn } from "@/lib/utils";

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

export function AccountingDashboard({ hideStats = false }: { hideStats?: boolean }) {
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

            if (tbRes.success && tbRes.data) setTrialBalance(tbRes.data);
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
                return "badge-paid";
            case "PURCHASE":
                return "badge-sent";
            case "RECEIPT":
                return "badge-completed";
            case "PAYMENT":
                return "badge-overdue";
            case "JOURNAL":
                return "badge-active";
            default:
                return "badge-draft";
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
            <ModuleHeader
                title="Accounting"
                description="Double-entry ledger system with real-time financial insights"
                showBackButton={true}
                backTo="/dashboard"
                icon={<BookOpen className="size-5 text-primary" />}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        {!hasData && (
                            <Button size="sm" onClick={handleSeedDefaults} disabled={seeding}>
                                {seeding ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                Setup Chart of Accounts
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Summary Cards */}
            {!hideStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Assets */}
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary to-primary/80 text-white group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <Building className="size-16 rotate-12" />
                        </div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Building className="size-5 text-white" />
                                </div>
                                <span className="text-sm font-medium text-white/90">Total Assets</span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(assetTotal)}</h3>
                            <p className="text-xs text-white/70 mt-4 flex items-center gap-1">
                                <TrendingUp className="size-3" />
                                Current valuation
                            </p>
                        </CardContent>
                    </Card>

                    {/* Liabilities */}
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-rose-500 to-red-600 text-white group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <Wallet className="size-16 -rotate-12" />
                        </div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Wallet className="size-5 text-white" />
                                </div>
                                <span className="text-sm font-medium text-white/90">Total Liabilities</span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(liabilityTotal)}</h3>
                            <p className="text-xs text-white/70 mt-4 flex items-center gap-1">
                                <TrendingDown className="size-3" />
                                Outstanding debt
                            </p>
                        </CardContent>
                    </Card>

                    {/* Income */}
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <Receipt className="size-16 rotate-6" />
                        </div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <TrendingUp className="size-5 text-white" />
                                </div>
                                <span className="text-sm font-medium text-white/90">Total Income</span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(incomeTotal)}</h3>
                            <p className="text-xs text-white/70 mt-4 flex items-center gap-1">
                                <CheckCircle className="size-3" />
                                Revenue generated
                            </p>
                        </CardContent>
                    </Card>

                    {/* Expenses */}
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <PiggyBank className="size-16 -rotate-6" />
                        </div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <TrendingDown className="size-5 text-white" />
                                </div>
                                <span className="text-sm font-medium text-white/90">Total Expenses</span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(expenseTotal)}</h3>
                            <p className="text-xs text-white/70 mt-4 flex items-center gap-1">
                                <FileText className="size-3" />
                                Operating costs
                            </p>
                        </CardContent>
                    </Card>

                    {/* Net Profit/Loss */}
                    <Card className={cn(
                        "relative overflow-hidden border-0 shadow-lg text-white group transition-all duration-300",
                        netProfit >= 0
                            ? "bg-gradient-to-br from-primary to-primary/80"
                            : "bg-gradient-to-br from-red-600 to-orange-600"
                    )}>
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <DollarSign className="size-16" />
                        </div>
                        <CardContent className="p-6 relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <DollarSign className="size-5 text-white" />
                                </div>
                                <span className="text-sm font-medium text-white/90">
                                    {netProfit >= 0 ? "Net Profit" : "Net Loss"}
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(netProfit)}</h3>
                            <p className="text-xs text-white/70 mt-4 flex items-center gap-1">
                                {netProfit >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                                Current margin
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
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
