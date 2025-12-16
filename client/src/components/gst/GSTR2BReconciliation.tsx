import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    Upload,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    FileText,
    Download,
    Search,
} from "lucide-react";
import { toast } from "sonner";

interface GSTR2BRecord {
    id: string;
    supplierGstin: string;
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    invoiceValue: number;
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    matchStatus: "MATCHED" | "UNMATCHED" | "MISMATCH" | "PENDING";
    mismatchReason?: string;
    purchaseBillNumber?: string;
}

// Mock data for demonstration
const mockRecords: GSTR2BRecord[] = [
    {
        id: "1",
        supplierGstin: "29GGGGG1314R9Z6",
        supplierName: "ABC Suppliers Pvt Ltd",
        invoiceNumber: "INV-2024-001",
        invoiceDate: "2024-11-05",
        invoiceValue: 118000,
        taxableValue: 100000,
        igst: 0,
        cgst: 9000,
        sgst: 9000,
        matchStatus: "MATCHED",
        purchaseBillNumber: "PB-2024-045",
    },
    {
        id: "2",
        supplierGstin: "27AABCU9603R1ZM",
        supplierName: "XYZ Traders",
        invoiceNumber: "INV-112024",
        invoiceDate: "2024-11-10",
        invoiceValue: 59000,
        taxableValue: 50000,
        igst: 0,
        cgst: 4500,
        sgst: 4500,
        matchStatus: "MISMATCH",
        mismatchReason: "Amount mismatch: Portal ₹59,000, Books ₹58,500",
        purchaseBillNumber: "PB-2024-052",
    },
    {
        id: "3",
        supplierGstin: "33AADCB2230R1ZL",
        supplierName: "Raw Materials Co",
        invoiceNumber: "RM-2024-789",
        invoiceDate: "2024-11-15",
        invoiceValue: 23600,
        taxableValue: 20000,
        igst: 3600,
        cgst: 0,
        sgst: 0,
        matchStatus: "UNMATCHED",
    },
];

export function GSTR2BReconciliation() {
    const [records, setRecords] = useState<GSTR2BRecord[]>(mockRecords);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".json")) {
            toast.error("Please upload a JSON file");
            return;
        }

        setUploading(true);
        try {
            // In production, this would parse the GSTR-2B JSON and match with purchase bills
            await new Promise((resolve) => setTimeout(resolve, 2000));
            toast.success("GSTR-2B file uploaded and processed!");
            // Records would be populated from the API response
        } catch (error) {
            toast.error("Failed to process GSTR-2B file");
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "MATCHED":
                return (
                    <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Matched
                    </Badge>
                );
            case "UNMATCHED":
                return (
                    <Badge className="bg-gray-100 text-gray-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unmatched
                    </Badge>
                );
            case "MISMATCH":
                return (
                    <Badge className="bg-amber-100 text-amber-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Mismatch
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-blue-100 text-blue-700">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                );
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const filteredRecords = records.filter((r) => {
        const matchesSearch =
            r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.supplierGstin.includes(searchQuery);
        const matchesStatus = filterStatus === "ALL" || r.matchStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: records.length,
        matched: records.filter((r) => r.matchStatus === "MATCHED").length,
        unmatched: records.filter((r) => r.matchStatus === "UNMATCHED").length,
        mismatch: records.filter((r) => r.matchStatus === "MISMATCH").length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">GSTR-2B Reconciliation</h2>
                    <p className="text-muted-foreground">
                        Match your purchase bills with GSTR-2B portal data
                    </p>
                </div>
                <div className="flex gap-2">
                    <label>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <Button variant="outline" asChild disabled={uploading}>
                            <span className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                {uploading ? "Processing..." : "Upload GSTR-2B JSON"}
                            </span>
                        </Button>
                    </label>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Records</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-green-600">Matched</p>
                        <p className="text-2xl font-bold text-green-700">{stats.matched}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Unmatched</p>
                        <p className="text-2xl font-bold text-gray-700">{stats.unmatched}</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-amber-600">Mismatch</p>
                        <p className="text-2xl font-bold text-amber-700">{stats.mismatch}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by supplier name, GSTIN, or invoice number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {["ALL", "MATCHED", "UNMATCHED", "MISMATCH"].map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Records Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Reconciliation Records
                    </CardTitle>
                    <CardDescription>
                        Compare GSTR-2B data with your purchase records
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left py-3 px-4 font-medium">Supplier</th>
                                    <th className="text-left py-3 px-4 font-medium">Invoice</th>
                                    <th className="text-left py-3 px-4 font-medium">Date</th>
                                    <th className="text-right py-3 px-4 font-medium">Value</th>
                                    <th className="text-right py-3 px-4 font-medium">Tax</th>
                                    <th className="text-center py-3 px-4 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 font-medium">Our Bill</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((record) => (
                                    <tr key={record.id} className="border-b hover:bg-muted/20">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium">{record.supplierName}</p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {record.supplierGstin}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono">{record.invoiceNumber}</td>
                                        <td className="py-3 px-4">
                                            {new Date(record.invoiceDate).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            {formatCurrency(record.invoiceValue)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            {formatCurrency(record.igst + record.cgst + record.sgst)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {getStatusBadge(record.matchStatus)}
                                            {record.mismatchReason && (
                                                <p className="text-xs text-amber-600 mt-1">{record.mismatchReason}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {record.purchaseBillNumber ? (
                                                <span className="font-mono text-primary">{record.purchaseBillNumber}</span>
                                            ) : (
                                                <Button variant="link" size="sm" className="p-0 h-auto">
                                                    Link Bill
                                                </Button>
                                            )}
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

export default GSTR2BReconciliation;
