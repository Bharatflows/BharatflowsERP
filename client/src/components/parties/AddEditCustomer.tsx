import { useCreateParty, useUpdateParty } from "../../hooks/useParties";
import { partiesService } from "../../services/modules.service";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, User, Building2, Phone, Mail, MapPin, CreditCard, FileText, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
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
import { cn } from "../../lib/utils";

interface AddEditCustomerProps {
  customerId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

import { INDIAN_STATES } from "../../constants/india";
import { PARTY_FORM_STEPS } from "../../constants/form-steps";

export function AddEditCustomer({ customerId, onSave, onCancel }: AddEditCustomerProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const createMutation = useCreateParty();
  const updateMutation = useUpdateParty();

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    creditLimit: "",
    creditDays: "",
    openingBalance: "",
    notes: "",
    status: "active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customerId) {
      const fetchCustomer = async () => {
        setLoading(true);
        try {
          const response = await partiesService.getById(customerId);
          const customer = response.data;
          if (customer) {
            setFormData({
              name: customer.name || "",
              businessName: customer.name || "",
              gstin: customer.gstin || "",
              phone: customer.phone || "",
              email: customer.email || "",
              address: customer.billingAddress?.address || "",
              city: customer.billingAddress?.city || "",
              state: customer.billingAddress?.state || "",
              pincode: customer.billingAddress?.pincode || "",
              creditLimit: customer.creditLimit?.toString() || "",
              creditDays: customer.creditDays?.toString() || "",
              openingBalance: customer.openingBalance?.toString() || "",
              notes: customer.notes || "",
              status: customer.isActive ? "active" : "inactive",
            });
          }
        } catch (error) {
          console.error("Failed to fetch customer details:", error);
          toast.error("Failed to load customer details");
        } finally {
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [customerId]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.phone.trim()) newErrors.phone = "Phone is required";
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (formData.gstin && formData.gstin.length !== 15) {
        newErrors.gstin = "GSTIN must be 15 characters";
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state) newErrors.state = "State is required";
      if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
        newErrors.pincode = "Pincode must be 6 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    const partyData = {
      ...formData,
      type: 'customer' as const,
      creditLimit: Number(formData.creditLimit) || 0,
      creditDays: Number(formData.creditDays) || 0,
      openingBalance: Number(formData.openingBalance) || 0,
      isActive: formData.status === 'active'
    };

    try {
      if (customerId) {
        await updateMutation.mutateAsync({ id: customerId, data: partyData });
      } else {
        await createMutation.mutateAsync(partyData);
      }
      onSave();
    } catch (error) {
      // Error handled in hook
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={onCancel} className="gap-2 mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Customers
        </Button>
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-6 rounded-2xl shadow-lg shadow-indigo-500/20">
          <h2 className="text-2xl font-bold">{customerId ? "Edit Customer" : "Add New Customer"}</h2>
          <p className="text-indigo-100 mt-1">
            {customerId ? "Update customer details and information" : "Enter customer details to add them to your business"}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (PARTY_FORM_STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {PARTY_FORM_STEPS.map((step, idx) => (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                  currentStep > step.id
                    ? "bg-emerald-500 text-white"
                    : currentStep === step.id
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
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
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <User className="size-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                <p className="text-sm text-muted-foreground">Contact and business details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Contact Person Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Rajesh Kumar"
                  className={cn("h-11 rounded-xl", errors.name && "border-rose-500 focus-visible:ring-rose-500")}
                />
                {errors.name && <p className="text-sm text-rose-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-foreground font-medium">
                  Business Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  placeholder="Raj Enterprises"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground font-medium">
                  Phone Number <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="9876543210"
                    className={cn("h-11 rounded-xl pl-10", errors.phone && "border-rose-500")}
                  />
                </div>
                {errors.phone && <p className="text-sm text-rose-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="customer@example.com"
                    className={cn("h-11 rounded-xl pl-10", errors.email && "border-rose-500")}
                  />
                </div>
                {errors.email && <p className="text-sm text-rose-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin" className="text-foreground font-medium">GSTIN</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                    placeholder="27AABCU9603R1ZM"
                    maxLength={15}
                    className={cn("h-11 rounded-xl pl-10 uppercase", errors.gstin && "border-rose-500")}
                  />
                </div>
                {errors.gstin && <p className="text-sm text-rose-500">{errors.gstin}</p>}
                <p className="text-xs text-muted-foreground">15-character GSTIN number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-foreground font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="status" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <MapPin className="size-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Address Information</h3>
                <p className="text-sm text-muted-foreground">Billing and shipping address</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground font-medium">
                Full Address <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Street address, building number, landmark..."
                rows={3}
                className={cn("rounded-xl resize-none", errors.address && "border-rose-500")}
              />
              {errors.address && <p className="text-sm text-rose-500">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-foreground font-medium">
                  City <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Mumbai"
                  className={cn("h-11 rounded-xl", errors.city && "border-rose-500")}
                />
                {errors.city && <p className="text-sm text-rose-500">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-foreground font-medium">
                  State <span className="text-rose-500">*</span>
                </Label>
                <Select value={formData.state} onValueChange={(value) => handleChange("state", value)}>
                  <SelectTrigger id="state" className={cn("h-11 rounded-xl", errors.state && "border-rose-500")}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-sm text-rose-500">{errors.state}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-foreground font-medium">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  placeholder="400001"
                  maxLength={6}
                  className={cn("h-11 rounded-xl", errors.pincode && "border-rose-500")}
                />
                {errors.pincode && <p className="text-sm text-rose-500">{errors.pincode}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Financial Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <CreditCard className="size-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Financial Information</h3>
                <p className="text-sm text-muted-foreground">Credit terms and opening balance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="creditLimit" className="text-foreground font-medium">Credit Limit (₹)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleChange("creditLimit", e.target.value)}
                  placeholder="100000"
                  min="0"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditDays" className="text-foreground font-medium">Credit Period (Days)</Label>
                <Input
                  id="creditDays"
                  type="number"
                  value={formData.creditDays}
                  onChange={(e) => handleChange("creditDays", e.target.value)}
                  placeholder="30"
                  min="0"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingBalance" className="text-foreground font-medium">Opening Balance (₹)</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  value={formData.openingBalance}
                  onChange={(e) => handleChange("openingBalance", e.target.value)}
                  placeholder="0"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Additional Notes
                </div>
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional notes about this customer..."
                rows={4}
                className="rounded-xl resize-none"
              />
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
            <Button onClick={handleNext} className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700">
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
              {customerId ? "Update Customer" : "Add Customer"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
