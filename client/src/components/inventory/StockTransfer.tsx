import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  MoreVertical,
  Truck,
  Loader2,
} from "lucide-react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useStockMovements, useWarehouses, useProducts, useTransferStock } from "../../hooks/useInventory";

interface StockTransferItem {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  reason?: string;
  notes?: string;
  productId: string;
  product?: {
    name: string;
  };
  warehouseId?: string;
  warehouse?: {
    name: string;
    code: string;
  };
  createdAt: string;
}

export function StockTransfer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    fromWarehouseId: "",
    toWarehouseId: "",
    productId: "",
    quantity: "",
    notes: "",
  });

  // API hooks
  const { data: movementsResponse, isLoading: movementsLoading } = useStockMovements({
    type: "TRANSFER_OUT", // Get transfer movements
    limit: 100,
  });
  const { data: warehousesResponse, isLoading: warehousesLoading } = useWarehouses();
  const { data: productsResponse, isLoading: productsLoading } = useProducts();
  const transferStockMutation = useTransferStock();

  const isLoading = movementsLoading || warehousesLoading || productsLoading;

  // Transform stock movements into transfer records
  const transfers: StockTransferItem[] = movementsResponse?.data || [];
  const warehouses = warehousesResponse?.data || [];
  const products = productsResponse?.data || [];

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      (transfer.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transfer.product?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transfer.warehouse?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && transfer.type === statusFilter;
  });

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "TRANSFER_OUT":
        return "Transfer Out";
      case "TRANSFER_IN":
        return "Transfer In";
      case "ADJUSTMENT":
        return "Adjustment";
      default:
        return type;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case "TRANSFER_OUT":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "TRANSFER_IN":
        return "bg-green-100 text-green-700 border-green-300";
      case "PURCHASE":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "SALE":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "TRANSFER_OUT":
        return <Truck className="h-3 w-3" />;
      case "TRANSFER_IN":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  const stats = {
    total: transfers.length,
    transferOut: transfers.filter((t) => t.type === "TRANSFER_OUT").length,
    transferIn: transfers.filter((t) => t.type === "TRANSFER_IN").length,
    totalQuantity: transfers.reduce((sum, t) => sum + Math.abs(t.quantity), 0),
  };

  const handleCreateTransfer = async () => {
    if (!newTransfer.fromWarehouseId || !newTransfer.toWarehouseId || !newTransfer.productId || !newTransfer.quantity) {
      return;
    }

    try {
      await transferStockMutation.mutateAsync({
        productId: newTransfer.productId,
        fromWarehouseId: newTransfer.fromWarehouseId,
        toWarehouseId: newTransfer.toWarehouseId,
        quantity: parseInt(newTransfer.quantity),
        notes: newTransfer.notes || undefined,
      });
      setNewTransfer({
        fromWarehouseId: "",
        toWarehouseId: "",
        productId: "",
        quantity: "",
        notes: "",
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading stock transfers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-sm mb-1">Total Movements</div>
            <div className="text-2xl font-semibold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-sm mb-1">Transfers Out</div>
            <div className="text-2xl font-semibold text-[#2563eb]">{stats.transferOut}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-sm mb-1">Transfers In</div>
            <div className="text-2xl font-semibold text-[#10b981]">{stats.transferIn}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-sm mb-1">Total Quantity</div>
            <div className="text-2xl font-semibold text-foreground">
              {stats.totalQuantity.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Stock Transfers</CardTitle>
              <CardDescription>
                Transfer stock between warehouses and track shipments
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Transfer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Stock Transfer</DialogTitle>
                  <DialogDescription>
                    Transfer stock from one warehouse to another
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Warehouse *</Label>
                      <Select
                        value={newTransfer.fromWarehouseId}
                        onValueChange={(value) => setNewTransfer({ ...newTransfer, fromWarehouseId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh: any) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.code} - {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>To Warehouse *</Label>
                      <Select
                        value={newTransfer.toWarehouseId}
                        onValueChange={(value) => setNewTransfer({ ...newTransfer, toWarehouseId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses
                            .filter((wh: any) => wh.id !== newTransfer.fromWarehouseId)
                            .map((wh: any) => (
                              <SelectItem key={wh.id} value={wh.id}>
                                {wh.code} - {wh.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Product *</Label>
                      <Select
                        value={newTransfer.productId}
                        onValueChange={(value) => setNewTransfer({ ...newTransfer, productId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.currentStock} available)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        value={newTransfer.quantity}
                        onChange={(e) => setNewTransfer({ ...newTransfer, quantity: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      placeholder="Add notes or remarks"
                      value={newTransfer.notes}
                      onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-primary"
                    onClick={handleCreateTransfer}
                    disabled={transferStockMutation.isPending}
                  >
                    {transferStockMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create Transfer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product or warehouse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Type: {statusFilter === "all" ? "All" : getMovementTypeLabel(statusFilter)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Movements
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("TRANSFER_OUT")}>
                    Transfer Out
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("TRANSFER_IN")}>
                    Transfer In
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Transfers Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Stock Change</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {transfers.length === 0 ? (
                        <div className="flex flex-col items-center gap-2">
                          <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
                          <p>No stock transfers yet</p>
                          <Button
                            size="sm"
                            className="bg-primary mt-2"
                            onClick={() => setIsCreateDialogOpen(true)}
                          >
                            Create First Transfer
                          </Button>
                        </div>
                      ) : (
                        "No transfers match your search"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.reference || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(transfer.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>{transfer.product?.name || "Unknown Product"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transfer.warehouse?.code || transfer.warehouse?.name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{Math.abs(transfer.quantity).toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transfer.previousStock} → {transfer.newStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(transfer.type)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(transfer.type)}
                            {getMovementTypeLabel(transfer.type)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
