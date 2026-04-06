import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Plus,
    ArrowRight,
    Trash2,
    Scale,
    Loader2,
    RefreshCw,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { inventoryService, productsService } from "../../services/modules.service";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

interface UnitConversion {
    id: string;
    fromUnit: string;
    toUnit: string;
    conversionFactor: number;
    description?: string;
    productId?: string;
    product?: { name: string };
}

export function UnitConversion() {
    const [conversions, setConversions] = useState<UnitConversion[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        fromUnit: "",
        toUnit: "",
        conversionFactor: "",
        description: "",
        productId: "ALL"
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [convRes, prodRes] = await Promise.all([
                inventoryService.getUnitConversions(),
                productsService.getAll()
            ]);

            if (convRes.success) setConversions(convRes.data || []);
            if (prodRes.success) setProducts(prodRes.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async () => {
        if (!form.fromUnit || !form.toUnit || !form.conversionFactor) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            const payload = {
                ...form,
                conversionFactor: parseFloat(form.conversionFactor),
                productId: form.productId === "ALL" ? null : form.productId
            };

            const response = await inventoryService.createUnitConversion(payload);
            if (response.success) {
                toast.success("Unit conversion added");
                setForm({ fromUnit: "", toUnit: "", conversionFactor: "", description: "", productId: "ALL" });
                setShowForm(false);
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add conversion");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await inventoryService.deleteUnitConversion(id);
            if (response.success) {
                toast.success("Conversion deleted");
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to delete conversion");
        }
    };

    if (loading && conversions.length === 0) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Unit Conversions</h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Define conversion factors for purchase and sale units.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="size-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                        <Plus className="size-4" />
                        New Conversion
                    </Button>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <Card className="border-0 shadow-md bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-lg">New Unit Conversion</CardTitle>
                        <CardDescription>Setup a global or product-specific conversion factor</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label>Select Product (Optional)</Label>
                                <Select
                                    value={form.productId}
                                    onValueChange={(v) => setForm({ ...form, productId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Products" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Products (Global)</SelectItem>
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>From Unit</Label>
                                <Input
                                    placeholder="e.g., Box"
                                    value={form.fromUnit}
                                    onChange={(e) => setForm({ ...form, fromUnit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>To Unit</Label>
                                <Input
                                    placeholder="e.g., Pcs"
                                    value={form.toUnit}
                                    onChange={(e) => setForm({ ...form, toUnit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Conversion Factor</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 12"
                                    value={form.conversionFactor}
                                    onChange={(e) => setForm({ ...form, conversionFactor: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleAdd} className="w-full">
                                    Create Rule
                                </Button>
                            </div>
                        </div>
                        {form.fromUnit && form.toUnit && form.conversionFactor && (
                            <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Scale className="size-4 text-primary" />
                                Rule: 1 {form.fromUnit} will be treated as {form.conversionFactor} {form.toUnit}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Conversions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {conversions.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted rounded-xl border-2 border-dashed">
                        <Scale className="size-12 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No unit conversions defined yet.</p>
                        <p className="text-xs">Create rules to automatically convert stock units across transactions.</p>
                    </div>
                ) : (
                    conversions.map((conv) => (
                        <Card key={conv.id} className="border-0 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-4 flex items-center justify-between border-b border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <Scale className="size-4 text-primary" />
                                        </div>
                                        <span className="font-bold text-foreground">{conv.productId ? "Product Specific" : "Global Rule"}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(conv.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-center flex-1">
                                            <div className="text-2xs font-bold text-muted-foreground uppercase tracking-widest mb-1">From</div>
                                            <div className="text-xl font-black text-foreground">{conv.fromUnit}</div>
                                        </div>
                                        <div className="px-4">
                                            <ArrowRight className="size-5 text-muted-foreground" />
                                        </div>
                                        <div className="text-center flex-1">
                                            <div className="text-2xs font-bold text-muted-foreground uppercase tracking-widest mb-1">To</div>
                                            <div className="text-xl font-black text-foreground">{conv.conversionFactor} {conv.toUnit}</div>
                                        </div>
                                    </div>

                                    {conv.productId && (
                                        <div className="pt-3 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Search className="size-3" />
                                                Linked Product: <span className="text-foreground font-bold">{conv.product?.name || "Unknown Product"}</span>
                                            </div>
                                        </div>
                                    )}

                                    {!conv.productId && (
                                        <div className="pt-3 border-t border-slate-50">
                                            <div className="text-2xs bg-muted text-muted-foreground px-2 py-0.5 rounded inline-block font-bold">
                                                APPLIES TO ALL ITEMS
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

export default UnitConversion;
