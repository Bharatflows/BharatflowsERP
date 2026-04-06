import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Sheet,
    SheetContent,
} from "../ui/sheet";
import { partiesService, gstinService } from "../../services/modules.service";
import { toast } from "sonner";
import { Loader2, Building2, Phone, Mail, MapPin, Truck, Copy, Search, CheckCircle, ChevronLeft, Save } from "lucide-react";
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
    const [gstinLoading, setGstinLoading] = useState(false);
    const [gstinVerified, setGstinVerified] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    const [formData, setFormData] = useState({
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

    const handleAddressChange = (type: 'billingAddress' | 'shippingAddress', field: string, value: string) => {
        setFormData(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
    };

    const copyBillingToShipping = () => {
        setFormData(prev => ({ ...prev, shippingAddress: { ...prev.billingAddress } }));
        toast.success("Billing address copied to shipping");
    };

    const handleGSTINLookup = async () => {
        const gstin = formData.gstin.trim();
        if (!gstin || gstin.length !== 15) { toast.error("Please enter a valid 15-character GSTIN"); return; }
        setGstinLoading(true);
        setGstinVerified(false);
        try {
            const response = await gstinService.lookup(gstin);
            if (response.success && response.data) {
                const data = response.data;
                setFormData(prev => ({
                    ...prev,
                    name: data.tradeName || data.legalName || prev.name,
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
                if (data.address.city || data.address.state) setActiveTab("address");
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) { toast.error("Supplier name is required"); return; }
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
            setFormData({
                name: "", phone: "", email: "", gstin: "", pan: "", currency: "INR",
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="min-w-[100vw] sm:min-w-[550px] lg:min-w-[600px] p-0 overflow-hidden flex flex-col [&>button]:hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border">
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-muted size-9">
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Building2 className="size-5 text-brand-primary" />
                        <h1 className="text-xl font-bold text-foreground">Add New Supplier</h1>
                    </div>
                </div>

                {/* Content */}
                <form id="add-supplier-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-4">
                                <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
                                <TabsTrigger value="tax" className="text-xs">Tax</TabsTrigger>
                                <TabsTrigger value="address" className="text-xs">Address</TabsTrigger>
                                <TabsTrigger value="other" className="text-xs">Other</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Supplier Name <span className="text-destructive">*</span></Label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. ABC Suppliers Pvt. Ltd." className="h-10" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium flex items-center gap-1.5"><Mail className="size-3.5" /> Email</Label>
                                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="supplier@email.com" className="h-10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium flex items-center gap-1.5"><Phone className="size-3.5" /> Phone</Label>
                                        <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="h-10" />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="tax" className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium flex items-center gap-2">GSTIN {gstinVerified && <CheckCircle className="size-4 text-emerald-600" />}</Label>
                                    <div className="flex gap-2">
                                        <Input value={formData.gstin} onChange={e => { setFormData({ ...formData, gstin: e.target.value.toUpperCase() }); setGstinVerified(false); }} placeholder="27AABCM9603R1ZM" maxLength={15} className="h-10 font-mono flex-1" />
                                        <Button type="button" variant="outline" onClick={handleGSTINLookup} disabled={gstinLoading || formData.gstin.length !== 15} className="h-10 gap-1.5">
                                            {gstinLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Fetch
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Enter 15-character GSTIN and click Fetch to auto-fill</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">PAN</Label>
                                    <Input value={formData.pan} onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} className="h-10 font-mono" />
                                </div>
                            </TabsContent>

                            <TabsContent value="address" className="space-y-5">
                                <div className="space-y-2.5">
                                    <Label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="size-3.5" /> Billing Address</Label>
                                    <Input value={formData.billingAddress.street} onChange={e => handleAddressChange('billingAddress', 'street', e.target.value)} placeholder="Street" className="h-10" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input value={formData.billingAddress.city} onChange={e => handleAddressChange('billingAddress', 'city', e.target.value)} placeholder="City" className="h-10" />
                                        <Input value={formData.billingAddress.state} onChange={e => handleAddressChange('billingAddress', 'state', e.target.value)} placeholder="State" className="h-10" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input value={formData.billingAddress.pincode} onChange={e => handleAddressChange('billingAddress', 'pincode', e.target.value)} placeholder="Pincode" className="h-10" />
                                        <Input value={formData.billingAddress.country} onChange={e => handleAddressChange('billingAddress', 'country', e.target.value)} placeholder="Country" className="h-10" />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium flex items-center gap-1.5"><Truck className="size-3.5" /> Shipping Address</Label>
                                        <Button type="button" variant="ghost" size="sm" onClick={copyBillingToShipping} className="h-7 text-xs gap-1"><Copy className="size-3" /> Copy Billing</Button>
                                    </div>
                                    <Input value={formData.shippingAddress.street} onChange={e => handleAddressChange('shippingAddress', 'street', e.target.value)} placeholder="Street" className="h-10" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input value={formData.shippingAddress.city} onChange={e => handleAddressChange('shippingAddress', 'city', e.target.value)} placeholder="City" className="h-10" />
                                        <Input value={formData.shippingAddress.state} onChange={e => handleAddressChange('shippingAddress', 'state', e.target.value)} placeholder="State" className="h-10" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input value={formData.shippingAddress.pincode} onChange={e => handleAddressChange('shippingAddress', 'pincode', e.target.value)} placeholder="Pincode" className="h-10" />
                                        <Input value={formData.shippingAddress.country} onChange={e => handleAddressChange('shippingAddress', 'country', e.target.value)} placeholder="Country" className="h-10" />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="other" className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">Currency</Label>
                                        <Select value={formData.currency} onValueChange={v => setFormData({ ...formData, currency: v })}>
                                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium">Payment Terms</Label>
                                        <Select value={formData.paymentTerms} onValueChange={v => setFormData({ ...formData, paymentTerms: v })}>
                                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_TERMS.map(term => <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Remarks (Internal Use)</Label>
                                    <Textarea value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} placeholder="Internal notes about this supplier..." className="min-h-[80px] resize-none" />
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
                            {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Add Supplier
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
