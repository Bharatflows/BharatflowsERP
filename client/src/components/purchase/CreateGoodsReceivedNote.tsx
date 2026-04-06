import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { partiesService, productsService, purchaseService, settingsService } from "../../services/modules.service";
import { toast } from "sonner";
import {
    Trash2, Save, ChevronLeft, Search, Loader2, PlusCircle, Package
} from "lucide-react";
import { AddSupplierDialog } from "./AddSupplierDialog";
import { AddProductDialog } from "../sales/AddProductDialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { SearchableSelect } from "../ui/searchable-select";

interface GRNItem {
    id: string;
    productId?: string;
    productName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unit: string;
    condition: string;
}

interface CreateGRNProps {
    grnId: string | null;
    onSave: () => void;
    onCancel: () => void;
}

export function CreateGoodsReceivedNote({ grnId, onSave, onCancel }: CreateGRNProps) {
    const isEdit = !!grnId;
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get("orderId");

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showAddSupplier, setShowAddSupplier] = useState(false);

    const [supplierId, setSupplierId] = useState("");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [grnNumber, setGrnNumber] = useState("");
    const [purchaseOrderId, setPurchaseOrderId] = useState("");
    const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
    const [challanNumber, setChallanNumber] = useState("");
    const [warehouse, setWarehouse] = useState("Main Warehouse");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<GRNItem[]>([]);

    const selectedSupplier = suppliers.find(s => s.id === supplierId);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersRes, productsRes, ordersRes] = await Promise.all([
                    partiesService.getAll({ type: 'SUPPLIER' }),
                    productsService.getAll(),
                    purchaseService.getAll()
                ]);
                setSuppliers(suppliersRes.data || []);
                setProducts(productsRes.data || []);
                setPurchaseOrders(ordersRes.data || []);
                if (!isEdit && !orderId) {
                    try {
                        const response = await settingsService.getNextSequenceNumber('GRN');
                        if (response.success && response.data?.nextNumber) setGrnNumber(response.data.nextNumber);
                    } catch (error) { console.error("Failed to fetch next GRN number:", error); }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Failed to load master data");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [isEdit, orderId]);

    // Fetch from linked PO
    useEffect(() => {
        if (orderId) {
            const fetchPO = async () => {
                try {
                    const order = await purchaseService.getById(orderId);
                    const d = order?.data;
                    if (d) {
                        setPurchaseOrderId(d.id);
                        setSupplierId(typeof d.supplier === 'object' ? d.supplier.id : d.supplierId || "");
                        setNotes(`Received against PO #${d.orderNumber}`);
                        if (d.items && Array.isArray(d.items)) {
                            setItems(d.items.map((item: any) => ({
                                id: Date.now().toString() + Math.random(), productId: item.productId,
                                productName: item.productName || item.name || "", orderedQuantity: item.quantity || 0,
                                receivedQuantity: item.quantity || 0, unit: item.unit || "pcs", condition: "Good",
                            })));
                        }
                    }
                } catch (error) { toast.error("Failed to load purchase order details"); }
            };
            fetchPO();
        }
    }, [orderId]);

    // Fetch existing GRN for edit
    useEffect(() => {
        if (isEdit && grnId) {
            const fetchGRN = async () => {
                try {
                    const response = await purchaseService.getGRNById(grnId);
                    const d = response?.data;
                    if (d) {
                        setGrnNumber(d.grnNumber || "");
                        setPurchaseOrderId(d.purchaseOrderId || "");
                        setSupplierId(d.supplierId || "");
                        setReceivedDate(d.grnDate ? new Date(d.grnDate).toISOString().split("T")[0] : "");
                        setChallanNumber(d.referenceNumber || "");
                        setWarehouse(d.warehouse || "Main Warehouse");
                        setNotes(d.notes || "");
                        if (d.items && Array.isArray(d.items)) {
                            setItems(d.items.map((item: any) => ({
                                id: item.id || Date.now().toString() + Math.random(), productId: item.productId,
                                productName: item.product?.name || item.productName || "", orderedQuantity: item.quantity || 0,
                                receivedQuantity: item.quantity || 0, unit: item.product?.unit || "pcs", condition: "Good",
                            })));
                        }
                    }
                } catch (error) { toast.error("Failed to load GRN data"); }
            };
            fetchGRN();
        }
    }, [isEdit, grnId]);

    // When PO is selected from dropdown, auto-fill supplier and items
    const handlePOChange = (poId: string) => {
        setPurchaseOrderId(poId);
        const selectedPO = purchaseOrders.find(po => po.id === poId);
        if (selectedPO) {
            setSupplierId(selectedPO.supplierId);
            const poItems = (selectedPO.items || []).map((item: any) => ({
                id: Date.now().toString() + Math.random(), productId: item.productId,
                productName: item.product?.name || item.productName || "", orderedQuantity: item.quantity,
                receivedQuantity: item.quantity, unit: item.unit || "pcs", condition: "Good",
            }));
            if (poItems.length > 0) setItems(poItems);
        }
    };

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), productId: undefined, productName: "", orderedQuantity: 0, receivedQuantity: 1, unit: "pcs", condition: "Good" }]);
    };
    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
    const updateItem = (id: string, field: keyof GRNItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: field === "receivedQuantity" || field === "orderedQuantity" ? parseFloat(String(value)) || 0 : value } : item));
    };
    const selectProduct = (itemId: string, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, productId, productName: product.name, unit: product.unit || "pcs" } : item));
    };

    const totalOrdered = items.reduce((sum, item) => sum + item.orderedQuantity, 0);
    const totalReceived = items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    const damagedItems = items.filter(item => item.condition === "Damaged").length;

    const handleSubmit = async () => {
        if (!supplierId) { toast.error("Please select a supplier"); return; }
        if (items.length === 0 || items.some(i => !i.productName || i.receivedQuantity <= 0)) { toast.error("Please fill all item details"); return; }

        setSaving(true);
        try {
            const grnData = {
                grnNumber: grnNumber, purchaseOrderId, supplierId,
                grnDate: receivedDate, receivedDate, challanNumber, warehouse, notes,
                items: items.map(item => ({
                    productId: item.productId, productName: item.productName,
                    orderedQuantity: item.orderedQuantity, receivedQuantity: item.receivedQuantity,
                    quantity: item.receivedQuantity, unit: item.unit, condition: item.condition,
                })),
                status: 'RECEIVED',
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
            toast.error(error.message || "Failed to save GRN");
        } finally {
            setSaving(false);
        }
    };

    const filteredSuppliers = supplierSearch
        ? suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || (s.gstin && s.gstin.toLowerCase().includes(supplierSearch.toLowerCase())))
        : suppliers;

    if (initialLoading) return <div className="flex justify-center items-center p-16"><Loader2 className="animate-spin size-8 text-brand-primary" /></div>;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* TOP HEADER */}
            <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-muted size-9"><ChevronLeft className="size-5" /></Button>
                    <h1 className="text-xl font-bold text-foreground">{isEdit ? "Edit GRN" : "New Goods Received Note"}</h1>
                    <Badge variant="outline" className="text-xs font-medium bg-muted/50 text-muted-foreground border-border">Draft</Badge>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">Auto-saved</span>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-6 max-w-[1100px] mx-auto w-full">
                <div className="space-y-6">
                    {/* SUPPLIER + META */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-foreground">Supplier & PO Details</h2>
                                <button type="button" onClick={() => setShowAddSupplier(true)} className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">+ New Supplier</button>
                            </div>
                            {/* Link Purchase Order */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Link Purchase Order <span className="text-muted-foreground">(Optional)</span></Label>
                                <Select value={purchaseOrderId} onValueChange={handlePOChange}>
                                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a PO to auto-fill..." /></SelectTrigger>
                                    <SelectContent>
                                        {purchaseOrders.map(po => <SelectItem key={po.id} value={po.id}>{po.orderNumber} — {po.supplier?.name || "Supplier"}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Linking a PO auto-fills items, quantities, and supplier</p>
                            </div>
                            {/* Supplier */}
                            {!selectedSupplier ? (
                                <SearchableSelect
                                    options={suppliers.map(s => ({
                                        label: s.name,
                                        value: s.id,
                                        description: s.gstin ? `GSTIN: ${s.gstin}` : undefined
                                    }))}
                                    value={supplierId}
                                    onValueChange={(val) => setSupplierId(val)}
                                    placeholder="Select or search supplier..."
                                    emptyMessage="No supplier found."
                                    onAddNew={() => setShowAddSupplier(true)}
                                    addNewLabel="Add New Supplier"
                                    className="h-10 border-border bg-muted/30"
                                    disabled={!!purchaseOrderId}
                                />
                            ) : (
                                <div className="bg-brand-primary-light border border-brand-primary/20 rounded-lg p-4 flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">{selectedSupplier.name}</p>
                                        {selectedSupplier.gstin && <p className="text-xs text-muted-foreground mt-0.5">GSTIN: {selectedSupplier.gstin}</p>}
                                    </div>
                                    {!purchaseOrderId && <button type="button" onClick={() => { setSupplierId(""); setSupplierSearch(""); }} className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">Change</button>}
                                </div>
                            )}
                            {/* Challan Number */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Delivery Challan / DC Number</Label>
                                <Input value={challanNumber} onChange={e => setChallanNumber(e.target.value)} placeholder="e.g. DC-12345" className="h-9 text-sm" />
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">GRN Number</Label>
                                <Input value={grnNumber} onChange={e => setGrnNumber(e.target.value)} placeholder="Auto-generated" className="h-9 font-mono text-sm w-full bg-muted/30 border-border" disabled />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Received Date</Label>
                                <Input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} className="h-9 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Warehouse</Label>
                                <Select value={warehouse} onValueChange={setWarehouse}>
                                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                                        <SelectItem value="Store Room A">Store Room A</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Summary Stats */}
                            <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground"><span>Total Ordered</span><span className="font-mono font-semibold text-foreground">{totalOrdered}</span></div>
                                <div className="flex justify-between text-muted-foreground"><span>Total Received</span><span className="font-mono font-semibold text-brand-primary">{totalReceived}</span></div>
                                {damagedItems > 0 && <div className="flex justify-between text-muted-foreground"><span>Damaged Items</span><span className="font-mono font-semibold text-red-600">{damagedItems}</span></div>}
                            </div>
                        </div>
                    </div>

                    {/* ITEM DETAILS TABLE */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Package className="size-4 text-brand-primary" />
                                <h2 className="text-sm font-semibold text-foreground">Received Items</h2>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="py-2.5 px-4 text-left w-[40px]">#</th>
                                        <th className="py-2.5 px-3 text-left">Product</th>
                                        <th className="py-2.5 px-3 text-center w-[100px]">Ordered</th>
                                        <th className="py-2.5 px-3 text-center w-[100px]">Received</th>
                                        <th className="py-2.5 px-3 text-center w-[100px]">Unit</th>
                                        <th className="py-2.5 px-3 text-left w-[150px]">Condition</th>
                                        <th className="py-2.5 px-3 text-center w-[40px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="group hover:bg-muted/20 transition-colors">
                                            <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{index + 1}</td>
                                            <td className="py-3 px-3">
                                                <Select value={item.productId || ""} onValueChange={val => { if (val === "__add_new__") { setShowAddProduct(true); return; } selectProduct(item.id, val); }}>
                                                    <SelectTrigger className="h-8 bg-background border-border hover:border-brand-primary focus:border-brand-primary px-2 text-sm font-medium"><SelectValue placeholder="Select product..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                        <SelectItem value="__add_new__" className="text-brand-primary font-semibold"><span className="flex items-center gap-1.5"><PlusCircle className="size-3.5" /> Add New Product</span></SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="py-3 px-3 text-center text-muted-foreground font-mono">{item.orderedQuantity || '—'}</td>
                                            <td className="py-3 px-3"><Input type="number" value={item.receivedQuantity} onChange={e => updateItem(item.id, 'receivedQuantity', e.target.value)} className="h-8 text-center font-mono text-sm font-semibold bg-background" min="0" /></td>
                                            <td className="py-3 px-3 text-center text-xs text-muted-foreground">{item.unit}</td>
                                            <td className="py-3 px-3">
                                                <Select value={item.condition} onValueChange={val => updateItem(item.id, 'condition', val)}>
                                                    <SelectTrigger className={`h-8 text-xs bg-background ${item.condition === "Damaged" ? "text-red-600 border-red-200" : item.condition === "Wrong Item" ? "text-amber-600 border-amber-200" : ""}`}><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Good">✅ Good Condition</SelectItem>
                                                        <SelectItem value="Damaged">❌ Damaged</SelectItem>
                                                        <SelectItem value="Wrong Item">⚠️ Wrong Item</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="size-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="size-3.5" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{items.length + 1}</td>
                                        <td colSpan={6} className="py-3 px-3"><Input placeholder="Type to add new item..." className="h-8 border-transparent hover:border-border bg-transparent px-1 text-sm text-muted-foreground" onFocus={addItem} readOnly /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-border">
                            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"><PlusCircle className="size-4" /> Add Another Line</button>
                        </div>
                    </div>

                    {/* NOTES */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-foreground">Notes / Remarks</Label>
                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations about the delivery..." className="resize-none text-sm min-h-[100px] bg-card border-border" />
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-card border-t border-border">
                <Button variant="outline" onClick={onCancel} className="h-9 px-5 text-sm font-medium">Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving} className="h-9 px-5 text-sm font-medium gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-sm">
                    {saving ? <Loader2 className="animate-spin size-4" /> : <Save className="size-4" />} {isEdit ? "Update GRN" : "Create GRN"}
                </Button>
            </div>

            <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} onSuccess={(p: any) => { setProducts(prev => [...prev, p]); }} />
            <AddSupplierDialog open={showAddSupplier} onOpenChange={setShowAddSupplier} onSuccess={(s: any) => { setSuppliers(prev => [...prev, s]); setSupplierId(s.id); }} />
        </div>
    );
}
