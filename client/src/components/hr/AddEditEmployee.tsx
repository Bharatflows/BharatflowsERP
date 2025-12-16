import { useState } from "react";
import { hrService } from "../../services/modules.service";
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
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import { CalendarIcon, ArrowLeft, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface AddEditEmployeeProps {
  employeeId?: string | null;
  onBack: () => void;
}

export function AddEditEmployee({ employeeId, onBack }: AddEditEmployeeProps) {
  const isEditMode = !!employeeId;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    dateOfBirth: new Date(),
    joiningDate: new Date(),
    department: "",
    designation: "",
    salary: "",
    accountNumber: "",
    ifscCode: "",
    panNumber: "",
    aadhaarNumber: "",
    pfNumber: "",
    esiNumber: "",
    address: "",
    emergencyContact: "",
    emergencyName: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);

  const departments = [
    "Sales",
    "Operations",
    "Accounts",
    "Admin",
    "IT",
    "Marketing",
    "HR",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.department || !formData.salary) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const employeeData = {
        ...formData,
        salary: Number(formData.salary),
        dateOfBirth: formData.dateOfBirth.toISOString(),
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
      console.error("Failed to save employee:", error);
      toast.error(error.message || "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      toast.success("Photo uploaded");
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    toast.info("Photo removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-foreground">
            {isEditMode ? "Edit Employee" : "Add New Employee"}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode ? `Editing ${employeeId}` : "Enter employee details"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic employee details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input
                      id="employeeId"
                      placeholder="EMP001"
                      value={formData.employeeId}
                      onChange={(e) =>
                        setFormData({ ...formData, employeeId: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Rajesh Kumar"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="employee@company.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left",
                            !formData.dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {formData.dateOfBirth
                            ? formData.dateOfBirth.toLocaleDateString("en-IN")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.dateOfBirth}
                          onSelect={(date) =>
                            date && setFormData({ ...formData, dateOfBirth: date })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left",
                            !formData.joiningDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {formData.joiningDate
                            ? formData.joiningDate.toLocaleDateString("en-IN")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.joiningDate}
                          onSelect={(date) =>
                            date && setFormData({ ...formData, joiningDate: date })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Complete address"
                    rows={2}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Job and salary information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        setFormData({ ...formData, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Input
                      id="designation"
                      placeholder="e.g., Sales Manager"
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({ ...formData, designation: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Monthly Salary (CTC) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="35000"
                      className="pl-7"
                      value={formData.salary}
                      onChange={(e) =>
                        setFormData({ ...formData, salary: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank & Statutory Details */}
            <Card>
              <CardHeader>
                <CardTitle>Bank & Statutory Details</CardTitle>
                <CardDescription>
                  Bank account and government IDs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Bank Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="1234567890"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, accountNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      placeholder="SBIN0001234"
                      value={formData.ifscCode}
                      onChange={(e) =>
                        setFormData({ ...formData, ifscCode: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      placeholder="ABCDE1234F"
                      value={formData.panNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, panNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                    <Input
                      id="aadhaarNumber"
                      placeholder="1234 5678 9012"
                      value={formData.aadhaarNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, aadhaarNumber: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pfNumber">PF Number</Label>
                    <Input
                      id="pfNumber"
                      placeholder="PF Account Number"
                      value={formData.pfNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, pfNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esiNumber">ESI Number</Label>
                    <Input
                      id="esiNumber"
                      placeholder="ESI Account Number"
                      value={formData.esiNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, esiNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>Contact in case of emergency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input
                      id="emergencyName"
                      placeholder="Emergency contact name"
                      value={formData.emergencyName}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Contact Number</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="+91 98765 43210"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Photo Upload & Actions */}
          <div className="space-y-6">
            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Photo</CardTitle>
                <CardDescription>Upload employee photograph</CardDescription>
              </CardHeader>
              <CardContent>
                {!photo ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-accent transition-colors">
                    <Upload className="size-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center mb-1">
                      Click to upload
                    </p>
                    <p className="text-muted-foreground text-center">
                      JPG, PNG (Max 2MB)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                ) : (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-foreground">{photo.name}</p>
                        <p className="text-muted-foreground">
                          {(photo.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removePhoto}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID:</span>
                  <span className="text-foreground">
                    {formData.employeeId || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="text-foreground">
                    {formData.department || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designation:</span>
                  <span className="text-foreground">
                    {formData.designation || "—"}
                  </span>
                </div>
                <div className="pt-3 border-t flex justify-between">
                  <span className="text-foreground">Monthly Salary:</span>
                  <span className="text-foreground">
                    ₹{formData.salary ? parseFloat(formData.salary).toLocaleString("en-IN") : "0"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {isEditMode ? "Update Employee" : "Add Employee"}
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

