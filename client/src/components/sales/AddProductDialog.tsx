import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Sheet, SheetContent } from "../ui/sheet";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { productsService } from "../../services/modules.service";
import { toast } from "sonner";
import { Loader2, Package, IndianRupee, Percent, Tag, Box, FileText, ChevronLeft, Info } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { GST_RATES, GST_MODES, calculateGST, type GSTMode, DEFAULT_GST_RATE } from "../../constants/tax";

interface AddProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (product: any) => void;
}

export function AddProductDialog({ open, onOpenChange, onSuccess }: AddProductDialogProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        sellingPrice: "",
        purchasePrice: "",
        unit: "pcs",
        gstRate: DEFAULT_GST_RATE,
        hsnCode: "",
        sacCode: "",
        category: "",
        openingStock: "",
        reorderLevel: "",
        taxApplicability: "taxable" as "taxable" | "exempt" | "nil",
        gstMode: "exclusive" as GSTMode,
        cessRate: "",
    });

    const resetForm = () => {
        setFormData({
            name: "", code: "", description: "", sellingPrice: "", purchasePrice: "",
            unit: "pcs", gstRate: DEFAULT_GST_RATE, hsnCode: "", sacCode: "", category: "",
            openingStock: "", reorderLevel: "", taxApplicability: "taxable", gstMode: "exclusive", cessRate: "",
        });
        setActiveTab("basic");
    };

    // ── Live tax breakdown preview ──
    const sellingTaxBreakdown = useMemo(() => {
        const price = parseFloat(formData.sellingPrice) || 0;
        if (price <= 0 || formData.taxApplicability !== "taxable") return null;
        const result = calculateGST(price, formData.gstRate, false, formData.gstMode);
        const cessAmt = formData.cessRate ? (result.baseAmount * (parseFloat(formData.cessRate) || 0)) / 100 : 0;
        return { ...result, cess: cessAmt, grandTotal: result.totalAmount + cessAmt };
    }, [formData.sellingPrice, formData.gstRate, formData.gstMode, formData.taxApplicability, formData.cessRate]);

    const purchaseTaxBreakdown = useMemo(() => {
        const price = parseFloat(formData.purchasePrice) || 0;
        if (price <= 0 || formData.taxApplicability !== "taxable") return null;
        const result = calculateGST(price, formData.gstRate, false, formData.gstMode);
        const cessAmt = formData.cessRate ? (result.baseAmount * (parseFloat(formData.cessRate) || 0)) / 100 : 0;
        return { ...result, cess: cessAmt, grandTotal: result.totalAmount + cessAmt };
    }, [formData.purchasePrice, formData.gstRate, formData.gstMode, formData.taxApplicability, formData.cessRate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) { toast.error("Product name is required"); return; }
        if (!formData.sellingPrice) { toast.error("Selling price is required"); return; }

        setLoading(true);
        try {
            const response = await productsService.create({
                ...formData,
                sellingPrice: Number(formData.sellingPrice),
                purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
                gstRate: formData.taxApplicability === "taxable" ? Number(formData.gstRate) : 0,
                openingStock: formData.openingStock ? Number(formData.openingStock) : 0,
                reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : 0,
                cessRate: formData.cessRate ? Number(formData.cessRate) : 0,
            } as any);

            toast.success("Product added successfully");
            onSuccess(response.data);
            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            console.error("Failed to create product:", error);
            toast.error(error.message || "Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    const halfRate = (Number(formData.gstRate) / 2);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="min-w-[100vw] sm:min-w-[550px] lg:min-w-[600px] p-0 overflow-hidden flex flex-col [&>button]:hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border">
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-muted size-9">
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Package className="size-5 text-brand-primary" />
                        <h1 className="text-xl font-bold text-foreground">Add New Product</h1>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="pricing">Pricing & Tax</TabsTrigger>
                                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                            </TabsList>

                            {/* Basic Info Tab */}
                            <TabsContent value="basic" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">
                                        Product Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Laptop Stand Pro" className="h-10" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-sm font-medium flex items-center gap-1.5"><Tag className="size-3.5" /> SKU / Product Code</Label>
                                        <Input id="code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="PROD-001" className="h-10 font-mono" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                                        <Input id="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Electronics, Furniture..." className="h-10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1.5"><FileText className="size-3.5" /> Description</Label>
                                    <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the product..." className="min-h-[80px] resize-none" />
                                </div>
                            </TabsContent>

                            {/* ═══════════════════════ Pricing & Tax Tab ═══════════════════════ */}
                            <TabsContent value="pricing" className="space-y-5 mt-4">
                                {/* ── Tax Applicability ── */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tax Applicability</Label>
                                    <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
                                        {[
                                            { value: "taxable", label: "Taxable" },
                                            { value: "exempt", label: "Exempt" },
                                            { value: "nil", label: "Nil Rated" },
                                        ].map(opt => (
                                            <button key={opt.value} type="button" onClick={() => setFormData({ ...formData, taxApplicability: opt.value as any })}
                                                className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${formData.taxApplicability === opt.value ? "bg-brand-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.taxApplicability === "exempt" && <p className="text-xs text-muted-foreground">Exempt goods are not subject to GST (e.g., fresh fruits, vegetables, grains)</p>}
                                    {formData.taxApplicability === "nil" && <p className="text-xs text-muted-foreground">Nil rated goods have 0% GST but appear on returns (e.g., salt, handloom)</p>}
                                </div>

                                {/* ── GST Inclusive / Exclusive Toggle ── */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Price Type</Label>
                                    <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-1">
                                        {GST_MODES.map(mode => (
                                            <button key={mode.value} type="button" onClick={() => setFormData({ ...formData, gstMode: mode.value as GSTMode })}
                                                className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${formData.gstMode === mode.value ? "bg-brand-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info className="size-3" />
                                        {formData.gstMode === "inclusive" ? "Prices include GST. Tax will be back-calculated from the price." : "Prices are before GST. Tax will be added on top."}
                                    </p>
                                </div>

                                {/* ── Selling & Purchase Price ── */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sellingPrice" className="text-sm font-medium flex items-center gap-1.5">
                                            <IndianRupee className="size-3.5" /> Selling Price <span className="text-destructive">*</span>
                                        </Label>
                                        <Input id="sellingPrice" type="number" required value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} placeholder="0.00" min="0" step="0.01" className="h-10" />
                                        {sellingTaxBreakdown && (
                                            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-lg p-2.5 space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground"><span>Base Price</span><span className="font-mono">₹{sellingTaxBreakdown.baseAmount.toFixed(2)}</span></div>
                                                <div className="flex justify-between text-xs text-muted-foreground"><span>CGST ({halfRate}%)</span><span className="font-mono">₹{sellingTaxBreakdown.cgst.toFixed(2)}</span></div>
                                                <div className="flex justify-between text-xs text-muted-foreground"><span>SGST ({halfRate}%)</span><span className="font-mono">₹{sellingTaxBreakdown.sgst.toFixed(2)}</span></div>
                                                {sellingTaxBreakdown.cess > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Cess</span><span className="font-mono">₹{sellingTaxBreakdown.cess.toFixed(2)}</span></div>}
                                                <div className="flex justify-between text-xs font-semibold text-foreground pt-1 border-t border-green-200 dark:border-green-800"><span>Total</span><span className="font-mono">₹{sellingTaxBreakdown.grandTotal.toFixed(2)}</span></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="purchasePrice" className="text-sm font-medium flex items-center gap-1.5">
                                            <IndianRupee className="size-3.5" /> Purchase Price
                                        </Label>
                                        <Input id="purchasePrice" type="number" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} placeholder="0.00" min="0" step="0.01" className="h-10" />
                                        {purchaseTaxBreakdown && (
                                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-2.5 space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground"><span>Base Price</span><span className="font-mono">₹{purchaseTaxBreakdown.baseAmount.toFixed(2)}</span></div>
                                                <div className="flex justify-between text-xs text-muted-foreground"><span>CGST ({halfRate}%)</span><span className="font-mono">₹{purchaseTaxBreakdown.cgst.toFixed(2)}</span></div>
                                                <div className="flex justify-between text-xs text-muted-foreground"><span>SGST ({halfRate}%)</span><span className="font-mono">₹{purchaseTaxBreakdown.sgst.toFixed(2)}</span></div>
                                                {purchaseTaxBreakdown.cess > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Cess</span><span className="font-mono">₹{purchaseTaxBreakdown.cess.toFixed(2)}</span></div>}
                                                <div className="flex justify-between text-xs font-semibold text-foreground pt-1 border-t border-blue-200 dark:border-blue-800"><span>Total</span><span className="font-mono">₹{purchaseTaxBreakdown.grandTotal.toFixed(2)}</span></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Margin Preview ── */}
                                {sellingTaxBreakdown && purchaseTaxBreakdown && (
                                    <div className="bg-muted/30 border border-border rounded-lg p-3 flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Profit Margin (before tax)</span>
                                        <span className={`text-sm font-bold font-mono ${(sellingTaxBreakdown.baseAmount - purchaseTaxBreakdown.baseAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ₹{(sellingTaxBreakdown.baseAmount - purchaseTaxBreakdown.baseAmount).toFixed(2)} ({((sellingTaxBreakdown.baseAmount - purchaseTaxBreakdown.baseAmount) / (purchaseTaxBreakdown.baseAmount || 1) * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                )}

                                {/* ── GST Rate ── */}
                                {formData.taxApplicability === "taxable" && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="gstRate" className="text-sm font-medium flex items-center gap-1.5">
                                                    <Percent className="size-3.5" /> GST Rate <span className="text-destructive">*</span>
                                                </Label>
                                                <Select value={formData.gstRate} onValueChange={value => setFormData({ ...formData, gstRate: value })}>
                                                    <SelectTrigger className="h-10"><SelectValue placeholder="Select GST Rate" /></SelectTrigger>
                                                    <SelectContent>
                                                        {GST_RATES.map(rate => (
                                                            <SelectItem key={rate.value} value={rate.value}>
                                                                {rate.label} — {rate.description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {/* Rate split info */}
                                                <p className="text-xs text-muted-foreground">
                                                    Intra-State: CGST {halfRate}% + SGST {halfRate}% | Inter-State: IGST {formData.gstRate}%
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cessRate" className="text-sm font-medium flex items-center gap-1.5">
                                                    <Percent className="size-3.5" /> Cess Rate <span className="text-muted-foreground text-xs">(Optional)</span>
                                                </Label>
                                                <Input id="cessRate" type="number" value={formData.cessRate} onChange={e => setFormData({ ...formData, cessRate: e.target.value })} placeholder="0" min="0" step="0.01" className="h-10" />
                                                <p className="text-xs text-muted-foreground">Compensation cess on luxury/sin goods</p>
                                            </div>
                                        </div>

                                        {/* ── HSN / SAC Code ── */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="hsnCode" className="text-sm font-medium">HSN Code <span className="text-muted-foreground text-xs">(Goods)</span></Label>
                                                <Input id="hsnCode" value={formData.hsnCode} onChange={e => setFormData({ ...formData, hsnCode: e.target.value })} placeholder="e.g. 8471" className="h-10 font-mono" />
                                                <p className="text-xs text-muted-foreground">Harmonized System Nomenclature for goods classification</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sacCode" className="text-sm font-medium">SAC Code <span className="text-muted-foreground text-xs">(Services)</span></Label>
                                                <Input id="sacCode" value={formData.sacCode} onChange={e => setFormData({ ...formData, sacCode: e.target.value })} placeholder="e.g. 998314" className="h-10 font-mono" />
                                                <p className="text-xs text-muted-foreground">Services Accounting Code for service classification</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Inventory Tab */}
                            <TabsContent value="inventory" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="unit" className="text-sm font-medium flex items-center gap-1.5"><Box className="size-3.5" /> Unit of Measure</Label>
                                        <Select value={formData.unit} onValueChange={value => setFormData({ ...formData, unit: value })}>
                                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                                <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                                <SelectItem value="g">Gram (g)</SelectItem>
                                                <SelectItem value="l">Litre (l)</SelectItem>
                                                <SelectItem value="ml">Millilitre (ml)</SelectItem>
                                                <SelectItem value="m">Metre (m)</SelectItem>
                                                <SelectItem value="box">Box</SelectItem>
                                                <SelectItem value="pack">Pack</SelectItem>
                                                <SelectItem value="dozen">Dozen</SelectItem>
                                                <SelectItem value="sqft">Sq. Feet</SelectItem>
                                                <SelectItem value="sqm">Sq. Metre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="openingStock" className="text-sm font-medium">Opening Stock</Label>
                                        <Input id="openingStock" type="number" value={formData.openingStock} onChange={e => setFormData({ ...formData, openingStock: e.target.value })} placeholder="0" min="0" className="h-10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reorderLevel" className="text-sm font-medium">Reorder Level</Label>
                                    <Input id="reorderLevel" type="number" value={formData.reorderLevel} onChange={e => setFormData({ ...formData, reorderLevel: e.target.value })} placeholder="Minimum stock before reorder" min="0" className="h-10" />
                                    <p className="text-xs text-muted-foreground">Get alerts when stock falls below this level</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between px-6 py-3.5 bg-card border-t border-border">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-9 px-5 text-sm font-medium">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="h-9 px-5 text-sm font-medium gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-sm">
                            {loading && <Loader2 className="size-4 animate-spin" />}
                            Add Product
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
