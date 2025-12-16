import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Loader2, Save, Hash, FileText, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Sequence {
    id: string;
    documentType: string;
    prefix: string;
    nextNumber: number;
    format: string | null;
    fiscalYear: string | null;
}

const DOCUMENT_TYPE_LABELS: Record<string, { label: string; description: string; color: string }> = {
    INVOICE: { label: "Invoice", description: "Sales invoices", color: "bg-emerald-100 text-emerald-700" },
    ESTIMATE: { label: "Estimate", description: "Cost estimates", color: "bg-blue-100 text-blue-700" },
    QUOTATION: { label: "Quotation", description: "Price quotations", color: "bg-purple-100 text-purple-700" },
    SALES_ORDER: { label: "Sales Order", description: "Sales orders", color: "bg-amber-100 text-amber-700" },
    DELIVERY_CHALLAN: { label: "Delivery Challan", description: "Delivery notes", color: "bg-cyan-100 text-cyan-700" },
    PURCHASE_ORDER: { label: "Purchase Order", description: "Purchase orders", color: "bg-orange-100 text-orange-700" },
    PURCHASE_BILL: { label: "Purchase Bill", description: "Vendor bills", color: "bg-rose-100 text-rose-700" },
    GRN: { label: "GRN", description: "Goods received", color: "bg-teal-100 text-teal-700" },
    CUSTOMER: { label: "Customer", description: "Customer codes", color: "bg-indigo-100 text-indigo-700" },
    SUPPLIER: { label: "Supplier", description: "Supplier codes", color: "bg-pink-100 text-pink-700" },
    PRODUCT: { label: "Product", description: "Product codes", color: "bg-lime-100 text-lime-700" },
    EMPLOYEE: { label: "Employee", description: "Employee IDs", color: "bg-slate-100 text-slate-700" },
};

// Format placeholders and preview
const formatPreview = (prefix: string, nextNumber: number, format: string): string => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const shortYear = year.slice(-2);

    let result = format || "{PREFIX}-{SEQ:4}";
    result = result.replace("{PREFIX}", prefix);
    result = result.replace("{YEAR}", year);
    result = result.replace("{YY}", shortYear);

    const seqMatch = result.match(/\{SEQ:(\d+)\}/);
    if (seqMatch) {
        const padLength = parseInt(seqMatch[1], 10);
        result = result.replace(seqMatch[0], nextNumber.toString().padStart(padLength, "0"));
    } else {
        result = result.replace("{SEQ}", nextNumber.toString());
    }

    return result;
};

