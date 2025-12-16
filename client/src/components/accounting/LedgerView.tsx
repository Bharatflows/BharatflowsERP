import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    RefreshCw,
    Loader2,
    ArrowLeft,
    Calendar,
    Download,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { accountingService } from "@/services/modules.service";
import { toast } from "sonner";

interface LedgerPosting {
    id: string;
    date: string;
    voucher: {
        voucherNumber: string;
        type: string;
        narration: string;
    };
    amount: number;
    type: string;
    narration?: string;
}

interface LedgerData {
    ledger: {
        id: string;
        name: string;
        code: string;
        group: { name: string; type: string };
    };
    openingBalance: number;
    openingType: string;
    postings: LedgerPosting[];
    closingBalance: number;
    closingType: string;
}

export function LedgerView() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<LedgerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await accountingService.getLedgerBalance(id, endDate);
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load ledger details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, endDate]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(Math.abs(amount));
    };

    const getTypeColor = (type: string) => {
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

    const handleExport = () => {
        if (!data) return;

        const headers = ["Date", "Voucher", "Type", "Narration", "Debit", "Credit", "Balance"];
        let runningBalance = data.openingBalance * (data.openingType === "DEBIT" ? 1 : -1);

        const rows = data.postings.map((p) => {
            const debit = p.type === "DEBIT" ? Number(p.amount) : 0;
            const credit = p.type === "CREDIT" ? Number(p.amount) : 0;
            runningBalance += debit - credit;

            return [
                new Date(p.date).toLocaleDateString("en-IN"),
                p.voucher.voucherNumber,
                p.voucher.type,
                p.narration || p.voucher.narration || "",
                debit || "",
                credit || "",
                runningBalance,
            ];
        });

        rows.unshift(["", "Opening Balance", "", "",
            data.openingType === "DEBIT" ? data.openingBalance : "",
            data.openingType === "CREDIT" ? data.openingBalance : "",
            data.openingBalance * (data.openingType === "DEBIT" ? 1 : -1)
        ]);

        const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ledger_${data.ledger.code}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Ledger exported to CSV");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading ledger...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">Ledger not found</p>
                <Link to="/accounting/chart-of-accounts">
                    <Button variant="link">Back to Chart of Accounts</Button>
                </Link>
            </div>
        );
    }

    // Calculate running balance for display
    let runningBalance = data.openingBalance * (data.openingType === "DEBIT" ? 1 : -1);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/accounting/chart-of-accounts">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{data.ledger.name}</h1>
                            <Badge variant="outline" className="font-mono">
                                {data.ledger.code}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {data.ledger.group.name} ({data.ledger.group.type})
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

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Opening Balance</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xl font-bold">{formatCurrency(data.openingBalance)}</p>
                            <Badge variant="outline">{data.openingType}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Transactions</p>
                        <p className="text-xl font-bold mt-1">{data.postings.length}</p>
                    </CardContent>
                </Card>

                <Card className={data.closingType === "DEBIT" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Closing Balance</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xl font-bold">{formatCurrency(data.closingBalance)}</p>
                            <Badge variant="outline" className={data.closingType === "DEBIT" ? "text-green-700" : "text-red-700"}>
                                {data.closingType}
                            </Badge>
                            {data.closingType === "DEBIT" ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Ledger Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Ledger Transactions</CardTitle>
                    <CardDescription>All entries affecting this account</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.postings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No transactions found for this period</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 bg-muted/50">
                                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                                        <th className="text-left py-3 px-4 font-semibold">Voucher</th>
                                        <th className="text-left py-3 px-4 font-semibold">Type</th>
                                        <th className="text-left py-3 px-4 font-semibold">Narration</th>
                                        <th className="text-right py-3 px-4 font-semibold text-green-700">Debit</th>
                                        <th className="text-right py-3 px-4 font-semibold text-red-700">Credit</th>
                                        <th className="text-right py-3 px-4 font-semibold">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Opening Balance Row */}
                                    <tr className="border-b bg-muted/30 font-medium">
                                        <td className="py-2 px-4">-</td>
                                        <td className="py-2 px-4" colSpan={3}>Opening Balance</td>
                                        <td className="py-2 px-4 text-right font-mono text-green-700">
                                            {data.openingType === "DEBIT" ? formatCurrency(data.openingBalance) : "-"}
                                        </td>
                                        <td className="py-2 px-4 text-right font-mono text-red-700">
                                            {data.openingType === "CREDIT" ? formatCurrency(data.openingBalance) : "-"}
                                        </td>
                                        <td className="py-2 px-4 text-right font-mono font-bold">
                                            {formatCurrency(Math.abs(runningBalance))} {runningBalance >= 0 ? "Dr" : "Cr"}
                                        </td>
                                    </tr>

                                    {/* Transaction Rows */}
                                    {data.postings.map((posting) => {
                                        const debit = posting.type === "DEBIT" ? Number(posting.amount) : 0;
                                        const credit = posting.type === "CREDIT" ? Number(posting.amount) : 0;
                                        runningBalance += debit - credit;

                                        return (
                                            <tr key={posting.id} className="border-b hover:bg-muted/20">
                                                <td className="py-2 px-4">
                                                    {new Date(posting.date).toLocaleDateString("en-IN")}
                                                </td>
                                                <td className="py-2 px-4 font-mono">
                                                    {posting.voucher.voucherNumber}
                                                </td>
                                                <td className="py-2 px-4">
                                                    <Badge className={getTypeColor(posting.voucher.type)} variant="secondary">
                                                        {posting.voucher.type}
                                                    </Badge>
                                                </td>
                                                <td className="py-2 px-4 max-w-[200px] truncate">
                                                    {posting.narration || posting.voucher.narration || "-"}
                                                </td>
                                                <td className="py-2 px-4 text-right font-mono text-green-700">
                                                    {debit > 0 ? formatCurrency(debit) : "-"}
                                                </td>
                                                <td className="py-2 px-4 text-right font-mono text-red-700">
                                                    {credit > 0 ? formatCurrency(credit) : "-"}
                                                </td>
                                                <td className="py-2 px-4 text-right font-mono font-bold">
                                                    {formatCurrency(Math.abs(runningBalance))} {runningBalance >= 0 ? "Dr" : "Cr"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 bg-muted font-bold">
                                        <td className="py-3 px-4" colSpan={4}>Closing Balance</td>
                                        <td className="py-3 px-4 text-right font-mono text-green-700">
                                            {data.closingType === "DEBIT" ? formatCurrency(data.closingBalance) : "-"}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-red-700">
                                            {data.closingType === "CREDIT" ? formatCurrency(data.closingBalance) : "-"}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            {formatCurrency(data.closingBalance)} {data.closingType === "DEBIT" ? "Dr" : "Cr"}
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

export default LedgerView;
