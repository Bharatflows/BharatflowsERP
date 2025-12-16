import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { salesService } from "../../services/sales.service";
import { partiesService, productsService, settingsService } from "../../services/modules.service";
import { toast } from "sonner";
import { Loader2, ChevronLeft, Download, Printer, User, FileText, Calendar, Truck, Plus, Trash2, Save, Send, Eye } from "lucide-react";
import type { Party, Product } from "../../types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { GST_RATES } from "../../constants/tax";

interface OrderItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    taxRate: number;
    amount: number;
}

interface CreateSalesOrderProps {
    orderId?: string | null;
    defaultPreview?: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export function CreateSalesOrder({ orderId, defaultPreview = false, onSave, onCancel }: CreateSalesOrderProps) {
    const [customers, setCustomers] = useState<Party[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isPreviewMode, setIsPreviewMode] = useState(defaultPreview);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const quotationId = searchParams.get("quotationId");

    const [customerId, setCustomerId] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState("");
    const [items, setItems] = useState<OrderItem[]>([]);
    const [notes, setNotes] = useState("");
    const [termsConditions, setTermsConditions] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersRes, productsRes] = await Promise.all([
                    partiesService.getAll({ type: 'customer' }),
                    productsService.getAll()
                ]);
                setCustomers(customersRes.data);
                setProducts(productsRes.data);

                // If editing, fetch order details
                if (orderId) {
                    const order = await salesService.getSalesOrder(orderId);
                    if (order) {
                        setCustomerId(typeof order.customer === 'object' ? order.customer.id : order.customerId || "");
                        setOrderNumber(order.orderNumber);
                        setOrderDate(order.orderDate ? new Date(order.orderDate).toISOString().split("T")[0] : "");
                        setExpectedDate(order.expectedDate ? new Date(order.expectedDate).toISOString().split("T")[0] : "");
                        setNotes(order.notes || "");

                        // Map items
                        if (order.items && Array.isArray(order.items)) {
                            const mappedItems = order.items.map((item: any) => ({
                                id: item.id || Date.now().toString() + Math.random(),
                                name: item.productName || "",
                                description: item.description || "",
                                quantity: item.quantity || 0,
                                unit: item.unit || "pcs",
                                rate: item.rate || 0,
                                taxRate: item.taxRate || 0,
                                amount: (item.quantity * item.rate) + ((item.quantity * item.rate * (item.taxRate || 0)) / 100)
                            }));
                            setItems(mappedItems);
                        }
                    }
                } else if (quotationId) {
                    // Pre-fill from Quotation
                    try {
                        const quotation = await salesService.getQuotation(quotationId);
                        if (quotation) {
                            setCustomerId(typeof quotation.customer === 'object' ? quotation.customer.id : quotation.customerId || "");
                            setNotes(`Converted from Quotation #${quotation.quotationNumber}`);

                            // Map items
                            if (quotation.items && Array.isArray(quotation.items)) {
                                const mappedItems = quotation.items.map((item: any) => ({
                                    id: Date.now().toString() + Math.random(),
                                    name: item.productName || item.name || "",
                                    description: item.description || "",
                                    quantity: item.quantity || 0,
                                    unit: item.unit || "pcs",
                                    rate: item.rate || 0,
                                    taxRate: item.taxRate || 0,
                                    amount: (item.quantity * item.rate) + ((item.quantity * item.rate * (item.taxRate || 0)) / 100)
                                }));
                                setItems(mappedItems);
                            }
                        }
                    } catch (error) {
                        console.error("Failed to fetch quotation:", error);
                        toast.error("Failed to load quotation details");
                    }
                } else {
                    // Fetch the next order number from the sequence API
                    try {
                        const response = await settingsService.getNextSequenceNumber('SALES_ORDER');
                        if (response.success && response.data?.nextNumber) {
                            setOrderNumber(response.data.nextNumber);
                        }
                    } catch (error) {
                        console.error("Failed to fetch next order number:", error);
                    }
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
        const newItem: OrderItem = {
            id: Date.now().toString(),
            name: "",
            description: "",
            quantity: 1,
            unit: "pcs",
            rate: 0,
            taxRate: 18,
            amount: 0,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof OrderItem, value: any) => {
        setItems(
            items.map((item) => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === "quantity" || field === "rate" || field === "taxRate") {
                        const subtotal = updatedItem.quantity * updatedItem.rate;
                        const tax = (subtotal * updatedItem.taxRate) / 100;
                        updatedItem.amount = subtotal + tax;
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };

    const selectProduct = (itemId: string, productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
            updateItem(itemId, "name", product.name);
            updateItem(itemId, "rate", product.salePrice);
            updateItem(itemId, "unit", product.unit);
            updateItem(itemId, "taxRate", product.gstRate);
            const item = items.find((i) => i.id === itemId);
            if (item) {
                const subtotal = item.quantity * product.salePrice;
                const tax = (subtotal * product.gstRate) / 100;
                updateItem(itemId, "amount", subtotal + tax);
            }
        }
    };

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const totalTax = items.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.rate;
        return sum + (itemSubtotal * item.taxRate) / 100;
    }, 0);
    const total = subtotal + totalTax;

