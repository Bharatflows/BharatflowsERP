import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { toast } from "sonner";
import { productionService, productsService } from "@/services/modules.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Product } from "@/types";
import { Checkbox } from "../ui/checkbox";

interface BOM {
  id: string;
  name: string;
  code?: string;
  finishedProduct: { id: string; name: string; code?: string };
  rawMaterialCount: number;
  totalCost: number;
  isActive: boolean;
}

export function BillOfMaterials() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    finishedProductId: "",
    outputQuantity: "1",
    laborCost: "0",
    overheadCost: "0",
    notes: "",
    isActive: true,
  });

  const [bomItems, setBomItems] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bomRes, prodRes] = await Promise.all([
        productionService.getBOMs(),
        productsService.getAll()
      ]);

      if (bomRes.success && bomRes.data) {
        setBoms(bomRes.data);
      }
      if (prodRes.success && prodRes.data) {
        // Handle both paginated and flat responses
        const prodData = Array.isArray(prodRes.data)
          ? prodRes.data
          : (prodRes.data as any).items || [];
        setProducts(prodData);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingBOM(null);
    setFormData({
      name: "",
      code: "",
      finishedProductId: "",
      outputQuantity: "1",
      laborCost: "0",
      overheadCost: "0",
      notes: "",
      isActive: true,
    });
    setBomItems([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (bom: any) => {
    // Need full BOM details for items
    const fetchAndEdit = async () => {
      try {
        const response = await productionService.getBOM(bom.id);
        if (response.success && response.data) {
          const detailedBOM = response.data;
          setEditingBOM(detailedBOM);
          setFormData({
            name: detailedBOM.name,
            code: detailedBOM.code || "",
            finishedProductId: detailedBOM.finishedProductId,
            outputQuantity: detailedBOM.outputQuantity.toString(),
            laborCost: detailedBOM.laborCost.toString(),
            overheadCost: detailedBOM.overheadCost.toString(),
            notes: detailedBOM.notes || "",
            isActive: detailedBOM.isActive,
          });
          setBomItems(detailedBOM.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity.toString(),
            unit: item.unit || "",
            notes: item.notes || ""
          })));
          setIsDialogOpen(true);
        }
      } catch (error) {
        toast.error("Failed to load BOM details");
      }
    };
    fetchAndEdit();
  };

  const addItem = () => {
    setBomItems([...bomItems, { productId: "", quantity: "1", unit: "", notes: "" }]);
  };

  const removeItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...bomItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill unit if product selected
    if (field === "productId") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit = product.unit;
      }
    }

    setBomItems(newItems);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.finishedProductId) {
      toast.error("Name and finished product are required");
      return;
    }

    if (bomItems.length === 0) {
      toast.error("At least one raw material is required");
      return;
    }

    if (bomItems.some(item => !item.productId || !item.quantity)) {
      toast.error("All raw materials must have a product and quantity");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        outputQuantity: parseFloat(formData.outputQuantity),
        laborCost: parseFloat(formData.laborCost),
        overheadCost: parseFloat(formData.overheadCost),
        items: bomItems.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity)
        }))
      };

      let response;
      if (editingBOM) {
        response = await productionService.updateBOM(editingBOM.id, payload);
      } else {
        response = await productionService.createBOM(payload);
      }

      if (response.success) {
        toast.success(editingBOM ? "BOM updated successfully" : "BOM created successfully");
        setIsDialogOpen(false);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save BOM");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalCost = () => {
    const materialCost = bomItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (parseFloat(item.quantity || "0") * (product?.purchasePrice || 0));
    }, 0);
    return materialCost + parseFloat(formData.laborCost || "0") + parseFloat(formData.overheadCost || "0");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this BOM?")) return;
    try {
      await productionService.deleteBOM(id);
      toast.success("BOM deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete BOM");
    }
  };

  return (
    <Card className="border border-border shadow-sm bg-card rounded-[16px] animate-fade-in">
      <CardHeader className="p-[24px] border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-foreground">Bill of Materials (BOM)</CardTitle>
          <div className="flex gap-[12px]">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
              <MIcon name="sync" className={`text-[18px] ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="gap-[8px] h-[40px] px-[24px] rounded-[8px] font-bold" onClick={handleCreate}>
              <MIcon name="add" className="text-[20px]" />
              Create BOM
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-[24px]">
        {loading ? (
          <div className="flex items-center justify-center p-[48px]">
            <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
          </div>
        ) : boms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[48px] text-muted-foreground">
            <p className="font-medium text-body">No Bill of Materials found</p>
            <Button variant="link" onClick={handleCreate} className="mt-[8px] font-bold">
              Create your first BOM
            </Button>
          </div>
        ) : (
          <div className="rounded-[12px] border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted dark:bg-slate-950">
                <TableRow className="border-b border-border">
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">BOM Name</TableHead>
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">Product</TableHead>
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">Raw Materials</TableHead>
                  <TableHead className="text-right font-bold text-foreground dark:text-muted-foreground">Total Cost</TableHead>
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right font-bold text-foreground dark:text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boms.map((bom) => (
                  <TableRow key={bom.id} className="border-b border-border">
                    <TableCell>
                      <div>
                        <p className="font-bold text-foreground">{bom.name}</p>
                        {bom.code && <p className="text-[12px] font-medium text-muted-foreground mt-[2px]">{bom.code}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground dark:text-muted-foreground font-medium">{bom.finishedProduct?.name || "-"}</TableCell>
                    <TableCell className="text-foreground dark:text-muted-foreground font-medium">{bom.rawMaterialCount} items</TableCell>
                    <TableCell className="text-right font-bold text-foreground">₹{bom.totalCost?.toLocaleString("en-IN") || 0}</TableCell>
                    <TableCell>
                      <Badge className={bom.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold text-[11px] rounded-[4px]" : "bg-muted text-muted-foreground border-slate-200 dark:bg-card dark:text-muted-foreground font-bold text-[11px] rounded-[4px]"}>
                        {bom.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-[4px]">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(bom)} className="h-[32px] w-[32px] p-0 text-muted-foreground hover:text-primary rounded-[8px]">
                          <MIcon name="edit" className="text-[18px]" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(bom.id)} className="h-[32px] w-[32px] p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-[8px]">
                          <MIcon name="delete" className="text-[18px]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-[16px] p-[24px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">{editingBOM ? "Edit BOM" : "Create Bill of Materials"}</DialogTitle>
            <DialogDescription className="text-body-sm font-medium text-muted-foreground mt-[4px]">
              Define the ingredients, quantities, and costs for a finished product.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-[24px] py-[16px]">
            {/* Basic Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] p-[16px] border border-border rounded-[12px] bg-muted/50 dark:bg-card">
              <div className="space-y-[8px] lg:col-span-2">
                <Label className="text-body-sm font-bold text-foreground">BOM Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Manufacturing BOM - Widget A"
                  className="h-[44px] rounded-[8px]"
                />
              </div>
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">BOM Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="BOM-001"
                  className="h-[44px] rounded-[8px]"
                />
              </div>
              <div className="space-y-[8px] lg:col-span-2">
                <Label className="text-body-sm font-bold text-foreground">Finished Product *</Label>
                <Select
                  value={formData.finishedProductId}
                  onValueChange={(value) => setFormData({ ...formData, finishedProductId: value })}
                >
                  <SelectTrigger className="h-[44px] rounded-[8px] bg-white border-slate-200">
                    <SelectValue placeholder="Select finished product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">Required Output Qty</Label>
                <Input
                  type="number"
                  value={formData.outputQuantity}
                  onChange={(e) => setFormData({ ...formData, outputQuantity: e.target.value })}
                  className="h-[44px] rounded-[8px]"
                />
              </div>
            </div>

            {/* Raw Materials Section */}
            <div className="space-y-[16px]">
              <div className="flex items-center justify-between">
                <h3 className="text-body font-bold text-foreground flex items-center gap-[8px]">
                  Raw Materials & Components
                  <Badge variant="secondary" className="font-bold text-[11px] rounded-[4px] py-0">{bomItems.length} items</Badge>
                </h3>
                <Button variant="outline" size="sm" onClick={addItem} className="h-[36px] rounded-[8px] px-[16px] font-bold border-border">
                  <MIcon name="add" className="text-[18px] mr-[4px]" />
                  Add Material
                </Button>
              </div>

              <div className="border border-border rounded-[12px] overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted dark:bg-slate-950">
                    <TableRow className="border-b border-border">
                      <TableHead className="w-[40%] font-bold text-foreground dark:text-muted-foreground">Product</TableHead>
                      <TableHead className="w-[15%] font-bold text-foreground dark:text-muted-foreground">Quantity</TableHead>
                      <TableHead className="w-[15%] font-bold text-foreground dark:text-muted-foreground">Unit</TableHead>
                      <TableHead className="w-[20%] text-right font-bold text-foreground dark:text-muted-foreground">Estimate Cost</TableHead>
                      <TableHead className="w-[10%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bomItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-[32px] text-muted-foreground font-medium text-body-sm">
                          No materials added yet. Click "Add Material" to start.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bomItems.map((item, index) => {
                        const product = products.find(p => p.id === item.productId);
                        const cost = (parseFloat(item.quantity || "0") * (product?.purchasePrice || 0));
                        return (
                          <TableRow key={index} className="group border-b border-border">
                            <TableCell>
                              <Select
                                value={item.productId}
                                onValueChange={(val) => updateItem(index, "productId", val)}
                              >
                                <SelectTrigger className="h-[36px] rounded-[8px] border-slate-200">
                                  <SelectValue placeholder="Select Product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-[36px] rounded-[8px]"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-[36px] bg-muted rounded-[8px] text-muted-foreground"
                                value={item.unit}
                                readOnly
                              />
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground">
                              ₹{cost.toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="h-[32px] w-[32px] p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[8px]"
                              >
                                <MIcon name="close" className="text-[18px]" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Costs & Notes Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px] mt-[16px]">
              <div className="space-y-[16px]">
                <Label className="text-body-sm font-bold text-foreground">Additional Information</Label>
                <Textarea
                  placeholder="Additional manufacturing instructions or notes..."
                  className="min-h-[120px] rounded-[12px] border-slate-200"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
                <div className="flex items-center space-x-[12px] p-[16px] border border-border rounded-[12px] bg-muted/50 dark:bg-card">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                    className="w-[18px] h-[18px] rounded-[4px]"
                  />
                  <div className="grid gap-[4px] leading-none">
                    <label htmlFor="isActive" className="text-body-sm font-bold text-foreground cursor-pointer">Active BOM</label>
                    <p className="text-[12px] text-muted-foreground font-medium">Inactivate to hide this BOM from work order creation.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-[16px]">
                <Label className="text-body-sm font-bold text-foreground">Cost Analysis</Label>
                <div className="space-y-[12px] p-[16px] border border-border rounded-[12px] bg-muted/50 dark:bg-card">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-muted-foreground font-medium">Material Cost</span>
                    <span className="font-bold text-foreground">
                      ₹{bomItems.reduce((sum, item) => {
                        const product = products.find(p => p.id === item.productId);
                        return sum + (parseFloat(item.quantity || "0") * (product?.purchasePrice || 0));
                      }, 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-muted-foreground font-medium">Labor Cost</span>
                    <Input
                      type="number"
                      className="w-[120px] h-[36px] text-right rounded-[8px]"
                      value={formData.laborCost}
                      onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-muted-foreground font-medium">Overhead Cost</span>
                    <Input
                      type="number"
                      className="w-[120px] h-[36px] text-right rounded-[8px]"
                      value={formData.overheadCost}
                      onChange={(e) => setFormData({ ...formData, overheadCost: e.target.value })}
                    />
                  </div>
                  <div className="pt-[12px] mt-[12px] border-t border-border flex items-center justify-between text-body font-bold text-primary">
                    <span>Estimated Total Cost</span>
                    <span>₹{calculateTotalCost().toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-[24px]">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting} className="rounded-[8px] h-[40px] px-[24px] font-bold border-border">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="min-w-[120px] rounded-[8px] h-[40px] px-[24px] font-bold">
              {submitting ? (
                <>
                  <MIcon name="sync" className="mr-[8px] text-[18px] animate-spin" />
                  Saving...
                </>
              ) : (
                editingBOM ? "Update BOM" : "Create BOM"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
