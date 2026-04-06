import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    RefreshCw,
    Loader2,
    Download,
    Calendar,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    TrendingUp,
} from "lucide-react";
import { accountingService } from "@/services/modules.service";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ModuleHeader } from "../ui/module-header";
import { ACCOUNT_TYPES } from "@/constants";

interface TrialBalanceEntry {
    ledgerId: string;
    ledgerName: string;
    ledgerCode: string;
    groupName: string;
    groupType: string;
    debit: number;
    credit: number;
}

interface TrialBalanceData {
    entries: TrialBalanceEntry[];
    totals: { debit: number; credit: number };
    asOfDate: string;
}

export function TrialBalance() {
    const [data, setData] = useState<TrialBalanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await accountingService.getTrialBalance(asOfDate);
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load trial balance");
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

    const getTypeColor = (type: string) => {
        switch (type) {
            case "ASSET":
                return "bg-blue-100 text-blue-700";
            case "LIABILITY":
                return "bg-red-100 text-red-700";
            case "EQUITY":
                return "bg-purple-100 text-purple-700";
            case "INCOME":
                return "bg-green-100 text-green-700";
            case "EXPENSE":
                return "bg-orange-100 text-orange-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    // Group entries by type
    const groupedEntries = data?.entries.reduce((acc, entry) => {
        if (!acc[entry.groupType]) {
            acc[entry.groupType] = [];
        }
        acc[entry.groupType].push(entry);
        return acc;
    }, {} as Record<string, TrialBalanceEntry[]>) || {};

    const isBalanced = data && Math.abs(data.totals.debit - data.totals.credit) < 0.01;

    const handleExportCSV = () => {
        if (!data) return;

        const headers = ["Ledger Code", "Ledger Name", "Group", "Type", "Debit", "Credit"];
        const rows = data.entries.map((e) => [
            e.ledgerCode,
            e.ledgerName,
            e.groupName,
            e.groupType,
            e.debit > 0 ? e.debit.toString() : "",
            e.credit > 0 ? e.credit.toString() : "",
        ]);
        rows.push(["", "TOTAL", "", "", data.totals.debit.toString(), data.totals.credit.toString()]);

        const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `trial_balance_${asOfDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Trial Balance exported to CSV");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading trial balance...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <ModuleHeader
                title="Trial Balance"
                description="Summary of all ledger account balances"
                showBackButton={true}
                backTo="/accounting"
                icon={<TrendingUp className="size-5 text-primary" />}
                actions={
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-muted p-1.5 rounded-lg border">
                            <Calendar className="h-4 w-4 text-muted-foreground ml-1" />
                            <Input
                                type="date"
                                value={asOfDate}
                                onChange={(e) => setAsOfDate(e.target.value)}
                                className="w-32 h-7 p-0 border-0 bg-transparent text-sm"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                }
            />

            {/* Balance Status */}
            <Card className={isBalanced ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="p-4 flex items-center gap-3">
                    {isBalanced ? (
                        <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-700 font-medium">
                                ✓ Trial Balance is balanced (Debit = Credit)
                            </span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-700 font-medium">
                                ⚠ Trial Balance is NOT balanced! Difference: {formatCurrency((data?.totals.debit || 0) - (data?.totals.credit || 0))}
                            </span>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Trial Balance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>As of {new Date(asOfDate).toLocaleDateString("en-IN", { dateStyle: "long" })}</CardTitle>
                </CardHeader>
                <CardContent>
                    {!data || data.entries.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No ledger entries found</p>
                            <Link to="/accounting">
                                <Button variant="link" className="mt-2">
                                    Setup Chart of Accounts first
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 bg-muted">
                                        <th className="text-left py-3 px-4 font-semibold">Code</th>
                                        <th className="text-left py-3 px-4 font-semibold">Ledger Account</th>
                                        <th className="text-left py-3 px-4 font-semibold">Group</th>
                                        <th className="text-left py-3 px-4 font-semibold">Type</th>
                                        <th className="text-right py-3 px-4 font-semibold text-green-700">Debit (₹)</th>
                                        <th className="text-right py-3 px-4 font-semibold text-red-700">Credit (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ACCOUNT_TYPES.map((type) => {
                                        const entries = groupedEntries[type] || [];
                                        if (entries.length === 0) return null;

                                        const typeDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                                        const typeCredit = entries.reduce((sum, e) => sum + e.credit, 0);

                                        return (
                                            <React.Fragment key={type}>
                                                {/* Type Header */}
                                                <tr className="bg-muted/30">
                                                    <td colSpan={6} className="py-2 px-4 font-bold">
                                                        <Badge className={getTypeColor(type)} variant="secondary">
                                                            {type}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                                {/* Entries */}
                                                {entries.map((entry) => (
                                                    <tr key={entry.ledgerId} className="border-b border-dashed hover:bg-muted/20">
                                                        <td className="py-2 px-4 font-mono text-xs">{entry.ledgerCode}</td>
                                                        <td className="py-2 px-4 font-medium">{entry.ledgerName}</td>
                                                        <td className="py-2 px-4 text-muted-foreground">{entry.groupName}</td>
                                                        <td className="py-2 px-4">
                                                            <Badge className={getTypeColor(entry.groupType)} variant="secondary">
                                                                {entry.groupType}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-2 px-4 text-right font-mono text-green-700">
                                                            {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                                                        </td>
                                                        <td className="py-2 px-4 text-right font-mono text-red-700">
                                                            {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {/* Type Subtotal */}
                                                <tr className="bg-muted/20 font-semibold">
                                                    <td colSpan={4} className="py-2 px-4 text-right">
                                                        {type} Total:
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono text-green-700">
                                                        {typeDebit > 0 ? formatCurrency(typeDebit) : "-"}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono text-red-700">
                                                        {typeCredit > 0 ? formatCurrency(typeCredit) : "-"}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-4 bg-muted font-bold text-lg">
                                        <td colSpan={4} className="py-3 px-4 text-right">
                                            GRAND TOTAL:
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-green-700">
                                            {formatCurrency(data.totals.debit)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-red-700">
                                            {formatCurrency(data.totals.credit)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default TrialBalance;
