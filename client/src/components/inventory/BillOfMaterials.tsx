import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    Plus,
    Search,
    Factory,
    Package,
    ArrowRight,
    Edit,
    Trash2,
    Play,
    Loader2,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { productionService, inventoryService, productsService } from "@/services/modules.service";
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
import { Textarea } from "../ui/textarea";

interface BOMItem {
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
}

interface BillOfMaterial {
    id: string;
    name: string;
    code: string;
    finishedProductName: string;
    finishedProductCode: string;
    outputQuantity: number;
    items: BOMItem[];
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    isActive: boolean;
}

// Mock data for demonstration
const mockBOMs: BillOfMaterial[] = [
    {
        id: "1",
        name: "Wooden Chair Assembly",
        code: "BOM-001",
        finishedProductName: "Wooden Chair",
        finishedProductCode: "PROD-FIN-001",
        outputQuantity: 1,
        items: [
            { productId: "rm1", productName: "Plywood Sheet", productCode: "RM-001", quantity: 2, unit: "pcs", costPerUnit: 500 },
            { productId: "rm2", productName: "Wood Screws", productCode: "RM-002", quantity: 12, unit: "pcs", costPerUnit: 5 },
            { productId: "rm3", productName: "Wood Polish", productCode: "RM-003", quantity: 0.5, unit: "ltr", costPerUnit: 200 },
        ],
        laborCost: 200,
        overheadCost: 50,
        totalCost: 1410,
        isActive: true,
    },
    {
        id: "2",
        name: "Metal Table Assembly",
        code: "BOM-002",
        finishedProductName: "Metal Folding Table",
        finishedProductCode: "PROD-FIN-002",
        outputQuantity: 1,
        items: [
            { productId: "rm4", productName: "Metal Frame", productCode: "RM-004", quantity: 1, unit: "pcs", costPerUnit: 800 },
            { productId: "rm5", productName: "Table Top (Glass)", productCode: "RM-005", quantity: 1, unit: "pcs", costPerUnit: 600 },
            { productId: "rm6", productName: "Bolts & Nuts Set", productCode: "RM-006", quantity: 1, unit: "set", costPerUnit: 100 },
        ],
        laborCost: 150,
        overheadCost: 75,
        totalCost: 1725,
        isActive: true,
    },
];

