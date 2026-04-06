import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { gstService } from "@/services/modules.service";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
        {name}
    </span>
);
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

interface TDSTCSEntry {
    id: string;
    type: "TDS" | "TCS";
    sectionCode: string;
    partyName: string;
    partyPan: string;
    referenceNumber: string;
    baseAmount: number;
    rate: number;
    taxAmount: number;
    transactionDate: string;
    status: "PENDING" | "FILED" | "PAID";
}

// Common TDS/TCS sections
const sections = {
    TDS: [
        { code: "194C", desc: "Contractors", rate: 1 },
        { code: "194J", desc: "Professional Fees", rate: 10 },
        { code: "194H", desc: "Commission", rate: 5 },
        { code: "194I", desc: "Rent", rate: 10 },
    ],
    TCS: [
        { code: "206C(1)", desc: "Sale of scrap", rate: 1 },
        { code: "206C(1H)", desc: "Sale above ₹50L", rate: 0.1 },
    ],
};

export function TDSTCSManagement() {
    const [entries, setEntries] = useState<TDSTCSEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<"ALL" | "TDS" | "TCS">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        type: "TDS" as "TDS" | "TCS",
        sectionCode: "",
        partyName: "",
        partyPan: "",
        referenceNumber: "",
        referenceType: "MANUAL",
        referenceId: "",
        baseAmount: 0,
        rate: 0,
        taxAmount: 0,
        transactionDate: new Date().toISOString().split("T")[0],
    });

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const response = await gstService.getTDSTCSEntries();
            if (response.success && response.data) {
                const mappedEntries = response.data.map((e: any) => ({
                    ...e,
                    baseAmount: Number(e.baseAmount),
                    rate: Number(e.rate),
                    taxAmount: Number(e.taxAmount),
                    transactionDate: e.transactionDate.split("T")[0],
                }));
                setEntries(mappedEntries);
            }
        } catch (error) {
            toast.error("Failed to fetch tax records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const calculateTax = (base: number, rate: number) => {
        return (base * rate) / 100;
    };

    const handleBaseAmountChange = (val: number) => {
        const tax = calculateTax(val, formData.rate);
        setFormData({ ...formData, baseAmount: val, taxAmount: tax });
    };

    const handleSectionChange = (val: string) => {
        const section = [...sections.TDS, ...sections.TCS].find((s) => s.code === val);
        const rate = section?.rate || 0;
        const tax = calculateTax(formData.baseAmount, rate);
        setFormData({ ...formData, sectionCode: val, rate, taxAmount: tax });
    };

    const handleSubmit = async () => {
        if (!formData.partyName || !formData.sectionCode || formData.baseAmount <= 0) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            const response = await gstService.createTDSTCSEntry({
                ...formData,
                referenceId: formData.referenceId || formData.referenceNumber,
                referenceType: formData.referenceType || "MANUAL"
            });
            if (response.success) {
                toast.success("Entry recorded successfully");
                setIsDialogOpen(false);
                fetchEntries();
                setFormData({
                    type: "TDS",
                    sectionCode: "",
                    partyName: "",
                    partyPan: "",
                    referenceNumber: "",
                    referenceType: "MANUAL",
                    referenceId: "",
                    baseAmount: 0,
                    rate: 0,
                    taxAmount: 0,
                    transactionDate: new Date().toISOString().split("T")[0],
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save entry");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
            case "FILED":
                return <Badge className="bg-blue-100 text-blue-700">Filed</Badge>;
            case "PAID":
                return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const filteredEntries = entries.filter((e) => {
        const matchesType = filterType === "ALL" || e.type === filterType;
        const matchesSearch =
            e.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const stats = {
        totalTDS: entries.filter((e) => e.type === "TDS").reduce((sum, e) => sum + e.taxAmount, 0),
        totalTCS: entries.filter((e) => e.type === "TCS").reduce((sum, e) => sum + e.taxAmount, 0),
        pending: entries.filter((e) => e.status === "PENDING").length,
    };

    return (
        <div className="space-y-[24px] p-[24px] animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">TDS / TCS Management</h1>
                    <p className="text-body-sm font-medium text-muted-foreground mt-[4px]">
                        Track Tax Deducted/Collected at Source
                    </p>
                </div>
                <div className="flex gap-[12px]">
                    <Button variant="outline" className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
                        <MIcon name="download" className="text-[18px]" />
                        Export
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold">
                        <MIcon name="add" className="text-[18px]" />
                        Add Entry
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
                <Card className="rounded-[16px] border-blue-200 dark:border-blue-900/50 shadow-sm bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="p-[20px]">
                        <div className="flex items-center gap-[16px]">
                            <div className="bg-blue-100 dark:bg-blue-900/40 p-[12px] rounded-[12px]">
                                <MIcon name="calculate" className="text-[24px] text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider mb-[4px]">Total TDS Deducted</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {formatCurrency(stats.totalTDS)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[16px] border-purple-200 dark:border-purple-900/50 shadow-sm bg-purple-50 dark:bg-purple-950/20">
                    <CardContent className="p-[20px]">
                        <div className="flex items-center gap-[16px]">
                            <div className="bg-purple-100 dark:bg-purple-900/40 p-[12px] rounded-[12px]">
                                <MIcon name="business" className="text-[24px] text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-purple-600/80 dark:text-purple-400/80 uppercase tracking-wider mb-[4px]">Total TCS Collected</p>
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                    {formatCurrency(stats.totalTCS)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[16px] border-amber-200 dark:border-amber-900/50 shadow-sm bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="p-[20px]">
                        <div className="flex items-center gap-[16px]">
                            <div className="bg-amber-100 dark:bg-amber-900/40 p-[12px] rounded-[12px]">
                                <MIcon name="description" className="text-[24px] text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider mb-[4px]">Pending Filing</p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-[16px]">
                <div className="relative flex-1">
                    <MIcon name="search" className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground" />
                    <Input
                        placeholder="Search by party name or reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-[40px] h-[40px] rounded-[8px] bg-card border-border"
                    />
                </div>
                <div className="flex gap-[8px]">
                    {(["ALL", "TDS", "TCS"] as const).map((type) => (
                        <Button
                            key={type}
                            variant={filterType === type ? "default" : "outline"}
                            className="h-[40px] px-[16px] rounded-[8px] font-bold"
                            onClick={() => setFilterType(type)}
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Entries Table */}
            <Card className="rounded-[16px] border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="p-[20px] pb-[16px] border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-2xl font-bold text-foreground">TDS/TCS Entries ({filteredEntries.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-[60px]">
                            <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="text-center py-[60px] text-muted-foreground">
                            <MIcon name="business" className="text-[48px] mx-auto mb-[12px] opacity-20" />
                            <p className="font-medium">No records found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted dark:bg-slate-950 border-b border-border">
                                    <tr>
                                        <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                                        <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Section</th>
                                        <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Party</th>
                                        <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Reference</th>
                                        <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Base Amount</th>
                                        <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Rate</th>
                                        <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Tax</th>
                                        <th className="px-[24px] py-[16px] text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.map((entry, index) => (
                                        <tr key={entry.id} className={cn(
                                            "border-b border-border hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors",
                                            index === filteredEntries.length - 1 && "border-b-0"
                                        )}>
                                            <td className="px-[24px] py-[16px]">
                                                <Badge variant={entry.type === "TDS" ? "default" : "secondary"} className="rounded-[6px] font-bold">
                                                    {entry.type}
                                                </Badge>
                                            </td>
                                            <td className="px-[24px] py-[16px] font-mono text-body-sm text-foreground dark:text-muted-foreground font-bold">{entry.sectionCode}</td>
                                            <td className="px-[24px] py-[16px]">
                                                <div>
                                                    <p className="text-body-sm font-bold text-foreground">{entry.partyName}</p>
                                                    <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mt-[2px]">{entry.partyPan}</p>
                                                </div>
                                            </td>
                                            <td className="px-[24px] py-[16px] font-mono text-body-sm font-medium text-muted-foreground">{entry.referenceNumber}</td>
                                            <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-medium text-foreground dark:text-muted-foreground">
                                                {formatCurrency(entry.baseAmount)}
                                            </td>
                                            <td className="px-[24px] py-[16px] text-right text-body-sm font-medium text-foreground dark:text-muted-foreground">{entry.rate}%</td>
                                            <td className="px-[24px] py-[16px] text-right font-mono text-body-sm font-bold text-foreground">
                                                {formatCurrency(entry.taxAmount)}
                                            </td>
                                            <td className="px-[24px] py-[16px] text-center">{getStatusBadge(entry.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* New Entry Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl p-[24px] rounded-[16px] bg-card border-border">
                    <DialogHeader className="mb-[16px]">
                        <DialogTitle className="text-2xl font-bold text-foreground">Record New TDS/TCS Entry</DialogTitle>
                        <DialogDescription className="text-body-sm font-medium text-muted-foreground">
                            Manually record tax deductions or collections.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-[16px] py-[8px]">
                        <div className="grid grid-cols-2 gap-[16px]">
                            <div className="space-y-[8px]">
                                <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Entry Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger className="h-[40px] rounded-[8px] border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TDS">TDS (Deduction)</SelectItem>
                                        <SelectItem value="TCS">TCS (Collection)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-[8px]">
                                <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Section Code *</Label>
                                <Select
                                    value={formData.sectionCode}
                                    onValueChange={handleSectionChange}
                                >
                                    <SelectTrigger className="h-[40px] rounded-[8px] border-slate-200">
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(formData.type === "TDS" ? sections.TDS : sections.TCS).map((s) => (
                                            <SelectItem key={s.code} value={s.code}>
                                                {s.code} - {s.desc} ({s.rate}%)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-[8px]">
                            <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Party Name *</Label>
                            <Input
                                value={formData.partyName}
                                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                placeholder="Recipient or Collection Party"
                                className="h-[40px] rounded-[8px] border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-[16px]">
                            <div className="space-y-[8px]">
                                <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Party PAN</Label>
                                <Input
                                    value={formData.partyPan}
                                    onChange={(e) => setFormData({ ...formData, partyPan: e.target.value.toUpperCase() })}
                                    maxLength={10}
                                    placeholder="e.g., ABCDE1234F"
                                    className="h-[40px] rounded-[8px] border-slate-200 uppercase"
                                />
                            </div>
                            <div className="space-y-[8px]">
                                <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Reference #</Label>
                                <Input
                                    value={formData.referenceNumber}
                                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                    placeholder="Invoice or Receipt #"
                                    className="h-[40px] rounded-[8px] border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-[16px]">
                            <div className="space-y-[8px]">
                                <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Base Amount *</Label>
                                <Input
                                    type="number"
                                    value={formData.baseAmount}
                                    onChange={(e) => handleBaseAmountChange(Number(e.target.value))}
                                    className="h-[40px] rounded-[8px] border-slate-200"
                                />
                            </div>
                            <div className="space-y-[8px]">
                                <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Tax Rate (%)</Label>
                                <Input value={formData.rate} readOnly className="h-[40px] rounded-[8px] bg-muted dark:bg-card border-slate-200 font-bold" />
                            </div>
                            <div className="space-y-[8px]">
                                <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Tax Amount</Label>
                                <Input value={formData.taxAmount} readOnly className="h-[40px] rounded-[8px] bg-primary/5 border-primary/20 font-bold text-primary" />
                            </div>
                        </div>

                        <div className="space-y-[8px]">
                            <Label className="text-[12px] font-bold text-foreground dark:text-muted-foreground">Transaction Date</Label>
                            <Input
                                type="date"
                                value={formData.transactionDate}
                                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                                className="h-[40px] rounded-[8px] border-slate-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-[24px]">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting} className="h-[40px] px-[16px] rounded-[8px] font-bold">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting} className="h-[40px] px-[16px] rounded-[8px] font-bold gap-[8px]">
                            {submitting ? (
                                <>
                                    <MIcon name="sync" className="text-[16px] animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Record Entry"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Section Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <Card className="rounded-[16px] border-border shadow-sm bg-card">
                    <CardHeader className="p-[20px] pb-[16px]">
                        <CardTitle className="text-2xl font-bold text-foreground">TDS Sections</CardTitle>
                    </CardHeader>
                    <CardContent className="p-[20px] pt-0">
                        <div className="space-y-[8px]">
                            {sections.TDS.map((s) => (
                                <div key={s.code} className="flex justify-between items-center p-[12px] border border-border rounded-[8px] hover:border-border transition-colors">
                                    <span className="font-mono text-body-sm font-bold text-foreground dark:text-muted-foreground">{s.code}</span>
                                    <span className="text-body-sm text-muted-foreground font-medium text-right flex-1 mx-[12px]">{s.desc}</span>
                                    <Badge variant="outline" className="rounded-[4px] font-bold text-[11px] bg-muted dark:bg-card px-[8px] py-[2px]">{s.rate}%</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[16px] border-border shadow-sm bg-card">
                    <CardHeader className="p-[20px] pb-[16px]">
                        <CardTitle className="text-2xl font-bold text-foreground">TCS Sections</CardTitle>
                    </CardHeader>
                    <CardContent className="p-[20px] pt-0">
                        <div className="space-y-[8px]">
                            {sections.TCS.map((s) => (
                                <div key={s.code} className="flex justify-between items-center p-[12px] border border-border rounded-[8px] hover:border-border transition-colors">
                                    <span className="font-mono text-body-sm font-bold text-foreground dark:text-muted-foreground">{s.code}</span>
                                    <span className="text-body-sm text-muted-foreground font-medium text-right flex-1 mx-[12px]">{s.desc}</span>
                                    <Badge variant="outline" className="rounded-[4px] font-bold text-[11px] bg-muted dark:bg-card px-[8px] py-[2px]">{s.rate}%</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default TDSTCSManagement;
