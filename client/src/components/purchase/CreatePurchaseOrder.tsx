import { useState, useEffect } from "react";
import { partiesService, productsService, purchaseService, settingsService } from "../../services/modules.service";
import { useCreatePurchaseOrder, useUpdatePurchaseOrder } from "../../hooks/usePurchase";
import { toast } from "sonner";
import type { Party, Product } from "../../types";
import {
  Trash2, Save, Send, ChevronLeft, Search, Loader2, PlusCircle
} from "lucide-react";
import { AddSupplierDialog } from "./AddSupplierDialog";
import { AddProductDialog } from "../sales/AddProductDialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { SearchableSelect } from "../ui/searchable-select";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { GST_RATES, GST_MODES, calculateGST, type GSTMode } from "../../constants/tax";
import { numberToWords } from "../../utils/numberToWords";

interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  hsnCode: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

interface CreatePurchaseOrderProps {
  orderId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function CreatePurchaseOrder({ orderId, onSave, onCancel }: CreatePurchaseOrderProps) {
  const isEdit = !!orderId;
  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [isInterState, setIsInterState] = useState(false);
  const [gstMode, setGstMode] = useState<GSTMode>("exclusive");

  const [supplierId, setSupplierId] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30");
  const [notes, setNotes] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes] = await Promise.all([
          partiesService.getAll({ type: 'SUPPLIER' }),
          productsService.getAll()
        ]);
        setSuppliers(suppliersRes.data || []);
        setProducts(productsRes.data || []);

