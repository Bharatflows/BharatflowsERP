import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
    Search,
    CheckCircle,
    XCircle,
    Loader2,
    FileText,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface HSNResult {
    hsnCode: string;
    description: string;
    gstRate: number;
    isValid: boolean;
}

// Common HSN codes for reference
const commonHSNCodes = [
    { code: "3004", desc: "Medicaments", rate: 12 },
    { code: "6109", desc: "T-shirts, singlets", rate: 5 },
    { code: "8471", desc: "Computers", rate: 18 },
    { code: "8517", desc: "Mobile phones", rate: 18 },
    { code: "9403", desc: "Furniture", rate: 18 },
    { code: "8703", desc: "Motor cars", rate: 28 },
    { code: "2106", desc: "Food preparations", rate: 18 },
    { code: "3923", desc: "Plastic articles", rate: 18 },
];

export function HSNValidator() {
    const [hsnCode, setHsnCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<HSNResult | null>(null);
    const [searchHistory, setSearchHistory] = useState<HSNResult[]>([]);

    const validateHSN = async () => {
        if (!hsnCode || hsnCode.length < 4) {
            toast.error("Please enter at least 4 digits");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // Simulated API call - in production, call actual HSN validation API
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Check if it matches common codes
            const matched = commonHSNCodes.find((c) => hsnCode.startsWith(c.code));

            if (matched) {
                const validResult: HSNResult = {
                    hsnCode: hsnCode,
                    description: matched.desc,
                    gstRate: matched.rate,
                    isValid: true,
                };
                setResult(validResult);
                setSearchHistory([validResult, ...searchHistory.slice(0, 9)]);
                toast.success("HSN code is valid");
            } else {
                const invalidResult: HSNResult = {
                    hsnCode: hsnCode,
                    description: "Unknown HSN code",
                    gstRate: 0,
                    isValid: false,
                };
                setResult(invalidResult);
                toast.error("HSN code not found in database");
            }
        } catch (error) {
            toast.error("Failed to validate HSN code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">HSN Code Validator</h1>
                <p className="text-muted-foreground">
                    Validate HSN codes and get GST rates automatically
                </p>
            </div>

            {/* Search Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Validate HSN Code
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Enter HSN code (e.g., 8517)"
                            value={hsnCode}
                            onChange={(e) => setHsnCode(e.target.value.replace(/\D/g, ""))}
                            className="max-w-xs font-mono text-lg"
                            maxLength={8}
                        />
                        <Button onClick={validateHSN} disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Search className="h-4 w-4 mr-2" />
                            )}
                            Validate
                        </Button>
                    </div>

                    {/* Result */}
                    {result && (
                        <div
                            className={`mt-4 p-4 rounded-lg border ${result.isValid
                                    ? "bg-green-50 border-green-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {result.isValid ? (
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : (
                                    <XCircle className="h-6 w-6 text-red-600" />
                                )}
                                <div>
                                    <p className="font-mono text-xl font-bold">{result.hsnCode}</p>
                                    <p className={result.isValid ? "text-green-700" : "text-red-700"}>
                                        {result.description}
                                    </p>
                                </div>
                                {result.isValid && (
                                    <Badge className="ml-auto bg-green-100 text-green-700">
                                        GST: {result.gstRate}%
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Common HSN Codes Reference */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Common HSN Codes
                    </CardTitle>
                    <CardDescription>Quick reference for frequently used codes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {commonHSNCodes.map((code) => (
                            <div
                                key={code.code}
                                onClick={() => setHsnCode(code.code)}
                                className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                            >
                                <p className="font-mono font-bold text-lg">{code.code}</p>
                                <p className="text-sm text-muted-foreground">{code.desc}</p>
                                <Badge variant="outline" className="mt-1">
                                    {code.rate}% GST
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Search History */}
            {searchHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Searches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {searchHistory.map((item, idx) => (
                                <Badge
                                    key={idx}
                                    variant={item.isValid ? "default" : "destructive"}
                                    className="cursor-pointer"
                                    onClick={() => setHsnCode(item.hsnCode)}
                                >
                                    {item.hsnCode}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default HSNValidator;
