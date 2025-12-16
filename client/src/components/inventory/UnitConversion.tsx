import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    Plus,
    ArrowRight,
    Edit,
    Trash2,
    Scale,
} from "lucide-react";
import { toast } from "sonner";

interface UnitConversion {
    id: string;
    fromUnit: string;
    toUnit: string;
    conversionFactor: number;
    description?: string;
    productName?: string;
}

// Mock data
const mockConversions: UnitConversion[] = [
    { id: "1", fromUnit: "Box", toUnit: "Pcs", conversionFactor: 12, description: "1 Box = 12 Pieces" },
    { id: "2", fromUnit: "Dozen", toUnit: "Pcs", conversionFactor: 12, description: "1 Dozen = 12 Pieces" },
    { id: "3", fromUnit: "Carton", toUnit: "Box", conversionFactor: 10, description: "1 Carton = 10 Boxes" },
    { id: "4", fromUnit: "Kg", toUnit: "Gm", conversionFactor: 1000, description: "1 Kg = 1000 Grams" },
    { id: "5", fromUnit: "Ltr", toUnit: "Ml", conversionFactor: 1000, description: "1 Litre = 1000 ml" },
];

export function UnitConversion() {
    const [conversions, setConversions] = useState<UnitConversion[]>(mockConversions);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ fromUnit: "", toUnit: "", factor: "", description: "" });

    const handleAdd = () => {
        if (!form.fromUnit || !form.toUnit || !form.factor) {
            toast.error("Please fill all required fields");
            return;
        }

        const newConversion: UnitConversion = {
            id: Date.now().toString(),
            fromUnit: form.fromUnit,
            toUnit: form.toUnit,
            conversionFactor: parseFloat(form.factor),
            description: form.description || `1 ${form.fromUnit} = ${form.factor} ${form.toUnit}`,
        };

        setConversions([...conversions, newConversion]);
        setForm({ fromUnit: "", toUnit: "", factor: "", description: "" });
        setShowForm(false);
        toast.success("Unit conversion added");
    };

    const handleDelete = (id: string) => {
        setConversions(conversions.filter((c) => c.id !== id));
        toast.success("Conversion deleted");
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Unit Conversions</h1>
                    <p className="text-muted-foreground">
                        Define how units convert (e.g., 1 Box = 12 Pcs)
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Conversion
                </Button>
            </div>

            {/* Add Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>New Unit Conversion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label>From Unit</Label>
                                <Input
                                    placeholder="e.g., Box"
                                    value={form.fromUnit}
                                    onChange={(e) => setForm({ ...form, fromUnit: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>To Unit</Label>
                                <Input
                                    placeholder="e.g., Pcs"
                                    value={form.toUnit}
                                    onChange={(e) => setForm({ ...form, toUnit: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Conversion Factor</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 12"
                                    value={form.factor}
                                    onChange={(e) => setForm({ ...form, factor: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleAdd} className="w-full">
                                    Add
                                </Button>
                            </div>
                        </div>
                        {form.fromUnit && form.toUnit && form.factor && (
                            <p className="mt-3 text-sm text-muted-foreground">
                                Preview: 1 {form.fromUnit} = {form.factor} {form.toUnit}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Conversions List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        Unit Conversions ({conversions.length})
                    </CardTitle>
                    <CardDescription>
                        Used for purchase (Box) → sale (Pcs) conversions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {conversions.map((conv) => (
                            <div
                                key={conv.id}
                                className="p-4 border rounded-lg hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{conv.fromUnit}</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-bold text-lg">{conv.toUnit}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500"
                                        onClick={() => handleDelete(conv.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-2xl font-bold text-primary">
                                    1 : {conv.conversionFactor}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {conv.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default UnitConversion;