    const handleSave = async () => {
        if (!customerId || !orderDate || items.length === 0) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                customerId,
                orderNumber,
                orderDate,
                expectedDate,
                items: items.map(item => ({
                    productId: item.name ? products.find(p => p.name === item.name)?.id : undefined,
                    productName: item.name,
                    quantity: item.quantity,
                    rate: item.rate,
                    taxRate: item.taxRate,
                })),
                notes,
            };

            await salesService.createSalesOrder(orderData as any);
            toast.success("Sales order created successfully");
            onSave();
        } catch (error) {
            console.error("Failed to create sales order:", error);
            toast.error("Failed to create sales order");
        } finally {
            setLoading(false);
        }
    };

    const selectedCustomer = customers.find((c) => c.id === customerId);

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isPreviewMode) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => defaultPreview ? onCancel() : setIsPreviewMode(false)}
                        className="gap-2"
                    >
                        <ChevronLeft className="size-4" />
                        {defaultPreview ? "Back to List" : "Back to Edit"}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="size-4" />
                            Download PDF
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Printer className="size-4" />
                            Print
                        </Button>
                        <Button onClick={handleSave} className="gap-2 bg-primary text-primary-foreground">
                            <Send className="size-4" />
                            Send Order
                        </Button>
                    </div>
                </div>

                <Card className="border-0 shadow-lg bg-white overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        {/* Order Header */}
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h1 className="text-4xl font-bold text-primary mb-2">SALES ORDER</h1>
                                <p className="text-muted-foreground">#{orderNumber || "DRAFT"}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="font-bold text-xl mb-1">BharatFlow</h2>
                                <p className="text-sm text-muted-foreground">123 Business Street</p>
                                <p className="text-sm text-muted-foreground">Mumbai, MH 400001</p>
                            </div>
                        </div>

                        {/* Bill To & Details */}
                        <div className="flex justify-between mb-12">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Order For</p>
                                {selectedCustomer ? (
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedCustomer.name}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                                        {selectedCustomer.gstin && (
                                            <p className="text-sm text-muted-foreground mt-1">GSTIN: {selectedCustomer.gstin}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">No customer selected</p>
                                )}
                            </div>
                            <div className="text-right space-y-2">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Order Date</p>
                                    <p className="font-medium">{new Date(orderDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Expected Delivery</p>
                                    <p className="font-medium">{expectedDate ? new Date(expectedDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <table className="w-full">
                                <thead className="border-b-2 border-primary/10">
                                    <tr>
                                        <th className="text-left py-3 font-semibold text-sm text-muted-foreground">Item Description</th>
                                        <th className="text-center py-3 font-semibold text-sm text-muted-foreground w-24">Qty</th>
                                        <th className="text-right py-3 font-semibold text-sm text-muted-foreground w-32">Rate</th>
                                        <th className="text-right py-3 font-semibold text-sm text-muted-foreground w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-4">
                                                <p className="font-medium">{item.name}</p>
                                                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                                            </td>
                                            <td className="text-center py-4">{item.quantity}</td>
                                            <td className="text-right py-4">₹{item.rate.toLocaleString('en-IN')}</td>
                                            <td className="text-right py-4 font-medium">₹{item.amount.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-12">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax (GST)</span>
                                    <span>₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-primary">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="grid grid-cols-2 gap-8 text-sm">
                            {notes && (
                                <div>
                                    <p className="font-semibold text-muted-foreground mb-1">Notes</p>
                                    <p className="text-muted-foreground">{notes}</p>
                                </div>
                            )}
                            {termsConditions && (
                                <div>
                                    <p className="font-semibold text-muted-foreground mb-1">Terms & Conditions</p>
                                    <p className="text-muted-foreground">{termsConditions}</p>
                                </div>
                            )}
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
                        <h1 className="text-2xl font-bold text-foreground">{orderId ? "Edit Sales Order" : "New Sales Order"}</h1>
                        <p className="text-muted-foreground text-sm">Create and manage customer orders</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsPreviewMode(true)} className="gap-2">
                        <Eye className="size-4" />
                        Preview
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="gap-2 bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Save Order
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer & Details Card */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center gap-2">
                            <User className="size-4 text-primary" />
                            <h3 className="font-semibold text-sm">Customer Details</h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="customer" className="text-sm font-medium">Select Customer</Label>
                                <Select value={customerId} onValueChange={setCustomerId}>
                                    <SelectTrigger id="customer" className="h-11">
                                        <SelectValue placeholder="Search or select a customer..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="p-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="w-full justify-start text-primary"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setShowAddCustomer(true);
                                                }}
                                            >
                                                <Plus className="size-4 mr-2" />
                                                Add New Customer
                                            </Button>
                                        </div>
                                        <Separator />
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-medium">{customer.name}</span>
                                                    {customer.email && <span className="text-xs text-muted-foreground">{customer.email}</span>}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <AddCustomerDialog
                                    open={showAddCustomer}
                                    onOpenChange={setShowAddCustomer}
                                    onSuccess={(newCustomer) => {
                                        setCustomers([...customers, newCustomer]);
                                        setCustomerId(newCustomer.id);
                                    }}
                                />
                                {selectedCustomer && (
                                    <div className="bg-primary/5 rounded-lg p-4 mt-2 border border-primary/10 flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm text-primary">{selectedCustomer.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{selectedCustomer.address || "No address provided"}</p>
                                            <p className="text-xs text-muted-foreground">GSTIN: {selectedCustomer.gstin || "N/A"}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-white">Customer</Badge>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Card */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                <h3 className="font-semibold text-sm">Order Items</h3>
                            </div>
                            <Button size="sm" variant="outline" onClick={addItem} className="h-8 gap-1 text-xs">
                                <Plus className="size-3" />
                                Add Item
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/20 border-b border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <div className="col-span-5">Item Details</div>
                                    <div className="col-span-2 text-center">Quantity</div>
                                    <div className="col-span-2 text-right">Rate</div>
                                    <div className="col-span-2 text-right">Amount</div>
                                    <div className="col-span-1"></div>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-border/50">
                                    {items.length === 0 ? (
                                        <div className="py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="bg-muted rounded-full p-3">
                                                    <FileText className="size-6 text-muted-foreground/50" />
                                                </div>
                                                <p>No items added yet</p>
                                                <Button variant="link" onClick={addItem} className="text-primary">Add your first item</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        items.map((item) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-start group hover:bg-muted/20 transition-colors">
                                                {/* Item Details */}
                                                <div className="col-span-5 space-y-2">
                                                    <Select
                                                        value={items.find(i => i.id === item.id)?.name ? products.find(p => p.name === items.find(i => i.id === item.id)?.name)?.id : undefined}
                                                        onValueChange={(productId) => selectProduct(item.id, productId)}
                                                    >
                                                        <SelectTrigger className="h-9 border-transparent hover:border-border bg-transparent hover:bg-white focus:bg-white transition-all p-0 font-medium">
                                                            <SelectValue placeholder="Select Item" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map((product) => (
                                                                <SelectItem key={product.id} value={product.id}>
                                                                    {product.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                                        placeholder="Add a description..."
                                                        className="h-8 text-xs border-transparent hover:border-border bg-transparent hover:bg-white focus:bg-white transition-all px-0 placeholder:text-muted-foreground/50"
                                                    />
                                                </div>

                                                {/* Quantity */}
                                                <div className="col-span-2 flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                        className="h-9 text-center"
                                                        min="0"
                                                    />
                                                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                                                </div>

                                                {/* Rate */}
                                                <div className="col-span-2 space-y-1">
                                                    <Input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                                                        className="h-9 text-right"
                                                        min="0"
                                                    />
                                                    <Select
                                                        value={item.taxRate.toString()}
                                                        onValueChange={(value) => updateItem(item.id, "taxRate", parseFloat(value))}
                                                    >
                                                        <SelectTrigger className="h-6 text-xs border-0 bg-transparent p-0 justify-end text-muted-foreground hover:text-foreground">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {GST_RATES.map((rate) => (
                                                                <SelectItem key={rate.value} value={rate.value}>
                                                                    {rate.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Amount */}
                                                <div className="col-span-2 text-right font-medium py-2">
                                                    ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        {items.length > 0 && (
                            <div className="bg-muted/10 p-6 border-t border-border/50">
                                <div className="flex justify-end">
                                    <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Total Tax</span>
                                            <span>₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Total Amount</span>
                                            <span className="text-xl font-bold text-primary">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Additional Info */}
                    < Card className="border-border/50 shadow-sm" >
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-medium">Customer Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Thank you for your business..."
                                    className="min-h-[100px] resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="terms" className="text-sm font-medium">Terms & Conditions</Label>
                                <Textarea
                                    id="terms"
                                    value={termsConditions}
                                    onChange={(e) => setTermsConditions(e.target.value)}
                                    placeholder="Payment terms, delivery terms, etc..."
                                    className="min-h-[100px] resize-none"
                                />
                            </div>
                        </CardContent>
                    </Card >
                </div >

                {/* Sidebar Settings */}
                < div className="space-y-6" >
                    <Card className="border-border/50 shadow-sm">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center gap-2">
                            <Calendar className="size-4 text-primary" />
                            <h3 className="font-semibold text-sm">Order Settings</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="orderNumber" className="text-xs font-medium uppercase text-muted-foreground">Order Number</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground font-medium">#</span>
                                    <Input
                                        id="orderNumber"
                                        value={orderNumber}
                                        onChange={(e) => setOrderNumber(e.target.value)}
                                        className="font-mono"
                                        placeholder="Auto-generated"
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="orderDate" className="text-xs font-medium uppercase text-muted-foreground">Order Date</Label>
                                <Input
                                    id="orderDate"
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expectedDate" className="text-xs font-medium uppercase text-muted-foreground">Expected Delivery</Label>
                                <Input
                                    id="expectedDate"
                                    type="date"
                                    value={expectedDate}
                                    onChange={(e) => setExpectedDate(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center gap-2">
                            <Truck className="size-4 text-primary" />
                            <h3 className="font-semibold text-sm">Shipping Info</h3>
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded border border-border">
                                        <Truck className="size-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Standard Shipping</p>
                                        <p className="text-xs text-muted-foreground">Configure in settings</p>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div >
            </div >
        </div >
    );
}
