import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { partiesService } from "../../services/modules.service";
import { toast } from "sonner";
import { Loader2, Building2, Phone, Mail, MapPin, Truck, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { PAYMENT_TERMS, DEFAULT_PAYMENT_TERM } from "../../constants/payment";

interface AddSupplierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (supplier: any) => void;
}

export function AddSupplierDialog({ open, onOpenChange, onSuccess }: AddSupplierDialogProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        gstin: "",
        pan: "",
        currency: "INR",
        paymentTerms: DEFAULT_PAYMENT_TERM,
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Supplier name is required");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                type: "supplier",
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                gstin: formData.gstin,
                pan: formData.pan,
                billingAddress: formData.billingAddress,
                shippingAddress: formData.shippingAddress,
                partyType: "supplier",
            };

            const response = await partiesService.create(payload as any);

            toast.success("Supplier added successfully");
            onSuccess(response.data);
            onOpenChange(false);

            // Reset form
            setFormData({
                name: "",
                phone: "",
                email: "",
                gstin: "",
                pan: "",
                currency: "INR",
                paymentTerms: DEFAULT_PAYMENT_TERM,
                billingAddress: { street: "", city: "", state: "", pincode: "", country: "India" },
                shippingAddress: { street: "", city: "", state: "", pincode: "", country: "India" },
                remarks: ""
            });
            setActiveTab("basic");
        } catch (error: any) {
            console.error("Failed to create supplier:", error);
            toast.error(error.message || "Failed to add supplier");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="size-5 text-primary" />
                        Add New Supplier
                    </DialogTitle>
                    <DialogDescription>
                        Add supplier details including contact, tax info, and addresses
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
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
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Supplier Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. ABC Suppliers Pvt. Ltd."
                                    className="h-11"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                                        <Mail className="size-3.5" /> Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="supplier@email.com"
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                                        <Phone className="size-3.5" /> Phone
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tax Details Tab */}
                        <TabsContent value="tax" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gstin" className="text-sm font-medium">GSTIN</Label>
                                    <Input
                                        id="gstin"
                                        value={formData.gstin}
                                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                        placeholder="27AABCM9603R1ZM"
                                        maxLength={15}
                                        className="h-11 font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">15-character GST number</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pan" className="text-sm font-medium">PAN</Label>
                                    <Input
                                        id="pan"
                                        value={formData.pan}
                                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        className="h-11 font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">10-character PAN number</p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Address Tab */}
                        <TabsContent value="address" className="space-y-6 mt-4">
                            {/* Billing Address */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-1.5">
                                    <MapPin className="size-3.5" /> Billing Address
                                </Label>
                                <Input
                                    value={formData.billingAddress.street}
                                    onChange={(e) => handleAddressChange('billingAddress', 'street', e.target.value)}
                                    placeholder="Street address"
                                    className="h-11"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        value={formData.billingAddress.city}
                                        onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                                        placeholder="City"
                                        className="h-11"
                                    />
                                    <Input
                                        value={formData.billingAddress.state}
                                        onChange={(e) => handleAddressChange('billingAddress', 'state', e.target.value)}
                                        placeholder="State"
                                        className="h-11"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        value={formData.billingAddress.pincode}
                                        onChange={(e) => handleAddressChange('billingAddress', 'pincode', e.target.value)}
                                        placeholder="Pincode"
                                        className="h-11"
                                    />
                                    <Input
                                        value={formData.billingAddress.country}
                                        onChange={(e) => handleAddressChange('billingAddress', 'country', e.target.value)}
                                        placeholder="Country"
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium flex items-center gap-1.5">
                                        <Truck className="size-3.5" /> Shipping Address
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={copyBillingToShipping}
                                        className="h-7 text-xs gap-1"
                                    >
                                        <Copy className="size-3" /> Copy Billing
                                    </Button>
                                </div>
                                <Input
                                    value={formData.shippingAddress.street}
                                    onChange={(e) => handleAddressChange('shippingAddress', 'street', e.target.value)}
                                    placeholder="Street address"
                                    className="h-11"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        value={formData.shippingAddress.city}
                                        onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)}
                                        placeholder="City"
                                        className="h-11"
                                    />
                                    <Input
                                        value={formData.shippingAddress.state}
                                        onChange={(e) => handleAddressChange('shippingAddress', 'state', e.target.value)}
                                        placeholder="State"
                                        className="h-11"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        value={formData.shippingAddress.pincode}
                                        onChange={(e) => handleAddressChange('shippingAddress', 'pincode', e.target.value)}
                                        placeholder="Pincode"
                                        className="h-11"
                                    />
                                    <Input
                                        value={formData.shippingAddress.country}
                                        onChange={(e) => handleAddressChange('shippingAddress', 'country', e.target.value)}
                                        placeholder="Country"
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Other Tab */}
                        <TabsContent value="other" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Currency</Label>
                                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
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
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_TERMS.map((term) => (
                                                <SelectItem key={term.value} value={term.value}>
                                                    {term.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remarks" className="text-sm font-medium">Remarks (Internal Use)</Label>
                                <Textarea
                                    id="remarks"
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    placeholder="Add any internal notes about this supplier..."
                                    className="min-h-[80px] resize-none"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading && <Loader2 className="size-4 animate-spin" />}
                            Add Supplier
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
