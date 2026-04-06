import { useState } from "react";
import { ArrowLeft, Save, Plus, Minus, Package, Loader2 } from "lucide-react";
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
import { cn } from "../../lib/utils";
import { ResponsiveGrid } from "../layout/ResponsiveGrid";
import { useProduct, useAdjustStock } from "../../hooks/useInventory";

interface StockAdjustmentProps {
  productId: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

type AdjustmentType = "add" | "remove" | "set";

export function StockAdjustment({ productId, onComplete, onCancel }: StockAdjustmentProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch product data from API
  const { data: productResponse, isLoading: productLoading } = useProduct(productId || '');
  const adjustStockMutation = useAdjustStock();

  const product = productResponse?.data;
  const currentStock = product?.currentStock || 0;
  const unit = product?.unit || 'pcs';

  const reasons = {
    add: [
      "New Purchase",
      "Production Complete",
      "Return from Customer",
      "Stock Count Correction",
      "Other",
    ],
    remove: [
      "Sold",
      "Damaged",
      "Expired",
      "Returned to Supplier",
      "Stock Count Correction",
      "Other",
    ],
    set: [
      "Physical Stock Count",
      "Opening Stock",
      "Stock Audit",
      "Other",
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId) {
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      return;
    }

    if (!reason) {
      return;
    }

    const qty = parseFloat(quantity);

    // Map adjustment type to API type
    let type: 'ADD' | 'REMOVE' | 'DAMAGE' | 'RETURN' | 'CORRECTION';
    let actualQuantity = qty;

    switch (adjustmentType) {
      case "add":
        type = reason === "Return from Customer" ? 'RETURN' : 'ADD';
        break;
      case "remove":
        if (reason === "Damaged") type = 'DAMAGE';
        else if (reason === "Returned to Supplier") type = 'RETURN';
        else type = 'REMOVE';
        break;
      case "set":
        type = 'CORRECTION';
        actualQuantity = qty - currentStock; // Calculate delta for correction
        break;
      default:
        type = 'ADD';
    }

    try {
      await adjustStockMutation.mutateAsync({
        productId,
        quantity: Math.abs(actualQuantity),
        type,
        reason,
        notes: notes || undefined,
      });
      onComplete();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const getNewStock = () => {
    if (!quantity || parseFloat(quantity) <= 0) return currentStock;

    const qty = parseFloat(quantity);
    switch (adjustmentType) {
      case "add":
        return currentStock + qty;
      case "remove":
        return Math.max(0, currentStock - qty);
      case "set":
        return qty;
      default:
        return currentStock;
    }
  };

  if (productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (!product && productId) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={onCancel} className="gap-2 mb-4">
          <ArrowLeft className="size-4" />
          Back to Products
        </Button>
        <div className="bg-error/10 text-error px-6 py-4 rounded-xl">
          <p>Product not found. Please select a valid product.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={onCancel} className="gap-2 mb-4">
          <ArrowLeft className="size-4" />
          Back to Products
        </Button>
        <div className="bg-primary text-primary-foreground px-6 py-4 rounded-xl">
          <h2>Stock Adjustment</h2>
          <p className="opacity-90">Adjust stock levels for your product</p>
        </div>
      </div>

      {/* Product Info */}
      <div className="card-base p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-4 rounded-xl">
            <Package className="size-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-foreground">{product?.name || 'Select Product'}</h3>
            <p className="text-muted-foreground">SKU: {product?.code || product?.sku || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Current Stock</p>
            <h3 className="text-foreground">
              {currentStock} {unit}
            </h3>
          </div>
        </div>
      </div>

      {/* Adjustment Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Adjustment Type */}
        <div className="card-base p-6">
          <Label className="mb-3 block">Adjustment Type</Label>
          <ResponsiveGrid columns="grid-cols-1 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setAdjustmentType("add")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                adjustmentType === "add"
                  ? "border-success bg-success-light"
                  : "border-border hover:border-success/50"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-lg",
                  adjustmentType === "add" ? "bg-success" : "bg-background"
                )}
              >
                <Plus
                  className={cn(
                    "size-6",
                    adjustmentType === "add" ? "text-white" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className={cn(adjustmentType === "add" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
                Add Stock
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdjustmentType("remove")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                adjustmentType === "remove"
                  ? "border-error bg-error-light"
                  : "border-border hover:border-error/50"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-lg",
                  adjustmentType === "remove" ? "bg-error" : "bg-background"
                )}
              >
                <Minus
                  className={cn(
                    "size-6",
                    adjustmentType === "remove" ? "text-white" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className={cn(adjustmentType === "remove" ? "text-destructive" : "text-muted-foreground")}>
                Remove Stock
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdjustmentType("set")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                adjustmentType === "set"
                  ? "border-primary bg-info-light"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-lg",
                  adjustmentType === "set" ? "bg-primary" : "bg-background"
                )}
              >
                <Package
                  className={cn(
                    "size-6",
                    adjustmentType === "set" ? "text-white" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className={cn(adjustmentType === "set" ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground")}>
                Set Stock
              </span>
            </button>
          </ResponsiveGrid>
        </div>

        {/* Quantity and Reason */}
        <div className="card-base p-6">
          <ResponsiveGrid columns="grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <p className="text-muted-foreground">
                {adjustmentType === "set"
                  ? "Set new stock level"
                  : `Quantity to ${adjustmentType === "add" ? "add" : "remove"}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons[adjustmentType].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </ResponsiveGrid>
        </div>

        {/* Summary */}
        <div className="bg-primary text-white rounded-xl p-6" >
          <h3 className="mb-4">Adjustment Summary</h3>
          <ResponsiveGrid columns="grid-cols-1 sm:grid-cols-3">
            <div>
              <p className="opacity-80 mb-1">Current Stock</p>
              <p className="text-2xl">
                {currentStock} {unit}
              </p>
            </div>
            <div>
              <p className="opacity-80 mb-1">Adjustment</p>
              <p className="text-2xl">
                {adjustmentType === "add" && "+"}
                {adjustmentType === "remove" && "-"}
                {adjustmentType === "set" && "="}
                {quantity || "0"} {unit}
              </p>
            </div>
            <div>
              <p className="opacity-80 mb-1">New Stock</p>
              <p className="text-2xl">
                {getNewStock()} {unit}
              </p>
            </div>
          </ResponsiveGrid>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end" >
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="gap-2 bg-primary"
            disabled={adjustStockMutation.isPending || !productId}
          >
            {adjustStockMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Confirm Adjustment
          </Button>
        </div >
      </form >
    </div >
  );
}