export function DocumentNumberSettings() {
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ prefix: string; nextNumber: string; format: string }>({
        prefix: "",
        nextNumber: "",
        format: "",
    });

    const fetchSequences = async () => {
        try {
            const response = await fetch("/api/v1/settings/sequences", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setSequences(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch sequences:", error);
            toast.error("Failed to load document number settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSequences();
    }, []);

    const handleEdit = (sequence: Sequence) => {
        setEditingId(sequence.id);
        setEditForm({
            prefix: sequence.prefix,
            nextNumber: sequence.nextNumber.toString(),
            format: sequence.format || "{PREFIX}-{SEQ:4}",
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({ prefix: "", nextNumber: "", format: "" });
    };

    const handleSave = async (documentType: string) => {
        if (!editForm.prefix.trim()) {
            toast.error("Prefix is required");
            return;
        }

        const nextNum = parseInt(editForm.nextNumber, 10);
        if (isNaN(nextNum) || nextNum < 1) {
            toast.error("Next number must be at least 1");
            return;
        }

        setSaving(documentType);
        try {
            const response = await fetch(`/api/v1/settings/sequences/${documentType}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    prefix: editForm.prefix.trim().toUpperCase(),
                    nextNumber: nextNum,
                    format: editForm.format.trim() || "{PREFIX}-{SEQ:4}",
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`${DOCUMENT_TYPE_LABELS[documentType]?.label || documentType} settings saved`);
                setEditingId(null);
                fetchSequences();
            } else {
                throw new Error(data.message || "Failed to save");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save settings");
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading document number settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                            <Hash className="size-6 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg text-indigo-900">Document Numbering</h3>
                            <p className="text-sm text-indigo-700 mt-1">
                                Configure auto-generated numbers for invoices, orders, and other documents.
                                Each new document will automatically get the next number in sequence.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="outline" className="bg-white/60">
                                    {"{PREFIX}"} = Prefix
                                </Badge>
                                <Badge variant="outline" className="bg-white/60">
                                    {"{YEAR}"} = 2024
                                </Badge>
                                <Badge variant="outline" className="bg-white/60">
                                    {"{YY}"} = 24
                                </Badge>
                                <Badge variant="outline" className="bg-white/60">
                                    {"{SEQ:4}"} = 0001
                                </Badge>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchSequences} className="gap-2">
                            <RefreshCw className="size-4" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sequence List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sequences.map((sequence) => {
                    const info = DOCUMENT_TYPE_LABELS[sequence.documentType] || {
                        label: sequence.documentType,
                        description: "Custom document",
                        color: "bg-gray-100 text-gray-700",
                    };
                    const isEditing = editingId === sequence.id;
                    const currentPrefix = isEditing ? editForm.prefix : sequence.prefix;
                    const currentNextNumber = isEditing
                        ? parseInt(editForm.nextNumber, 10) || 1
                        : sequence.nextNumber;
                    const currentFormat = isEditing
                        ? editForm.format
                        : sequence.format || "{PREFIX}-{SEQ:4}";

                    return (
                        <Card
                            key={sequence.id}
                            className={`transition-all ${isEditing ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"}`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${info.color}`}>
                                            <FileText className="size-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{info.label}</CardTitle>
                                            <CardDescription className="text-xs">{info.description}</CardDescription>
                                        </div>
                                    </div>
                                    {!isEditing && (
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(sequence)}>
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isEditing ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`prefix-${sequence.id}`} className="text-xs">
                                                    Prefix
                                                </Label>
                                                <Input
                                                    id={`prefix-${sequence.id}`}
                                                    value={editForm.prefix}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, prefix: e.target.value.toUpperCase() })
                                                    }
                                                    placeholder="INV"
                                                    maxLength={10}
                                                    className="h-9 uppercase"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`next-${sequence.id}`} className="text-xs">
                                                    Next Number
                                                </Label>
                                                <Input
                                                    id={`next-${sequence.id}`}
                                                    type="number"
                                                    value={editForm.nextNumber}
                                                    onChange={(e) => setEditForm({ ...editForm, nextNumber: e.target.value })}
                                                    min="1"
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`format-${sequence.id}`} className="text-xs">
                                                Number Format
                                            </Label>
                                            <Input
                                                id={`format-${sequence.id}`}
                                                value={editForm.format}
                                                onChange={(e) => setEditForm({ ...editForm, format: e.target.value })}
                                                placeholder="{PREFIX}-{SEQ:4}"
                                                className="h-9 font-mono text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Eye className="size-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Preview:</span>
                                                <code className="px-2 py-1 bg-slate-100 rounded text-primary font-medium">
                                                    {formatPreview(currentPrefix, currentNextNumber, currentFormat)}
                                                </code>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={handleCancel}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSave(sequence.documentType)}
                                                    disabled={saving === sequence.documentType}
                                                    className="gap-1.5"
                                                >
                                                    {saving === sequence.documentType ? (
                                                        <Loader2 className="size-4 animate-spin" />
                                                    ) : (
                                                        <Save className="size-4" />
                                                    )}
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Prefix</p>
                                                <p className="font-mono font-medium">{sequence.prefix}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Next #</p>
                                                <p className="font-medium">{sequence.nextNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Format</p>
                                                <p className="font-mono text-xs truncate">{sequence.format || "{PREFIX}-{SEQ:4}"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-3 border-t text-sm">
                                            <Eye className="size-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Next:</span>
                                            <code className="px-2 py-1 bg-slate-100 rounded text-primary font-medium">
                                                {formatPreview(currentPrefix, currentNextNumber, currentFormat)}
                                            </code>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
