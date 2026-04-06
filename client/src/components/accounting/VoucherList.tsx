import { useState, useMemo } from "react";
import {
    FileText,
    RefreshCw,
    Plus,
    Search,
    Eye,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    MoreVertical,
    Download,
    FileDown,
    Sheet,
    ChevronDown,
    Printer
} from "lucide-react";
import { DataTable } from "../ui/data-table";
import { StatsCard } from "../ui/stats-card";
import { ListFilters } from "../ui/ListFilters";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { useVouchers } from "../../hooks/useAccounting";
import { exportToCSV, exportToExcel, exportToPDF, formatCurrency, formatDate } from "../../lib/exportUtils";
import { cn } from "../../lib/utils";
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
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

    const { data: response, isLoading, refetch, isFetching } = useVouchers();

    const vouchers: Voucher[] = useMemo(() => {
        return (response as any)?.data || [];
    }, [response]);

    const filteredVouchers = vouchers.filter((v) => {
        const matchesSearch =
            v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.narration || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || v.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case "SALES": return "badge-success";
            case "PURCHASE": return "badge-info";
            case "RECEIPT": return "badge-success";
            case "PAYMENT": return "badge-error";
            case "JOURNAL": return "badge-warning";
            case "CONTRA": return "badge-pending";
            default: return "badge-draft";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "SALES": return <ArrowUpRight className="size-3" />;
            case "PURCHASE": return <ArrowDownLeft className="size-3" />;
            case "RECEIPT": return <ArrowUpRight className="size-3" />;
            case "PAYMENT": return <ArrowDownLeft className="size-3" />;
            case "JOURNAL": return <FileText className="size-3" />;
            case "CONTRA": return <RefreshCw className="size-3" />;
            default: return null;
        }
    };

    const getTotalAmount = (voucher: Voucher) => {
        return voucher.postings
            .filter((p) => p.type === "DEBIT")
            .reduce((sum, p) => sum + Number(p.amount), 0);
    };

    const stats = {
        total: vouchers.length,
        sales: vouchers.filter(v => v.type === "SALES").length,
        purchase: vouchers.filter(v => v.type === "PURCHASE").length,
        receipt: vouchers.filter(v => v.type === "RECEIPT").length,
        payment: vouchers.filter(v => v.type === "PAYMENT").length,
    };

    const handleExportCSV = () => {
        const data = filteredVouchers.map(v => ({
            'Voucher #': v.voucherNumber,
            'Date': formatDate(v.date),
            'Type': v.type,
            'Reference': v.referenceType || '-',
            'Narration': v.narration || '-',
            'Amount': getTotalAmount(v)
        }));
        exportToCSV(data, 'Vouchers');
    };

    const handleExportExcel = () => {
        const data = filteredVouchers.map(v => ({
            'Voucher #': v.voucherNumber,
            'Date': formatDate(v.date),
            'Type': v.type,
            'Reference': v.referenceType || '-',
            'Narration': v.narration || '-',
            'Amount': getTotalAmount(v)
        }));
        exportToExcel(data, 'Vouchers');
    };

    const handleExportPDF = () => {
        const columns = ['Voucher #', 'Date', 'Type', 'Reference', 'Narration', 'Amount'];
        const data = filteredVouchers.map(v => [
            v.voucherNumber,
            formatDate(v.date),
            v.type,
            v.referenceType || '-',
            v.narration || '-',
            formatCurrency(getTotalAmount(v))
        ]);
        exportToPDF({ title: 'Vouchers Report', columns, data, filename: 'Vouchers' });
    };

    const columns = [
        {
            header: "Voucher Info",
            cell: (voucher: Voucher) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        <FileText className="size-4" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{voucher.voucherNumber}</p>
                        <p className="text-muted-foreground text-xs">{voucher.referenceType || voucher.type}</p>
                    </div>
                </div>
            )
        },
        {
            header: "Date",
            cell: (voucher: Voucher) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {formatDate(voucher.date)}
                </div>
            )
        },
        {
            header: "Details",
            className: "hidden md:table-cell",
            cell: (voucher: Voucher) => (
                <span className="truncate max-w-[200px] block" title={voucher.narration || ""}>
                    {voucher.narration || "-"}
                </span>
            )
        },
        {
            header: "Type",
            className: "text-center",
            cell: (voucher: Voucher) => (
                <div className="flex justify-center">
                    <Badge className={cn("rounded-full px-3 py-1 font-medium gap-1", getTypeColor(voucher.type))}>
                        {getTypeIcon(voucher.type)}
                        {voucher.type}
                    </Badge>
                </div>
            )
        },
        {
            header: "Amount",
            className: "text-right",
            cell: (voucher: Voucher) => (
                <span className="font-medium text-foreground">{formatCurrency(getTotalAmount(voucher))}</span>
            )
        },
        {
            header: "Actions",
            className: "text-center",
            cell: (voucher: Voucher) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedVoucher(voucher)}
                    >
                        <Eye className="size-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => setSelectedVoucher(voucher)} className="rounded-lg">
                                <Eye className="size-4 mr-2" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg">
                                <Printer className="size-4 mr-2" />
                                Print Voucher
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
                                <Download className="size-4 mr-2" />
                                Download PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    const renderMobileItem = (voucher: Voucher) => (
        <div
            key={voucher.id}
            className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
            onClick={() => setSelectedVoucher(voucher)}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        <FileText className="size-4" />
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">{voucher.voucherNumber}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(voucher.date)}</p>
                    </div>
                </div>
                <Badge className={cn("rounded-full px-3 py-1", getTypeColor(voucher.type))}>
                    {voucher.type}
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">Narration</p>
                    <p className="font-medium truncate">{voucher.narration || "-"}</p>
                </div>
                <div>
                    <p className="text-muted-foreground mb-1">Method</p>
                    <p className="font-medium">{voucher.referenceType || "-"}</p>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground mb-1">Amount</p>
                    <p className="font-medium">{formatCurrency(getTotalAmount(voucher))}</p>
                </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={(e) => { e.stopPropagation(); setSelectedVoucher(voucher); }}>
                    Details
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                    label="Total Vouchers"
                    value={stats.total}
                    icon={FileText}
                    gradient="bg-gradient-to-br from-primary to-primary/80"
                    shadowColor="shadow-primary/20"
                />
                <StatsCard
                    label="Receipts"
                    value={stats.receipt}
                    icon={ArrowUpRight}
                    gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    shadowColor="shadow-emerald-500/20"
                />
                <StatsCard
                    label="Payments"
                    value={stats.payment}
                    icon={ArrowDownLeft}
                    gradient="bg-gradient-to-br from-rose-500 to-rose-600"
                    shadowColor="shadow-rose-500/20"
                />
                <StatsCard
                    label="Journals"
                    value={stats.total - stats.receipt - stats.payment - stats.sales - stats.purchase} // Approximation for other types
                    icon={FileText}
                    gradient="bg-gradient-to-br from-amber-500 to-amber-600"
                    shadowColor="shadow-amber-500/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={cn("space-y-6", selectedVoucher ? "lg:col-span-2" : "lg:col-span-3")}>
                    <ListFilters
                        searchPlaceholder="Search vouchers..."
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        onRefresh={refetch}
                        isFetching={isFetching}
                        statusValue={typeFilter}
                        onStatusChange={setTypeFilter}
                        statusOptions={[
                            { value: "SALES", label: "Sales" },
                            { value: "PURCHASE", label: "Purchase" },
                            { value: "RECEIPT", label: "Receipt" },
                            { value: "PAYMENT", label: "Payment" },
                            { value: "JOURNAL", label: "Journal" },
                            { value: "CONTRA", label: "Contra" },
                        ]}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 h-11 rounded-xl">
                                    <Download className="size-4" />
                                    Export
                                    <ChevronDown className="size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={handleExportCSV} className="rounded-lg">
                                    <FileDown className="size-4 mr-2" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportExcel} className="rounded-lg">
                                    <Sheet className="size-4 mr-2" />
                                    Export as Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPDF} className="rounded-lg">
                                    <FileDown className="size-4 mr-2" />
                                    Export as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </ListFilters>

                    <DataTable
                        data={filteredVouchers}
                        columns={columns}
                        mobileRenderer={renderMobileItem}
                        isLoading={isLoading}
                        onRowClick={(voucher) => setSelectedVoucher(voucher)}
                        emptyState={{
                            title: "No vouchers found",
                            description: "Create your first voucher to get started",
                            icon: FileText,
                            action: (
                                <Link to="/accounting/vouchers/new">
                                    <Button className="mt-2 gap-2 rounded-xl">
                                        <Plus className="size-4" />
                                        New Voucher
                                    </Button>
                                </Link>
                            )
                        }}
                    />
                </div>

                {selectedVoucher && (
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="rounded-2xl border-border shadow-sm sticky top-6">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Eye className="h-5 w-5 text-primary" />
                                        Voucher Details
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedVoucher(null)}>
                                            <ChevronDown className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription>
                                    {selectedVoucher.voucherNumber}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Date</p>
                                            <p className="font-medium">{formatDate(selectedVoucher.date)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Type</p>
                                            <Badge className={getTypeColor(selectedVoucher.type)}>{selectedVoucher.type}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Reference</p>
                                            <p className="font-medium">{selectedVoucher.referenceType || "-"}</p>
                                        </div>
                                    </div>

                                    {selectedVoucher.narration && (
                                        <div className="p-3 bg-muted/50 rounded-xl text-sm">
                                            <p className="text-muted-foreground text-xs mb-1">Narration</p>
                                            <p>{selectedVoucher.narration}</p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <p className="font-medium text-sm flex items-center gap-2">
                                            <CreditCard className="size-3.5" />
                                            Postings
                                        </p>
                                        <div className="rounded-xl border border-border overflow-hidden text-sm">
                                            {selectedVoucher.postings.map((p, i) => (
                                                <div key={p.id} className={cn("p-3 flex justify-between items-center bg-background", i !== selectedVoucher.postings.length - 1 && "border-b border-border")}>
                                                    <div>
                                                        <p className="font-medium">{p.ledger.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{p.ledger.code}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={cn("font-medium font-mono", p.type === "DEBIT" ? "text-emerald-600" : "text-rose-600")}>
                                                            {p.type === "DEBIT" ? "+" : "-"}{formatCurrency(Number(p.amount))}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{p.type}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 px-1">
                                            <span className="font-medium text-sm">Total Amount</span>
                                            <span className="font-bold font-mono text-primary">
                                                {formatCurrency(getTotalAmount(selectedVoucher))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="w-full rounded-xl" variant="outline" onClick={() => setSelectedVoucher(null)}>
                                        Close
                                    </Button>
                                    <Button className="w-full rounded-xl gap-2">
                                        <Printer className="size-4" />
                                        Print
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
export default VoucherList;
