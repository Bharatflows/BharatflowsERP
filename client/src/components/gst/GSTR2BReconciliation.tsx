import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { gstService } from "../../services/modules.service";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
        {name}
    </span>
);

interface GSTR2BRecord {
    id: string;
    supplierGstin: string;
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    invoiceValue: number;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    matchStatus: "MATCHED" | "UNMATCHED" | "MISMATCH" | "PENDING";
    mismatchReason?: string;
    purchaseBillNumber?: string;
    purchaseBillId?: string;
}

export function GSTR2BReconciliation() {
    const [records, setRecords] = useState<GSTR2BRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [uploading, setUploading] = useState(false);
    const [returnPeriod, setReturnPeriod] = useState("112024"); // Default for demo/late 2024

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await gstService.getGSTR2BRecords({ returnPeriod });
            if (response.success && response.data) {
                const mappedRecords = response.data.map((r: any) => ({
                    ...r,
                    invoiceValue: Number(r.invoiceValue),
                    taxableValue: Number(r.taxableValue),
                    igst: Number(r.igst),
                    cgst: Number(r.cgst),
                    sgst: Number(r.sgst),
                    invoiceDate: r.invoiceDate.split("T")[0],
                }));
                setRecords(mappedRecords);
            }
        } catch (error) {
            toast.error("Failed to fetch reconciliation records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [returnPeriod]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".json")) {
            toast.error("Please upload a JSON file");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content);

                // Expecting { records: [...] } or an array
                const recordsToUpload = Array.isArray(parsedData) ? parsedData : (parsedData.records || []);

                if (recordsToUpload.length === 0) {
                    toast.error("No valid GSTR-2B records found in file");
                    return;
                }

                setUploading(true);
                const response = await gstService.uploadGSTR2B({
                    records: recordsToUpload,
                    returnPeriod
                });

                if (response.success) {
                    toast.success(response.message || "GSTR-2B file uploaded and processed!");
                    fetchRecords();
                } else {
                    toast.error(response.message || "Failed to process GSTR-2B file");
                }
            } catch (error: any) {
                console.error("Parse error:", error);
                toast.error("Failed to parse JSON file: " + error.message);
            } finally {
                setUploading(false);
                // Clear the input
                event.target.value = "";
            }
        };
        reader.readAsText(file);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "MATCHED":
                return (
                    <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 rounded-[6px] font-bold">
                        <MIcon name="check_circle" className="text-[14px] mr-[4px]" />
                        Matched
                    </Badge>
                );
            case "UNMATCHED":
                return (
                    <Badge className="bg-muted dark:bg-card text-foreground dark:text-muted-foreground border-slate-200 dark:border-slate-700 rounded-[6px] font-bold">
                        <MIcon name="cancel" className="text-[14px] mr-[4px]" />
                        Unmatched
                    </Badge>
                );
            case "MISMATCH":
                return (
                    <Badge className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 rounded-[6px] font-bold">
                        <MIcon name="warning" className="text-[14px] mr-[4px]" />
                        Mismatch
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 rounded-[6px] font-bold">
                        <MIcon name="refresh" className="text-[14px] mr-[4px]" />
                        Pending
                    </Badge>
                );
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const filteredRecords = records.filter((r) => {
        const matchesSearch =
            r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.supplierGstin.includes(searchQuery);
        const matchesStatus = filterStatus === "ALL" || r.matchStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: records.length,
        matched: records.filter((r) => r.matchStatus === "MATCHED").length,
        unmatched: records.filter((r) => r.matchStatus === "UNMATCHED").length,
        mismatch: records.filter((r) => r.matchStatus === "MISMATCH").length,
    };

    return (
        <div className="space-y-[24px] animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">GSTR-2B Reconciliation</h2>
                    <p className="text-body-sm font-medium text-muted-foreground mt-[4px]">
                        Match your purchase bills with GSTR-2B portal data
                    </p>
                </div>
                <div className="flex gap-[12px]">
                    <label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <Button variant="outline" asChild disabled={uploading} className="h-[40px] px-[16px] rounded-[8px] font-bold border-border">
                            <span className="cursor-pointer gap-[8px]">
                                <MIcon name="upload" className="text-[18px]" />
                                {uploading ? "Processing..." : "Upload GSTR-2B JSON"}
                            </span>
                        </Button>
                    </label>
                    <Button variant="outline" className="h-[40px] px-[16px] rounded-[8px] font-bold gap-[8px] border-border">
                        <MIcon name="download" className="text-[18px]" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-[16px]">
                <Card className="rounded-[16px] border-border shadow-sm bg-card">
                    <CardContent className="p-[20px]">
                        <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Total Records</p>
                        <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[16px] border-emerald-200 dark:border-emerald-900/50 shadow-sm bg-emerald-50 dark:bg-emerald-950/20">
                    <CardContent className="p-[20px]">
                        <p className="text-[12px] font-bold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mb-[4px]">Matched</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.matched}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[16px] border-border shadow-sm bg-muted dark:bg-slate-800/20">
                    <CardContent className="p-[20px]">
                        <p className="text-[12px] font-bold text-muted-foreground/80 dark:text-muted-foreground/80 uppercase tracking-wider mb-[4px]">Unmatched</p>
                        <p className="text-3xl font-bold text-foreground dark:text-muted-foreground">{stats.unmatched}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[16px] border-amber-200 dark:border-amber-900/50 shadow-sm bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="p-[20px]">
                        <p className="text-[12px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider mb-[4px]">Mismatch</p>
                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.mismatch}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-[16px]">
                <div className="relative flex-1">
                    <MIcon name="search" className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground" />
                    <Input
                        placeholder="Search by supplier name, GSTIN, or invoice number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-[40px] h-[40px] rounded-[8px] border-border bg-card"
                    />
                </div>
                <div className="flex gap-[8px] flex-wrap">
                    {["ALL", "MATCHED", "UNMATCHED", "MISMATCH"].map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? "default" : "outline"}
                            className="h-[40px] px-[16px] rounded-[8px] font-bold"
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Records Table */}
            <Card className="rounded-[16px] border-border shadow-sm overflow-hidden">
                <CardHeader className="p-[20px] pb-[16px] border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-2xl font-bold flex items-center gap-[12px] text-foreground">
                        <MIcon name="description" className="text-[24px] text-primary" />
                        Reconciliation Records
                    </CardTitle>
                    <CardDescription className="text-body-sm font-medium text-muted-foreground">
                        Compare GSTR-2B data with your purchase records
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted dark:bg-slate-950 border-b border-border">
                                <tr>
                                    <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Supplier</th>
                                    <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Invoice</th>
                                    <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                    <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Value</th>
                                    <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Tax</th>
                                    <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                                    <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Our Bill</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((record, index) => (
                                    <tr key={record.id} className={cn(
                                        "border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors",
                                        index === filteredRecords.length - 1 && "border-b-0"
                                    )}>
                                        <td className="px-[24px] py-[16px]">
                                            <div>
                                                <p className="text-body-sm font-bold text-foreground">{record.supplierName}</p>
                                                <p className="text-[12px] font-medium text-muted-foreground font-mono mt-[2px]">
                                                    {record.supplierGstin}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-[24px] py-[16px] font-mono text-body-sm font-bold text-foreground dark:text-muted-foreground">{record.invoiceNumber}</td>
                                        <td className="px-[24px] py-[16px] text-body-sm font-medium text-muted-foreground">
                                            {new Date(record.invoiceDate).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-medium text-foreground dark:text-muted-foreground">
                                            {formatCurrency(record.invoiceValue)}
                                        </td>
                                        <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-bold text-foreground">
                                            {formatCurrency(record.igst + record.cgst + record.sgst)}
                                        </td>
                                        <td className="px-[24px] py-[16px] text-center">
                                            {getStatusBadge(record.matchStatus)}
                                            {record.mismatchReason && (
                                                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-[4px]">{record.mismatchReason}</p>
                                            )}
                                        </td>
                                        <td className="px-[24px] py-[16px]">
                                            {record.purchaseBillId ? (
                                                <Badge variant="outline" className="font-mono text-[10px] font-bold rounded-[4px] border-primary/30 text-primary bg-primary/5">MATCHED</Badge>
                                            ) : (
                                                <Button variant="link" size="sm" className="p-0 h-auto text-body-sm font-bold text-primary">
                                                    Link Bill
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default GSTR2BReconciliation;
