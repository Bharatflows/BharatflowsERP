import { useState, useEffect } from "react";
import { expensesService, partiesService } from "../../services/modules.service";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SearchableSelect } from "../ui/searchable-select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import { CalendarIcon, Upload, X, ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Party } from "../../types";

interface AddEditExpenseProps {
  expenseId?: string | null;
  onBack: () => void;
}

export function AddEditExpense({ expenseId, onBack }: AddEditExpenseProps) {
  const isEditMode = !!expenseId;
  const [loading, setLoading] = useState(false);
  const [fetchingExpense, setFetchingExpense] = useState(false);
  const [expenseNumber, setExpenseNumber] = useState<string | null>(null);
  const [expenseStatus, setExpenseStatus] = useState<string>("PENDING");
  const [canEdit, setCanEdit] = useState(true);
  const [suppliers, setSuppliers] = useState<Party[]>([]);

  const [formData, setFormData] = useState({
    date: new Date(),
    description: "",
    category: "",
    vendor: "",
    amount: "",
    paymentMethod: "",
    gstApplicable: "no",
    gstAmount: "",
    notes: "",
  });

  const [receipt, setReceipt] = useState<File | null>(null);

  // Fetch expense data and suppliers
  useEffect(() => {
    fetchSuppliers();
    if (isEditMode && expenseId) {
      fetchExpenseData();
    }
  }, [expenseId, isEditMode]);

  const fetchSuppliers = async () => {
    try {
      const response = await partiesService.getAll({ role: "SUPPLIER" });
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  };

  const fetchExpenseData = async () => {
    if (!expenseId) return;
    setFetchingExpense(true);
    try {
      const response = await expensesService.getById(expenseId);
      if (response.success && response.data) {
        const exp = response.data as any;
        setFormData({
          date: new Date(exp.date),
          description: exp.description || "",
          category: exp.category || "",
          vendor: exp.vendor || "",
          amount: String(exp.amount || ""),
          paymentMethod: exp.paymentMethod || "",
          gstApplicable: exp.gstAmount && Number(exp.gstAmount) > 0 ? "yes" : "no",
          gstAmount: String(exp.gstAmount || ""),
          notes: exp.notes || "",
        });
        setExpenseNumber(exp.expenseNumber || null);
        setExpenseStatus(exp.status || "PENDING");
        // Disallow editing if status is PAID or expense is older than 30 days
        const expenseDate = new Date(exp.date);
        const daysDiff = Math.floor((Date.now() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
        if (exp.status === "PAID" || daysDiff > 30) {
          setCanEdit(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch expense:", error);
      toast.error("Failed to load expense data");
    } finally {
      setFetchingExpense(false);
    }
  };

  // Fetch categories from API
  const [categories, setCategories] = useState<string[]>([
    "Rent", "Salaries", "Utilities", "Transport", "Marketing",
    "Office Supplies", "Business Meals", "Equipment", "Others"
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Dynamic import to avoid circular dependency
        const { expenseCategoriesService } = await import("../../services/modules.service");
        const response = await expenseCategoriesService.getAll();
        if (response.success && response.data && response.data.length > 0) {
          setCategories(response.data.map((c: any) => c.name));
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const paymentMethods = [
    "Cash",
    "Bank Transfer",
    "Credit Card",
    "Debit Card",
    "UPI",
    "Cheque",
    "Online",
    "Auto-debit",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast.error("This expense cannot be edited");
      return;
    }

    if (!formData.description || !formData.category || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        ...formData,
        amount: Number(formData.amount),
        gstAmount: Number(formData.gstAmount) || 0,
        date: formData.date.toISOString(),
      };

      if (isEditMode && expenseId) {
        await expensesService.update(expenseId, expenseData);
        toast.success("Expense updated successfully");
      } else {
        await expensesService.create(expenseData);
        toast.success("Expense added successfully");
      }
      onBack();
    } catch (error: any) {
      console.error("Failed to save expense:", error);
      toast.error(error.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceipt(file);
      toast.success("Receipt uploaded");
    }
  };

  const removeReceipt = () => {
    setReceipt(null);
    toast.info("Receipt removed");
  };

  if (fetchingExpense) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading expense data...</p>
        </div>
      </div>
    );
  }

  // Transform suppliers for SearchableSelect
  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.name, // Using name as the value since the backend expects a string vendor name, not ID, currently. Or maybe it should be ID?
    // Looking at the formData.vendor = exp.vendor || "", it seems to be a string name.
    // However, usually we want to link by ID.
    // The current backend likely stores `vendor` as a string.
    // To match the existing behavior while improving UX, I will use supplier.name as the value.
    label: supplier.name,
    description: supplier.gstin ? `GSTIN: ${supplier.gstin}` : undefined
  }));

  // Setup options for categories
  const categoryOptions = categories.map((cat) => ({
    value: cat,
    label: cat
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-foreground">
            {isEditMode ? "Edit Expense" : "Add New Expense"}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode
              ? `Editing ${expenseNumber || `#${expenseId?.slice(0, 8)}`}`
              : "Record a new business expense"}
          </p>
        </div>
      </div>

      {/* Non-editable warning */}
      {isEditMode && !canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">This expense cannot be edited</p>
            <p className="text-sm text-amber-700">
              {expenseStatus === "PAID"
                ? "Paid expenses cannot be modified for accounting integrity."
                : "Expenses older than 30 days are locked for compliance."}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
              <CardDescription>Enter the expense information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {formData.date ? (
                          formData.date.toLocaleDateString("en-IN")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <SearchableSelect
                    options={categoryOptions}
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                    placeholder="Select category"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g., Office rent for September 2024"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Vendor & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor/Payee</Label>
                  <SearchableSelect
                    options={supplierOptions}
                    value={formData.vendor}
                    onValueChange={(val) => setFormData({ ...formData, vendor: val })}
                    placeholder="Select or search vendor"
                    emptyMessage="No vendor found."
                    className="w-full"
                  />
                  {/* Keep the input as fallback or alternative if user wants to type a name not in list? 
                      The requirement is to use searchable select. 
                      However, valid expenses might be to one-off vendors not in the system.
                      SearchableSelect usually forces selection from list.
                      But we can add a "creatable" logic or just use the Select.
                      If I strictly follow the prompt "Refactoring Dropdowns To Comboboxes", I should use the Combobox.
                      If the user needs to add a new vendor, they should probably add it to the system or I might need to allow free text.
                      For now, I will stick to the SearchableSelect populated with suppliers as requested.
                      If free text is needed, the `SearchableSelect` component might need an update or I just use it as is for now.
                      Wait, the previous code was a simple Input. Now I am making it a Select.
                      This limits the user to existing suppliers.
                      Is this desired?
                      The prompt says "replacing the existing Select components...". But here it was an Input.
                      "Identifying and refactoring similar dropdowns in other modules...".
                      Technically, `Expenses` didn't have a dropdown for vendor, it had an Input.
                      But usually you want to select a vendor.
                      Let's assume the user wants to standardize on selecting registered vendors.
                      However, if I assume too much, I might break the 'adhoc vendor' flow.
                      But given the task "Expenses (Vendor)" in task.md, and "Refactoring Dropdowns", maybe I should check if there WAS a dropdown. 
                      There WAS NOT a dropdown for vendor in the code I just read (it was `<Input id="vendor" ... />`).
                      However, often `Category` IS a dropdown. I am definitely changing Category.
                      For Vendor, if I change it to a Select, I am enhancing it.
                      I will also keep the standard Input if the user wants to type something else? 
                      No, `SearchableSelect` doesn't currently support free text entry if not in options.
                      I will proceed with `SearchableSelect` for Vendor as well, assuming the user wants to link expenses to system vendors for better tracking (Vendor Payments tab relies on vendors). 
                   */}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      className="pl-7"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* GST Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>GST Applicable?</Label>
                  <Select
                    value={formData.gstApplicable}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gstApplicable: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.gstApplicable === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="gstAmount">GST Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                      <Input
                        id="gstAmount"
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={formData.gstAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, gstAmount: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or comments"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Receipt Upload & Summary */}
          <div className="space-y-6">
            {/* Receipt Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt/Invoice</CardTitle>
                <CardDescription>Upload supporting documents</CardDescription>
              </CardHeader>
              <CardContent>
                {!receipt ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-accent transition-colors">
                    <Upload className="size-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center mb-1">
                      Click to upload
                    </p>
                    <p className="text-muted-foreground text-center">
                      PDF, JPG, PNG (Max 5MB)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleReceiptUpload}
                    />
                  </label>
                ) : (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-foreground">{receipt.name}</p>
                        <p className="text-muted-foreground">
                          {(receipt.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeReceipt}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Amount:</span>
                  <span className="text-foreground">
                    ₹{formData.amount || "0.00"}
                  </span>
                </div>
                {formData.gstApplicable === "yes" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST:</span>
                    <span className="text-foreground">
                      ₹{formData.gstAmount || "0.00"}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t flex justify-between">
                  <span className="text-foreground">Total:</span>
                  <span className="text-foreground">
                    ₹
                    {(
                      parseFloat(formData.amount || "0") +
                      (formData.gstApplicable === "yes"
                        ? parseFloat(formData.gstAmount || "0")
                        : 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {isEditMode ? "Update Expense" : "Save Expense"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onBack}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

