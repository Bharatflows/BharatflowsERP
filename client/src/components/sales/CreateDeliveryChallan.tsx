import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { deliveryChallansService, partiesService, productsService, settingsService, salesOrdersService } from "../../services/modules.service";
import { toast } from "sonner";
import type { Party, Product } from "../../types";
import {
    Trash2, Save, Send, ChevronLeft, Search, Loader2, Printer, PlusCircle, ArrowRightCircle
} from "lucide-react";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { AddProductDialog } from "./AddProductDialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { SearchableSelect } from "../ui/searchable-select";
import { numberToWords } from "../../utils/numberToWords";

interface ChallanItem {
    id: string;
    productId?: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
}

interface CreateDeliveryChallanProps {
    challanId?: string | null;
    defaultPreview?: boolean;
    onSave: (data: any) => void;
    onCancel: () => void;
}

export function CreateDeliveryChallan({ challanId, defaultPreview = false, onSave, onCancel }: CreateDeliveryChallanProps) {
    const [customers, setCustomers] = useState<Party[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get("orderId");

    const [customerId, setCustomerId] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [challanNumber, setChallanNumber] = useState("");
    const [challanDate, setChallanDate] = useState(new Date().toISOString().split("T")[0]);
    const [referenceNumber, setReferenceNumber] = useState("");
    const [items, setItems] = useState<ChallanItem[]>([]);
    const [notes, setNotes] = useState("");
    const [termsConditions, setTermsConditions] = useState("");
    const [status, setStatus] = useState("draft");

    const selectedCustomer = customers.find(c => c.id === customerId);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersRes, productsRes] = await Promise.all([
                    partiesService.getAll({ type: 'customer' }),
                    productsService.getAll()
                ]);
                setCustomers(customersRes.data);
                setProducts(productsRes.data);

                if (challanId) {
                    const response = await deliveryChallansService.getById(challanId);
                    const challan = response?.data;
                    if (challan) {
                        setCustomerId(typeof challan.customer === 'object' ? (challan.customer as any).id : challan.customerId || "");
                        setChallanNumber(challan.challanNumber || "");
                        setChallanDate(challan.challanDate ? new Date(challan.challanDate).toISOString().split("T")[0] : "");
                        setReferenceNumber(challan.referenceNumber || "");
                        setNotes(challan.notes || "");
                        setStatus(challan.status || "draft");
                        if (challan.items && Array.isArray(challan.items)) {
                            setItems(challan.items.map((item: any) => ({
                                id: item.id || Date.now().toString() + Math.random(),
                                productId: item.productId,
                                name: item.productName || "",
                                description: item.description || "",
                                quantity: item.quantity || 0,
                                unit: item.unit || "pcs",
                                rate: item.rate || 0,
                                amount: (item.quantity || 0) * (item.rate || 0)
                            })));
                        }
                    }
                } else if (orderId) {
                    try {
                        const orderRes = await salesOrdersService.getById(orderId);
                        const order = orderRes?.data;
                        if (order) {
                            setCustomerId(typeof order.customer === 'object' ? order.customer.id : order.customerId || "");
                            setReferenceNumber(order.orderNumber);
                            if (order.items && Array.isArray(order.items)) {
                                setItems(order.items.map((item: any) => ({
                                    id: Date.now().toString() + Math.random(),
                                    productId: item.productId,
                                    name: item.productName || item.name || "",
                                    description: item.description || "",
                                    quantity: item.quantity || 0,
                                    unit: item.unit || "pcs",
                                    rate: item.rate || 0,
                                    amount: (item.quantity || 0) * (item.rate || 0)
                                })));
                            }
                        }
                    } catch (error) {
                        console.error("Failed to fetch sales order:", error);
                        toast.error("Failed to load sales order details");
                    }
                } else {
                    try {
                        const response = await settingsService.getNextSequenceNumber('DELIVERY_CHALLAN');
                        if (response.success && response.data?.nextNumber) setChallanNumber(response.data.nextNumber);
                    } catch (error) { console.error("Failed to fetch next challan number:", error); }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Failed to load data");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [challanId]);

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), productId: undefined, name: "", description: "", quantity: 1, unit: "pcs", rate: 0, amount: 0 }]);
    };
    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

    const updateItem = (id: string, field: keyof ChallanItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (['quantity', 'rate'].includes(field)) {
                    const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
                    const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
                    updated.amount = qty * rate;
                }
                return updated;
            }
            return item;
        }));
    };

    const selectProduct = (itemId: string, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const rate = (product as any).sellingPrice || (product as any).salePrice || 0;
                return { ...item, productId, name: product.name, description: product.description || "", unit: product.unit || "pcs", rate, amount: item.quantity * rate };
            }
            return item;
        }));
    };

    const total = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

    const handleConvert = async () => {
        if (!challanId) return;
        if (window.confirm("Convert this Delivery Challan to an Invoice?")) {
            try {
                const response = await deliveryChallansService.convert(challanId);
                const invoice = response.data;
                toast.success("Converted to Invoice successfully");
                if (invoice && invoice.id) navigate(`/sales/invoices/${invoice.id}/edit`);
            } catch (error) {
                console.error("Failed to convert:", error);
                toast.error("Failed to convert to invoice");
            }
        }
    };

    const handleSave = async (sendAfterSave = false) => {
        if (!customerId) { toast.error("Please select a customer"); return; }
        if (items.length === 0) { toast.error("Please add at least one item"); return; }
        const challanData = {
            id: challanId,
            customerId,
            challanNumber: challanNumber,
            challanDate,
            referenceNumber,
            items: items.map(item => ({
                productId: item.productId,
                productName: item.name,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                rate: item.rate,
            })),
            status: sendAfterSave ? "pending" : "draft",
            notes,
        };
        onSave(challanData);
    };

    const filteredCustomers = customerSearch
        ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.gstin && c.gstin.toLowerCase().includes(customerSearch.toLowerCase())))
        : customers;

    if (initialLoading) return <div className="flex justify-center items-center p-16"><Loader2 className="animate-spin size-8 text-brand-primary" /></div>;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* TOP HEADER */}
            <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-muted size-9"><ChevronLeft className="size-5" /></Button>
                    <h1 className="text-xl font-bold text-foreground">{challanId ? "Edit Delivery Challan" : "New Delivery Challan"}</h1>
                    <Badge variant="outline" className="text-xs font-medium bg-muted/50 text-muted-foreground border-border">Draft</Badge>
                </div>
                <div className="flex items-center gap-2">
                    {challanId && status !== 'converted' && (
                        <Button variant="outline" onClick={handleConvert} className="h-9 px-3 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
                            <ArrowRightCircle className="size-4" /> Convert to Invoice
                        </Button>
                    )}
                    <span className="text-xs text-muted-foreground hidden sm:block">Auto-saved</span>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto px-6 py-6 max-w-[1100px] mx-auto w-full">
                <div className="space-y-6">
                    {/* CUSTOMER + META */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-foreground">Customer Details</h2>
                                <button type="button" onClick={() => setShowAddCustomer(true)} className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">+ New Customer</button>
                            </div>
                            {!selectedCustomer ? (
                                <SearchableSelect
                                    options={customers.map(c => ({
                                        label: c.name,
                                        value: c.id,
                                        description: c.gstin ? `GSTIN: ${c.gstin}` : undefined
                                    }))}
                                    value={customerId}
                                    onValueChange={(val) => setCustomerId(val)}
                                    placeholder="Select or search customer..."
                                    emptyMessage="No customer found."
                                    onAddNew={() => setShowAddCustomer(true)}
                                    addNewLabel="Add New Customer"
                                    className="h-10 border-border bg-muted/30"
                                />
                            ) : (
                                <div className="bg-brand-primary-light border border-brand-primary/20 rounded-lg p-4 flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">{selectedCustomer.name}</p>
                                        {selectedCustomer.gstin && <p className="text-xs text-muted-foreground mt-0.5">GSTIN: {selectedCustomer.gstin}</p>}
                                    </div>
                                    <button type="button" onClick={() => { setCustomerId(""); setCustomerSearch(""); }} className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">Change</button>
                                </div>
                            )}
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Challan Number</Label>
                                <Input value={challanNumber} onChange={e => setChallanNumber(e.target.value)} placeholder="Auto-generated" className="h-9 font-mono text-sm w-full bg-muted/30 border-border" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Challan Date</Label>
                                <Input type="date" value={challanDate} onChange={e => setChallanDate(e.target.value)} className="h-9 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Reference Number</Label>
                                <Input value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="e.g. PO-123" className="h-9 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* ITEM DETAILS TABLE (No GST for Delivery Challan) */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground">Item Details</h2>
                            <span className="text-xs text-muted-foreground">Currency: <strong className="text-foreground">INR (₹)</strong></span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="py-2.5 px-4 text-left w-[40px]">#</th>
                                        <th className="py-2.5 px-3 text-left">Item Name / Description</th>
                                        <th className="py-2.5 px-3 text-center w-[80px]">Qty</th>
                                        <th className="py-2.5 px-3 text-right w-[120px]">Rate</th>
                                        <th className="py-2.5 px-4 text-right w-[130px]">Amount</th>
                                        <th className="py-2.5 px-3 text-center w-[40px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="group hover:bg-muted/20 transition-colors">
                                            <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{index + 1}</td>
                                            <td className="py-3 px-3">
                                                <div className="space-y-1">
                                                    <Select value={item.productId || ""} onValueChange={(val) => {
                                                        if (val === "__add_new__") { setShowAddProduct(true); return; }
                                                        selectProduct(item.id, val);
                                                    }}>
                                                        <SelectTrigger className="h-8 border-transparent bg-background hover:border-brand-primary focus:border-brand-primary px-2 text-sm font-medium"><SelectValue placeholder="Select product..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                            <SelectItem value="__add_new__" className="text-brand-primary font-semibold">
                                                                <span className="flex items-center gap-1.5"><PlusCircle className="size-3.5" /> Add New Product</span>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Add description..." className="h-7 text-xs border-transparent hover:border-border bg-transparent px-1 text-muted-foreground" />
                                                </div>
                                            </td>
                                            <td className="py-3 px-3"><Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="h-8 text-center font-mono text-sm bg-background" min="1" /></td>
                                            <td className="py-3 px-3"><Input type="number" value={item.rate} onChange={e => updateItem(item.id, 'rate', e.target.value)} className="h-8 text-right font-mono text-sm bg-background" min="0" /></td>
                                            <td className="py-3 px-4 text-right font-semibold font-mono text-foreground">{(item.quantity * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-3 text-center">
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="size-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="size-3.5" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{items.length + 1}</td>
                                        <td colSpan={5} className="py-3 px-3"><Input placeholder="Type to add new item..." className="h-8 border-transparent hover:border-border bg-transparent px-1 text-sm text-muted-foreground" onFocus={addItem} readOnly /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-border">
                            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors"><PlusCircle className="size-4" /> Add Another Line</button>
                        </div>
                    </div>

                    {/* NOTES + SUMMARY */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-foreground">Customer Notes</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions..." className="resize-none text-sm min-h-[90px] bg-card border-border" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-foreground">Terms & Conditions</Label>
                                <Textarea value={termsConditions} onChange={e => setTermsConditions(e.target.value)} placeholder="Delivery terms..." className="resize-none text-sm min-h-[90px] bg-card border-border" />
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm self-start">
                            <div className="flex justify-between items-center text-muted-foreground"><span>Total Value</span><span className="font-mono font-medium text-foreground">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                            <p className="text-xs text-muted-foreground italic">This is a delivery document, not a tax invoice.</p>
                            <div className="pt-3 border-t border-border">
                                <div className="flex justify-between items-end">
                                    <div><p className="font-semibold text-foreground">Total Amount</p><p className="text-xs text-muted-foreground mt-0.5 max-w-[220px] leading-snug">In Words: {numberToWords(total)}</p></div>
                                    <span className="text-2xl font-bold text-brand-primary font-mono leading-none">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-card border-t border-border">
                <Button variant="outline" onClick={onCancel} className="h-9 px-5 text-sm font-medium">Cancel</Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => window.print()} className="h-9 px-4 text-sm font-medium gap-1.5"><Printer className="size-4" /> Print</Button>
                    <Button variant="outline" onClick={() => handleSave(false)} disabled={loading} className="h-9 px-4 text-sm font-medium gap-1.5">
                        {loading ? <Loader2 className="animate-spin size-4" /> : <Save className="size-4" />} Save as Draft
                    </Button>
                    <Button onClick={() => handleSave(true)} disabled={loading} className="h-9 px-5 text-sm font-medium gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-sm">
                        {loading ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />} Save & Send
                    </Button>
                </div>
            </div>

            <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} onSuccess={(p: any) => { setProducts(prev => [...prev, p]); }} />
            <AddCustomerDialog open={showAddCustomer} onOpenChange={setShowAddCustomer} onSuccess={(c: any) => { setCustomers(prev => [...prev, c]); setCustomerId(c.id); }} />
        </div>
    );
}
