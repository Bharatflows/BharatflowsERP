import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Sheet, SheetContent } from "../ui/sheet";
import { partiesService, gstinService } from "../../services/modules.service";
import { toast } from "sonner";
import { Loader2, User, Phone, Mail, MapPin, Truck, Copy, Search, CheckCircle, ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { PAYMENT_TERMS, DEFAULT_PAYMENT_TERM } from "../../constants/payment";

interface AddCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (customer: any) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onSuccess }: AddCustomerDialogProps) {
    const [loading, setLoading] = useState(false);
    const [gstinLoading, setGstinLoading] = useState(false);
    const [gstinVerified, setGstinVerified] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [customerType, setCustomerType] = useState("business");

    const [formData, setFormData] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        gstin: "",
        pan: "",
        currency: "INR",
        paymentTerms: DEFAULT_PAYMENT_TERM,
        website: "",
        billingAddress: {
            street: "",
            city: "",
            state: "",
            pincode: "",
            country: "India"
        },
        shippingAddress: {
            street: "",
            city: "",
            state: "",
            pincode: "",
            country: "India"
        },
        remarks: ""
    });

    const handleAddressChange = (type: 'billingAddress' | 'shippingAddress', field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    const copyBillingToShipping = () => {
        setFormData(prev => ({
            ...prev,
            shippingAddress: { ...prev.billingAddress }
        }));
        toast.success("Billing address copied to shipping");
    };

    const handleGSTINLookup = async () => {
        const gstin = formData.gstin.trim();
        if (!gstin || gstin.length !== 15) {
            toast.error("Please enter a valid 15-character GSTIN");
            return;
        }

        setGstinLoading(true);
        setGstinVerified(false);
        try {
            const response = await gstinService.lookup(gstin);
            if (response.success && response.data) {
                const data = response.data;
                setFormData(prev => ({
                    ...prev,
                    name: data.tradeName || data.legalName || prev.name,
                    companyName: data.legalName || prev.companyName,
                    pan: gstin.substring(2, 12),
                    billingAddress: {
                        street: [data.address.building, data.address.street].filter(Boolean).join(', ') || prev.billingAddress.street,
                        city: data.address.city || prev.billingAddress.city,
                        state: data.address.state || data.stateName || prev.billingAddress.state,
                        pincode: data.address.pincode || prev.billingAddress.pincode,
                        country: data.address.country || 'India'
                    }
                }));
                setGstinVerified(true);
                toast.success(`GSTIN verified: ${data.legalName}`);
                if (data.address.city || data.address.state) {
                    setActiveTab("address");
                }
            } else {
                toast.error(response.message || "Could not fetch GSTIN details");
            }
        } catch (error: any) {
            console.error("GSTIN lookup failed:", error);
            toast.error(error.message || "Failed to lookup GSTIN");
        } finally {
            setGstinLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "", companyName: "", email: "", phone: "", gstin: "", pan: "",
            currency: "INR", paymentTerms: DEFAULT_PAYMENT_TERM, website: "",
            billingAddress: { street: "", city: "", state: "", pincode: "", country: "India" },
            shippingAddress: { street: "", city: "", state: "", pincode: "", country: "India" },
            remarks: ""
        });
        setActiveTab("basic");
        setGstinVerified(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) { toast.error("Customer name is required"); return; }

        setLoading(true);
        try {
            const payload = {
                type: "customer",
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                gstin: formData.gstin,
                pan: formData.pan,
                billingAddress: formData.billingAddress,
                shippingAddress: formData.shippingAddress,
                partyType: "customer",
            };

            const response = await partiesService.create(payload as any);
            toast.success("Customer added successfully");
            onSuccess(response.data);
            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            console.error("Failed to create customer:", error);
            toast.error(error.message || "Failed to add customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="min-w-[100vw] sm:min-w-[550px] lg:min-w-[600px] p-0 overflow-hidden flex flex-col [&>button]:hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border">
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-muted size-9">
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <User className="size-5 text-brand-primary" />
                        <h1 className="text-xl font-bold text-foreground">Add New Customer</h1>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="tax">Tax Details</TabsTrigger>
                                <TabsTrigger value="address">Address</TabsTrigger>
                                <TabsTrigger value="other">Other</TabsTrigger>
                            </TabsList>

                            {/* Basic Info Tab */}
                            <TabsContent value="basic" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Customer Type</Label>
                                    <RadioGroup value={customerType} onValueChange={setCustomerType} className="flex gap-6">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="business" id="business" />
                                            <Label htmlFor="business" className="font-normal cursor-pointer">Business</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="individual" id="individual" />
                                            <Label htmlFor="individual" className="font-normal cursor-pointer">Individual</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium">
                                        Customer Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter customer/company name"
                                        className="h-10"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                                            <Mail className="size-3.5" /> Email
                                        </Label>
                                        <Input
                                            id="email" type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@example.com"
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                                            <Phone className="size-3.5" /> Phone
                                        </Label>
                                        <Input
                                            id="phone" type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91 98765 43210"
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tax Details Tab */}
                            <TabsContent value="tax" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gstin" className="text-sm font-medium flex items-center gap-2">
                                        GSTIN
                                        {gstinVerified && <CheckCircle className="size-4 text-emerald-600" />}
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="gstin"
                                            value={formData.gstin}
                                            onChange={(e) => {
                                                setFormData({ ...formData, gstin: e.target.value.toUpperCase() });
                                                setGstinVerified(false);
                                            }}
                                            placeholder="27AABCM9603R1ZM"
                                            maxLength={15}
                                            className="h-10 font-mono flex-1"
                                        />
                                        <Button
                                            type="button" variant="outline"
                                            onClick={handleGSTINLookup}
                                            disabled={gstinLoading || formData.gstin.length !== 15}
                                            className="h-10 gap-2"
                                        >
                                            {gstinLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                                            Fetch
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Enter 15-character GST number and click Fetch to auto-fill customer details
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pan" className="text-sm font-medium">PAN</Label>
                                    <Input
                                        id="pan"
                                        value={formData.pan}
                                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        className="h-10 font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">10-character PAN number</p>
                                </div>
                            </TabsContent>

                            {/* Address Tab */}
                            <TabsContent value="address" className="space-y-6 mt-4">
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium flex items-center gap-1.5">
                                        <MapPin className="size-3.5" /> Billing Address
                                    </Label>
                                    <Input value={formData.billingAddress.street} onChange={(e) => handleAddressChange('billingAddress', 'street', e.target.value)} placeholder="Street address" className="h-10" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input value={formData.billingAddress.city} onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)} placeholder="City" className="h-10" />
                                        <Input value={formData.billingAddress.state} onChange={(e) => handleAddressChange('billingAddress', 'state', e.target.value)} placeholder="State" className="h-10" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input value={formData.billingAddress.pincode} onChange={(e) => handleAddressChange('billingAddress', 'pincode', e.target.value)} placeholder="Pincode" className="h-10" />
                                        <Input value={formData.billingAddress.country} onChange={(e) => handleAddressChange('billingAddress', 'country', e.target.value)} placeholder="Country" className="h-10" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                            <Truck className="size-3.5" /> Shipping Address
                                        </Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={copyBillingToShipping} className="h-7 text-xs gap-1">
                                            <Copy className="size-3" /> Copy Billing
                                        </Button>
                                    </div>
                                    <Input value={formData.shippingAddress.street} onChange={(e) => handleAddressChange('shippingAddress', 'street', e.target.value)} placeholder="Street address" className="h-10" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input value={formData.shippingAddress.city} onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)} placeholder="City" className="h-10" />
                                        <Input value={formData.shippingAddress.state} onChange={(e) => handleAddressChange('shippingAddress', 'state', e.target.value)} placeholder="State" className="h-10" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input value={formData.shippingAddress.pincode} onChange={(e) => handleAddressChange('shippingAddress', 'pincode', e.target.value)} placeholder="Pincode" className="h-10" />
                                        <Input value={formData.shippingAddress.country} onChange={(e) => handleAddressChange('shippingAddress', 'country', e.target.value)} placeholder="Country" className="h-10" />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Other Tab */}
                            <TabsContent value="other" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Currency</Label>
                                        <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Payment Terms</Label>
                                        <Select value={formData.paymentTerms} onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })}>
                                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_TERMS.map((term) => (
                                                    <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                                    <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="www.example.com" className="h-10" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="remarks" className="text-sm font-medium">Remarks (Internal Use)</Label>
                                    <Textarea id="remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Add any internal notes about this customer..." className="min-h-[80px] resize-none" />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between px-6 py-3.5 bg-card border-t border-border">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-9 px-5 text-sm font-medium">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="h-9 px-5 text-sm font-medium gap-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white shadow-sm">
                            {loading && <Loader2 className="size-4 animate-spin" />}
                            Add Customer
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
