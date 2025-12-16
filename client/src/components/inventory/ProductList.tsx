import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Loader2,
  LayoutGrid,
  List,
  ArrowUpDown
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils";
import { useProducts, useDeleteProduct } from "../../hooks/useInventory";
import { CardSkeleton, TableSkeleton } from "../ui/LoadingSkeletons";
import { NoDataEmptyState } from "../ui/EmptyState";

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
}

export function ProductList({ onCreateNew, onEditProduct, onAdjustStock }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // New state for view, sort, and pagination
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // TanStack Query - automatic caching, loading states, and refetching
  const { data: productsData, isLoading: loading } = useProducts();
  const deleteMutation = useDeleteProduct();

  // Map API response to component format
  const products: Product[] = useMemo(() => {
    const productsArray = (productsData?.data as any) || [];
    return productsArray.map((p: any) => ({
      ...p,
      sku: p.code || p.sku || '',
      stockStatus: (p.currentStock <= 0 ? 'out-of-stock' : p.currentStock <= p.minStock ? 'low-stock' : 'in-stock') as "in-stock" | "low-stock" | "out-of-stock",
      category: p.category || 'Uncategorized'
    }));
  }, [productsData]);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "badge-success";
      case "low-stock":
        return "badge-warning";
      case "out-of-stock":
        return "badge-error";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case "in-stock":
        return <TrendingUp className="size-3" />;
      case "low-stock":
        return <Minus className="size-3" />;
      case "out-of-stock":
        return <TrendingDown className="size-3" />;
      default:
        return null;
    }
  };

  const handleSort = (key: keyof Product) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.hsnCode && product.hsnCode.includes(searchQuery));
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesStock = stockFilter === "all" || product.stockStatus === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Loading state with skeletons
  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
        <TableSkeleton rows={8} columns={8} />
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <NoDataEmptyState
        itemName="products"
        onAdd={onCreateNew}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or HSN code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stock Status Filter */}
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none h-9 w-9"
              onClick={() => setViewMode("list")}
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none h-9 w-9"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>

          {/* Export Button */}
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Products</p>
              <h3 className="text-foreground mt-1">{products.length}</h3>
            </div>
            <div className="bg-primary p-3 rounded-lg">
              <Package className="size-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">In Stock</p>
              <h3 className="text-foreground mt-1">
                {products.filter((p) => p.stockStatus === "in-stock").length}
              </h3>
            </div>
            <div className="bg-[#10b981] p-3 rounded-lg">
              <TrendingUp className="size-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Low Stock</p>
              <h3 className="text-foreground mt-1">
                {products.filter((p) => p.stockStatus === "low-stock").length}
              </h3>
            </div>
            <div className="bg-[#f59e0b] p-3 rounded-lg">
              <Minus className="size-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Out of Stock</p>
              <h3 className="text-foreground mt-1">
                {products.filter((p) => p.stockStatus === "out-of-stock").length}
              </h3>
            </div>
            <div className="bg-[#ef4444] p-3 rounded-lg">
              <TrendingDown className="size-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Products List/Grid */}
      {viewMode === "list" ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">Product <ArrowUpDown className="size-3" /></div>
                  </th>
                  <th className="text-left px-6 py-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("category")}>
                    <div className="flex items-center gap-1">Category <ArrowUpDown className="size-3" /></div>
                  </th>
                  <th className="text-left px-6 py-4 text-muted-foreground">HSN Code</th>
                  <th className="text-right px-6 py-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("currentStock")}>
                    <div className="flex items-center justify-end gap-1">Stock <ArrowUpDown className="size-3" /></div>
                  </th>
                  <th className="text-right px-6 py-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("purchasePrice")}>
                    <div className="flex items-center justify-end gap-1">Purchase Price <ArrowUpDown className="size-3" /></div>
                  </th>
                  <th className="text-right px-6 py-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("sellingPrice")}>
                    <div className="flex items-center justify-end gap-1">Sale Price <ArrowUpDown className="size-3" /></div>
                  </th>
                  <th className="text-center px-6 py-4 text-muted-foreground">Status</th>
                  <th className="text-center px-6 py-4 text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <Package className="size-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No products found</p>
                      <Button onClick={onCreateNew} variant="outline" className="gap-2">
                        <Plus className="size-4" />
                        Add Your First Product
                      </Button>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/50 transition-colors",
                        index === paginatedProducts.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground font-medium">{product.name}</p>
                          <p className="text-muted-foreground text-sm">SKU: {product.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-foreground">{product.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-foreground">{product.hsnCode}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p className="text-foreground font-medium">
                            {product.currentStock} {product.unit}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Min: {product.minStock}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-foreground">
                          ₹{Number(product.purchasePrice).toLocaleString("en-IN")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-foreground">
                          ₹{Number(product.sellingPrice).toLocaleString("en-IN")}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <Badge
                            variant="outline"
                            className={cn("gap-1", getStatusColor(product.stockStatus))}
                          >
                            {getStockIcon(product.stockStatus)}
                            {product.stockStatus === "in-stock" && "In Stock"}
                            {product.stockStatus === "low-stock" && "Low Stock"}
                            {product.stockStatus === "out-of-stock" && "Out of Stock"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAdjustStock(product.id)}
                            className="gap-1"
                          >
                            <Package className="size-4" />
                            Adjust
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditProduct(product.id)}>
                                <Edit className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="size-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("gap-1", getStatusColor(product.stockStatus))}
                  >
                    {getStockIcon(product.stockStatus)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p>{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Stock</p>
                    <p className="font-medium">{product.currentStock} {product.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purchase</p>
                    <p>₹{Number(product.purchasePrice).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Selling</p>
                    <p className="font-medium">₹{Number(product.sellingPrice).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onAdjustStock(product.id)}
                  >
                    Adjust
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEditProduct(product.id)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show current page window could be added here
                // For simplicity showing first 5 or all if less
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