        if (!isEdit) {
          try {
            const response = await settingsService.getNextSequenceNumber('PURCHASE_ORDER');
            if (response.success && response.data?.nextNumber) setOrderNumber(response.data.nextNumber);
          } catch (error) { console.error("Failed to fetch next order number:", error); }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load suppliers or products");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [isEdit]);

  useEffect(() => {
    if (isEdit && orderId) {
      const fetchPO = async () => {
        try {
          const response = await purchaseService.getById(orderId);
          const data = response?.data;
          if (data) {
            setSupplierId(data.supplierId || "");
            setOrderNumber(data.orderNumber || "");
            setOrderDate(data.orderDate ? new Date(data.orderDate).toISOString().split("T")[0] : "");
            setExpectedDate(data.expectedDate ? new Date(data.expectedDate).toISOString().split("T")[0] : "");
            setPaymentTerms(data.paymentTerms || "30");
            setNotes(data.notes || "");
            setTermsConditions(data.termsConditions || "");
            if (data.items && Array.isArray(data.items)) {
              setItems(data.items.map((item: any) => ({
                id: item.id || Date.now().toString() + Math.random(),
                productId: item.productId,
                productName: item.product?.name || item.productName || "",
                hsnCode: item.product?.hsnCode || item.hsnCode || "",
                description: item.description || "",
                quantity: Number(item.quantity) || 0,
                unit: item.product?.unit || item.unit || "pcs",
                rate: Number(item.rate) || 0,
                taxRate: Number(item.taxRate) || 18,
                amount: 0,
              })));
            }
          }
        } catch (error) {
          console.error("Failed to fetch PO:", error);
          toast.error("Failed to load purchase order");
        }
      };
      fetchPO();
    }
  }, [isEdit, orderId]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), productId: undefined, productName: "", hsnCode: "", description: "", quantity: 1, unit: "pcs", rate: 0, taxRate: 18, amount: 0 }]);
  };
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) { return { ...item, [field]: value }; }
      return item;
    }));
  };

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const rate = product.purchasePrice || product.sellingPrice || product.salePrice || 0;
        const tax = product.gstRate || product.taxRate || 18;
        return { ...item, productId, productName: product.name, hsnCode: product.hsnCode || "", description: product.description || "", unit: product.unit || "pcs", rate, taxRate: tax };
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

  const calculateTotal = () => {
    if (gstMode === "inclusive") {
      return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) - discount;
    }
    const { totalCGST, totalSGST, totalIGST } = calculateTaxBreakdown();
    return calculateSubtotal() + totalCGST + totalSGST + totalIGST - discount;
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
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (sendAfterSave = false) => {
    if (!supplierId) { toast.error("Please select a supplier"); return; }
    if (items.length === 0 || items.some(i => !i.productName)) { toast.error("Please fill all item details"); return; }

    const orderData = {
      supplierId,
      orderNumber: orderNumber,
      orderDate,
      expectedDate,
      paymentTerms,
      notes,
      termsConditions,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        hsnCode: item.hsnCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discount: 0,
        taxRate: item.taxRate,
        amount: item.quantity * item.rate,
      })),
      subtotal,
      totalTax: totalCGST + totalSGST + totalIGST,
      totalAmount: total,
      status: sendAfterSave ? "sent" : "draft",
    };

    if (isEdit && orderId) {
      updateMutation.mutate({ id: orderId, data: orderData }, { onSuccess: () => onSave() });
    } else {
      createMutation.mutate(orderData, { onSuccess: () => onSave() });
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
          <h1 className="text-xl font-bold text-foreground">{isEdit ? "Edit Purchase Order" : "New Purchase Order"}</h1>
          <Badge variant="outline" className="text-xs font-medium bg-muted/50 text-muted-foreground border-border">Draft</Badge>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">Auto-saved</span>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-[1100px] mx-auto w-full">
        <div className="space-y-6">
          {/* SUPPLIER + META */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 self-start">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Supplier Details</h2>
                <button type="button" onClick={() => setShowAddSupplier(true)} className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">+ New Supplier</button>
              </div>
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
                />
              ) : (
                <div className="bg-brand-primary-light border border-brand-primary/20 rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{selectedSupplier.name}</p>
                    {selectedSupplier.gstin && <p className="text-xs text-muted-foreground mt-0.5">GSTIN: {selectedSupplier.gstin}</p>}
                    {selectedSupplier.email && <p className="text-xs text-muted-foreground">{selectedSupplier.email}</p>}
                  </div>
                  <button type="button" onClick={() => { setSupplierId(""); setSupplierSearch(""); }} className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover transition-colors">Change</button>
                </div>
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Order Number</Label>
                <Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Auto-generated" className="h-9 font-mono text-sm w-full bg-muted/30 border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Order Date</Label>
                <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Expected Delivery</Label>
                <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Immediate</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="15">15 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="45">45 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ITEM DETAILS TABLE */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Order Items</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-2 py-1">
                  {GST_MODES.map(mode => (
                    <button key={mode.value} type="button" onClick={() => setGstMode(mode.value as GSTMode)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${gstMode === mode.value ? "bg-brand-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {mode.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer"><input type="checkbox" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} className="rounded border-border" /> Inter-State (IGST)</label>
                <span className="text-xs text-muted-foreground">Currency: <strong className="text-foreground">INR (₹)</strong></span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-2.5 px-4 text-left w-[40px]">#</th>
                    <th className="py-2.5 px-3 text-left">Item / HSN</th>
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
                          <Select value={item.productId || ""} onValueChange={val => {
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
                          <Input value={item.hsnCode} onChange={e => updateItem(item.id, 'hsnCode', e.target.value)} placeholder="HSN/SAC" className="h-7 text-xs border-transparent hover:border-border bg-transparent px-1 text-muted-foreground w-24" />
                        </div>
                      </td>
                      <td className="py-3 px-3"><Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="h-8 text-center font-mono text-sm bg-background" min="1" /></td>
                      <td className="py-3 px-3"><Input type="number" value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="h-8 text-right font-mono text-sm bg-background" min="0" /></td>
                      <td className="py-3 px-3">
                        <Select value={String(item.taxRate)} onValueChange={val => updateItem(item.id, 'taxRate', parseFloat(val))}>
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
                    <td colSpan={6} className="py-3 px-3"><Input placeholder="Type to add new item..." className="h-8 border-transparent hover:border-border bg-transparent px-1 text-sm text-muted-foreground" onFocus={addItem} readOnly /></td>
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
                <Label className="text-sm font-semibold text-foreground">Vendor Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes for the supplier..." className="resize-none text-sm min-h-[90px] bg-card border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Terms & Conditions</Label>
                <Textarea value={termsConditions} onChange={e => setTermsConditions(e.target.value)} placeholder="Payment terms, delivery terms..." className="resize-none text-sm min-h-[90px] bg-card border-border" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm self-start">
              <div className="flex justify-between items-center text-muted-foreground"><span>Subtotal</span><span className="font-mono font-medium text-foreground">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              {isInterState ? (
                <div className="flex justify-between items-center text-muted-foreground"><span>IGST ({gstRate}%)</span><span className="font-mono">₹{totalIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-muted-foreground"><span>CGST ({halfRate}%)</span><span className="font-mono">₹{totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between items-center text-muted-foreground"><span>SGST ({halfRate}%)</span><span className="font-mono">₹{totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                </>
              )}
              {discount > 0 && <div className="flex justify-between items-center text-muted-foreground"><span>Discount</span><span className="font-mono text-red-600">-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
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
          <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isPending} className="h-9 px-4 text-sm font-medium gap-1.5">
            {isPending ? <Loader2 className="animate-spin size-4" /> : <Save className="size-4" />} Save as Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} disabled={isPending} className="h-9 px-5 text-sm font-medium gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-sm">
            {isPending ? <Loader2 className="animate-spin size-4" /> : <Send className="size-4" />} Confirm & Send
          </Button>
        </div>
      </div>

      <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} onSuccess={(p: any) => { setProducts(prev => [...prev, p]); }} />
      <AddSupplierDialog open={showAddSupplier} onOpenChange={setShowAddSupplier} onSuccess={(s: any) => { setSuppliers(prev => [...prev, s]); setSupplierId(s.id); }} />
    </div>
  );
}
