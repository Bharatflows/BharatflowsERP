import { useState, useMemo } from "react";
import { DataTable } from "../ui/data-table";
import { StatsCard } from "../ui/stats-card";
import { ListFilters } from "../ui/ListFilters";
import { exportToCSV, exportToExcel, exportToPDF, formatCurrency } from "../../lib/exportUtils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { ConfirmActionDialog } from "../system";
import { cn } from "../../lib/utils";
import { useProducts, useDeleteProduct } from "../../hooks/useInventory";
import { NoDataEmptyState } from "../ui/EmptyState";
import {
  ModuleLayout,
  ModuleHeader,
  ModuleControls,
  ModuleContent,
  ControlGroup,
  FilterBar
} from "../layout/ModuleLayout";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

const PackageIcon = (props: any) => <MIcon name="inventory_2" {...props} />
const TrendingDownIcon = (props: any) => <MIcon name="trending_down" {...props} />
const TrendingUpIcon = (props: any) => <MIcon name="trending_up" {...props} />
const MinusIcon = (props: any) => <MIcon name="remove" {...props} />


interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  hsnCode: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number;
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
}

interface ProductListProps {
  onCreateNew: () => void;
  onEditProduct: (id: string) => void;
  onAdjustStock: (id: string) => void;
  hideStats?: boolean;
}

