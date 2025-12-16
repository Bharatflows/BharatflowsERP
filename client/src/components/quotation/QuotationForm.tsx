import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { Quotation, QuotationItem } from "./QuotationModule";

interface QuotationFormProps {
  quotation?: Quotation;
  onSave: (quotation: Quotation) => void;
  onCancel: () => void;
}

export function QuotationForm({ quotation, onSave, onCancel }: QuotationFormProps) {
  const [formData, setFormData] = useState<Partial<Quotation>>(
    quotation || {
      quotationNumber: `QT-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      partyName: "",
      partyGSTIN: "",
      partyAddress: "",
      items: [],
      status: "Draft",
      terms: "Payment within 30 days",
      notes: "",
      createdBy: "Admin",
    }
  );

  const [items, setItems] = useState<QuotationItem[]>(quotation?.items || []);

  const addItem = () => {
    const newItem: QuotationItem = {
      id: String(Date.now()),
      productName: "",
      hsn: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      discount: 0,
      taxRate: 18,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate amount
    const item = updatedItems[index];
    const subtotal = item.quantity * item.rate;
    const discountAmount = (subtotal * item.discount) / 100;
    item.amount = subtotal - discountAmount;

    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = items.reduce((sum, item) => {
      const taxableAmount = item.amount;
      return sum + (taxableAmount * item.taxRate) / 100;
    }, 0);

    // For simplicity, split tax equally between CGST and SGST
    const cgst = taxAmount / 2;
    const sgst = taxAmount / 2;
    const total = subtotal + taxAmount;

    return { subtotal, cgst, sgst, igst: 0, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totals = calculateTotals();

    const quotationData: Quotation = {
      id: quotation?.id || String(Date.now()),
      quotationNumber: formData.quotationNumber!,
      date: formData.date!,
      validUntil: formData.validUntil!,
      partyName: formData.partyName!,
      partyGSTIN: formData.partyGSTIN!,
      partyAddress: formData.partyAddress!,
      items,
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      total: totals.total,
      status: formData.status as Quotation["status"] || "Draft",
      terms: formData.terms!,
      notes: formData.notes!,
      createdBy: formData.createdBy!,
    };

    onSave(quotationData);
  };

  const totals = calculateTotals();

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel} size="sm">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-foreground">
            {quotation ? "Edit Quotation" : "New Quotation"}
          </h1>
          <p className="text-muted-foreground">
            Fill in the details below
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details Card */}
        <div className="bg-white rounded-xl border border-border p-4 md:p-6 space-y-4">
          <h3 className="text-foreground">Basic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Quotation Number *</Label>
              <Input
                value={formData.quotationNumber}
                onChange={(e) =>
                  setFormData({ ...formData, quotationNumber: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Valid Until *</Label>
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
                required
              />
            </div>
          </div>
        </div>

        {/* Party Details Card */}
        <div className="bg-white rounded-xl border border-border p-4 md:p-6 space-y-4">
          <h3 className="text-foreground">Party Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Party Name *</Label>
              <Input
                value={formData.partyName}
                onChange={(e) =>
                  setFormData({ ...formData, partyName: e.target.value })
                }
                placeholder="Enter party name"
                required
              />
            </div>
            <div>
              <Label>GSTIN *</Label>
              <Input
                value={formData.partyGSTIN}
                onChange={(e) =>
                  setFormData({ ...formData, partyGSTIN: e.target.value })
                }
                placeholder="27AABCU9603R1ZM"
                required
              />
            </div>
          </div>
          <div>
            <Label>Address *</Label>
            <Textarea
              value={formData.partyAddress}
              onChange={(e) =>
                setFormData({ ...formData, partyAddress: e.target.value })
              }
              placeholder="Enter party address"
              required
              rows={2}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl border border-border p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground">Items</h3>
            <Button type="button" onClick={addItem} size="sm" className="bg-[#3b82f6] hover:bg-[#2563eb]">
              <Plus className="size-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8fafc] border-b border-border">
                <tr>
                  <th className="text-left p-2 text-muted-foreground">Product</th>
                  <th className="text-left p-2 text-muted-foreground">HSN</th>
                  <th className="text-left p-2 text-muted-foreground">Qty</th>
                  <th className="text-left p-2 text-muted-foreground">Unit</th>
                  <th className="text-left p-2 text-muted-foreground">Rate</th>
                  <th className="text-left p-2 text-muted-foreground">Disc%</th>
                  <th className="text-left p-2 text-muted-foreground">Tax%</th>
                  <th className="text-right p-2 text-muted-foreground">Amount</th>
                  <th className="text-center p-2 text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="p-2">
                      <Input
                        value={item.productName}
                        onChange={(e) => updateItem(index, "productName", e.target.value)}
                        placeholder="Product name"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={item.hsn}
                        onChange={(e) => updateItem(index, "hsn", e.target.value)}
                        placeholder="HSN"
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value))
                        }
                        min="1"
                        className="w-20"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                        placeholder="pcs"
                        className="w-16"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", parseFloat(e.target.value))
                        }
                        min="0"
                        step="0.01"
                        className="w-24"
                        required
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(index, "discount", parseFloat(e.target.value))
                        }
                        min="0"
                        max="100"
                        className="w-16"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={item.taxRate}
                        onChange={(e) =>
                          updateItem(index, "taxRate", parseFloat(e.target.value))
                        }
                        min="0"
                        max="100"
                        className="w-16"
                      />
                    </td>
                    <td className="p-2 text-right">
                      ₹{item.amount.toFixed(2)}
                    </td>
                    <td className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="size-4 text-[#ef4444]" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-foreground">Item {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="size-4 text-[#ef4444]" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Product Name *</Label>
                    <Input
                      value={item.productName}
                      onChange={(e) => updateItem(index, "productName", e.target.value)}
                      placeholder="Product name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>HSN Code</Label>
                      <Input
                        value={item.hsn}
                        onChange={(e) => updateItem(index, "hsn", e.target.value)}
                        placeholder="HSN"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                        placeholder="pcs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value))
                        }
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <Label>Rate *</Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", parseFloat(e.target.value))
                        }
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Discount %</Label>
                      <Input
                        type="number"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(index, "discount", parseFloat(e.target.value))
                        }
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        value={item.taxRate}
                        onChange={(e) =>
                          updateItem(index, "taxRate", parseFloat(e.target.value))
                        }
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Amount:</p>
                      <p className="text-foreground">₹{item.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items added. Click "Add Item" to get started.
            </div>
          )}
        </div>

        {/* Terms & Notes */}
        <div className="bg-white rounded-xl border border-border p-4 md:p-6 space-y-4">
          <h3 className="text-foreground">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Enter terms and conditions"
                rows={3}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-white rounded-xl border border-border p-4 md:p-6">
          <div className="max-w-md ml-auto space-y-2">
            <div className="flex justify-between">
              <p className="text-muted-foreground">Subtotal:</p>
              <p className="text-foreground">₹{totals.subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">CGST:</p>
              <p className="text-foreground">₹{totals.cgst.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">SGST:</p>
              <p className="text-foreground">₹{totals.sgst.toFixed(2)}</p>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <p className="text-foreground">Total:</p>
              <p className="text-foreground">₹{totals.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" className="bg-[#3b82f6] hover:bg-[#2563eb] sm:w-auto">
            <Save className="size-4 mr-2" />
            Save Quotation
          </Button>
        </div>
      </form>
    </div>
  );
}
