import { useState } from "react";
import { ProductList } from "./ProductList";
import { AddEditProduct } from "./AddEditProduct";
import { StockAdjustment } from "./StockAdjustment";
import { InventoryOverview } from "./InventoryOverview";
import { BillOfMaterials } from "./BillOfMaterials";
import { WastageTracking } from "./WastageTracking";
import { CreateStockAdjustment } from "./CreateStockAdjustment";
import { ViewStockAdjustment } from "./ViewStockAdjustment";
import { useProducts, useLowStock, useWarehouses, useInventoryValuation } from "../../hooks/useInventory";
import { toast } from "sonner";

type View = "list" | "create" | "edit" | "adjustment" | "adjustment-list" | "adjustment-create" | "adjustment-view" | "bom" | "wastage";
type Tab = "products" | "lowstock" | "warehouses" | "transfers" | "adjustments" | "history" | "bom" | "wastage";

interface InventoryModuleProps {
  onBack?: () => void;
}

export function InventoryModule({ onBack }: InventoryModuleProps) {
  const [activeTab, setActiveTab] = useState<string>("products");
  const [productView, setProductView] = useState<View>("list");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [adjustmentProductId, setAdjustmentProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<string | null>(null);

  // Data fetching
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: lowStockData } = useLowStock();
  const { data: warehousesData } = useWarehouses();
  const { data: valuationData } = useInventoryValuation();

  // Extract data
  const result = productsData?.data as any;
  const products = Array.isArray(result?.products) ? result.products : (Array.isArray(result) ? result : []);

  const lowStockResult = lowStockData?.data as any;
  const lowStockCount = Array.isArray(lowStockResult?.products) ? lowStockResult.products.length : 0;

  const warehousesResult = warehousesData?.data as any;
  const warehousesCount = Array.isArray(warehousesResult) ? warehousesResult.length : 0;

  const valuation = Number(valuationData?.data?.totalValue || 0);

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
    setProductView("list");
  };

  const handleCreateAdjustment = () => {
    setProductView("adjustment-create");
  };

  const handleViewAdjustment = (id: string) => {
    setSelectedAdjustmentId(id);
    setProductView("adjustment-view");
  };

  const handleAdjustmentSaved = () => {
    setProductView("list");
    setActiveTab("adjustments");
  };

  const handleExport = () => {
    toast.info("Exporting inventory data...");
  };

  return (
    <div className="min-h-full">
      {productView === "list" && !showStockAdjustment ? (
        <InventoryOverview
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          products={products}
          productsLoading={productsLoading}
          lowStockCount={lowStockCount}
          warehousesCount={warehousesCount}
          valuation={valuation}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onCreateProduct={handleCreateProduct}
          onEditProduct={(id) => {
            setSelectedProductId(id);
            setProductView("edit");
          }}
          onAdjustStock={handleAdjustStock}
          onCreateAdjustment={handleCreateAdjustment}
          onViewAdjustment={handleViewAdjustment}
          onExport={handleExport}
        />
      ) : productView === "bom" ? (
        <BillOfMaterials />
      ) : productView === "wastage" ? (
        <WastageTracking />
      ) : (
        <div className="p-6">
          {(productView === "create" || productView === "edit") && (
            <AddEditProduct
              productId={selectedProductId || undefined}
              onSave={handleProductSaved}
              onCancel={handleBackToList}
            />
          )}
          {showStockAdjustment && !productView.includes('adjustment-') && (
            <StockAdjustment
              productId={adjustmentProductId}
              onComplete={handleAdjustmentComplete}
              onCancel={handleBackToList}
            />
          )}
          {productView === "adjustment-create" && (
            <CreateStockAdjustment
              onSave={handleAdjustmentSaved}
              onCancel={handleBackToList}
            />
          )}
          {productView === "adjustment-view" && selectedAdjustmentId && (
            <ViewStockAdjustment
              id={selectedAdjustmentId}
              onBack={handleBackToList}
            />
          )}
        </div>
      )}
    </div>
  );
}