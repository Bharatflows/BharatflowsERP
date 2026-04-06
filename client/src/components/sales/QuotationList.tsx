import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Quotation } from "../../types";
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    ChevronDown,
    Download,
    MoreVertical,
    IndianRupee,
    Trash2,
    Edit,
    Send,
    Printer,
    Eye,
    FileDown,
    Sheet
} from "lucide-react";
import { DataTable } from "../ui/data-table";
import { StatsCard } from "../ui/stats-card";
import { ListFilters } from "../ui/ListFilters";
import { formatCurrency, formatDate, exportToCSV } from "../../lib/exportUtils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { cn } from "../../lib/utils";
import { SmartCard } from "@/components/ui/SmartCard";

interface QuotationListProps {
    quotations: Quotation[];
    onCreateNew: () => void;
    onViewQuotation: (id: string) => void;
    onEditQuotation: (id: string) => void;
    onDeleteQuotation?: (id: string) => void;
    onRefresh?: () => void;
    isLoading?: boolean;
}

export function QuotationList({
    quotations,
    onCreateNew,
    onViewQuotation,
    onEditQuotation,
    onDeleteQuotation,
    onRefresh,
    isLoading = false
}: QuotationListProps) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);

    const handleDownload = (quotation: Quotation) => {
        toast.info("Downloading PDF...");
    };

    const handleSend = (quotation: Quotation) => {
        toast.info("Sending email...");
    };

    const handleConvertToSO = (id: string) => {
        toast.info("Converting to Sales Order...");
    };

    const handleDeleteClick = (quotation: Quotation) => {
        setQuotationToDelete(quotation);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (quotationToDelete) {
            onDeleteQuotation?.(quotationToDelete.id);
            toast.success("Quotation deleted successfully");
            setDeleteDialogOpen(false);
            setQuotationToDelete(null);
            onRefresh?.();
        }
    };

    const handleExportCSV = () => {
        const data = filteredQuotations.map(q => ({
            'Quotation #': q.quotationNumber,
            'Customer': q.customer?.name,
            'Date': formatDate(q.date),
            'Amount': q.totalAmount,
            'Status': q.status
        }));
        exportToCSV(data, 'Quotations');
    };

    const handleExportExcel = () => {
        toast.info("Exporting to Excel...");
    };

    const handleExportPDF = () => {
        toast.info("Exporting to PDF...");
    };

    const filteredQuotations = (quotations || []).filter((quotation) => {
        const matchesSearch =
            quotation.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (quotation.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || quotation.status.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "draft": return "badge-draft";
            case "sent": return "badge-sent";
            case "viewed": return "badge-partial";
            case "accepted": return "badge-paid";
            case "rejected": return "badge-overdue";
            case "converted": return "badge-completed";
            default: return "badge-draft";
        }
    };

    const columns = [
        {
            header: "Quotation Number",
            cell: (quotation: Quotation) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        <FileText className="size-4" />
                    </div>
                    <span className="font-medium text-foreground">{quotation.quotationNumber}</span>
                </div>
            )
        },
        {
            header: "Customer",
            cell: (quotation: Quotation) => (
                <span className="font-medium text-foreground">{quotation.customer?.name || "Unknown"}</span>
            )
        },
        {
            header: "Date",
            cell: (quotation: Quotation) => (
                <span className="text-muted-foreground">{formatDate(quotation.date)}</span>
            )
        },
        {
            header: "Status",
            className: "text-center",
            cell: (quotation: Quotation) => (
                <div className="flex justify-center">
                    <Badge className={cn("rounded-full px-3 py-1 font-medium", getStatusColor(quotation.status))}>
                        {quotation.status}
                    </Badge>
                </div>
            )
        },
        {
            header: "Amount",
            className: "text-right",
            cell: (quotation: Quotation) => (
                <span className="text-lg font-semibold text-foreground">
                    {formatCurrency(Number(quotation.totalAmount || 0))}
                </span>
            )
        },
        {
            header: "Actions",
            className: "text-center",
            cell: (quotation: Quotation) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg action-view"
                        onClick={() => onViewQuotation(quotation.id)}
                    >
                        <Eye className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-lg action-edit"
                        onClick={() => onEditQuotation(quotation.id)}
                        disabled={quotation.status === 'Converted'}
                    >
                        <Edit className="size-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem onClick={() => handleDownload(quotation)} className="rounded-lg">
                                <Download className="size-4 mr-2" />
                                Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSend(quotation)} className="rounded-lg">
                                <Send className="size-4 mr-2" />
                                Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleConvertToSO(quotation.id)} className="rounded-lg" disabled={quotation.status === 'Converted'}>
                                <div className="flex items-center">
                                    <FileText className="size-4 mr-2" />
                                    Convert to SO
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive rounded-lg"
                                onClick={() => handleDeleteClick(quotation)}
                                disabled={quotation.status === 'Converted'}
                            >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    const renderMobileItem = (quotation: Quotation) => (
        <SmartCard
            title={quotation.quotationNumber}
            subtitle={quotation.customer?.name}
            action={
                <Badge variant="outline" className={cn("capitalize px-2 py-0.5", getStatusColor(quotation.status))}>
                    {quotation.status}
                </Badge>
            }
            onClick={() => onViewQuotation(quotation.id)}
            footer={
                <div className="flex items-center justify-between w-full">
                    <div className="text-lg font-bold text-primary">
                        {formatCurrency(Number(quotation.totalAmount || 0))}
                    </div>
                </div>
            }
        >
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{formatDate(quotation.date)}</span>
            </div>
        </SmartCard>
    );

    const totalValue = (quotations || []).reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);
    const pendingCount = (quotations || []).filter(q => q.status === 'Sent' || q.status === 'Viewed').length;
    const acceptedCount = (quotations || []).filter(q => q.status === 'Accepted').length;

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1 pb-2">
                <StatsCard
                    label="Total Quotations"
                    value={quotations.length}
                    icon={FileText}
                    gradient="bg-gradient-to-br from-primary to-primary/80"
                    shadowColor="shadow-primary/20"
                />
                <StatsCard
                    label="Total Value"
                    value={formatCurrency(totalValue)}
                    icon={IndianRupee}
                    gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    shadowColor="shadow-emerald-500/20"
                />
                <StatsCard
                    label="Pending"
                    value={pendingCount}
                    icon={Clock}
                    gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                    shadowColor="shadow-amber-500/20"
                />
                <StatsCard
                    label="Accepted"
                    value={acceptedCount}
                    icon={CheckCircle}
                    gradient="bg-gradient-to-br from-teal-500 to-teal-600"
                    shadowColor="shadow-teal-500/20"
                />
            </div>

            <ListFilters
                searchPlaceholder="Search by quotation number..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                statusValue={statusFilter}
                onStatusChange={setStatusFilter}
                onRefresh={onRefresh}
                statusOptions={[
                    { value: "all", label: "All Status" },
                    { value: "draft", label: "Draft" },
                    { value: "sent", label: "Sent" },
                    { value: "accepted", label: "Accepted" },
                    { value: "rejected", label: "Rejected" },
                    { value: "converted", label: "Converted" },
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
                data={filteredQuotations}
                columns={columns}
                mobileRenderer={renderMobileItem}
                isLoading={isLoading}
                onRowClick={(quotation) => onViewQuotation(quotation.id)}
                emptyState={{
                    title: "No quotations found",
                    description: "Create your first quotation to get started",
                    icon: FileText,
                    action: (
                        <Button onClick={onCreateNew} className="mt-2 gap-2 rounded-xl">
                            <Plus className="size-4" />
                            Create First Quotation
                        </Button>
                    )
                }}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">{quotationToDelete?.quotationNumber}</span>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
