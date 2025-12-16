import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    Plus,
    Search,
    Package,
    QrCode,
    CheckCircle,
    XCircle,
    RotateCcw,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface SerialNumber {
    id: string;
    serialNumber: string;
    productName: string;
    productCode: string;
    status: "IN_STOCK" | "SOLD" | "RETURNED" | "DAMAGED";
    purchaseBillNumber?: string;
    invoiceNumber?: string;
    warrantyExpiry?: string;
    createdAt: string;
}

// Mock data for demonstration
const mockSerials: SerialNumber[] = [
    {
        id: "1",
        serialNumber: "SN-PHONE-001-2024",
        productName: "Samsung Galaxy A54",
        productCode: "PROD-001",
        status: "IN_STOCK",
        purchaseBillNumber: "PB-2024-100",
        warrantyExpiry: "2025-12-01",
        createdAt: "2024-11-01",
    },
    {
        id: "2",
        serialNumber: "SN-PHONE-002-2024",
        productName: "Samsung Galaxy A54",
        productCode: "PROD-001",
        status: "SOLD",
        purchaseBillNumber: "PB-2024-100",
        invoiceNumber: "INV-2024-0150",
        warrantyExpiry: "2025-12-01",
        createdAt: "2024-11-01",
    },
    {
        id: "3",
        serialNumber: "SN-LAPTOP-001-2024",
        productName: "Dell Inspiron 15",
        productCode: "PROD-005",
        status: "RETURNED",
        purchaseBillNumber: "PB-2024-095",
        invoiceNumber: "INV-2024-0125",
        warrantyExpiry: "2026-06-15",
        createdAt: "2024-10-15",
    },
];

export function SerialNumberTracking() {
    const [serials, setSerials] = useState<SerialNumber[]>(mockSerials);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [showAddModal, setShowAddModal] = useState(false);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "IN_STOCK":
                return (
                    <Badge className="bg-green-100 text-green-700">
                        <Package className="h-3 w-3 mr-1" />
                        In Stock
                    </Badge>
                );
            case "SOLD":
                return (
                    <Badge className="bg-blue-100 text-blue-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sold
                    </Badge>
                );
            case "RETURNED":
                return (
                    <Badge className="bg-amber-100 text-amber-700">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Returned
                    </Badge>
                );
            case "DAMAGED":
                return (
                    <Badge className="bg-red-100 text-red-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Damaged
                    </Badge>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const filteredSerials = serials.filter((s) => {
        const matchesSearch =
            s.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.productName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: serials.length,
        inStock: serials.filter((s) => s.status === "IN_STOCK").length,
        sold: serials.filter((s) => s.status === "SOLD").length,
        returned: serials.filter((s) => s.status === "RETURNED").length,
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Serial Number Tracking</h1>
                    <p className="text-muted-foreground">
                        Track individual items for electronics, laptops, and high-value products
                    </p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Serial Numbers
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <QrCode className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Serials</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-green-600">In Stock</p>
                                <p className="text-2xl font-bold text-green-700">{stats.inStock}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600">Sold</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.sold}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <RotateCcw className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-600">Returned</p>
                                <p className="text-2xl font-bold text-amber-700">{stats.returned}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by serial number or product name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {["ALL", "IN_STOCK", "SOLD", "RETURNED", "DAMAGED"].map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === "ALL" ? "All" : status.replace("_", " ")}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Serial Numbers Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Serial Numbers ({filteredSerials.length})
                    </CardTitle>
                    <CardDescription>
                        View and manage individual product serial numbers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left py-3 px-4 font-medium">Serial Number</th>
                                    <th className="text-left py-3 px-4 font-medium">Product</th>
                                    <th className="text-center py-3 px-4 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 font-medium">Purchase Bill</th>
                                    <th className="text-left py-3 px-4 font-medium">Invoice</th>
                                    <th className="text-left py-3 px-4 font-medium">Warranty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSerials.map((serial) => (
                                    <tr key={serial.id} className="border-b hover:bg-muted/20">
                                        <td className="py-3 px-4 font-mono font-medium">
                                            {serial.serialNumber}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium">{serial.productName}</p>
                                                <p className="text-xs text-muted-foreground">{serial.productCode}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {getStatusBadge(serial.status)}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-sm">
                                            {serial.purchaseBillNumber || "-"}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-sm">
                                            {serial.invoiceNumber || "-"}
                                        </td>
                                        <td className="py-3 px-4">
                                            {serial.warrantyExpiry ? (
                                                <span className={new Date(serial.warrantyExpiry) < new Date() ? "text-red-600" : "text-green-600"}>
                                                    {new Date(serial.warrantyExpiry).toLocaleDateString("en-IN")}
                                                </span>
                                            ) : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default SerialNumberTracking;
