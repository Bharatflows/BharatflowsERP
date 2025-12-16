import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    Plus,
    Search,
    Factory,
    Package,
    ArrowRight,
    Edit,
    Trash2,
    Play,
} from "lucide-react";
import { toast } from "sonner";

interface BOMItem {
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
}

interface BillOfMaterial {
    id: string;
    name: string;
    code: string;
    finishedProductName: string;
    finishedProductCode: string;
    outputQuantity: number;
    items: BOMItem[];
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    isActive: boolean;
}

// Mock data for demonstration
const mockBOMs: BillOfMaterial[] = [
    {
        id: "1",
        name: "Wooden Chair Assembly",
        code: "BOM-001",
        finishedProductName: "Wooden Chair",
        finishedProductCode: "PROD-FIN-001",
        outputQuantity: 1,
        items: [
            { productId: "rm1", productName: "Plywood Sheet", productCode: "RM-001", quantity: 2, unit: "pcs", costPerUnit: 500 },
            { productId: "rm2", productName: "Wood Screws", productCode: "RM-002", quantity: 12, unit: "pcs", costPerUnit: 5 },
            { productId: "rm3", productName: "Wood Polish", productCode: "RM-003", quantity: 0.5, unit: "ltr", costPerUnit: 200 },
        ],
        laborCost: 200,
        overheadCost: 50,
        totalCost: 1410,
        isActive: true,
    },
    {
        id: "2",
        name: "Metal Table Assembly",
        code: "BOM-002",
        finishedProductName: "Metal Folding Table",
        finishedProductCode: "PROD-FIN-002",
        outputQuantity: 1,
        items: [
            { productId: "rm4", productName: "Metal Frame", productCode: "RM-004", quantity: 1, unit: "pcs", costPerUnit: 800 },
            { productId: "rm5", productName: "Table Top (Glass)", productCode: "RM-005", quantity: 1, unit: "pcs", costPerUnit: 600 },
            { productId: "rm6", productName: "Bolts & Nuts Set", productCode: "RM-006", quantity: 1, unit: "set", costPerUnit: 100 },
        ],
        laborCost: 150,
        overheadCost: 75,
        totalCost: 1725,
        isActive: true,
    },
];

export function BillOfMaterials() {
    const [boms, setBoms] = useState<BillOfMaterial[]>(mockBOMs);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBOM, setSelectedBOM] = useState<BillOfMaterial | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const filteredBOMs = boms.filter(
        (b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.finishedProductName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleManufacture = (bom: BillOfMaterial) => {
        toast.success(`Started manufacturing: ${bom.finishedProductName}`);
        // In production, this would create stock movements and update inventory
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Bill of Materials</h1>
                    <p className="text-muted-foreground">
                        Define raw materials needed to manufacture finished goods
                    </p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create BOM
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by BOM name or finished product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BOM List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Factory className="h-5 w-5" />
                            Bill of Materials ({filteredBOMs.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredBOMs.map((bom) => (
                                <div
                                    key={bom.id}
                                    onClick={() => setSelectedBOM(bom)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedBOM?.id === bom.id
                                            ? "border-primary bg-primary/5"
                                            : "hover:border-muted-foreground/30"
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {bom.code}
                                                </span>
                                                <Badge variant={bom.isActive ? "default" : "secondary"}>
                                                    {bom.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <h3 className="font-semibold mt-1">{bom.name}</h3>
                                        </div>
                                        <span className="font-bold text-primary">
                                            {formatCurrency(bom.totalCost)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                        <Package className="h-4 w-4" />
                                        <span>Produces: {bom.finishedProductName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline">{bom.items.length} raw materials</Badge>
                                        <Badge variant="outline">Output: {bom.outputQuantity}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* BOM Detail */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {selectedBOM ? selectedBOM.name : "Select a BOM"}
                        </CardTitle>
                        <CardDescription>
                            {selectedBOM
                                ? `Raw materials and costs for ${selectedBOM.finishedProductName}`
                                : "Click on a BOM to view details"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!selectedBOM ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Factory className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Select a Bill of Materials</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Finished Product */}
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium">Finished Product</p>
                                    <p className="font-bold text-green-700">{selectedBOM.finishedProductName}</p>
                                    <p className="text-xs text-green-600 font-mono">{selectedBOM.finishedProductCode}</p>
                                </div>

                                {/* Arrow */}
                                <div className="flex justify-center">
                                    <div className="bg-muted p-2 rounded-full">
                                        <ArrowRight className="h-4 w-4 rotate-[-90deg]" />
                                    </div>
                                </div>

                                {/* Raw Materials */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-muted/50 px-4 py-2 font-medium">Raw Materials</div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2 px-4">Material</th>
                                                <th className="text-right py-2 px-4">Qty</th>
                                                <th className="text-right py-2 px-4">Rate</th>
                                                <th className="text-right py-2 px-4">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedBOM.items.map((item, idx) => (
                                                <tr key={idx} className="border-b">
                                                    <td className="py-2 px-4">
                                                        <div>
                                                            <p className="font-medium">{item.productName}</p>
                                                            <p className="text-xs text-muted-foreground">{item.productCode}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-4 text-right">
                                                        {item.quantity} {item.unit}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono">
                                                        {formatCurrency(item.costPerUnit)}
                                                    </td>
                                                    <td className="py-2 px-4 text-right font-mono font-medium">
                                                        {formatCurrency(item.quantity * item.costPerUnit)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Cost Summary */}
                                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                                    <div className="flex justify-between">
                                        <span>Materials Cost</span>
                                        <span className="font-mono">
                                            {formatCurrency(
                                                selectedBOM.items.reduce((sum, i) => sum + i.quantity * i.costPerUnit, 0)
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Labor Cost</span>
                                        <span className="font-mono">{formatCurrency(selectedBOM.laborCost)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Overhead</span>
                                        <span className="font-mono">{formatCurrency(selectedBOM.overheadCost)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 font-bold">
                                        <span>Total Cost</span>
                                        <span className="font-mono text-primary">
                                            {formatCurrency(selectedBOM.totalCost)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button className="flex-1" onClick={() => handleManufacture(selectedBOM)}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Manufacture
                                    </Button>
                                    <Button variant="outline">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" className="text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default BillOfMaterials;
