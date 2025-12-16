import { useState, useEffect } from "react";
import { partiesService, productsService, purchaseService, settingsService } from "../../services/modules.service";
import { useCreatePurchaseOrder, useUpdatePurchaseOrder } from "../../hooks/usePurchase";
import { Loader2, Save, Plus, Trash2, Eye, ChevronLeft, FileText, User, Calendar, CreditCard, Download, Printer } from "lucide-react";
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
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { AddProductDialog } from "../sales/AddProductDialog";
import { AddSupplierDialog } from "./AddSupplierDialog";

interface CreatePurchaseOrderProps {
  orderId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxRate: number;
  amount: number;
}

const gstRates = ["0", "5", "12", "18", "28"];

export function CreatePurchaseOrder({ orderId, onSave, onCancel }: CreatePurchaseOrderProps) {
  const isEdit = !!orderId;
  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, productsRes] = await Promise.all([
          partiesService.getAll({ type: 'SUPPLIER' }),
          productsService.getAll()
        ]);
        setSuppliers(suppliersRes.data || []);
        setProducts(productsRes.data || []);

        // Fetch next order number for new orders
        if (!isEdit) {
          try {
            const response = await settingsService.getNextSequenceNumber('PURCHASE_ORDER');
            if (response.success && response.data && response.data.nextNumber) {
              setFormData(prev => ({ ...prev, orderNumber: response.data!.nextNumber }));
            }
          } catch (error) {
            console.error("Failed to fetch next order number:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch master data:", error);
        toast.error("Failed to load suppliers or products");
      }
    };
    fetchData();
  }, [isEdit]);

  // Fetch existing PO data when editing
  useEffect(() => {
    const fetchOrderData = async () => {
      if (isEdit && orderId) {
        try {
          const response = await purchaseService.getById(orderId);
          if (response && response.data) {
            const orderData = response.data;
            setFormData({
              orderNumber: orderData.orderNumber || "",
              supplierId: orderData.supplierId || "",
              orderDate: orderData.orderDate ? new Date(orderData.orderDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
              expectedDate: orderData.expectedDate ? new Date(orderData.expectedDate).toISOString().split("T")[0] : "",
              paymentTerms: orderData.paymentTerms || "30",
              notes: orderData.notes || "",
              termsConditions: orderData.termsConditions || "",
            });

            // Map items from order data
            if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
              const mappedItems = orderData.items.map((item: any) => {
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.rate) || 0;
                const discount = Number(item.discount) || 0;
                const taxRate = Number(item.taxRate) || 0;

                const subtotal = qty * rate;
                const discountAmount = (subtotal * discount) / 100;
                const taxableAmount = subtotal - discountAmount;
                const taxAmount = (taxableAmount * taxRate) / 100;

                return {
                  id: item.id || Date.now().toString() + Math.random(),
                  productId: item.productId,
                  productName: item.product?.name || item.productName || "",
                  hsnCode: item.product?.hsnCode || item.hsnCode || "",
                  quantity: qty,
                  unit: item.product?.unit || item.unit || "pcs",
                  rate: rate,
                  discount: discount,
                  taxRate: taxRate,
                  amount: taxableAmount + taxAmount,
                };
              });
              setItems(mappedItems);
            }
          }
        } catch (error) {
          console.error("Failed to fetch purchase order data:", error);
          toast.error("Failed to load purchase order data for editing");
        }
      }
    };
    fetchOrderData();
  }, [isEdit, orderId]);

  // Form state
  const [formData, setFormData] = useState({
    orderNumber: "",
    supplierId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: "",
    paymentTerms: "30",
    notes: "",
    termsConditions: "",
  });

  const [items, setItems] = useState<OrderItem[]>([
    {
      id: "1",
      productName: "",
      hsnCode: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      discount: 0,
      taxRate: 18,
      amount: 0,
    },
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      productName: "",
      hsnCode: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      discount: 0,
      taxRate: 18,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate amount
          const qty = Number(updatedItem.quantity) || 0;
          const rate = Number(updatedItem.rate) || 0;
          const discount = Number(updatedItem.discount) || 0;
          const taxRate = Number(updatedItem.taxRate) || 0;

          const subtotal = qty * rate;
          const discountAmount = (subtotal * discount) / 100;
          const taxableAmount = subtotal - discountAmount;
          const taxAmount = (taxableAmount * taxRate) / 100;
          updatedItem.amount = taxableAmount + taxAmount;

          return updatedItem;
        }
        return item;
      })
    );
  };

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === itemId) {
            const rate = Number(product.purchasePrice) || 0;
            const quantity = Number(item.quantity) || 0;
            const discount = Number(item.discount) || 0;
            const taxRate = Number(item.taxRate) || 0;

            const subtotal = quantity * rate;
            const discountAmount = (subtotal * discount) / 100;
            const taxableAmount = subtotal - discountAmount;
            const taxAmount = (taxableAmount * taxRate) / 100;

            return {
              ...item,
              productId,
              productName: product.name,
              hsnCode: product.hsnCode || "",
              unit: product.unit,
              rate,
              amount: taxableAmount + taxAmount
            };
          }
          return item;
        })
      );
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.rate;
      return sum + itemSubtotal;
    }, 0);

    const totalDiscount = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.rate;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      return sum + itemDiscount;
    }, 0);

    const taxableAmount = subtotal - totalDiscount;

    const totalTax = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.rate;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const itemTaxable = itemSubtotal - itemDiscount;
      const itemTax = (itemTaxable * item.taxRate) / 100;
      return sum + itemTax;
    }, 0);

    const total = taxableAmount + totalTax;

    return { subtotal, totalDiscount, taxableAmount, totalTax, total, totalAmount: total };
  };

  const handleSubmit = async () => {
    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (!formData.expectedDate) {
      toast.error("Please select expected delivery date");
      return;
    }

    const hasEmptyItems = items.some((item) => !item.productName || item.quantity <= 0);
    if (hasEmptyItems) {
      toast.error("Please fill all item details");
      return;
    }

    const orderData = {
      ...formData,
      items: items.map(item => {
        const subtotal = item.quantity * item.rate;
        const discountAmount = (subtotal * item.discount) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * item.taxRate) / 100;

        return {
          ...item,
          productId: item.productId,
          description: "", // Add default description
          taxAmount: taxAmount // Add calculated tax amount
        };
      }),
      ...calculateTotals()
    };

    if (isEdit && orderId) {
      updateMutation.mutate(
        { id: orderId, data: orderData },
        {
          onSuccess: () => {
            onSave();
          }
        }
      );
    } else {
      createMutation.mutate(orderData, {
        onSuccess: () => {
          onSave();
        }
      });
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

  const totals = calculateTotals();
  const selectedSupplier = suppliers.find((s) => s.id === formData.supplierId);

  if (isPreviewMode) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setIsPreviewMode(false)} className="gap-2">
            <ChevronLeft className="size-4" />
            Back to Edit
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
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="gap-2 bg-primary text-primary-foreground">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Order
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">PURCHASE ORDER</h1>
                <p className="text-muted-foreground">#{formData.orderNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-xl mb-1">BharatFlow</h2>
                <p className="text-sm text-muted-foreground">123 Business Street</p>
                <p className="text-sm text-muted-foreground">Mumbai, MH 400001</p>
              </div>
            </div>

            {/* Vendor & Details */}
            <div className="flex justify-between mb-12">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Vendor</p>
                {selectedSupplier ? (
                  <div>
                    <h3 className="font-bold text-lg">{selectedSupplier.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedSupplier.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedSupplier.phone}</p>
                    {selectedSupplier.gstin && (
                      <p className="text-sm text-muted-foreground mt-1">GSTIN: {selectedSupplier.gstin}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No supplier selected</p>
                )}
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Order Date</p>
                  <p className="font-medium">{new Date(formData.orderDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium">{formData.expectedDate ? new Date(formData.expectedDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '-'}</p>
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
                        <p className="font-medium">{item.productName}</p>
                        {item.hsnCode && <p className="text-sm text-muted-foreground">HSN: {item.hsnCode}</p>}
                      </td>
                      <td className="text-center py-4">{item.quantity} {item.unit}</td>
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
                  <span>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span>₹{totals.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="grid grid-cols-2 gap-8 text-sm">
              {formData.notes && (
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Notes</p>
                  <p className="text-muted-foreground">{formData.notes}</p>
                </div>
              )}
              {formData.termsConditions && (
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Terms & Conditions</p>
                  <p className="text-muted-foreground">{formData.termsConditions}</p>
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
            <h1 className="text-2xl font-bold text-foreground">{isEdit ? "Edit Purchase Order" : "New Purchase Order"}</h1>
            <p className="text-muted-foreground text-sm">Create and manage purchase orders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewMode(true)} className="gap-2">
            <Eye className="size-4" />
            Preview
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="gap-2 bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all">
            {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Order
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
              <h3 className="font-semibold text-sm">Supplier Details</h3>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium flex items-center gap-1.5">
                  🏢 Supplier <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.supplierId} onValueChange={(val) => handleInputChange("supplierId", val)}>
                  <SelectTrigger id="supplier" className="h-11">
                    <SelectValue placeholder="Search or select a supplier..." />
                  </SelectTrigger>
                  <SelectContent>
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
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{supplier.name}</span>
                          {supplier.gstin && <span className="text-xs text-muted-foreground">GSTIN: {supplier.gstin}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSupplier && (
                  <div className="bg-primary/5 rounded-lg p-4 mt-2 border border-primary/10 flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-primary">{selectedSupplier.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedSupplier.email || "No email"}</p>
                      <p className="text-xs text-muted-foreground">GSTIN: {selectedSupplier.gstin || "N/A"}</p>
                    </div>
                    <Badge variant="outline" className="bg-white">Supplier</Badge>
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
                <h3 className="font-semibold text-sm">Order Items ({items.length})</h3>
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
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-1 text-right">GST</div>
                    <div className="col-span-2 text-right">Amount</div>
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
                                  type="button"
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
                          <div className="flex gap-2">
                            <Input
                              value={item.hsnCode}
                              onChange={(e) => updateItem(item.id, "hsnCode", e.target.value)}
                              placeholder="HSN"
                              className="h-7 text-xs w-20"
                            />
                          </div>
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
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                            className="h-9 text-right"
                            min="0"
                          />
                        </div>

                        {/* GST */}
                        <div className="col-span-1">
                          <Select
                            value={item.taxRate.toString()}
                            onValueChange={(val) => updateItem(item.id, "taxRate", parseFloat(val))}
                          >
                            <SelectTrigger className="h-9 text-right px-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {gstRates.map((rate) => (
                                <SelectItem key={rate} value={rate}>
                                  {rate}%
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
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            {items.length > 0 && (
              <div className="bg-muted/10 p-6 border-t border-border/50">
                <div className="flex justify-end">
                  <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Tax</span>
                      <span>₹{totals.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-xl font-bold text-primary">₹{totals.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Additional Info */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Add any additional notes..."
                  className="min-h-[100px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termsConditions" className="text-sm font-medium">Terms & Conditions</Label>
                <Textarea
                  id="termsConditions"
                  value={formData.termsConditions}
                  onChange={(e) => handleInputChange("termsConditions", e.target.value)}
                  placeholder="Enter terms and conditions..."
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
                    value={formData.orderNumber}
                    onChange={(e) => handleInputChange("orderNumber", e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="orderDate" className="text-xs font-medium uppercase text-muted-foreground">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => handleInputChange("orderDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate" className="text-xs font-medium uppercase text-muted-foreground">Expected Delivery</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => handleInputChange("expectedDate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Payment Terms</h3>
            </div>
            <CardContent className="p-6">
              <Select value={formData.paymentTerms} onValueChange={(val) => handleInputChange("paymentTerms", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Immediate</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="15">15 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="45">45 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                </SelectContent>
              </Select>
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
