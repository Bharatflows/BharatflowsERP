import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { productsService } from "../../services/modules.service";
import { toast } from "sonner";
import { Loader2, Package, IndianRupee, Percent, Tag, Box, FileText } from "lucide-react";
import { Textarea } from "../ui/textarea";

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
        gstRate: "18",
        hsnCode: "",
        category: "",
        openingStock: "",
        reorderLevel: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Product name is required");
            return;
        }
        if (!formData.sellingPrice) {
            toast.error("Selling price is required");
            return;
        }

        setLoading(true);

        try {
            const response = await productsService.create({
                ...formData,
                sellingPrice: Number(formData.sellingPrice),
                purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
                gstRate: Number(formData.gstRate),
                openingStock: formData.openingStock ? Number(formData.openingStock) : 0,
                reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : 0,
            } as any);

            toast.success("Product added successfully");
            onSuccess(response.data);
            onOpenChange(false);

            // Reset form
            setFormData({
                name: "",
                code: "",
                description: "",
                sellingPrice: "",
                purchasePrice: "",
                unit: "pcs",
                gstRate: "18",
                hsnCode: "",
                category: "",
                openingStock: "",
                reorderLevel: "",
            });
            setActiveTab("basic");
        } catch (error: any) {
            console.error("Failed to create product:", error);
            toast.error(error.message || "Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="size-5 text-primary" />
                        Add New Product
                    </DialogTitle>
                    <DialogDescription>
                        Add product details including pricing, tax info, and inventory
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
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
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Laptop Stand Pro"
                                    className="h-11"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code" className="text-sm font-medium flex items-center gap-1.5">
                                        <Tag className="size-3.5" /> SKU / Product Code
                                    </Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="PROD-001"
                                        className="h-11 font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                                    <Input
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Electronics, Furniture..."
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1.5">
                                    <FileText className="size-3.5" /> Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the product..."
                                    className="min-h-[80px] resize-none"
                                />
                            </div>
                        </TabsContent>

                        {/* Pricing & Tax Tab */}
                        <TabsContent value="pricing" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sellingPrice" className="text-sm font-medium flex items-center gap-1.5">
                                        <IndianRupee className="size-3.5" /> Selling Price <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="sellingPrice"
                                        type="number"
                                        required
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purchasePrice" className="text-sm font-medium flex items-center gap-1.5">
                                        <IndianRupee className="size-3.5" /> Purchase Price
                                    </Label>
                                    <Input
                                        id="purchasePrice"
                                        type="number"
                                        value={formData.purchasePrice}
                                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gstRate" className="text-sm font-medium flex items-center gap-1.5">
                                        <Percent className="size-3.5" /> GST Rate
                                    </Label>
                                    <Select
                                        value={formData.gstRate}
                                        onValueChange={(value) => setFormData({ ...formData, gstRate: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select GST Rate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0% (Exempt)</SelectItem>
                                            <SelectItem value="5">5%</SelectItem>
                                            <SelectItem value="12">12%</SelectItem>
                                            <SelectItem value="18">18%</SelectItem>
                                            <SelectItem value="28">28%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hsnCode" className="text-sm font-medium">HSN Code</Label>
                                    <Input
                                        id="hsnCode"
                                        value={formData.hsnCode}
                                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                                        placeholder="e.g. 8471"
                                        className="h-11 font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">Harmonized System Nomenclature code</p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Inventory Tab */}
                        <TabsContent value="inventory" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="unit" className="text-sm font-medium flex items-center gap-1.5">
                                        <Box className="size-3.5" /> Unit of Measure
                                    </Label>
                                    <Select
                                        value={formData.unit}
                                        onValueChange={(value) => setFormData({ ...formData, unit: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                            <SelectItem value="g">Gram (g)</SelectItem>
                                            <SelectItem value="l">Litre (l)</SelectItem>
                                            <SelectItem value="ml">Millilitre (ml)</SelectItem>
                                            <SelectItem value="m">Metre (m)</SelectItem>
                                            <SelectItem value="box">Box</SelectItem>
                                            <SelectItem value="pack">Pack</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="openingStock" className="text-sm font-medium">Opening Stock</Label>
                                    <Input
                                        id="openingStock"
                                        type="number"
                                        value={formData.openingStock}
                                        onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                                        placeholder="0"
                                        min="0"
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reorderLevel" className="text-sm font-medium">Reorder Level</Label>
                                <Input
                                    id="reorderLevel"
                                    type="number"
                                    value={formData.reorderLevel}
                                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                                    placeholder="Minimum stock before reorder"
                                    min="0"
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">Get alerts when stock falls below this level</p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading && <Loader2 className="size-4 animate-spin" />}
                            Add Product
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