export function ProductList({ onCreateNew, onEditProduct, onAdjustStock, hideStats = false }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // TanStack Query
  const { data: productsData, isLoading: loading, isFetching, refetch } = useProducts();
  const deleteMutation = useDeleteProduct();

  // Map API response to component format
  const products: Product[] = useMemo(() => {
    const productsArray = (productsData?.data as any) || [];
    return productsArray.map((p: any) => ({
      ...p,
      sku: p.code || p.sku || "N/A",
      currentStock: p.stockQuantity || p.currentStock || 0,
      minStock: p.lowStockThreshold || p.minStock || 0,
      category: p.category?.name || p.category || "Uncategorized",
      unit: p.unit?.name || p.unit || "N/A",
      stockStatus: (p.stockQuantity || 0) <= (p.lowStockThreshold || 0) ? 'low-stock' : 'in-stock'
    }));
  }, [productsData]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock": return "success";
      case "low-stock": return "warning";
      case "out-of-stock": return "danger";
      default: return "secondary";
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case "in-stock": return <MIcon name="trending_up" className="text-[12px]" />;
      case "low-stock": return <MIcon name="remove" className="text-[12px]" />;
      case "out-of-stock": return <MIcon name="trending_down" className="text-[12px]" />;
      default: return null;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    if (stockFilter === "all") return matchesSearch;
    if (stockFilter === "low_stock") return matchesSearch && product.stockStatus === "low-stock";
    if (stockFilter === "out_of_stock") return matchesSearch && product.currentStock === 0;
    return matchesSearch;
  });

  const calculateStats = () => {
    const total = products.length;
    const lowStock = products.filter(p => p.stockStatus === "low-stock").length;
    const outOfStock = products.filter(p => p.currentStock === 0).length;
    const value = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
    return { total, lowStock, outOfStock, value };
  };

  const stats = calculateStats();

  // Export handlers
  const handleExportCSV = () => exportToCSV(filteredProducts, 'inventory-products');
  const handleExportExcel = () => exportToExcel(filteredProducts, 'inventory-products');
  const handleExportPDF = () => {
    const columns = ['name', 'sku', 'category', 'currentStock', 'sellingPrice'];
    const data = filteredProducts.map(p => [p.name, p.sku, p.category, p.currentStock, p.sellingPrice]);
    exportToPDF({ title: 'Inventory Products', columns, data, filename: 'inventory-products' });
  };

  const columns: any[] = [
    {
      header: "Product",
      accessorKey: "name",
      cell: (product: Product) => (
        <div>
          <span className="font-semibold text-foreground">{product.name}</span>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">{product.sku}</div>
        </div>
      )
    },
    {
      header: "Category",
      accessorKey: "category",
    },
    {
      header: "Stock",
      accessorKey: "currentStock",
      cell: (product: Product) => (
        <div className="flex flex-col items-start gap-1">
          <span className={cn(
            "font-mono font-bold",
            product.currentStock === 0 ? "text-red-600" :
              product.currentStock <= product.minStock ? "text-amber-600" : "text-foreground dark:text-muted-foreground"
          )}>
            {product.currentStock} {product.unit}
          </span>
          {product.currentStock <= product.minStock && product.currentStock > 0 && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4">
              Low
            </Badge>
          )}
        </div>
      )
    },
    {
      header: "Value",
      accessorKey: "sellingPrice",
      cell: (product: Product) => (
        <div className="text-right">
          <div className="font-mono font-semibold text-foreground">{formatCurrency(product.sellingPrice)}</div>
          <div className="text-[10px] text-muted-foreground">Cost: {formatCurrency(product.purchasePrice)}</div>
        </div>
      )
    },
    {
      header: "Status",
      accessorKey: "stockStatus",
      cell: (product: Product) => (
        <div className="flex justify-center w-full">
          <Badge
            variant={getStatusColor(product.stockStatus) as any}
            className="capitalize px-2 h-5"
          >
            {product.stockStatus === "in-stock" ? "In Stock" : product.stockStatus.replace("-", " ")}
          </Badge>
        </div>
      )
    },
    {
      header: "",
      accessorKey: "id",
      cell: (product: Product) => (
        <div className="flex justify-end pr-[8px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-[32px] w-[32px] text-muted-foreground hover:text-foreground dark:hover:text-slate-100">
                <MIcon name="more_vert" className="text-[16px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditProduct(product.id)}>
                <MIcon name="edit" className="text-[14px] mr-[8px]" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAdjustStock(product.id)}>
                <MIcon name="trending_up" className="text-[14px] mr-[8px]" /> Adjust Stock
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                onClick={() => setDeleteId(product.id)}
              >
                <MIcon name="delete" className="text-[14px] mr-[8px]" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const renderMobileItem = (product: Product) => (
    <div className="flex flex-col gap-2 p-1">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-foreground">{product.name}</div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">{product.sku}</div>
        </div>
        <Badge
          variant={getStatusColor(product.stockStatus) as any}
          className="capitalize text-xs"
        >
          {product.stockStatus === "in-stock" ? "In Stock" : product.stockStatus.replace("-", " ")}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs">Stock</span>
          <span>{product.currentStock} {product.unit}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-muted-foreground text-xs">Price</span>
          <span>{formatCurrency(product.sellingPrice)}</span>
        </div>
      </div>
      <div className="flex gap-[8px] mt-[8px]">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-body-sm font-bold h-[32px] rounded-[4px]"
          onClick={(e) => { e.stopPropagation(); onAdjustStock(product.id); }}
        >
          <MIcon name="inventory_2" className="text-[16px] mr-[8px]" />
          Adjust
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-body-sm font-bold h-[32px] rounded-[4px]"
          onClick={(e) => { e.stopPropagation(); onEditProduct(product.id); }}
        >
          <MIcon name="edit" className="text-[16px] mr-[8px]" />
          Edit
        </Button>
      </div>
    </div>
  );

  return (
    <ModuleLayout>
      <ModuleHeader
        title="Products"
        description="Manage your product inventory and stock levels"
        breadcrumbs={[
          { label: "Inventory", href: "/inventory" },
          { label: "Products" },
        ]}
        actions={
          <Button onClick={onCreateNew} className="gap-[8px] h-[40px] px-[20px] bg-primary text-white hover:bg-orange-700 font-bold rounded-[8px]">
            <MIcon name="add" className="text-[20px]" />
            Add Product
          </Button>
        }
      />

      {!hideStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] px-[4px] pb-[8px]">
          <StatsCard
            label="Total Products"
            value={stats.total}
            icon={PackageIcon}
            className="p-[16px]"
            gradient="bg-gradient-to-br from-primary to-primary/80"
            shadowColor="shadow-primary/20"
          />
          <StatsCard
            label="Low Stock"
            value={stats.lowStock}
            icon={TrendingDownIcon}
            className="p-[16px]"
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
            shadowColor="shadow-amber-500/20"
          />
          <StatsCard
            label="Out of Stock"
            value={stats.outOfStock}
            icon={MinusIcon}
            className="p-[16px]"
            gradient="bg-gradient-to-br from-rose-500 to-rose-600"
            shadowColor="shadow-rose-500/20"
          />
          <StatsCard
            label="Inventory Value"
            value={formatCurrency(stats.value)}
            icon={TrendingUpIcon}
            className="p-[16px]"
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            shadowColor="shadow-emerald-500/20"
          />
        </div>
      )}

      <ModuleControls>
        <FilterBar>
          <ListFilters
            searchPlaceholder="Search products..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            statusOptions={[
              { value: "all", label: "All Items" },
              { value: "in-stock", label: "In Stock" },
              { value: "low-stock", label: "Low Stock" },
              { value: "out-of-stock", label: "Out of Stock" },
            ]}
            statusValue={stockFilter}
            onStatusChange={setStockFilter}
            onRefresh={refetch}
            isFetching={isFetching}
            className="border-none p-0 shadow-none bg-transparent"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-[8px] h-[44px] rounded-[8px] border-border text-body font-bold">
                  <MIcon name="download" className="text-[20px]" />
                  Export
                  <MIcon name="expand_more" className="text-[16px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-[8px]">
                <DropdownMenuItem onClick={handleExportCSV} className="rounded-[4px] py-[8px]">
                  <MIcon name="description" className="text-[18px] mr-[8px]" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="rounded-[4px] py-[8px]">
                  <MIcon name="table_view" className="text-[18px] mr-[8px]" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="rounded-[4px] py-[8px]">
                  <MIcon name="picture_as_pdf" className="text-[18px] mr-[8px]" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ListFilters>
        </FilterBar>
      </ModuleControls>

      <ModuleContent
        isEmpty={!loading && filteredProducts.length === 0}
        isLoading={loading}
        emptyState={{
          title: "No products found",
          description: "Add your first product to get started",
          icon: "package",
          action: {
            label: "Add First Product",
            onClick: onCreateNew
          }
        }}
      >
        <DataTable
          data={filteredProducts}
          columns={columns}
          mobileRenderer={renderMobileItem}
          isLoading={loading}
          onRowClick={(product) => onEditProduct(product.id)}
        />
      </ModuleContent>

      <ConfirmActionDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Product?"
        description={`Are you sure you want to delete "${products.find(p => p.id === deleteId)?.name}"? This action cannot be undone and will affect any related inventory data.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </ModuleLayout>
  );
}
