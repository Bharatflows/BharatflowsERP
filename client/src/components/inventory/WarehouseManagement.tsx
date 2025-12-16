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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Search,
  Plus,
  Building2,
  Package,
  TrendingUp,
  MapPin,
  Phone,
  Edit,
  Trash2,
  MoreVertical,
  ArrowRightLeft,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from "../../hooks/useInventory";

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive: boolean;
  isDefault: boolean;
}

export function WarehouseManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<string | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  // API hooks
  const { data: warehousesResponse, isLoading } = useWarehouses();
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const deleteWarehouseMutation = useDeleteWarehouse();

  const warehouses: Warehouse[] = warehousesResponse?.data || [];

  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (warehouse.city || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddWarehouse = async () => {
    if (!newWarehouse.name || !newWarehouse.code) return;

    try {
      await createWarehouseMutation.mutateAsync({
        name: newWarehouse.name,
        code: newWarehouse.code,
        address: newWarehouse.address || undefined,
        city: newWarehouse.city || undefined,
        state: newWarehouse.state || undefined,
        pincode: newWarehouse.pincode || undefined,
        isDefault: newWarehouse.isDefault,
      });
      setNewWarehouse({
        name: "",
        code: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        isDefault: false,
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleEditWarehouse = async () => {
    if (!editingWarehouse) return;

    try {
      await updateWarehouseMutation.mutateAsync({
        id: editingWarehouse.id,
        data: {
          name: editingWarehouse.name,
          code: editingWarehouse.code,
          address: editingWarehouse.address || undefined,
          city: editingWarehouse.city || undefined,
          state: editingWarehouse.state || undefined,
          pincode: editingWarehouse.pincode || undefined,
          isActive: editingWarehouse.isActive,
          isDefault: editingWarehouse.isDefault,
        },
      });
      setEditingWarehouse(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!deleteWarehouseId) return;

    try {
      await deleteWarehouseMutation.mutateAsync(deleteWarehouseId);
      setDeleteWarehouseId(null);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const openEditDialog = (warehouse: Warehouse) => {
    setEditingWarehouse({ ...warehouse });
    setIsEditDialogOpen(true);
  };

  const totalStats = {
    totalWarehouses: warehouses.length,
    activeWarehouses: warehouses.filter((w) => w.isActive).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading warehouses...</p>
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
            <div className="flex items-start justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Total Warehouses</div>
                <div className="text-2xl font-semibold text-foreground">
                  {totalStats.totalWarehouses}
                </div>
              </div>
              <div className="bg-primary p-3 rounded-xl">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Active Warehouses</div>
                <div className="text-2xl font-semibold text-foreground">
                  {totalStats.activeWarehouses}
                </div>
              </div>
              <div className="bg-success p-3 rounded-xl">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Inactive</div>
                <div className="text-2xl font-semibold text-foreground">
                  {totalStats.totalWarehouses - totalStats.activeWarehouses}
                </div>
              </div>
              <div className="bg-orange p-3 rounded-xl">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Default</div>
                <div className="text-2xl font-semibold text-foreground">
                  {warehouses.filter((w) => w.isDefault).length}
                </div>
              </div>
              <div className="bg-purple p-3 rounded-xl">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Warehouse Management</CardTitle>
              <CardDescription>
                Manage multiple warehouses, godowns, and storage locations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Stock Transfer
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Warehouse</DialogTitle>
                    <DialogDescription>
                      Create a new warehouse or storage location
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Warehouse Name *</Label>
                      <Input
                        placeholder="Main Warehouse - City"
                        value={newWarehouse.name}
                        onChange={(e) =>
                          setNewWarehouse({ ...newWarehouse, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Warehouse Code *</Label>
                      <Input
                        placeholder="WH-XXX-01"
                        value={newWarehouse.code}
                        onChange={(e) =>
                          setNewWarehouse({ ...newWarehouse, code: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Set as Default</Label>
                      <Select
                        value={newWarehouse.isDefault ? "true" : "false"}
                        onValueChange={(value) =>
                          setNewWarehouse({ ...newWarehouse, isDefault: value === "true" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Address</Label>
                      <Textarea
                        placeholder="Complete address"
                        value={newWarehouse.address}
                        onChange={(e) =>
                          setNewWarehouse({ ...newWarehouse, address: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={newWarehouse.city}
                        onChange={(e) =>
                          setNewWarehouse({ ...newWarehouse, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={newWarehouse.state}
                        onChange={(e) =>
                          setNewWarehouse({ ...newWarehouse, state: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input
                        value={newWarehouse.pincode}
                        onChange={(e) =>
                          setNewWarehouse({ ...newWarehouse, pincode: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddWarehouse}
                      className="bg-primary"
                      disabled={createWarehouseMutation.isPending}
                    >
                      {createWarehouseMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Add Warehouse
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search warehouses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Warehouses Table */}
          {filteredWarehouses.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Warehouses Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search." : "Get started by adding your first warehouse."}
              </p>
              {!searchQuery && (
                <Button className="bg-primary" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Warehouse
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <div className="font-medium">{warehouse.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {warehouse.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <div className="text-sm">
                            <div>{warehouse.city || "N/A"}</div>
                            <div className="text-muted-foreground">{warehouse.state || ""}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            warehouse.isActive
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }
                        >
                          {warehouse.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {warehouse.isDefault && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                            Default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(warehouse)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Warehouse
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="h-4 w-4 mr-2" />
                              View Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Transfer Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteWarehouseId(warehouse.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Warehouse
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
            <DialogDescription>
              Update warehouse information
            </DialogDescription>
          </DialogHeader>
          {editingWarehouse && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label>Warehouse Name *</Label>
                <Input
                  value={editingWarehouse.name}
                  onChange={(e) =>
                    setEditingWarehouse({ ...editingWarehouse, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Warehouse Code *</Label>
                <Input
                  value={editingWarehouse.code}
                  onChange={(e) =>
                    setEditingWarehouse({ ...editingWarehouse, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingWarehouse.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setEditingWarehouse({ ...editingWarehouse, isActive: value === "active" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={editingWarehouse.address || ""}
                  onChange={(e) =>
                    setEditingWarehouse({ ...editingWarehouse, address: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={editingWarehouse.city || ""}
                  onChange={(e) =>
                    setEditingWarehouse({ ...editingWarehouse, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={editingWarehouse.state || ""}
                  onChange={(e) =>
                    setEditingWarehouse({ ...editingWarehouse, state: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input
                  value={editingWarehouse.pincode || ""}
                  onChange={(e) =>
                    setEditingWarehouse({ ...editingWarehouse, pincode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Set as Default</Label>
                <Select
                  value={editingWarehouse.isDefault ? "true" : "false"}
                  onValueChange={(value) =>
                    setEditingWarehouse({ ...editingWarehouse, isDefault: value === "true" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditWarehouse}
              className="bg-primary"
              disabled={updateWarehouseMutation.isPending}
            >
              {updateWarehouseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteWarehouseId} onOpenChange={() => setDeleteWarehouseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this warehouse? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWarehouse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWarehouseMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
