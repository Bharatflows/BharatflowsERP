import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import AuditLogViewer from "../audit/AuditLogViewer";

// ... existing imports

export function AddEditProduct({ productId, onSave, onCancel }: AddEditProductProps) {
  const isEdit = !!productId;
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAuditLog, setShowAuditLog] = useState(false); // New State
  // ... existing code

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <Button variant="ghost" onClick={onCancel} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back to Products
          </Button>

          {isEdit && (
            <Button variant="outline" size="sm" onClick={() => setShowAuditLog(true)} className="gap-2">
              <History className="size-4" />
              View History
            </Button>
          )}
        </div>

        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-6 rounded-2xl shadow-lg shadow-emerald-500/20">
          <h2 className="text-2xl font-bold">{isEdit ? "Edit Product" : "Add New Product"}</h2>
          <p className="text-emerald-100 mt-1">
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
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                  currentStep > step.id
                    ? "bg-emerald-500 text-white"
                    : currentStep === step.id
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                      : "bg-white text-slate-400 border-2 border-slate-200"
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <step.icon className="size-5" />
                )}
              </div>
              <div className="mt-3 text-center">
                <p className={cn(
                  "font-medium text-sm",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Package className="size-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                <p className="text-sm text-muted-foreground">Product identity and classification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Product Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Premium Cotton T-Shirt"
                  className={cn("h-11 rounded-xl", errors.name && "border-rose-500 focus-visible:ring-rose-500")}
                />
                {errors.name && <p className="text-sm text-rose-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku" className="text-foreground font-medium">
                  SKU / Product Code <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value.toUpperCase())}
                    placeholder="e.g., TS-001"
                    className={cn("h-11 rounded-xl pl-10 uppercase", errors.sku && "border-rose-500")}
                  />
                </div>
                {errors.sku && <p className="text-sm text-rose-500">{errors.sku}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground font-medium">
                  Category <span className="text-rose-500">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger id="category" className={cn("h-11 rounded-xl", errors.category && "border-rose-500")}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-rose-500">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-foreground font-medium">
                  Unit <span className="text-rose-500">*</span>
                </Label>
                <Select value={formData.unit} onValueChange={(value) => handleChange("unit", value)}>
                  <SelectTrigger id="unit" className={cn("h-11 rounded-xl", errors.unit && "border-rose-500")}>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-sm text-rose-500">{errors.unit}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hsnCode" className="text-foreground font-medium">HSN/SAC Code</Label>
                <Input
                  id="hsnCode"
                  value={formData.hsnCode}
                  onChange={(e) => handleChange("hsnCode", e.target.value)}
                  placeholder="e.g., 6109"
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Required for GST compliance</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode" className="text-foreground font-medium">Barcode</Label>
                <div className="relative">
                  <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleChange("barcode", e.target.value)}
                    placeholder="e.g., 1234567890123"
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter product description, features, specifications..."
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Stock Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Warehouse className="size-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Stock Information</h3>
                <p className="text-sm text-muted-foreground">Inventory levels and alerts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currentStock" className="text-foreground font-medium">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => handleChange("currentStock", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock" className="text-foreground font-medium">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleChange("minStock", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Alert when below</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStock" className="text-foreground font-medium">Maximum Stock</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => handleChange("maxStock", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorderPoint" className="text-foreground font-medium">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => handleChange("reorderPoint", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Auto reorder trigger</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground font-medium">Storage Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="e.g., Warehouse A, Shelf 3, Bin 12"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label htmlFor="trackInventory" className="text-foreground font-medium">Track Inventory</Label>
                  <p className="text-sm text-muted-foreground">Enable stock tracking for this product</p>
                </div>
                <Switch
                  id="trackInventory"
                  checked={formData.trackInventory}
                  onCheckedChange={(checked) => handleChange("trackInventory", checked)}
                />
              </div>

              {formData.trackInventory && (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <Label htmlFor="isBatchTracked" className="text-foreground font-medium">Enable Batch Tracking</Label>
                      <p className="text-sm text-muted-foreground">Track expiry dates and batch numbers</p>
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

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <Label htmlFor="isSerialTracked" className="text-foreground font-medium">Enable Serial Number Tracking</Label>
                      <p className="text-sm text-muted-foreground">Track individual items by serial number</p>
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

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label htmlFor="sellWithoutStock" className="text-foreground font-medium">Allow Negative Stock</Label>
                  <p className="text-sm text-muted-foreground">Allow selling even when out of stock</p>
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
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <DollarSign className="size-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Pricing Information</h3>
                <p className="text-sm text-muted-foreground">Prices, taxes and margins</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice" className="text-foreground font-medium">Purchase Price (₹)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => handleChange("purchasePrice", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice" className="text-foreground font-medium">
                  Sale Price (₹) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={formData.salePrice}
                  onChange={(e) => handleChange("salePrice", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={cn("h-11 rounded-xl", errors.salePrice && "border-rose-500")}
                />
                {errors.salePrice && <p className="text-sm text-rose-500">{errors.salePrice}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mrp" className="text-foreground font-medium">MRP (₹)</Label>
                <Input
                  id="mrp"
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => handleChange("mrp", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gstRate" className="text-foreground font-medium">GST Rate (%)</Label>
                <Select value={formData.gstRate} onValueChange={(value) => handleChange("gstRate", value)}>
                  <SelectTrigger id="gstRate" className="h-11 rounded-xl">
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

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Profit Margin</Label>
                <div className="h-11 px-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center">
                  <span className={cn(
                    "font-semibold",
                    parseFloat(formData.salePrice) > parseFloat(formData.purchasePrice) ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {calculateMargin()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-7">
                <Switch
                  id="taxInclusive"
                  checked={formData.taxInclusive}
                  onCheckedChange={(checked) => handleChange("taxInclusive", checked)}
                />
                <Label htmlFor="taxInclusive" className="text-foreground font-medium">
                  Tax Inclusive Pricing
                </Label>
              </div>
            </div>

            {/* Summary Card */}
            <div className="mt-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Tag className="size-4" />
                Price Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Purchase</p>
                  <p className="font-semibold text-foreground">₹{formData.purchasePrice || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sale</p>
                  <p className="font-semibold text-foreground">₹{formData.salePrice || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">GST</p>
                  <p className="font-semibold text-foreground">{formData.gstRate || "0"}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Margin</p>
                  <p className={cn(
                    "font-semibold",
                    parseFloat(formData.salePrice) > parseFloat(formData.purchasePrice) ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {calculateMargin()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrev}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="size-4" />
            {currentStep === 1 ? "Cancel" : "Previous"}
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">
              Next Step
              <ArrowLeft className="size-4 rotate-180" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isEdit ? "Update Product" : "Add Product"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
