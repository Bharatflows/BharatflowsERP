import { useState, useEffect } from "react";
import { settingsService } from "../../services/modules.service";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import {
  Building2,
  Upload,
  Save,
  Palette,
  FileText,
  IndianRupee,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { INDIAN_STATES } from "../../constants";


export function BusinessProfile() {
  const { user } = useAuth();
  const company = user?.company;

  const [businessData, setBusinessData] = useState({
    businessName: company?.businessName || "",
    legalName: (company as any)?.legalName || "",
    gstNumber: company?.gstin || "",
    panNumber: company?.pan || "",
    businessType: "Private Limited", // Default or fetch if available
    industry: "Manufacturing", // Default or fetch if available
    email: company?.email || user?.email || "",
    phone: company?.phone || user?.phone || "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // Update state when user data loads
  useEffect(() => {
    if (company) {
      setBusinessData(prev => ({
        ...prev,
        businessName: company.businessName || "",
        legalName: (company as any).legalName || "",
        gstNumber: company.gstin || "",
        panNumber: company.pan || "",
        email: company.email || user?.email || "",
        phone: company.phone || user?.phone || "",
        // Parse address if it exists and is a string or object
        ...(typeof company.address === 'string' ? JSON.parse(company.address) : company.address || {})
      }));
    }
  }, [company, user]);

  const [bankData, setBankData] = useState({
    accountName: "Sharma Enterprises Pvt Ltd",
    accountNumber: "1234567890",
    ifscCode: "HDFC0001234",
    bankName: "HDFC Bank",
    branch: "MG Road, Bangalore",
    accountType: "Current Account",
    confirmAccountNumber: "",
  });

  const [brandingData, setBrandingData] = useState({
    primaryColor: "#4f46e5",
    secondaryColor: "#06b6d4",
    accentColor: "#10b981",
    invoicePrefix: "INV",
    estimatePrefix: "EST",
    poPrefix: "PO",
    includeGSTNote: true,
    includeTerms: true,
  });

  const [fetchingGst, setFetchingGst] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);

  const [saving, setSaving] = useState(false);

  // Helper to save updates with validation error handling
  const saveUpdates = async (updates: any, successMessage: string) => {
    setSaving(true);
    try {
      const response = await settingsService.updateCompanyDetails(updates);
      if (response.success) {
        toast.success(successMessage);
      }
    } catch (error: any) {
      // Handle field-level validation errors
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.entries(errors).forEach(([field, message]) => {
          toast.error(`${field}: ${message}`);
        });
      } else {
        toast.error(error?.response?.data?.message || error.message || "Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFetchGSTIN = async () => {
    if (!businessData.gstNumber) {
      toast.error("Please enter a GSTIN number first");
      return;
    }

    // Basic format check
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(businessData.gstNumber)) {
      toast.error("Invalid GSTIN format");
      return;
    }

    setFetchingGst(true);
    setGstVerified(false);

    try {
      const response = await settingsService.getGSTINDetails(businessData.gstNumber);

      if (response.success && response.data) {
        const data = response.data;

        setBusinessData(prev => ({
          ...prev,
          legalName: data.legalName || prev.legalName,
          // businessName might be same as legal name or trade name
          businessName: data.tradeName || data.legalName || prev.businessName,
          addressLine1: data.address?.building ? `${data.address.building}, ${data.address.street}` : data.address?.street || prev.addressLine1,
          city: data.address?.city || prev.city,
          state: data.stateName || prev.state,
          pincode: data.address?.pincode || prev.pincode,
          // Auto-fill PAN from GSTIN if missing
          panNumber: !prev.panNumber && businessData.gstNumber.length >= 12 ? businessData.gstNumber.substring(2, 12) : prev.panNumber
        }));

        setGstVerified(true);
        toast.success("Business details fetched successfully!");
      } else {
        toast.error("Could not fetch details for this GSTIN");
      }
    } catch (error: any) {
      console.error("GST fetch error:", error);
      toast.error(error.message || "Failed to fetch GSTIN details");
    } finally {
      setFetchingGst(false);
    }
  };

  const handleSaveBasicInfo = () => {
    // Client-side GSTIN validation
    if (businessData.gstNumber) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(businessData.gstNumber)) {
        toast.error("Invalid GSTIN format (e.g., 27AAPFU0939F1ZV)");
        return;
      }
    }

    // Client-side PAN validation
    if (businessData.panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(businessData.panNumber)) {
        toast.error("Invalid PAN format (e.g., ABCDE1234F)");
        return;
      }
    }

    saveUpdates({
      businessName: businessData.businessName,
      legalName: businessData.legalName,
      gstin: businessData.gstNumber,
      pan: businessData.panNumber,
      email: businessData.email,
      phone: businessData.phone,
      website: businessData.website,
      address: {
        line1: businessData.addressLine1,
        line2: businessData.addressLine2,
        city: businessData.city,
        state: businessData.state,
        pincode: businessData.pincode,
        country: businessData.country
      }
    }, "Business information saved successfully");
  };

  const handleSaveBankInfo = () => {
    // Validate account number match if confirm field exists
    if (bankData.confirmAccountNumber && bankData.accountNumber !== bankData.confirmAccountNumber) {
      toast.error("Account numbers do not match");
      return;
    }

    // Validate IFSC format
    if (bankData.ifscCode) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(bankData.ifscCode)) {
        toast.error("Invalid IFSC code format (e.g., HDFC0001234)");
        return;
      }
    }

    saveUpdates({
      bankDetails: bankData
    }, "Bank details saved successfully");
  };

  const handleSaveBranding = () => {
    saveUpdates({
      branding: brandingData
    }, "Branding settings saved successfully");
  };

  return (
    <div className="p-6">

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 bg-muted/20 p-1 rounded-xl">
          <TabsTrigger
            value="basic"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            Basic Info
          </TabsTrigger>
          <TabsTrigger
            value="bank"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            Bank Details
          </TabsTrigger>
          <TabsTrigger
            value="branding"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            Branding
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6 mt-0">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Business Information</CardTitle>
                  <CardDescription>Manage your company's basic details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Logo Upload */}
              <div>
                <Label className="text-sm font-medium">Business Logo</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 hover:bg-muted transition-colors">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Button>
                    <p className="text-muted-foreground text-xs">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

              {/* Business Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name *</Label>
                  <Input
                    id="legalName"
                    value={businessData.legalName}
                    onChange={(e) => setBusinessData({ ...businessData, legalName: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* GST & PAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="gstNumber"
                        value={businessData.gstNumber}
                        onChange={(e) => {
                          setBusinessData({ ...businessData, gstNumber: e.target.value.toUpperCase() });
                          setGstVerified(false);
                        }}
                        className="bg-background pr-20"
                        placeholder="27AABCU9603R1ZM"
                        maxLength={15}
                      />
                      {gstVerified && (
                        <Badge className="absolute right-2 top-2 bg-emerald-500 hover:bg-emerald-600 text-white border-0 pointer-events-none">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleFetchGSTIN}
                      disabled={fetchingGst || !businessData.gstNumber}
                      title="Fetch Details from GSTIN"
                      className="shrink-0"
                    >
                      {fetchingGst ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    value={businessData.panNumber}
                    onChange={(e) => setBusinessData({ ...businessData, panNumber: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Business Type & Industry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select value={businessData.businessType} onValueChange={(value) => setBusinessData({ ...businessData, businessType: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="LLP">LLP</SelectItem>
                      <SelectItem value="Private Limited">Private Limited</SelectItem>
                      <SelectItem value="Public Limited">Public Limited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={businessData.industry} onValueChange={(value) => setBusinessData({ ...businessData, industry: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Trading">Trading</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Wholesale">Wholesale</SelectItem>
                      <SelectItem value="IT/Software">IT/Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 border-t border-border/50 pt-6">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={businessData.email}
                      onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={businessData.phone}
                      onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={businessData.website}
                      onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4 border-t border-border/50 pt-6">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Business Address
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={businessData.addressLine1}
                      onChange={(e) => setBusinessData({ ...businessData, addressLine1: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={businessData.addressLine2}
                      onChange={(e) => setBusinessData({ ...businessData, addressLine2: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={businessData.city}
                        onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select value={businessData.state} onValueChange={(value) => setBusinessData({ ...businessData, state: value })}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        value={businessData.pincode}
                        onChange={(e) => setBusinessData({ ...businessData, pincode: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input id="country" value={businessData.country} disabled className="bg-muted" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveBasicInfo} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Business Information
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details Tab */}
        <TabsContent value="bank" className="space-y-6 mt-0">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Bank Account Details</CardTitle>
                  <CardDescription>Manage your banking information for payments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Holder Name *</Label>
                  <Input
                    id="accountName"
                    value={bankData.accountName}
                    onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select value={bankData.accountType} onValueChange={(value) => setBankData({ ...bankData, accountType: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Current Account">Current Account</SelectItem>
                      <SelectItem value="Savings Account">Savings Account</SelectItem>
                      <SelectItem value="Cash Credit">Cash Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={bankData.ifscCode}
                    onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={bankData.bankName}
                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch *</Label>
                  <Input
                    id="branch"
                    value={bankData.branch}
                    onChange={(e) => setBankData({ ...bankData, branch: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveBankInfo} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Bank Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6 mt-0">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 p-3 rounded-lg">
                  <Palette className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Branding & Templates</CardTitle>
                  <CardDescription>Customize your invoices and documents</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Color Theme */}
              <div className="space-y-4">
                <h3 className="text-foreground font-medium">Color Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={brandingData.primaryColor}
                        onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                        className="w-20 h-10 p-1 bg-background"
                      />
                      <Input value={brandingData.primaryColor} readOnly className="bg-muted" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={brandingData.secondaryColor}
                        onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                        className="w-20 h-10 p-1 bg-background"
                      />
                      <Input value={brandingData.secondaryColor} readOnly className="bg-muted" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={brandingData.accentColor}
                        onChange={(e) => setBrandingData({ ...brandingData, accentColor: e.target.value })}
                        className="w-20 h-10 p-1 bg-background"
                      />
                      <Input value={brandingData.accentColor} readOnly className="bg-muted" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Prefixes */}
              <div className="space-y-4 border-t border-border/50 pt-6">
                <h3 className="text-foreground font-medium">Document Number Prefixes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      value={brandingData.invoicePrefix}
                      onChange={(e) => setBrandingData({ ...brandingData, invoicePrefix: e.target.value })}
                      placeholder="INV"
                      className="bg-background"
                    />
                    <p className="text-muted-foreground text-xs">e.g., INV-2024-001</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatePrefix">Estimate Prefix</Label>
                    <Input
                      id="estimatePrefix"
                      value={brandingData.estimatePrefix}
                      onChange={(e) => setBrandingData({ ...brandingData, estimatePrefix: e.target.value })}
                      placeholder="EST"
                      className="bg-background"
                    />
                    <p className="text-muted-foreground text-xs">e.g., EST-2024-001</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poPrefix">Purchase Order Prefix</Label>
                    <Input
                      id="poPrefix"
                      value={brandingData.poPrefix}
                      onChange={(e) => setBrandingData({ ...brandingData, poPrefix: e.target.value })}
                      placeholder="PO"
                      className="bg-background"
                    />
                    <p className="text-muted-foreground text-xs">e.g., PO-2024-001</p>
                  </div>
                </div>
              </div>

              {/* Invoice Settings */}
              <div className="space-y-4 border-t border-border/50 pt-6">
                <h3 className="text-foreground font-medium">Invoice Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Include GST Declaration Note</Label>
                      <p className="text-muted-foreground text-sm">
                        Add standard GST compliance note on invoices
                      </p>
                    </div>
                    <Switch
                      checked={brandingData.includeGSTNote}
                      onCheckedChange={(checked) => setBrandingData({ ...brandingData, includeGSTNote: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Include Terms & Conditions</Label>
                      <p className="text-muted-foreground text-sm">
                        Add default terms and conditions on documents
                      </p>
                    </div>
                    <Switch
                      checked={brandingData.includeTerms}
                      onCheckedChange={(checked) => setBrandingData({ ...brandingData, includeTerms: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveBranding} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Branding Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6 mt-0">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-50 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Business Documents</CardTitle>
                  <CardDescription>Upload and manage important documents</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {[
                { name: "GST Certificate", uploaded: true, filename: "gst_certificate.pdf" },
                { name: "PAN Card", uploaded: true, filename: "pan_card.pdf" },
                { name: "Address Proof", uploaded: false, filename: "" },
                { name: "Bank Cancelled Cheque", uploaded: true, filename: "cancelled_cheque.pdf" },
                { name: "Partnership Deed / MOA", uploaded: false, filename: "" },
              ].map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-foreground font-medium">{doc.name}</p>
                      {doc.uploaded ? (
                        <p className="text-muted-foreground text-sm">{doc.filename}</p>
                      ) : (
                        <p className="text-muted-foreground text-sm">Not uploaded</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.uploaded ? (
                      <>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">Uploaded</Badge>
                        <Button variant="outline" size="sm" className="hover:bg-primary/5 hover:text-primary">View</Button>
                        <Button variant="outline" size="sm" className="hover:bg-primary/5 hover:text-primary">Replace</Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/5 hover:text-primary">
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

