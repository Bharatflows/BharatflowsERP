import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    RefreshCw,
    Loader2,
    Plus,
    ArrowLeft,
    Search,
    FileText,
    Eye,
} from "lucide-react";
import { accountingService } from "@/services/modules.service";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Posting {
    id: string;
    amount: number;
    type: string;
    ledger: { id: string; name: string; code: string };
    narration?: string;
}

interface Voucher {
    id: string;
    voucherNumber: string;
    date: string;
    type: string;
    referenceType?: string;
    referenceId?: string;
    narration?: string;
    postings: Posting[];
    createdAt: string;
}

export function VoucherList() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await accountingService.getVouchers();
            if (res.success) {
                setVouchers(res.data || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load vouchers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
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
            case "CONTRA":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const filteredVouchers = vouchers.filter(
        (v) =>
            v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.narration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTotalAmount = (voucher: Voucher) => {
        return voucher.postings
            .filter((p) => p.type === "DEBIT")
            .reduce((sum, p) => sum + Number(p.amount), 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading vouchers...</span>
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
                        <h1 className="text-2xl font-bold">Journal Vouchers</h1>
                        <p className="text-muted-foreground">
                            All accounting entries and transactions
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Link to="/accounting/vouchers/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Voucher
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by voucher number, type, or narration..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Voucher List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Vouchers ({filteredVouchers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredVouchers.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No vouchers found</p>
                                <p className="text-sm">Create invoices, bills, or journal entries to see them here</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {filteredVouchers.map((voucher) => (
                                    <div
                                        key={voucher.id}
                                        onClick={() => setSelectedVoucher(voucher)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedVoucher?.id === voucher.id
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "hover:border-muted-foreground/30"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge className={getTypeColor(voucher.type)} variant="secondary">
                                                    {voucher.type}
                                                </Badge>
                                                <span className="font-mono font-medium">{voucher.voucherNumber}</span>
                                            </div>
                                            <span className="font-bold">{formatCurrency(getTotalAmount(voucher))}</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                                            <span className="truncate max-w-[200px]">
                                                {voucher.narration || "No description"}
                                            </span>
                                            <span>{new Date(voucher.date).toLocaleDateString("en-IN")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Voucher Detail */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Voucher Detail
                        </CardTitle>
                        <CardDescription>
                            {selectedVoucher
                                ? `${selectedVoucher.voucherNumber} - ${selectedVoucher.type}`
                                : "Select a voucher to view details"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!selectedVoucher ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Select a voucher from the list</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Voucher Info */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Voucher Number</p>
                                        <p className="font-mono font-bold">{selectedVoucher.voucherNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-medium">
                                            {new Date(selectedVoucher.date).toLocaleDateString("en-IN", {
                                                dateStyle: "long",
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Type</p>
                                        <Badge className={getTypeColor(selectedVoucher.type)} variant="secondary">
                                            {selectedVoucher.type}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Reference</p>
                                        <p className="font-medium">
                                            {selectedVoucher.referenceType || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Narration */}
                                {selectedVoucher.narration && (
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Narration</p>
                                        <p className="mt-1">{selectedVoucher.narration}</p>
                                    </div>
                                )}

                                {/* Postings */}
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted">
                                                <th className="text-left py-2 px-4 font-medium">Account</th>
                                                <th className="text-right py-2 px-4 font-medium text-green-700">Debit</th>
                                                <th className="text-right py-2 px-4 font-medium text-red-700">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedVoucher.postings.map((posting) => (
                                                <tr key={posting.id} className="border-b">
                                                    <td className="py-2 px-4">
                                                        <span className="font-mono text-xs text-muted-foreground mr-2">
                                                            {posting.ledger.code}
                                                        </span>
                                                        {posting.ledger.name}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono text-green-700">
                                                        {posting.type === "DEBIT" ? formatCurrency(Number(posting.amount)) : "-"}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono text-red-700">
                                                        {posting.type === "CREDIT" ? formatCurrency(Number(posting.amount)) : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-muted font-bold">
                                                <td className="py-2 px-4">Total</td>
                                                <td className="py-2 px-4 text-right font-mono text-green-700">
                                                    {formatCurrency(
                                                        selectedVoucher.postings
                                                            .filter((p) => p.type === "DEBIT")
                                                            .reduce((sum, p) => sum + Number(p.amount), 0)
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 text-right font-mono text-red-700">
                                                    {formatCurrency(
                                                        selectedVoucher.postings
                                                            .filter((p) => p.type === "CREDIT")
                                                            .reduce((sum, p) => sum + Number(p.amount), 0)
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default VoucherList;
