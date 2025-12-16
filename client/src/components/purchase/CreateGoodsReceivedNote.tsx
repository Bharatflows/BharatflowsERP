import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { partiesService, productsService, purchaseService, settingsService } from "../../services/modules.service";
import { Loader2, Save, Plus, Trash2, Eye, ChevronLeft, User, Package, Truck, ClipboardList, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { AddProductDialog } from "../sales/AddProductDialog";
import { AddSupplierDialog } from "./AddSupplierDialog";

interface CreateGRNProps {
    grnId: string | null;
    onSave: () => void;
    onCancel: () => void;
}

interface GRNItem {
    id: string;
    productId?: string;
    productName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unit: string;
    condition: string;
}

export function CreateGoodsReceivedNote({ grnId, onSave, onCancel }: CreateGRNProps) {
    const isEdit = !!grnId;
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get("orderId");
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [showAddSupplier, setShowAddSupplier] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersRes, productsRes, ordersRes] = await Promise.all([
                    partiesService.getAll({ type: 'SUPPLIER' }),
                    productsService.getAll(),
                    purchaseService.getAll() // Fetch POs to link
                ]);
                setSuppliers(suppliersRes.data || []);
                setProducts(productsRes.data || []);
                setPurchaseOrders(ordersRes.data || []);

                // Fetch next GRN number for new GRNs (only if not linking from a PO)
                if (!isEdit && !orderId) {
                    try {
                        const response = await settingsService.getNextSequenceNumber('GRN');
                        if (response.success && response.data && response.data.nextNumber) {
                            setFormData(prev => ({ ...prev, grnNumber: response.data!.nextNumber }));
                        }
                    } catch (error) {
                        console.error("Failed to fetch next GRN number:", error);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Failed to load master data");
            }
        };
        fetchData();
    }, [isEdit, orderId]);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (orderId) {
                try {
                    const order = await purchaseService.getById(orderId);
                    if (order && order.data) {
                        const orderData = order.data;
                        setFormData(prev => ({
                            ...prev,
                            purchaseOrderId: orderData.id,
                            supplierId: typeof orderData.supplier === 'object' ? orderData.supplier.id : orderData.supplierId || "",
                            notes: `Received against PO #${orderData.orderNumber}`
                        }));

                        // Map items
                        if (orderData.items && Array.isArray(orderData.items)) {
                            const mappedItems = orderData.items.map((item: any) => ({
                                id: Date.now().toString() + Math.random(),
                                productId: item.productId,
                                productName: item.productName || item.name || "",
                                orderedQuantity: item.quantity || 0,
                                receivedQuantity: item.quantity || 0, // Default to full receipt
                                unit: item.unit || "pcs",
                                condition: "Good"
                            }));
                            setItems(mappedItems);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch purchase order:", error);
                    toast.error("Failed to load purchase order details");
                }
            }
        };
        fetchOrderDetails();
    }, [orderId]);

    // Fetch existing GRN data when editing
    useEffect(() => {
        const fetchGRNData = async () => {
            if (isEdit && grnId) {
                try {
                    const response = await purchaseService.getGRNById(grnId);
                    if (response && response.data) {
                        const grnData = response.data;
                        setFormData({
                            grnNumber: grnData.grnNumber || "",
                            purchaseOrderId: grnData.purchaseOrderId || "",
                            supplierId: grnData.supplierId || "",
                            grnDate: grnData.grnDate ? new Date(grnData.grnDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                            receivedDate: grnData.grnDate ? new Date(grnData.grnDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                            challanNumber: grnData.referenceNumber || "",
                            warehouse: grnData.warehouse || "Main Warehouse",
                            notes: grnData.notes || "",
                        });

                        // Map items from GRN data
                        if (grnData.items && Array.isArray(grnData.items)) {
                            const mappedItems = grnData.items.map((item: any) => ({
                                id: item.id || Date.now().toString() + Math.random(),
                                productId: item.productId,
                                productName: item.product?.name || item.productName || "",
                                orderedQuantity: item.quantity || 0,
                                receivedQuantity: item.quantity || 0,
                                unit: item.product?.unit || "pcs",
                                condition: "Good"
                            }));
                            setItems(mappedItems);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch GRN data:", error);
                    toast.error("Failed to load GRN data for editing");
                }
            }
        };
        fetchGRNData();
    }, [isEdit, grnId]);

    // Form state
    const [formData, setFormData] = useState({
        grnNumber: "",
        purchaseOrderId: "",
        supplierId: "",
        grnDate: new Date().toISOString().split("T")[0],
        receivedDate: new Date().toISOString().split("T")[0],
        challanNumber: "",
        warehouse: "Main Warehouse",
        notes: "",
    });

    const [items, setItems] = useState<GRNItem[]>([
        {
            id: "1",
            productName: "",
            orderedQuantity: 0,
            receivedQuantity: 1,
            unit: "pcs",
            condition: "Good",
        },
    ]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Auto-fill supplier if PO is selected
        if (field === "purchaseOrderId") {
            const selectedPO = purchaseOrders.find(po => po.id === value);
            if (selectedPO) {
                setFormData(prev => ({ ...prev, supplierId: selectedPO.supplierId }));
                // Also populate items from PO
                const poItems = (selectedPO.items || []).map((item: any) => ({
                    id: Date.now().toString() + Math.random(),
                    productId: item.productId,
                    productName: item.product?.name || item.productName || "",
                    orderedQuantity: item.quantity,
                    receivedQuantity: item.quantity, // Default to full receipt
                    unit: item.unit || "pcs",
                    condition: "Good"
                }));
                if (poItems.length > 0) setItems(poItems);
            }
        }
    };

    const addItem = () => {
        const newItem: GRNItem = {
            id: Date.now().toString(),
            productName: "",
            orderedQuantity: 0,
            receivedQuantity: 1,
            unit: "pcs",
            condition: "Good",
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof GRNItem, value: any) => {
        setItems(
            items.map((item) => {
                if (item.id === id) {
                    return { ...item, [field]: value };
                }
                return item;
            })
        );
    };

    const selectProduct = (itemId: string, productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
            updateItem(itemId, "productId", productId);
            updateItem(itemId, "productName", product.name);
            updateItem(itemId, "unit", product.unit || "pcs");
        }
    };

    const handleSubmit = async () => {
        if (!formData.supplierId) {
            toast.error("Please select a supplier");
            return;
        }

        const hasEmptyItems = items.some((item) => !item.productName || item.receivedQuantity <= 0);
        if (hasEmptyItems) {
            toast.error("Please fill all item details with valid received quantities");
            return;
        }

        setLoading(true);
        try {
            const grnData = {
                ...formData,
                items: items.map(item => {
                    const product = products.find(p => p.name === item.productName);
                    return {
                        ...item,
                        productId: product?.id
                    };
                }),
                status: 'RECEIVED'
            };

            if (isEdit && grnId) {
                await purchaseService.updateGRN(grnId, grnData);
                toast.success("GRN updated successfully");
            } else {
                await purchaseService.createGRN(grnData);
                toast.success("GRN created successfully");
            }
            onSave();
        } catch (error: any) {
            console.error("Failed to save GRN:", error);
            toast.error(error.message || "Failed to save GRN");
        } finally {
            setLoading(false);
        }
    };

    const handleAddProductSuccess = (newProduct: any) => {
        setProducts([...products, newProduct]);
        if (activeItemId) {
            selectProduct(activeItemId, newProduct.id);
            setActiveItemId(null);
        }
    };

    const handleAddSupplierSuccess = (newSupplier: any) => {
        setSuppliers([...suppliers, newSupplier]);
        setFormData(prev => ({ ...prev, supplierId: newSupplier.id }));
    };

    const selectedSupplier = suppliers.find((s) => s.id === formData.supplierId);
    const selectedPO = purchaseOrders.find((po) => po.id === formData.purchaseOrderId);

    if (isPreviewMode) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => setIsPreviewMode(false)} className="gap-2">
                        <ChevronLeft className="size-4" />
                        Back to Edit
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} className="gap-2 bg-primary text-primary-foreground">
                            <Save className="size-4" />
                            Save GRN
                        </Button>
                    </div>
                </div>

                <Card className="border-0 shadow-lg bg-white overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h1 className="text-4xl font-bold text-primary mb-2">GOODS RECEIVED NOTE</h1>
                                <p className="text-muted-foreground">#{formData.grnNumber}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="font-bold text-xl mb-1">BharatFlow</h2>
                                <p className="text-sm text-muted-foreground">Warehouse: {formData.warehouse}</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex justify-between mb-12">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Supplier</p>
                                {selectedSupplier ? (
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedSupplier.name}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedSupplier.email}</p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">No supplier selected</p>
                                )}
                            </div>
                            <div className="text-right space-y-2">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Received Date</p>
                                    <p className="font-medium">{new Date(formData.receivedDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">PO Reference</p>
                                    <p className="font-medium">{selectedPO ? selectedPO.orderNumber : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Challan No.</p>
                                    <p className="font-medium">{formData.challanNumber || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <table className="w-full">
                                <thead className="border-b-2 border-primary/10">
                                    <tr>
                                        <th className="text-left py-3 font-semibold text-sm text-muted-foreground">Item Description</th>
                                        <th className="text-center py-3 font-semibold text-sm text-muted-foreground w-32">Ordered Qty</th>
                                        <th className="text-center py-3 font-semibold text-sm text-muted-foreground w-32">Received Qty</th>
                                        <th className="text-right py-3 font-semibold text-sm text-muted-foreground w-32">Condition</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-4">
                                                <p className="font-medium">{item.productName}</p>
                                            </td>
                                            <td className="text-center py-4">{item.orderedQuantity || '-'} {item.unit}</td>
                                            <td className="text-center py-4 font-bold">{item.receivedQuantity} {item.unit}</td>
                                            <td className="text-right py-4">{item.condition}</td>
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

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-border/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-muted">
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{isEdit ? "Edit GRN" : "New Goods Received Note"}</h1>
                        <p className="text-muted-foreground text-sm">Record incoming goods and inventory</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsPreviewMode(true)} className="gap-2">
                        <Eye className="size-4" />
                        Preview
                    </Button>
                    <Button onClick={handleSubmit} className="gap-2 bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Save GRN
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Supplier & Details Card */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center gap-2">
                            <User className="size-4 text-primary" />
                            <h3 className="font-semibold text-sm">Supplier & Order Details</h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="po" className="text-sm font-medium flex items-center gap-1.5">
                                        📄 Link Purchase Order
                                        <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                                    </Label>
                                    <Select value={formData.purchaseOrderId} onValueChange={(val) => handleInputChange("purchaseOrderId", val)}>
                                        <SelectTrigger id="po" className="h-11">
                                            <SelectValue placeholder="Search by PO number or supplier..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {purchaseOrders.map((po) => (
                                                <SelectItem key={po.id} value={po.id}>
                                                    {po.orderNumber} - {po.supplier?.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                                        <Info className="size-3 mt-0.5 flex-shrink-0" />
                                        Linking a PO auto-fills items, quantities, and supplier details
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="supplier" className="text-sm font-medium flex items-center gap-1.5">
                                        🏢 Supplier <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={formData.supplierId} onValueChange={(val) => handleInputChange("supplierId", val)} disabled={!!formData.purchaseOrderId}>
                                        <SelectTrigger id="supplier" className="h-11">
                                            <SelectValue placeholder="Search or select a supplier..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {!formData.purchaseOrderId && (
                                                <>
                                                    <div className="p-1">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-primary h-8 px-2 text-sm"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setShowAddSupplier(true);
                                                            }}
                                                        >
                                                            <Plus className="size-3 mr-2" />
                                                            Add New Supplier
                                                        </Button>
                                                    </div>
                                                    <Separator className="my-1" />
                                                </>
                                            )}
                                            {suppliers.map((supplier) => (
                                                <SelectItem key={supplier.id} value={supplier.id}>
                                                    {supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!!formData.purchaseOrderId && (
                                        <p className="text-xs text-muted-foreground">
                                            Auto-filled from linked Purchase Order
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="challanNumber" className="text-sm font-medium flex items-center gap-1.5">
                                    📦 Delivery Challan / DC Number
                                </Label>
                                <Input
                                    id="challanNumber"
                                    value={formData.challanNumber}
                                    onChange={(e) => handleInputChange("challanNumber", e.target.value)}
                                    placeholder="e.g. DC-12345"
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Reference number from supplier's delivery challan
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Card */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="size-4 text-primary" />
                                <h3 className="font-semibold text-sm">Received Items ({items.length})</h3>
                            </div>
                            <Button size="sm" variant="outline" onClick={addItem} className="h-8 gap-1 text-xs">
                                <Plus className="size-3" />
                                Add Item
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <div className="min-w-[600px]">
                                    {/* Header */}
                                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/20 border-b border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <div className="col-span-4">Item Details</div>
                                        <div className="col-span-2 text-center">Ordered</div>
                                        <div className="col-span-2 text-center">Received</div>
                                        <div className="col-span-3 text-left">Condition</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {/* Items */}
                                    <div className="divide-y divide-border/50">
                                        {items.map((item) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-start group hover:bg-muted/20 transition-colors">
                                                {/* Item Details */}
                                                <div className="col-span-4 space-y-2">
                                                    <Select
                                                        value={item.productId || ""}
                                                        onValueChange={(productId) => selectProduct(item.id, productId)}
                                                    >
                                                        <SelectTrigger className="h-9 border-transparent hover:border-border bg-transparent hover:bg-white focus:bg-white transition-all p-0 font-medium">
                                                            <SelectValue placeholder="Select Item" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <div className="p-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-primary h-8 px-2 text-sm"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setActiveItemId(item.id);
                                                                        setShowAddProduct(true);
                                                                    }}
                                                                >
                                                                    <Plus className="size-3 mr-2" />
                                                                    Add New Product
                                                                </Button>
                                                            </div>
                                                            <Separator className="my-1" />
                                                            {products.map((product) => (
                                                                <SelectItem key={product.id} value={product.id}>
                                                                    {product.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Ordered Qty */}
                                                <div className="col-span-2 flex items-center justify-center gap-2">
                                                    <span className="text-sm text-muted-foreground">{item.orderedQuantity || '-'}</span>
                                                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                                                </div>

                                                {/* Received Qty */}
                                                <div className="col-span-2 flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={item.receivedQuantity}
                                                        onChange={(e) => updateItem(item.id, "receivedQuantity", parseFloat(e.target.value) || 0)}
                                                        className="h-9 text-center font-medium"
                                                        min="0"
                                                    />
                                                </div>

                                                {/* Condition */}
                                                <div className="col-span-3">
                                                    <Select
                                                        value={item.condition}
                                                        onValueChange={(val) => updateItem(item.id, "condition", val)}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Good">Good Condition</SelectItem>
                                                            <SelectItem value="Damaged">Damaged</SelectItem>
                                                            <SelectItem value="Wrong Item">Wrong Item</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Delete */}
                                                <div className="col-span-1 text-center opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(item.id)}
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info */}
                    <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-medium">Notes / Remarks</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange("notes", e.target.value)}
                                    placeholder="Any observations about the delivery..."
                                    className="min-h-[100px] resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center gap-2">
                            <ClipboardList className="size-4 text-primary" />
                            <h3 className="font-semibold text-sm">GRN Details</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="grnNumber" className="text-xs font-medium uppercase text-muted-foreground">GRN Number</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground font-medium">#</span>
                                    <Input
                                        id="grnNumber"
                                        value={formData.grnNumber}
                                        onChange={(e) => handleInputChange("grnNumber", e.target.value)}
                                        className="font-mono"
                                        disabled
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="receivedDate" className="text-xs font-medium uppercase text-muted-foreground">Received Date</Label>
                                <Input
                                    id="receivedDate"
                                    type="date"
                                    value={formData.receivedDate}
                                    onChange={(e) => handleInputChange("receivedDate", e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center gap-2">
                            <Truck className="size-4 text-primary" />
                            <h3 className="font-semibold text-sm">Logistics</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="warehouse" className="text-sm font-medium">Warehouse</Label>
                                <Select value={formData.warehouse} onValueChange={(val) => handleInputChange("warehouse", val)}>
                                    <SelectTrigger id="warehouse">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                                        <SelectItem value="Store Room A">Store Room A</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AddProductDialog
                open={showAddProduct}
                onOpenChange={(open) => {
                    setShowAddProduct(open);
                    if (!open) setActiveItemId(null);
                }}
                onSuccess={handleAddProductSuccess}
            />

            <AddSupplierDialog
                open={showAddSupplier}
                onOpenChange={setShowAddSupplier}
                onSuccess={handleAddSupplierSuccess}
            />
        </div>
    );
}
