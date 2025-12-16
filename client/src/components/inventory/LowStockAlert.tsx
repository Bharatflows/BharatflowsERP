import { AlertTriangle, Package, Plus, Edit, TrendingDown, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { useLowStock } from "../../hooks/useInventory";

interface LowStockAlertProps {
  onAdjustStock: (productId: string) => void;
  onEditProduct: (productId: string) => void;
}

// Helper function to compute stock level based on current vs minimum stock
function getStockLevel(currentStock: number, minStock: number): "critical" | "low" | "warning" {
  const ratio = currentStock / minStock;
  if (currentStock === 0 || ratio <= 0.25) return "critical";
  if (ratio <= 0.5) return "low";
  return "warning";
}

// Helper function to estimate days until stockout (simplified estimation)
function estimateDaysUntilStockout(currentStock: number, minStock: number): number {
  if (currentStock === 0) return 0;
  // Simple estimation: assume ~10% of minStock sold per day
  const dailySales = Math.max(minStock * 0.1, 1);
  return Math.ceil(currentStock / dailySales);
}

export function LowStockAlert({ onAdjustStock, onEditProduct }: LowStockAlertProps) {
  const { data: lowStockResponse, isLoading, error } = useLowStock();

  const getStockLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]";
      case "low":
        return "bg-[#fef3c7] text-[#92400e] border-[#fde68a]";
      case "warning":
        return "bg-[#fed7aa] text-[#9a3412] border-[#fdba74]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockLevelLabel = (level: string) => {
    switch (level) {
      case "critical":
        return "Critical";
      case "low":
        return "Low Stock";
      case "warning":
        return "Warning";
      default:
        return "Unknown";
    }
  };

  // Transform API data to include computed fields
  const lowStockProducts = (lowStockResponse?.data || []).map((product: any) => ({
    id: product.id,
    name: product.name,
    sku: product.code || product.sku || 'N/A',
    category: product.category || 'Uncategorized',
    currentStock: product.currentStock || 0,
    minStock: product.minStock || product.reorderLevel || 10,
    unit: product.unit || 'pcs',
    salePrice: Number(product.sellingPrice || product.salePrice || 0),
    stockLevel: getStockLevel(product.currentStock || 0, product.minStock || 10),
    daysUntilStockout: estimateDaysUntilStockout(product.currentStock || 0, product.minStock || 10),
  }));

  const criticalCount = lowStockProducts.filter((p: any) => p.stockLevel === "critical").length;
  const lowCount = lowStockProducts.filter((p: any) => p.stockLevel === "low").length;
  const warningCount = lowStockProducts.filter((p: any) => p.stockLevel === "warning").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading low stock alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-error/10 text-error px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-6" />
            <p>Failed to load low stock alerts. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-success/10 text-success px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Package className="size-6" />
            <div>
              <h3 className="font-medium">All Stock Levels Healthy</h3>
              <p className="opacity-80">No products are currently below their minimum stock levels.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Alert Banner */}
      <div className="bg-error text-white px-6 py-4 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-8" />
          <div className="flex-1">
            <h2>Low Stock Alerts</h2>
            <p className="opacity-90">
              {criticalCount + lowCount + warningCount} products need your attention
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#fecaca] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Critical</p>
              <h3 className="text-foreground mt-1">{criticalCount}</h3>
              <p className="text-muted-foreground">Out of stock or urgent</p>
            </div>
            <div className="bg-[#ef4444] p-3 rounded-lg">
              <TrendingDown className="size-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#fde68a] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Low Stock</p>
              <h3 className="text-foreground mt-1">{lowCount}</h3>
              <p className="text-muted-foreground">Below minimum level</p>
            </div>
            <div className="bg-[#f59e0b] p-3 rounded-lg">
              <AlertTriangle className="size-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#fdba74] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Warning</p>
              <h3 className="text-foreground mt-1">{warningCount}</h3>
              <p className="text-muted-foreground">Approaching minimum</p>
            </div>
            <div className="bg-[#f97316] p-3 rounded-lg">
              <Package className="size-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-foreground">Products Requiring Action</h3>
          <p className="text-muted-foreground">Restock or adjust inventory levels for these products</p>
        </div>

        <div className="divide-y divide-border">
          {lowStockProducts.map((product: any) => (
            <div
              key={product.id}
              className="p-6 hover:bg-[#f8fafc] transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Product Icon */}
                <div
                  className={cn(
                    "p-3 rounded-xl",
                    product.stockLevel === "critical" && "bg-[#fee2e2]",
                    product.stockLevel === "low" && "bg-[#fef3c7]",
                    product.stockLevel === "warning" && "bg-[#fed7aa]"
                  )}
                >
                  <Package
                    className={cn(
                      "size-6",
                      product.stockLevel === "critical" && "text-[#991b1b]",
                      product.stockLevel === "low" && "text-[#92400e]",
                      product.stockLevel === "warning" && "text-[#9a3412]"
                    )}
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="text-foreground mb-1">{product.name}</h4>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>SKU: {product.sku}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("gap-1", getStockLevelColor(product.stockLevel))}
                    >
                      <AlertTriangle className="size-3" />
                      {getStockLevelLabel(product.stockLevel)}
                    </Badge>
                  </div>

                  {/* Stock Information */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-[#f8fafc] rounded-lg">
                      <p className="text-muted-foreground">Current Stock</p>
                      <p className="text-foreground">
                        {product.currentStock} {product.unit}
                      </p>
                    </div>
                    <div className="p-3 bg-[#f8fafc] rounded-lg">
                      <p className="text-muted-foreground">Minimum Stock</p>
                      <p className="text-foreground">
                        {product.minStock} {product.unit}
                      </p>
                    </div>
                    <div className="p-3 bg-[#f8fafc] rounded-lg">
                      <p className="text-muted-foreground">Required Quantity</p>
                      <p className="text-foreground">
                        {Math.max(0, product.minStock - product.currentStock)} {product.unit}
                      </p>
                    </div>
                    <div className="p-3 bg-[#f8fafc] rounded-lg">
                      <p className="text-muted-foreground">Est. Stockout</p>
                      <p className="text-foreground">
                        {product.daysUntilStockout === 0
                          ? "Now"
                          : `${product.daysUntilStockout} days`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onAdjustStock(product.id)}
                      className="gap-2 bg-primary"
                    >
                      <Plus className="size-4" />
                      Add Stock
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditProduct(product.id)}
                      className="gap-2"
                    >
                      <Edit className="size-4" />
                      Edit Product
                    </Button>
                    {product.stockLevel === "critical" && (
                      <div className="ml-auto flex items-center gap-2 text-[#991b1b] bg-[#fee2e2] px-3 py-1.5 rounded-lg">
                        <AlertTriangle className="size-4" />
                        <span>Urgent Action Required</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-info-light border border-info/30 rounded-xl p-6">
        <h3 className="text-foreground mb-3">💡 Inventory Management Tips</h3>
        <ul className="space-y-2 text-foreground">
          <li className="flex items-start gap-2">
            <span className="text-[#2563eb] mt-1">•</span>
            <span>Set appropriate minimum stock levels based on your sales velocity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#2563eb] mt-1">•</span>
            <span>Enable reorder notifications to receive alerts via email or SMS</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#2563eb] mt-1">•</span>
            <span>Review and adjust stock levels regularly based on seasonal demand</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#2563eb] mt-1">•</span>
            <span>Consider setting up automatic purchase orders for fast-moving items</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
