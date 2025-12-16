import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Plus,
  Trash2,
  Save,
  Send,
  X,
  Eye,
  ChevronLeft,
  FileText,
  User,
  Calendar,
  CreditCard,
  Download,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { salesService } from "../../services/sales.service";
import { productsService, partiesService, settingsService } from "../../services/modules.service";
import { AddProductDialog } from "./AddProductDialog";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { Badge } from "../ui/badge";
import { GST_RATES } from "../../constants/tax";

interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

interface CreateInvoiceProps {
  invoiceId?: string | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function CreateInvoice({ invoiceId, onSave, onCancel }: CreateInvoiceProps) {
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          partiesService.getAll({ type: 'customer' }),
          productsService.getAll()
        ]);
        setCustomers(customersRes.data || []);
        setProducts(productsRes.data || []);
      } catch (error) {
        console.error("Failed to fetch master data:", error);
        toast.error("Failed to load customers or products");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        try {
          const invoice = await salesService.getInvoice(invoiceId);

          if (invoice) {
            setCustomerId(invoice.customerId || "");
            setInvoiceNumber(invoice.invoiceNumber);
            setInvoiceDate(invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split("T")[0] : "");
            setDueDate(invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "");

            const mappedItems = (invoice.items || []).map((item: any) => ({
              id: item.id,
              productId: item.productId,
              name: item.productName || item.name,
              description: item.description || "",
              quantity: Number(item.quantity),
              unit: item.unit || "pcs",
              rate: Number(item.rate),
              taxRate: Number(item.taxRate),
              amount: Number(item.total || item.amount)
            }));

            setItems(mappedItems);
            setNotes(invoice.notes || "");
            setTermsConditions((invoice as any).termsConditions || "");
          }
        } catch (error) {
          console.error("Failed to fetch invoice:", error);
          toast.error("Failed to load invoice details");
        }
      };
      fetchInvoice();
    } else {
      // Fetch the next invoice number from the sequence API
      const fetchNextNumber = async () => {
        try {
          const response = await settingsService.getNextSequenceNumber('INVOICE');
          if (response.success && response.data?.nextNumber) {
            setInvoiceNumber(response.data.nextNumber);
          } else {
            // Fallback to a basic format if API fails
            setInvoiceNumber(`INV-${new Date().getFullYear()}-001`);
          }
        } catch (error) {
          console.error("Failed to fetch next invoice number:", error);
          setInvoiceNumber(`INV-${new Date().getFullYear()}-001`);
        }
      };
      fetchNextNumber();
    }
  }, [invoiceId]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      description: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      taxRate: 18,
      amount: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
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
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === itemId) {
            const rate = Number(product.sellingPrice || product.rate || 0);
            const taxRate = Number(product.gstRate || product.taxRate || 0);
            const subtotal = item.quantity * rate;
            const tax = (subtotal * taxRate) / 100;

            return {
              ...item,
              productId,
              name: product.name,
              unit: product.unit,
              rate,
              taxRate,
              amount: subtotal + tax
            };
          }
          return item;
        })
      );
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalTax = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.rate;
    return sum + (itemSubtotal * item.taxRate) / 100;
  }, 0);
  const total = subtotal + totalTax;

  const handleSave = () => {
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const invalidItems = items.filter(item => !item.productId || item.quantity <= 0 || item.rate < 0);
    if (invalidItems.length > 0) {
      toast.error("Please ensure all items have a product, valid quantity, and rate");
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);

    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    const invoiceItems = items.map(item => ({
      ...item,
      productName: item.name
    }));

    const invoiceData = {
      id: invoiceId,
      customerId,
      customerName: selectedCustomer?.name || 'Unknown Customer',
      customer: selectedCustomer ? { name: selectedCustomer.name } : undefined,
      invoiceNumber,
      invoiceDate,
      date: invoiceDate,
      dueDate,
      items: invoiceItems,
      notes,
      termsConditions,
      subtotal,
      totalTax,
      totalAmount: total,
      amount: total,
    };

    onSave(invoiceData);
  };

  const handleAddProductSuccess = (newProduct: any) => {
    setProducts([...products, newProduct]);
    if (activeItemId) {
      selectProduct(activeItemId, newProduct.id);
      setActiveItemId(null);
    }
  };

  const selectedCustomer = customers?.find((c) => c.id === customerId);

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
            <Button onClick={handleSave} className="gap-2 bg-primary text-primary-foreground">
              <Send className="size-4" />
              Send Invoice
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-bold text-primary mb-2">INVOICE</h1>
                <p className="text-muted-foreground">#{invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-xl mb-1">BharatFlow</h2>
                <p className="text-sm text-muted-foreground">123 Business Street</p>
                <p className="text-sm text-muted-foreground">Mumbai, MH 400001</p>
                <p className="text-sm text-muted-foreground">GSTIN: 27ABCDE1234F1Z5</p>
              </div>
            </div>

            {/* Bill To & Details */}
            <div className="flex justify-between mb-12">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Bill To</p>
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
                  <p className="text-sm font-semibold text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">{new Date(invoiceDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Due Date</p>
                  <p className="font-medium">{dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '-'}</p>
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
            <h1 className="text-2xl font-bold text-foreground">{invoiceId ? "Edit Invoice" : "New Invoice"}</h1>
            <p className="text-muted-foreground text-sm">Create and manage customer invoices</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewMode(true)} className="gap-2">
            <Eye className="size-4" />
            Preview
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all">
            <Save className="size-4" />
            Save Invoice
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
                <h3 className="font-semibold text-sm">Invoice Items ({items.length})</h3>
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
                        <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-start group bg-white border border-border rounded-lg mb-2 shadow-sm transition-all hover:shadow-md">
                          {/* Item Details */}
                          <div className="col-span-5 space-y-2">
                            <Select
                              value={item.productId || undefined}
                              onValueChange={(productId) => selectProduct(item.id, productId)}
                            >
                              <SelectTrigger className="h-9 border-transparent hover:border-border bg-transparent hover:bg-white focus:bg-white transition-all p-0 font-medium">
                                <SelectValue placeholder="Select Item" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-start text-primary h-8 px-2 text-sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
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
          <Card className="border-border/50 shadow-sm">
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
                  placeholder="Payment is due within 15 days..."
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
              <h3 className="font-semibold text-sm">Invoice Settings</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber" className="text-xs font-medium uppercase text-muted-foreground">Invoice Number</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">#</span>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="invoiceDate" className="text-xs font-medium uppercase text-muted-foreground">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-xs font-medium uppercase text-muted-foreground">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Payment Options</h3>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded border border-border">
                    <CreditCard className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Online Payment</p>
                    <p className="text-xs text-muted-foreground">Accept via UPI/Card</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
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
    </div>
  );
}
