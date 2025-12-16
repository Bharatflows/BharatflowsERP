import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    Plus,
    Search,
    FileText,
    Download,
    Calculator,
    Building,
} from "lucide-react";
import { toast } from "sonner";

interface TDSTCSEntry {
    id: string;
    type: "TDS" | "TCS";
    sectionCode: string;
    partyName: string;
    partyPan: string;
    referenceNumber: string;
    baseAmount: number;
    rate: number;
    taxAmount: number;
    transactionDate: string;
    status: "PENDING" | "FILED" | "PAID";
}

// Common TDS/TCS sections
const sections = {
    TDS: [
        { code: "194C", desc: "Contractors", rate: 1 },
        { code: "194J", desc: "Professional Fees", rate: 10 },
        { code: "194H", desc: "Commission", rate: 5 },
        { code: "194I", desc: "Rent", rate: 10 },
    ],
    TCS: [
        { code: "206C(1)", desc: "Sale of scrap", rate: 1 },
        { code: "206C(1H)", desc: "Sale above ₹50L", rate: 0.1 },
    ],
};

// Mock data
const mockEntries: TDSTCSEntry[] = [
    {
        id: "1",
        type: "TDS",
        sectionCode: "194C",
        partyName: "ABC Contractors",
        partyPan: "ABCDE1234F",
        referenceNumber: "PB-2024-100",
        baseAmount: 100000,
        rate: 1,
        taxAmount: 1000,
        transactionDate: "2024-11-15",
        status: "PENDING",
    },
    {
        id: "2",
        type: "TDS",
        sectionCode: "194J",
        partyName: "XYZ Consultants",
        partyPan: "XYZAB5678G",
        referenceNumber: "PB-2024-095",
        baseAmount: 50000,
        rate: 10,
        taxAmount: 5000,
        transactionDate: "2024-11-10",
        status: "FILED",
    },
    {
        id: "3",
        type: "TCS",
        sectionCode: "206C(1H)",
        partyName: "Large Buyer Ltd",
        partyPan: "LBUYR9999H",
        referenceNumber: "INV-2024-500",
        baseAmount: 7500000,
        rate: 0.1,
        taxAmount: 7500,
        transactionDate: "2024-11-20",
        status: "PENDING",
    },
];

export function TDSTCSManagement() {
    const [entries, setEntries] = useState<TDSTCSEntry[]>(mockEntries);
    const [filterType, setFilterType] = useState<"ALL" | "TDS" | "TCS">("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
            case "FILED":
                return <Badge className="bg-blue-100 text-blue-700">Filed</Badge>;
            case "PAID":
                return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const filteredEntries = entries.filter((e) => {
        const matchesType = filterType === "ALL" || e.type === filterType;
        const matchesSearch =
            e.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const stats = {
        totalTDS: entries.filter((e) => e.type === "TDS").reduce((sum, e) => sum + e.taxAmount, 0),
        totalTCS: entries.filter((e) => e.type === "TCS").reduce((sum, e) => sum + e.taxAmount, 0),
        pending: entries.filter((e) => e.status === "PENDING").length,
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">TDS / TCS Management</h1>
                    <p className="text-muted-foreground">
                        Track Tax Deducted/Collected at Source
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Calculator className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600">Total TDS Deducted</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {formatCurrency(stats.totalTDS)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <Building className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-purple-600">Total TCS Collected</p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {formatCurrency(stats.totalTCS)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <FileText className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-600">Pending Filing</p>
                                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
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
                        placeholder="Search by party name or reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {(["ALL", "TDS", "TCS"] as const).map((type) => (
                        <Button
                            key={type}
                            variant={filterType === type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterType(type)}
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Entries Table */}
            <Card>
                <CardHeader>
                    <CardTitle>TDS/TCS Entries ({filteredEntries.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left py-3 px-4 font-medium">Type</th>
                                    <th className="text-left py-3 px-4 font-medium">Section</th>
                                    <th className="text-left py-3 px-4 font-medium">Party</th>
                                    <th className="text-left py-3 px-4 font-medium">Reference</th>
                                    <th className="text-right py-3 px-4 font-medium">Base Amount</th>
                                    <th className="text-right py-3 px-4 font-medium">Rate</th>
                                    <th className="text-right py-3 px-4 font-medium">Tax</th>
                                    <th className="text-center py-3 px-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="border-b hover:bg-muted/20">
                                        <td className="py-3 px-4">
                                            <Badge variant={entry.type === "TDS" ? "default" : "secondary"}>
                                                {entry.type}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 font-mono">{entry.sectionCode}</td>
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium">{entry.partyName}</p>
                                                <p className="text-xs text-muted-foreground">{entry.partyPan}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-sm">{entry.referenceNumber}</td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            {formatCurrency(entry.baseAmount)}
                                        </td>
                                        <td className="py-3 px-4 text-right">{entry.rate}%</td>
                                        <td className="py-3 px-4 text-right font-mono font-bold">
                                            {formatCurrency(entry.taxAmount)}
                                        </td>
                                        <td className="py-3 px-4 text-center">{getStatusBadge(entry.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Section Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>TDS Sections</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {sections.TDS.map((s) => (
                                <div key={s.code} className="flex justify-between p-2 border rounded">
                                    <span className="font-mono">{s.code}</span>
                                    <span className="text-muted-foreground">{s.desc}</span>
                                    <Badge variant="outline">{s.rate}%</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>TCS Sections</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {sections.TCS.map((s) => (
                                <div key={s.code} className="flex justify-between p-2 border rounded">
                                    <span className="font-mono">{s.code}</span>
                                    <span className="text-muted-foreground">{s.desc}</span>
                                    <Badge variant="outline">{s.rate}%</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default TDSTCSManagement;
