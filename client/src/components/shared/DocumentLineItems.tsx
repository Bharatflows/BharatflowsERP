/**
 * DocumentLineItems Component
 * 
 * Shared component for displaying and editing line items in document forms.
 * Used by Invoice, Estimate, Quotation, Sales Order, Delivery Challan forms.
 */

import { Plus, X, Package } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { DocumentLineItem } from "../../types/documentTypes";
import { Product } from "../../types";

interface DocumentLineItemsProps {
    items: DocumentLineItem[];
    products: Product[];
    onAddItem: () => void;
    onRemoveItem: (id: string) => void;
    onUpdateItem: (id: string, field: keyof DocumentLineItem, value: any) => void;
    onProductSelect: (itemId: string, product: Product) => void;
    totals: {
        subtotal: number;
        totalTax: number;
        totalAmount: number;
    };
    loading?: boolean;
    showAddProductButton?: boolean;
    onAddProduct?: () => void;
}

// Format currency helper (fallback if not imported)
const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
};

export function DocumentLineItems({
    items,
    products,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    onProductSelect,
    totals,
    loading = false,
    showAddProductButton = false,
    onAddProduct,
}: DocumentLineItemsProps) {
    const handleProductChange = (itemId: string, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            onProductSelect(itemId, product);
        }
    };

    return (
        <Card className="border rounded-xl">
            <CardContent className="p-0">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 p-4 bg-muted/50 rounded-t-xl font-medium text-sm text-muted-foreground">
                    <div className="col-span-4">Product / Service</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-1 text-center">Tax %</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1"></div>
                </div>

                {/* Items */}
                <div className="divide-y">
                    {items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 p-4 items-center">
                            {/* Product Select */}
                            <div className="col-span-4">
                                <Select
                                    value={item.productId || ""}
                                    onValueChange={(value) => handleProductChange(item.id, value)}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select product...">
                                            {item.name || item.productName || "Select product..."}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                    <span>{product.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        ({product.sku})
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                        {showAddProductButton && onAddProduct && (
                                            <div className="p-2 border-t">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={onAddProduct}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add New Product
                                                </Button>
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Quantity */}
                            <div className="col-span-1">
                                <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                        onUpdateItem(item.id, "quantity", Number(e.target.value) || 1)
                                    }
                                    className="text-center rounded-xl"
                                />
                            </div>

                            {/* Unit */}
                            <div className="col-span-1">
                                <Input
                                    value={item.unit}
                                    onChange={(e) => onUpdateItem(item.id, "unit", e.target.value)}
                                    className="rounded-xl"
                                    placeholder="PCS"
                                />
                            </div>

                            {/* Rate */}
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.rate}
                                    onChange={(e) =>
                                        onUpdateItem(item.id, "rate", Number(e.target.value) || 0)
                                    }
                                    className="text-right rounded-xl"
                                />
                            </div>

                            {/* Tax Rate */}
                            <div className="col-span-1">
                                <Select
                                    value={String(item.taxRate)}
                                    onValueChange={(value) =>
                                        onUpdateItem(item.id, "taxRate", Number(value))
                                    }
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0%</SelectItem>
                                        <SelectItem value="5">5%</SelectItem>
                                        <SelectItem value="12">12%</SelectItem>
                                        <SelectItem value="18">18%</SelectItem>
                                        <SelectItem value="28">28%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount */}
                            <div className="col-span-2 text-right font-medium">
                                {formatAmount(item.amount || 0)}
                            </div>

                            {/* Remove Button */}
                            <div className="col-span-1 flex justify-center">
                                {items.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onRemoveItem(item.id)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Item Button */}
                <div className="p-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddItem}
                        className="gap-2 rounded-xl"
                    >
                        <Plus className="h-4 w-4" />
                        Add Line Item
                    </Button>
                </div>

                <Separator />

                {/* Totals */}
                <div className="p-4 space-y-2 bg-muted/30 rounded-b-xl">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatAmount(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatAmount(totals.totalTax)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{formatAmount(totals.totalAmount)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