export function BillOfMaterials() {
    const [boms, setBoms] = useState<BillOfMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBOM, setSelectedBOM] = useState<BillOfMaterial | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        finishedProductId: "",
        outputQuantity: 1,
        laborCost: 0,
        overheadCost: 0,
        notes: "",
        items: [] as any[],
    });

    const fetchBOMs = async () => {
        setLoading(true);
        try {
            const response = await productionService.getBOMs();
            if (response.success && response.data) {
                const mappedBOMs = response.data.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    code: b.code || "",
                    finishedProductName: b.finishedProduct.name,
                    finishedProductCode: b.finishedProduct.code || "",
                    outputQuantity: Number(b.outputQuantity),
                    items: b.items.map((i: any) => ({
                        productId: i.productId,
                        productName: i.product.name,
                        productCode: i.product.code || "",
                        quantity: Number(i.quantity),
                        unit: i.product.unit || "pcs",
                        costPerUnit: Number(i.product.purchasePrice || 0),
                    })),
                    laborCost: Number(b.laborCost),
                    overheadCost: Number(b.overheadCost),
                    totalCost: Number(b.totalCost),
                    isActive: b.isActive,
                }));
                setBoms(mappedBOMs);
                if (mappedBOMs.length > 0 && !selectedBOM) {
                    setSelectedBOM(mappedBOMs[0]);
                }
            }
        } catch (error) {
            toast.error("Failed to fetch BOMs");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productsService.getAll();
            if (response.success && response.data) {
                setProducts(response.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchBOMs();
        fetchProducts();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            finishedProductId: "",
            outputQuantity: 1,
            laborCost: 0,
            overheadCost: 0,
            notes: "",
            items: [],
        });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: "", quantity: 1 }]
        });
    };

    const removeItem = (idx: number) => {
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (idx: number, field: string, value: any) => {
        const newItems = [...formData.items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.finishedProductId || formData.items.length === 0) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            const response = await productionService.createBOM(formData);
            if (response.success) {
                toast.success("BOM created successfully");
                setIsDialogOpen(false);
                fetchBOMs();
                resetForm();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create BOM");
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

    const filteredBOMs = boms.filter(
        (b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.finishedProductName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleManufacture = (bom: BillOfMaterial) => {
        toast.success(`Started manufacturing: ${bom.finishedProductName}`);
        // In production, this would create stock movements and update inventory
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Bill of Materials</h1>
                    <p className="text-muted-foreground">
                        Define raw materials needed to manufacture finished goods
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create BOM
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by BOM name or finished product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : boms.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-muted/20">
                    <Factory className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-xl font-medium">No Bill of Materials found</p>
                    <p className="text-muted-foreground mt-1">Start by creating your first BOM</p>
                    <Button
                        variant="link"
                        onClick={() => setIsDialogOpen(true)}
                        className="mt-4"
                    >
                        Create BOM
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* BOM List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Factory className="h-5 w-5" />
                                Bill of Materials ({filteredBOMs.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {filteredBOMs.map((bom) => (
                                    <div
                                        key={bom.id}
                                        onClick={() => setSelectedBOM(bom)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedBOM?.id === bom.id
                                            ? "border-primary bg-primary/5"
                                            : "hover:border-muted-foreground/30"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {bom.code}
                                                    </span>
                                                    <Badge variant={bom.isActive ? "default" : "secondary"}>
                                                        {bom.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <h3 className="font-semibold mt-1">{bom.name}</h3>
                                            </div>
                                            <span className="font-bold text-primary">
                                                {formatCurrency(bom.totalCost)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                            <Package className="h-4 w-4" />
                                            <span>Produces: {bom.finishedProductName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline">{bom.items.length} raw materials</Badge>
                                            <Badge variant="outline">Output: {bom.outputQuantity}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* BOM Detail */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {selectedBOM ? selectedBOM.name : "Select a BOM"}
                            </CardTitle>
                            <CardDescription>
                                {selectedBOM
                                    ? `Raw materials and costs for ${selectedBOM.finishedProductName}`
                                    : "Click on a BOM to view details"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!selectedBOM ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Factory className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Select a Bill of Materials</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Finished Product */}
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-600 font-medium">Finished Product</p>
                                        <p className="font-bold text-green-700">{selectedBOM.finishedProductName}</p>
                                        <p className="text-xs text-green-600 font-mono">{selectedBOM.finishedProductCode}</p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex justify-center">
                                        <div className="bg-muted p-2 rounded-full">
                                            <ArrowRight className="h-4 w-4 rotate-[-90deg]" />
                                        </div>
                                    </div>

                                    {/* Raw Materials */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-muted px-4 py-2 font-medium">Raw Materials</div>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2 px-4">Material</th>
                                                    <th className="text-right py-2 px-4">Qty</th>
                                                    <th className="text-right py-2 px-4">Rate</th>
                                                    <th className="text-right py-2 px-4">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedBOM.items.map((item, idx) => (
                                                    <tr key={idx} className="border-b">
                                                        <td className="py-2 px-4">
                                                            <div>
                                                                <p className="font-medium">{item.productName}</p>
                                                                <p className="text-xs text-muted-foreground">{item.productCode}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-4 text-right">
                                                            {item.quantity} {item.unit}
                                                        </td>
                                                        <td className="py-2 px-4 text-right font-mono">
                                                            {formatCurrency(item.costPerUnit)}
                                                        </td>
                                                        <td className="py-2 px-4 text-right font-mono font-medium">
                                                            {formatCurrency(item.quantity * item.costPerUnit)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Cost Summary */}
                                    <div className="space-y-2 p-4 bg-muted rounded-lg">
                                        <div className="flex justify-between">
                                            <span>Materials Cost</span>
                                            <span className="font-mono">
                                                {formatCurrency(
                                                    selectedBOM.items.reduce((sum, i) => sum + i.quantity * i.costPerUnit, 0)
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Labor Cost</span>
                                            <span className="font-mono">{formatCurrency(selectedBOM.laborCost)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Overhead</span>
                                            <span className="font-mono">{formatCurrency(selectedBOM.overheadCost)}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 font-bold">
                                            <span>Total Cost</span>
                                            <span className="font-mono text-primary">
                                                {formatCurrency(selectedBOM.totalCost)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button className="flex-1" onClick={() => handleManufacture(selectedBOM)}>
                                            <Play className="h-4 w-4 mr-2" />
                                            Manufacture
                                        </Button>
                                        <Button variant="outline">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" className="text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Create BOM Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Bill of Materials</DialogTitle>
                        <DialogDescription>
                            Define the recipe for manufacturing a finished product.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>BOM Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Luxury Chair Set"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>BOM Code</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., BOM-001"
                                />
                            </div>
                        </div>

                        {/* Product Mapping */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Finished Product *</Label>
                                <Select
                                    value={formData.finishedProductId}
                                    onValueChange={(val) => setFormData({ ...formData, finishedProductId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} ({p.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Output Quantity *</Label>
                                <Input
                                    type="number"
                                    value={formData.outputQuantity}
                                    onChange={(e) => setFormData({ ...formData, outputQuantity: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Raw Materials / Components</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Material
                                </Button>
                            </div>

                            {formData.items.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground">
                                    No materials added yet
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {formData.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg">
                                            <div className="flex-1 space-y-1.5">
                                                <Label className="text-xs">Product</Label>
                                                <Select
                                                    value={item.productId}
                                                    onValueChange={(val) => handleItemChange(idx, "productId", val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Material" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((p) => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-24 space-y-1.5">
                                                <Label className="text-xs">Qty</Label>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500"
                                                onClick={() => removeItem(idx)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Costs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Labor Cost</Label>
                                <Input
                                    type="number"
                                    value={formData.laborCost}
                                    onChange={(e) => setFormData({ ...formData, laborCost: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Overhead Cost</Label>
                                <Input
                                    type="number"
                                    value={formData.overheadCost}
                                    onChange={(e) => setFormData({ ...formData, overheadCost: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional manufacturing instructions..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create BOM"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default BillOfMaterials;
