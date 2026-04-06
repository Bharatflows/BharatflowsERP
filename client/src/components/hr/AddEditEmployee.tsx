import { useState, useEffect } from "react";
import { hrService } from "../../services/modules.service";
import { Loader2, ArrowLeft, Save, User, Briefcase, Building2, CreditCard, Phone, Mail, CheckCircle2 } from "lucide-react";
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
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface AddEditEmployeeProps {
  employeeId?: string | null;
  onBack: () => void;
}

const FORM_STEPS = [
  { id: 1, title: "Personal", description: "Basic info", icon: User },
  { id: 2, title: "Employment", description: "Job details", icon: Briefcase },
  { id: 3, title: "Salary", description: "Compensation", icon: CreditCard },
];

const DEPARTMENTS = ["Sales", "Operations", "Accounts", "Admin", "IT", "Marketing", "HR", "Production"];

const PAY_FREQUENCIES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "DAILY", label: "Daily" },
];

export function AddEditEmployee({ employeeId, onBack }: AddEditEmployeeProps) {
  const isEditMode = !!employeeId;
  const [loading, setLoading] = useState(false);
  const [fetchingEmployee, setFetchingEmployee] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    dateOfBirth: null as Date | null,
    joiningDate: new Date(),
    address: "",
    department: "",
    designation: "",
    payFrequency: "MONTHLY",
    salary: "",
    overtimeRate: "",
    accountNumber: "",
    ifscCode: "",
    panNumber: "",
    aadhaarNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch employee data when editing
  useEffect(() => {
    if (isEditMode && employeeId) {
      setFetchingEmployee(true);
      hrService.getById(employeeId)
        .then((response) => {
          if (response.success && response.data) {
            const emp: any = response.data;
            setFormData({
              employeeId: emp.employeeId || "",
              name: emp.name || "",
              email: emp.email || "",
              phone: emp.phone || "",
              dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : null,
              joiningDate: emp.joiningDate ? new Date(emp.joiningDate) : new Date(),
              address: emp.address || "",
              department: emp.department || "",
              designation: emp.designation || "",
              payFrequency: emp.payFrequency || "MONTHLY",
              salary: emp.salary?.toString() || "",
              overtimeRate: emp.overtimeRate?.toString() || "",
              accountNumber: emp.accountNumber || "",
              ifscCode: emp.ifscCode || "",
              panNumber: emp.panNumber || "",
              aadhaarNumber: emp.aadhaarNumber || "",
            });
          }
        })
        .catch(() => toast.error("Failed to load employee data"))
        .finally(() => setFetchingEmployee(false));
    }
  }, [employeeId, isEditMode]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.phone.trim()) newErrors.phone = "Phone is required";
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    if (step === 2) {
      if (!formData.department) newErrors.department = "Department is required";
      if (!formData.designation.trim()) newErrors.designation = "Designation is required";
    }

    if (step === 3) {
      if (!formData.salary) newErrors.salary = "Salary is required";
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

    setLoading(true);
    try {
      const employeeData = {
        ...formData,
        salary: Number(formData.salary) || 0,
        overtimeRate: formData.overtimeRate ? Number(formData.overtimeRate) : null,
        dateOfBirth: formData.dateOfBirth?.toISOString() || null,
        joiningDate: formData.joiningDate.toISOString(),
      };

      if (isEditMode && employeeId) {
        await hrService.update(employeeId, employeeData);
        toast.success("Employee updated successfully");
      } else {
        await hrService.create(employeeData);
        toast.success("Employee added successfully");
      }
      onBack();
    } catch (error: any) {
      toast.error(error.message || "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  const getSalaryLabel = () => {
    switch (formData.payFrequency) {
      case "DAILY": return "Daily Wage (₹)";
      case "WEEKLY": return "Weekly Wage (₹)";
      default: return "Monthly Salary (₹)";
    }
  };

  if (fetchingEmployee) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-10 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading employee data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={onBack} className="gap-2 mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-8 py-6 rounded-2xl shadow-lg shadow-primary/20">
          <h2 className="text-2xl font-bold">{isEditMode ? "Edit Employee" : "Add New Employee"}</h2>
          <p className="text-blue-100 mt-1">
            {isEditMode ? `${formData.name} • ${formData.employeeId}` : "Enter employee details"}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {FORM_STEPS.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                  currentStep > step.id
                    ? "bg-emerald-500 text-white"
                    : currentStep === step.id
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-white text-muted-foreground border-2 border-slate-200"
                )}
              >
                {currentStep > step.id ? <CheckCircle2 className="size-6" /> : <step.icon className="size-5" />}
              </div>
              <div className="mt-3 text-center">
                <p className={cn("font-medium text-sm", currentStep >= step.id ? "text-foreground" : "text-muted-foreground")}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="size-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <p className="text-sm text-muted-foreground">Basic employee details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium">Employee ID</Label>
                <Input
                  value={formData.employeeId}
                  onChange={(e) => handleChange("employeeId", e.target.value)}
                  placeholder="EMP001"
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Auto-generated if left empty</p>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Full Name <span className="text-rose-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Rajesh Kumar"
                  className={cn("h-11 rounded-xl", errors.name && "border-rose-500")}
                />
                {errors.name && <p className="text-sm text-rose-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Phone <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="9876543210"
                    className={cn("h-11 rounded-xl pl-10", errors.phone && "border-rose-500")}
                  />
                </div>
                {errors.phone && <p className="text-sm text-rose-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="employee@example.com"
                    className={cn("h-11 rounded-xl pl-10", errors.email && "border-rose-500")}
                  />
                </div>
                {errors.email && <p className="text-sm text-rose-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full h-11 rounded-xl justify-start", !formData.dateOfBirth && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 size-4" />
                      {formData.dateOfBirth ? formData.dateOfBirth.toLocaleDateString("en-IN") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dateOfBirth || undefined}
                      onSelect={(date) => handleChange("dateOfBirth", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Joining Date <span className="text-rose-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-11 rounded-xl justify-start">
                      <CalendarIcon className="mr-2 size-4" />
                      {formData.joiningDate.toLocaleDateString("en-IN")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.joiningDate}
                      onSelect={(date) => date && handleChange("joiningDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Complete address..."
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Employment Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Briefcase className="size-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Employment Details</h3>
                <p className="text-sm text-muted-foreground">Job and department information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium">Department <span className="text-rose-500">*</span></Label>
                <Select value={formData.department} onValueChange={(value) => handleChange("department", value)}>
                  <SelectTrigger className={cn("h-11 rounded-xl", errors.department && "border-rose-500")}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-sm text-rose-500">{errors.department}</p>}
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Designation <span className="text-rose-500">*</span></Label>
                <Input
                  value={formData.designation}
                  onChange={(e) => handleChange("designation", e.target.value)}
                  placeholder="e.g., Sales Manager"
                  className={cn("h-11 rounded-xl", errors.designation && "border-rose-500")}
                />
                {errors.designation && <p className="text-sm text-rose-500">{errors.designation}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Salary & Bank Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <CreditCard className="size-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Salary & Bank Details</h3>
                <p className="text-sm text-muted-foreground">Compensation and payment info</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium">Payment Frequency</Label>
                <Select value={formData.payFrequency} onValueChange={(value) => handleChange("payFrequency", value)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAY_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">{getSalaryLabel()} <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => handleChange("salary", e.target.value)}
                    placeholder={formData.payFrequency === "DAILY" ? "500" : formData.payFrequency === "WEEKLY" ? "3500" : "25000"}
                    className={cn("h-11 rounded-xl pl-8", errors.salary && "border-rose-500")}
                  />
                </div>
                {errors.salary && <p className="text-sm text-rose-500">{errors.salary}</p>}
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Overtime Rate (₹/hour)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={formData.overtimeRate}
                    onChange={(e) => handleChange("overtimeRate", e.target.value)}
                    placeholder="100"
                    className="h-11 rounded-xl pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Optional - for OT calculation</p>
              </div>
            </div>

            <hr className="my-6" />

            <h4 className="font-semibold text-muted-foreground mb-4">Bank & ID Details (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium">Bank Account Number</Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => handleChange("accountNumber", e.target.value)}
                  placeholder="Account number"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">IFSC Code</Label>
                <Input
                  value={formData.ifscCode}
                  onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  className="h-11 rounded-xl uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">PAN Number</Label>
                <Input
                  value={formData.panNumber}
                  onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="h-11 rounded-xl uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Aadhaar Number</Label>
                <Input
                  value={formData.aadhaarNumber}
                  onChange={(e) => handleChange("aadhaarNumber", e.target.value)}
                  placeholder="1234 5678 9012"
                  maxLength={14}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onBack : handlePrev}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="size-4" />
            {currentStep === 1 ? "Cancel" : "Previous"}
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
              Next Step
              <ArrowLeft className="size-4 rotate-180" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isEditMode ? "Update Employee" : "Add Employee"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
