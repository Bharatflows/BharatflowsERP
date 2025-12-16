import { useState } from "react";
import { ProductList } from "./ProductList";
import { AddEditProduct } from "./AddEditProduct";
import { StockAdjustment } from "./StockAdjustment";
import { LowStockAlert } from "./LowStockAlert";
import { WarehouseManagement } from "./WarehouseManagement";
import { StockTransfer } from "./StockTransfer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Package, AlertTriangle, History, Plus, Building2, ArrowRightLeft, Search, Filter, Download } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ModuleHeader } from "../ui/module-header";

type View = "list" | "create" | "edit" | "adjustment";
type Tab = "products" | "lowstock" | "warehouses" | "transfers" | "adjustments";

interface InventoryModuleProps {
  onBack?: () => void;
}

export function InventoryModule({ onBack }: InventoryModuleProps) {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [productView, setProductView] = useState<View>("list");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [adjustmentProductId, setAdjustmentProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCreateProduct = () => {
    setProductView("create");
    setSelectedProductId(null);
  };

  const handleProductSaved = () => {
    setProductView("list");
  };

  const handleBackToList = () => {
    setProductView("list");
    setShowStockAdjustment(false);
  };

  const handleAdjustStock = (productId: string) => {
    setAdjustmentProductId(productId);
    setShowStockAdjustment(true);
  };

  const handleAdjustmentComplete = () => {
    setShowStockAdjustment(false);
    setAdjustmentProductId(null);
  };

  return (
    <div className="p-6 space-y-6 min-h-full bg-background">
      <ModuleHeader
        title="Inventory Management"
        description="Manage products, warehouses, stock levels, and track inventory"
        showBackButton={false}
        icon={<Package className="size-5 text-primary" />}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={handleCreateProduct}>
              <Plus className="size-4 mr-2" />
              Add Product
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="size-4 mr-2" />
            Filters
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="products">
              <Package className="size-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="lowstock">
              <AlertTriangle className="size-4 mr-2" />
              Low Stock
            </TabsTrigger>
            <TabsTrigger value="warehouses">
              <Building2 className="size-4 mr-2" />
              Warehouses
            </TabsTrigger>
            <TabsTrigger value="transfers">
              <ArrowRightLeft className="size-4 mr-2" />
              Stock Transfer
            </TabsTrigger>
            <TabsTrigger value="adjustments">
              <History className="size-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {productView === "list" && !showStockAdjustment && (
              <ProductList
                onCreateNew={handleCreateProduct}
                onEditProduct={(id) => {
                  setSelectedProductId(id);
                  setProductView("edit");
                }}
                onAdjustStock={handleAdjustStock}
              />
            )}
            {(productView === "create" || productView === "edit") && (
              <AddEditProduct
                productId={selectedProductId}
                onSave={handleProductSaved}
                onCancel={handleBackToList}
              />
            )}
            {showStockAdjustment && (
              <StockAdjustment
                productId={adjustmentProductId}
                onComplete={handleAdjustmentComplete}
                onCancel={handleBackToList}
              />
            )}
          </TabsContent>

          <TabsContent value="lowstock">
            <LowStockAlert
              onAdjustStock={handleAdjustStock}
              onEditProduct={(id) => {
                setSelectedProductId(id);
                setProductView("edit");
                setActiveTab("products");
              }}
            />
          </TabsContent>

          <TabsContent value="warehouses">
            <WarehouseManagement />
          </TabsContent>

          <TabsContent value="transfers">
            <StockTransfer />
          </TabsContent>

          <TabsContent value="adjustments">
            <div className="bg-card rounded-xl border p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <History className="size-8 text-primary" />
                </div>
              </div>
              <h3 className="text-foreground font-semibold mb-2">Stock Adjustment History</h3>
              <p className="text-muted-foreground mb-4">
                View all stock adjustments, additions, and removals
              </p>
              <p className="text-muted-foreground text-sm">Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}