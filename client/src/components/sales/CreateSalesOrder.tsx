import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { salesService, partiesService, productsService, settingsService } from "../../services/modules.service";
import { toast } from "sonner";
import type { Party, Product } from "../../types";
import {
    Plus, Trash2, Save, Send, ChevronLeft, Search, Loader2, Printer, PlusCircle
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
import { GST_RATES, calculateTax, GST_MODES, calculateGST, type GSTMode } from "../../constants/tax";
import { numberToWords } from "../../utils/numberToWords";

interface OrderItem {
    id: string;
    productId?: string;
    name: string;
    description: string;
    hsn: string;
    quantity: number;
    unit: string;
    rate: number;
    taxRate: number;
    amount: number;
}

interface CreateSalesOrderProps {
    orderId?: string | null;
    defaultPreview?: boolean;
    onSave: (data: any) => void;
    onCancel: () => void;
}

export function CreateSalesOrder({ orderId, defaultPreview = false, onSave, onCancel }: CreateSalesOrderProps) {
    const [customers, setCustomers] = useState<Party[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [isInterState, setIsInterState] = useState(false);
    const [gstMode, setGstMode] = useState<GSTMode>("exclusive");
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const quotationId = searchParams.get("quotationId");

    const [customerId, setCustomerId] = useState("");
    const [customerSearch, setCustomerSearch] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState("");
    const [items, setItems] = useState<OrderItem[]>([]);
    const [notes, setNotes] = useState("");
    const [termsConditions, setTermsConditions] = useState("");
    const [discount, setDiscount] = useState(0);

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

                if (orderId) {
                    const response: any = await salesService.getSalesOrder(orderId);
                    const order = response.data || response;
                    if (order) {
                        setCustomerId(typeof order.customer === 'object' ? order.customer.id : order.customerId || "");
                        setOrderNumber(order.orderNumber);
                        setOrderDate(order.orderDate ? new Date(order.orderDate).toISOString().split("T")[0] : "");
                        setExpectedDate(order.expectedDate ? new Date(order.expectedDate).toISOString().split("T")[0] : "");
                        setNotes(order.notes || "");
                        if (order.items && Array.isArray(order.items)) {
                            setItems(order.items.map((item: any) => ({
                                id: item.id || Date.now().toString() + Math.random(),
                                productId: item.productId,
                                name: item.productName || "",
                                description: item.description || "",
                                hsn: item.hsn || item.hsnCode || "",
                                quantity: item.quantity || 0,
                                unit: item.unit || "pcs",
                                rate: item.rate || 0,
                                taxRate: item.taxRate || 0,
                                amount: (item.quantity * item.rate) * (1 + (item.taxRate || 0) / 100)
                            })));
                        }
                    }
                } else if (quotationId) {
                    try {
                        const response: any = await salesService.getQuotation(quotationId);
                        const quotation = response.data || response;
                        if (quotation) {
                            setCustomerId(typeof quotation.customer === 'object' ? quotation.customer.id : quotation.customerId || "");
                            setNotes(`Converted from Quotation #${quotation.quotationNumber}`);
                            if (quotation.items && Array.isArray(quotation.items)) {
                                setItems(quotation.items.map((item: any) => ({
                                    id: Date.now().toString() + Math.random(),
                                    productId: item.productId,
                                    name: item.productName || item.name || "",
                                    description: item.description || "",
                                    hsn: item.hsn || item.hsnCode || "",
                                    quantity: item.quantity || 0,
                                    unit: item.unit || "pcs",
                                    rate: item.rate || 0,
                                    taxRate: item.taxRate || 0,
                                    amount: (item.quantity * item.rate) * (1 + (item.taxRate || 0) / 100)
                                })));
                            }
                        }
                    } catch (error) {
                        console.error("Failed to fetch quotation:", error);
                        toast.error("Failed to load quotation details");
                    }
                } else {
                    try {
                        const response = await settingsService.getNextSequenceNumber('SALES_ORDER');
                        if (response.success && response.data?.nextNumber) setOrderNumber(response.data.nextNumber);
                    } catch (error) { console.error("Failed to fetch next order number:", error); }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Failed to load customers or products");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [orderId, quotationId]);

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), name: "", description: "", hsn: "", quantity: 1, unit: "pcs", rate: 0, taxRate: 18, amount: 0 }]);
    };
    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

    const updateItem = (id: string, field: keyof OrderItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (['quantity', 'rate', 'taxRate'].includes(field)) {
                    const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
                    const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
                    const tax = field === 'taxRate' ? parseFloat(value) || 0 : item.taxRate;
                    updated.amount = (qty * rate) * (1 + tax / 100);
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
                const tax = (product as any).gstRate || (product as any).taxRate || 0;
                const hsn = (product as any).hsnCode || (product as any).hsn || "";
                return { ...item, productId, name: product.name, description: product.description || "", unit: product.unit || "pcs", hsn, rate, taxRate: tax, amount: (item.quantity * rate) * (1 + tax / 100) };
            }
            return item;
        }));
    };

    // --- Calculations ---
    const calculateSubtotal = () => {
        if (gstMode === "inclusive") {
            return items.reduce((sum, item) => {
                const lineTotal = item.quantity * item.rate;
                const result = calculateGST(lineTotal, String(item.taxRate), isInterState, "inclusive");
                return sum + result.baseAmount;
            }, 0);
        }
        return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    };

    const calculateTaxBreakdown = () => {
        let totalCGST = 0, totalSGST = 0, totalIGST = 0;
        items.forEach(item => {
            const lineTotal = item.quantity * item.rate;
            const result = calculateGST(lineTotal, String(item.taxRate), isInterState, gstMode);
            totalCGST += result.cgst;
            totalSGST += result.sgst;
            totalIGST += result.igst;
        });
        return { totalCGST, totalSGST, totalIGST };
    };

    const calculateTotalTax = () => {
        const { totalCGST, totalSGST, totalIGST } = calculateTaxBreakdown();
        return totalCGST + totalSGST + totalIGST;
    };

    const calculateTotal = () => {
        if (gstMode === "inclusive") {
            return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) - discount;
        }
        return calculateSubtotal() + calculateTotalTax() - discount;
    };

    const getPredominantGSTRate = () => {
        if (items.length === 0) return 0;
        const rates: Record<number, number> = {};
        items.forEach(item => { rates[item.taxRate] = (rates[item.taxRate] || 0) + 1; });
        return Number(Object.entries(rates).sort((a, b) => b[1] - a[1])[0]?.[0] || 0);
    };

    const subtotal = calculateSubtotal();
    const { totalCGST, totalSGST, totalIGST } = calculateTaxBreakdown();
    const gstRate = getPredominantGSTRate();
    const halfRate = gstRate / 2;
    const total = calculateTotal();

    const handleSave = async (sendAfterSave = false) => {
        if (!customerId) { toast.error("Please select a customer"); return; }
        if (items.length === 0) { toast.error("Please add at least one item"); return; }
        const orderData = {
            id: orderId,
            customerId,
            orderNumber: orderNumber,
            orderDate,
            expectedDate,
            discount,
            items: items.map(item => ({
                productId: item.productId,
                productName: item.name,
                description: item.description,
                hsnCode: item.hsn,
                quantity: item.quantity,
                unit: item.unit,
                rate: item.rate,
                taxRate: item.taxRate,
            })),
            status: sendAfterSave ? "confirmed" : "draft",
            notes,
            termsConditions,
        };
        onSave(orderData);
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
                    <h1 className="text-xl font-bold text-foreground">{orderId ? "Edit Sales Order" : "New Sales Order"}</h1>
                    <Badge variant="outline" className="text-xs font-medium bg-muted/50 text-muted-foreground border-border">Draft</Badge>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">Auto-saved</span>
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
                                        {(selectedCustomer as any).address && <p className="text-xs text-muted-foreground mt-0.5">{(selectedCustomer as any).address}</p>}
                                    </div>
                                    <button type="button" onClick={() => { setCustomerId(""); setCustomerSearch(""); }} className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">Change</button>
                                </div>
                            )}
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Order Number</Label>
                                <Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Auto-generated" className="h-9 font-mono text-sm w-full bg-muted/30 border-border" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground">Order Date</Label>
                                    <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="h-9 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground">Expected Delivery</Label>
                                    <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="h-9 text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ITEM DETAILS TABLE */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                            <h2 className="text-sm font-semibold text-foreground">Item Details</h2>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-2 py-1">
                                    {GST_MODES.map(mode => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => setGstMode(mode.value as GSTMode)}
                                            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${gstMode === mode.value
                                                ? "bg-brand-primary text-white shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground">Currency: <strong className="text-foreground">INR (₹)</strong></span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="py-2.5 px-4 text-left w-[40px]">#</th>
                                        <th className="py-2.5 px-3 text-left">Item Name / Description</th>
                                        <th className="py-2.5 px-3 text-left w-[100px]">HSN/SAC</th>
                                        <th className="py-2.5 px-3 text-center w-[80px]">Qty</th>
                                        <th className="py-2.5 px-3 text-right w-[120px]">Rate</th>
                                        <th className="py-2.5 px-3 text-center w-[80px]">GST %</th>
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
                                                        <SelectTrigger className="h-8 bg-background border-border hover:border-brand-primary focus:border-brand-primary px-2 text-sm font-medium"><SelectValue placeholder="Select product..." /></SelectTrigger>
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
                                            <td className="py-3 px-3"><Input value={item.hsn} onChange={e => updateItem(item.id, 'hsn', e.target.value)} placeholder="HSN" className="h-8 text-xs font-mono text-center border-transparent hover:border-border bg-transparent" /></td>
                                            <td className="py-3 px-3"><Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="h-8 text-center font-mono text-sm bg-background" min="1" /></td>
                                            <td className="py-3 px-3"><Input type="number" value={item.rate} onChange={e => updateItem(item.id, 'rate', e.target.value)} className="h-8 text-right font-mono text-sm bg-background" min="0" /></td>
                                            <td className="py-3 px-3">
                                                <Select value={String(item.taxRate)} onValueChange={val => updateItem(item.id, 'taxRate', val)}>
                                                    <SelectTrigger className="h-8 text-center text-xs font-mono justify-center px-1 bg-background text-foreground"><SelectValue /></SelectTrigger>
                                                    <SelectContent>{GST_RATES.map(rate => <SelectItem key={rate.value} value={String(rate.value)}>{rate.value}%</SelectItem>)}</SelectContent>
                                                </Select>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold font-mono text-foreground">{(item.quantity * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-3 text-center">
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="size-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="size-3.5" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{items.length + 1}</td>
                                        <td colSpan={7} className="py-3 px-3"><Input placeholder="Type to add new item..." className="h-8 border-transparent hover:border-border bg-transparent px-1 text-sm text-muted-foreground" onFocus={addItem} readOnly /></td>
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
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thanks for your business..." className="resize-none text-sm min-h-[90px] bg-card border-border" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-foreground">Terms & Conditions</Label>
                                <Textarea value={termsConditions} onChange={e => setTermsConditions(e.target.value)} placeholder="Payment terms, delivery terms..." className="resize-none text-sm min-h-[90px] bg-card border-border" />
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm self-start">
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="font-mono font-medium text-foreground">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {isInterState ? (
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span>IGST ({gstRate}%)</span>
                                    <span className="font-mono">₹{totalIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>CGST ({halfRate}%)</span>
                                        <span className="font-mono">₹{totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>SGST ({halfRate}%)</span>
                                        <span className="font-mono">₹{totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-between items-center text-muted-foreground">
                                <span className="flex items-center gap-1">Discount{discount === 0 && <button type="button" className="text-xs text-brand-primary hover:underline">Add</button>}</span>
                                {discount > 0 ? <Input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="h-7 w-28 text-right font-mono text-sm" min="0" /> : <span className="font-mono">- ₹0.00</span>}
                            </div>
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
                        {loading ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />} Confirm & Send
                    </Button>
                </div>
            </div>

            <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} onSuccess={(p: any) => { setProducts(prev => [...prev, p]); }} />
            <AddCustomerDialog open={showAddCustomer} onOpenChange={setShowAddCustomer} onSuccess={(c: any) => { setCustomers(prev => [...prev, c]); setCustomerId(c.id); }} />
        </div>
    );
}
