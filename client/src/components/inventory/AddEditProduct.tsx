import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import AuditLogViewer from "../audit/AuditLogViewer";
import { SearchableSelect } from "../ui/searchable-select";
import { cn } from "../../lib/utils";
import { productsService } from "../../services/modules.service";
import { toast } from "sonner";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

interface AddEditProductProps {
  productId?: string;
  onSave: () => void;
  onCancel: () => void;
}

const categories = ["Electronics", "Clothing", "Food", "Furniture", "Others"];
const units = ["pcs", "kg", "g", "l", "ml", "m", "cm", "box", "pack"];
const gstRates = ["0", "5", "12", "18", "28"];

const steps = [
  { id: 1, title: "Basic Info", description: "Product details", icon: "inventory_2" },
  { id: 2, title: "Stock", description: "Inventory levels", icon: "warehouse" },
  { id: 3, title: "Pricing", description: "Price & tax", icon: "attach_money" },
];

export function AddEditProduct({ productId, onSave, onCancel }: AddEditProductProps) {
  const isEdit = !!productId;
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAuditLog, setShowAuditLog] = useState(false); // New State

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));
  const unitOptions = units.map((u) => ({ value: u, label: u }));

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    unit: "",
    hsnCode: "",
    barcode: "",
    description: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    reorderPoint: "",
    location: "",
    trackInventory: true,
    isBatchTracked: false,
    isSerialTracked: false,
    sellWithoutStock: false,
    purchasePrice: "",
    salePrice: "",
    mrp: "",
    gstRate: "18",
    taxInclusive: false,
  });

  useEffect(() => {
    if (isEdit && productId) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const response = await productsService.getById(productId);
          if (response.success && response.data) {
            const product = response.data;
            setFormData({
              name: product.name || "",
              sku: product.sku || product.code || "",
              category: product.category || "",
              unit: product.unit || "",
              hsnCode: product.hsnCode || "",
              barcode: product.barcode || "",
              description: product.description || "",
              currentStock: product.currentStock?.toString() || "0",
              minStock: product.minStock?.toString() || "0",
              maxStock: product.maxStock?.toString() || "0",
              reorderPoint: product.reorderLevel?.toString() || "0",
              location: product.location || "",
              trackInventory: product.trackInventory ?? true,
              isBatchTracked: product.isBatchTracked ?? false,
              isSerialTracked: product.isSerialTracked ?? false,
              sellWithoutStock: product.sellWithoutStock ?? false,
              purchasePrice: product.purchasePrice?.toString() || "0",
              salePrice: product.salePrice?.toString() || product.sellingPrice?.toString() || "0",
              mrp: product.mrp?.toString() || "0",
              gstRate: product.gstRate?.toString() || "18",
              taxInclusive: product.taxInclusive ?? false,
            });
          }
        } catch (error) {
          toast.error("Failed to load product details");
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [isEdit, productId]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateMargin = () => {
    const purchase = parseFloat(formData.purchasePrice) || 0;
    const sale = parseFloat(formData.salePrice) || 0;
    if (purchase === 0) return "N/A";
    const margin = ((sale - purchase) / purchase) * 100;
    return `${margin.toFixed(1)}%`;
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Product name is required";
    if (!formData.sku) newErrors.sku = "SKU is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.unit) newErrors.unit = "Unit is required";
    if (!formData.salePrice) newErrors.salePrice = "Sale price is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setCurrentStep(1); // Go back to first step if validation fails
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        code: formData.sku,
        category: formData.category,
        unit: formData.unit,
        hsnCode: formData.hsnCode,
        barcode: formData.barcode,
        description: formData.description,
        currentStock: parseFloat(formData.currentStock) || 0,
        minStock: parseFloat(formData.minStock) || 0,
        maxStock: parseFloat(formData.maxStock) || 0,
        reorderPoint: parseFloat(formData.reorderPoint) || 0,
        location: formData.location,
        trackInventory: formData.trackInventory,
        isBatchTracked: formData.isBatchTracked,
        isSerialTracked: formData.isSerialTracked,
        sellWithoutStock: formData.sellWithoutStock,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        sellingPrice: parseFloat(formData.salePrice) || 0,
        mrp: parseFloat(formData.mrp) || 0,
        gstRate: parseFloat(formData.gstRate) || 18,
        taxInclusive: formData.taxInclusive,
      };

      if (isEdit && productId) {
        const response = await productsService.update(productId, payload);
        if (response.success) {
          toast.success("Product updated successfully");
          onSave();
        }
      } else {
        const response = await productsService.create(payload);
        if (response.success) {
          toast.success("Product created successfully");
          onSave();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-[24px] animate-fade-in">
      {/* Header */}
      <div className="mb-[32px]">
        <div className="flex justify-between items-start mb-[16px]">
          <Button variant="ghost" onClick={onCancel} className="gap-[8px] -ml-[8px] text-muted-foreground hover:text-foreground dark:hover:text-slate-100 font-bold border-none shadow-none text-body-sm h-[40px]">
            <MIcon name="arrow_back" className="text-[20px]" />
            Back to Products
          </Button>

          {isEdit && (
            <Button variant="outline" size="sm" onClick={() => setShowAuditLog(true)} className="gap-[8px] border-border font-bold rounded-[8px] h-[40px]">
              <MIcon name="history" className="text-[20px]" />
              View History
            </Button>
          )}
        </div>

        <div className="bg-primary text-white px-[32px] py-[24px] rounded-[16px] shadow-sm">
          <h2 className="text-2xl font-bold">{isEdit ? "Edit Product" : "Add New Product"}</h2>
          <p className="text-white/80 mt-[8px] text-body-sm">
            {isEdit ? "Update product details and inventory information" : "Enter product details to add to your inventory"}
          </p>
        </div>
      </div>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product History</DialogTitle>
            <DialogDescription>
              Audit trail for this product.
            </DialogDescription>
          </DialogHeader>
          {productId && <AuditLogViewer entityType="PRODUCT" entityId={productId} />}
        </DialogContent>
      </Dialog>

      {/* ... existing Step Indicator and Form ... */}

      {/* Step Indicator */}
      <div className="mb-[32px]">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-[24px] left-0 right-0 h-[2px] bg-slate-200 dark:bg-card">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center z-10 bg-white/50 dark:bg-transparent px-[8px]">
              <div
                className={cn(
                  "w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border-2",
                  currentStep > step.id
                    ? "bg-primary text-white border-primary"
                    : currentStep === step.id
                      ? "bg-primary text-white border-primary ring-4 ring-primary/20"
                      : "bg-card text-muted-foreground border-border"
                )}
              >
                {currentStep > step.id ? (
                  <MIcon name="check_circle" className="text-[24px]" />
                ) : (
                  <MIcon name={step.icon} className="text-[24px]" />
                )}
              </div>
              <div className="mt-[12px] text-center bg-white/50 py-[2px] px-[8px] rounded dark:bg-transparent">
                <p className={cn(
                  "font-bold text-body-sm",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-card rounded-[16px] border border-border p-[32px] shadow-sm">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-[24px]">
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className="w-[40px] h-[40px] rounded-[8px] bg-primary/10 flex items-center justify-center">
                <MIcon name="inventory_2" className="text-[20px] text-primary" />
              </div>
              <div>
                <h3 className="text-body font-bold text-foreground">Basic Information</h3>
                <p className="text-[12px] font-medium text-muted-foreground">Product identity and classification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
              <div className="space-y-[8px]">
                <Label htmlFor="name" className="text-foreground font-bold text-body-sm">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Premium Cotton T-Shirt"
                  className={cn("h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium", errors.name && "border-red-500")}
                />
                {errors.name && <p className="text-[12px] font-bold text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="sku" className="text-foreground font-bold text-body-sm">
                  SKU / Product Code <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MIcon name="numbers" className="absolute left-[12px] top-[calc(50%+8px)] -translate-y-1/2 text-[18px] text-muted-foreground" />
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                    placeholder="e.g., TS-001"
                    className={cn("h-[44px] rounded-[8px] pl-[36px] uppercase bg-muted dark:bg-slate-950 border-border text-body font-medium", errors.sku && "border-red-500")}
                  />
                </div>
                {errors.sku && <p className="text-[12px] font-bold text-red-500">{errors.sku}</p>}
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="category" className="text-foreground font-bold text-body-sm">
                  Category <span className="text-red-500">*</span>
                </Label>
                <div className={cn(errors.category && "border-red-500")}>
                  <SearchableSelect
                    options={categoryOptions}
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                    placeholder="Select category"
                    className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body"
                  />
                </div>
                {errors.category && <p className="text-[12px] font-bold text-red-500">{errors.category}</p>}
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="unit" className="text-foreground font-bold text-body-sm">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <div className={cn(errors.unit && "border-red-500")}>
                  <SearchableSelect
                    options={unitOptions}
                    value={formData.unit}
                    onValueChange={(value) => handleChange("unit", value)}
                    placeholder="Select unit"
                    className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body"
                  />
                </div>
                {errors.unit && <p className="text-[12px] font-bold text-red-500">{errors.unit}</p>}
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="hsnCode" className="text-foreground font-bold text-body-sm">HSN/SAC Code</Label>
                <Input
                  id="hsnCode"
                  value={formData.hsnCode}
                  onChange={(e) => handleChange("hsnCode", e.target.value)}
                  placeholder="e.g., 6109"
                  className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
                />
                <p className="text-[11px] text-muted-foreground font-medium">Required for GST compliance</p>
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="barcode" className="text-foreground font-bold text-body-sm">Barcode</Label>
                <div className="relative">
                  <MIcon name="qr_code_2" className="absolute left-[12px] top-[calc(50%+8px)] -translate-y-1/2 text-[18px] text-muted-foreground" />
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleChange("barcode", e.target.value)}
                    placeholder="e.g., 1234567890123"
                    className="h-[44px] rounded-[8px] pl-[36px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-[8px]">
                <Label htmlFor="description" className="text-foreground font-bold text-body-sm">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter product description, features, specifications..."
                  rows={3}
                  className="rounded-[8px] resize-none bg-muted dark:bg-slate-950 border-border text-body font-medium p-[12px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Stock Information */}
        {currentStep === 2 && (
          <div className="space-y-[24px]">
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className="w-[40px] h-[40px] rounded-[8px] bg-primary/10 flex items-center justify-center">
                <MIcon name="warehouse" className="text-[20px] text-primary" />
              </div>
              <div>
                <h3 className="text-body font-bold text-foreground">Stock Information</h3>
                <p className="text-[12px] font-medium text-muted-foreground">Inventory levels and alerts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px]">
              <div className="space-y-[8px]">
                <Label htmlFor="currentStock" className="text-foreground font-bold text-body-sm">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => handleChange("currentStock", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
                />
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="minStock" className="text-foreground font-bold text-body-sm">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleChange("minStock", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
                />
                <p className="text-[11px] text-muted-foreground font-medium">Alert when below</p>
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="maxStock" className="text-foreground font-bold text-body-sm">Maximum Stock</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => handleChange("maxStock", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
                />
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="reorderPoint" className="text-foreground font-bold text-body-sm">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => handleChange("reorderPoint", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
                />
                <p className="text-[11px] text-muted-foreground font-medium">Auto reorder trigger</p>
              </div>
            </div>

            <div className="space-y-[8px]">
              <Label htmlFor="location" className="text-foreground font-bold text-body-sm">Storage Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g., Warehouse A, Shelf 3, Bin 12"
                className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
              />
            </div>

            <div className="mt-[24px] pt-[24px] border-t border-border space-y-[16px]">
              <div className="flex items-center justify-between p-[16px] bg-muted rounded-[8px] border border-slate-100 dark:border-slate-800">
                <div>
                  <Label htmlFor="trackInventory" className="text-foreground font-bold text-body-sm">Track Inventory</Label>
                  <p className="text-[12px] text-muted-foreground font-medium mt-[2px]">Enable stock tracking for this product</p>
                </div>
                <Switch
                  id="trackInventory"
                  checked={formData.trackInventory}
                  onCheckedChange={(checked) => handleChange("trackInventory", checked)}
                />
              </div>

              {formData.trackInventory && (
                <>
                  <div className="flex items-center justify-between p-[16px] bg-muted rounded-[8px] border border-slate-100 dark:border-slate-800">
                    <div>
                      <Label htmlFor="isBatchTracked" className="text-foreground font-bold text-body-sm">Enable Batch Tracking</Label>
                      <p className="text-[12px] text-muted-foreground font-medium mt-[2px]">Track expiry dates and batch numbers</p>
                    </div>
                    <Switch
                      id="isBatchTracked"
                      checked={formData.isBatchTracked}
                      onCheckedChange={(checked) => {
                        handleChange("isBatchTracked", checked);
                        if (checked) handleChange("isSerialTracked", false); // Mutually exclusive usually
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-[16px] bg-muted rounded-[8px] border border-slate-100 dark:border-slate-800">
                    <div>
                      <Label htmlFor="isSerialTracked" className="text-foreground font-bold text-body-sm">Enable Serial Number Tracking</Label>
                      <p className="text-[12px] text-muted-foreground font-medium mt-[2px]">Track individual items by serial number</p>
                    </div>
                    <Switch
                      id="isSerialTracked"
                      checked={formData.isSerialTracked}
                      onCheckedChange={(checked) => {
                        handleChange("isSerialTracked", checked);
                        if (checked) handleChange("isBatchTracked", false); // Mutually exclusive usually
                      }}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between p-[16px] bg-muted rounded-[8px] border border-slate-100 dark:border-slate-800">
                <div>
                  <Label htmlFor="sellWithoutStock" className="text-foreground font-bold text-body-sm">Allow Negative Stock</Label>
                  <p className="text-[12px] text-muted-foreground font-medium mt-[2px]">Allow selling even when out of stock</p>
                </div>
                <Switch
                  id="sellWithoutStock"
                  checked={formData.sellWithoutStock}
                  onCheckedChange={(checked) => handleChange("sellWithoutStock", checked)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pricing Information */}
        {currentStep === 3 && (
          <div className="space-y-[24px]">
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className="w-[40px] h-[40px] rounded-[8px] bg-primary/10 flex items-center justify-center">
                <MIcon name="attach_money" className="text-[20px] text-primary" />
              </div>
              <div>
                <h3 className="text-body font-bold text-foreground">Pricing Information</h3>
                <p className="text-[12px] font-medium text-muted-foreground">Prices, taxes and margins</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
              <div className="space-y-[8px]">
                <Label htmlFor="purchasePrice" className="text-foreground font-bold text-body-sm">Purchase Price (₹)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => handleChange("purchasePrice", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
                />
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="salePrice" className="text-foreground font-bold text-body-sm">
                  Sale Price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={formData.salePrice}
                  onChange={(e) => handleChange("salePrice", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={cn("h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium", errors.salePrice && "border-red-500")}
                />
                {errors.salePrice && <p className="text-[12px] font-bold text-red-500">{errors.salePrice}</p>}
              </div>

              <div className="space-y-[8px]">
                <Label htmlFor="mrp" className="text-foreground font-bold text-body-sm">MRP (₹)</Label>
                <Input
                  id="mrp"
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => handleChange("mrp", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
              <div className="space-y-[8px]">
                <Label htmlFor="gstRate" className="text-foreground font-bold text-body-sm">GST Rate (%)</Label>
                <Select value={formData.gstRate} onValueChange={(value) => handleChange("gstRate", value)}>
                  <SelectTrigger id="gstRate" className="h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border text-body font-medium">
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {gstRates.map((rate) => (
                      <SelectItem key={rate} value={rate}>
                        {rate}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-[8px]">
                <Label className="text-foreground font-bold text-body-sm">Profit Margin</Label>
                <div className="h-[44px] px-[16px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-[8px] flex items-center">
                  <span className={cn(
                    "font-bold text-body-lg",
                    parseFloat(formData.salePrice) > parseFloat(formData.purchasePrice) ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"
                  )}>
                    {calculateMargin()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-[12px] pt-[32px]">
                <Switch
                  id="taxInclusive"
                  checked={formData.taxInclusive}
                  onCheckedChange={(checked) => handleChange("taxInclusive", checked)}
                />
                <Label htmlFor="taxInclusive" className="text-foreground font-bold text-body-sm">
                  Tax Inclusive Pricing
                </Label>
              </div>
            </div>

            {/* Summary Card */}
            <div className="mt-[24px] p-[24px] bg-muted rounded-[12px] border border-border">
              <h4 className="font-bold text-foreground mb-[16px] flex items-center gap-[8px] text-body">
                <MIcon name="sell" className="text-[20px]" />
                Price Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px] text-body-sm">
                <div>
                  <p className="text-muted-foreground font-bold uppercase tracking-wider text-[11px] mb-[4px]">Purchase</p>
                  <p className="font-mono font-bold text-foreground text-[18px]">₹{formData.purchasePrice || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-bold uppercase tracking-wider text-[11px] mb-[4px]">Sale</p>
                  <p className="font-mono font-bold text-foreground text-[18px]">₹{formData.salePrice || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-bold uppercase tracking-wider text-[11px] mb-[4px]">GST</p>
                  <p className="font-mono font-bold text-foreground text-[18px]">{formData.gstRate || "0"}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-bold uppercase tracking-wider text-[11px] mb-[4px]">Margin</p>
                  <p className={cn(
                    "font-mono font-bold text-[18px]",
                    parseFloat(formData.salePrice) > parseFloat(formData.purchasePrice) ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"
                  )}>
                    {calculateMargin()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-[32px] pt-[24px] border-t border-border">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrev}
            className="gap-[8px] rounded-[8px] h-[40px] px-[24px] font-bold border-border text-foreground dark:text-muted-foreground transition-colors"
          >
            <MIcon name="arrow_back" className="text-[20px]" />
            {currentStep === 1 ? "Cancel" : "Previous"}
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} className="gap-[8px] rounded-[8px] h-[40px] px-[24px] font-bold bg-primary hover:bg-orange-700 text-white transition-colors">
              Next Step
              <MIcon name="arrow_forward" className="text-[20px]" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-[8px] rounded-[8px] h-[40px] px-[24px] font-bold bg-primary hover:bg-orange-700 text-white transition-colors"
            >
              {isSubmitting ? (
                <MIcon name="sync" className="text-[20px] animate-spin" />
              ) : (
                <MIcon name="save" className="text-[20px]" />
              )}
              {isEdit ? "Update Product" : "Add Product"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
