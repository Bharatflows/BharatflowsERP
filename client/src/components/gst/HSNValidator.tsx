import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
        {name}
    </span>
);

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
        <div className="space-y-[24px] p-[24px] animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">HSN Code Validator</h1>
                <p className="text-body-sm font-medium text-muted-foreground mt-[4px]">
                    Validate HSN codes and get GST rates automatically
                </p>
            </div>

            {/* Search Card */}
            <Card className="rounded-[16px] border-border shadow-sm bg-card">
                <CardHeader className="p-[24px] pb-[16px]">
                    <CardTitle className="flex items-center gap-[8px] text-2xl font-bold text-foreground">
                        <MIcon name="search" className="text-[20px]" />
                        Validate HSN Code
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-[24px] pt-0">
                    <div className="flex gap-[16px]">
                        <Input
                            placeholder="Enter HSN code (e.g., 8517)"
                            value={hsnCode}
                            onChange={(e) => setHsnCode(e.target.value.replace(/\D/g, ""))}
                            className="max-w-xs font-mono text-body h-[44px] rounded-[8px] border-slate-200"
                            maxLength={8}
                        />
                        <Button onClick={validateHSN} disabled={loading} className="gap-[8px] h-[44px] px-[24px] rounded-[8px] font-bold">
                            {loading ? (
                                <MIcon name="sync" className="text-[18px] animate-spin" />
                            ) : (
                                <MIcon name="search" className="text-[18px]" />
                            )}
                            Validate
                        </Button>
                    </div>

                    {/* Result */}
                    {result && (
                        <div
                            className={`mt-[24px] p-[16px] rounded-[12px] border ${result.isValid
                                ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                                : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                                }`}
                        >
                            <div className="flex items-center gap-[12px]">
                                {result.isValid ? (
                                    <MIcon name="check_circle" className="text-[24px] text-green-600 dark:text-green-500" />
                                ) : (
                                    <MIcon name="cancel" className="text-[24px] text-red-600 dark:text-red-500" />
                                )}
                                <div>
                                    <p className="font-mono text-2xl font-bold text-foreground mb-[2px]">{result.hsnCode}</p>
                                    <p className={`font-medium ${result.isValid ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                                        {result.description}
                                    </p>
                                </div>
                                {result.isValid && (
                                    <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-200 border-0 font-bold rounded-[6px]">
                                        GST: {result.gstRate}%
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Common HSN Codes Reference */}
            <Card className="rounded-[16px] border-border shadow-sm bg-card">
                <CardHeader className="p-[24px] pb-[16px]">
                    <CardTitle className="flex items-center gap-[8px] text-2xl font-bold text-foreground">
                        <MIcon name="description" className="text-[20px]" />
                        Common HSN Codes
                    </CardTitle>
                    <CardDescription className="text-body-sm text-muted-foreground font-medium">Quick reference for frequently used codes</CardDescription>
                </CardHeader>
                <CardContent className="p-[24px] pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[12px]">
                        {commonHSNCodes.map((code) => (
                            <div
                                key={code.code}
                                onClick={() => setHsnCode(code.code)}
                                className="p-[16px] border border-border rounded-[12px] cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <p className="font-mono font-bold text-body text-foreground group-hover:text-primary transition-colors">{code.code}</p>
                                <p className="text-body-sm font-medium text-muted-foreground mt-[4px]">{code.desc}</p>
                                <Badge variant="outline" className="mt-[8px] font-bold text-[11px] rounded-[4px] bg-muted dark:bg-card">
                                    {code.rate}% GST
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Search History */}
            {searchHistory.length > 0 && (
                <Card className="rounded-[16px] border-border shadow-sm bg-card">
                    <CardHeader className="p-[24px] pb-[16px]">
                        <CardTitle className="text-2xl font-bold text-foreground">Recent Searches</CardTitle>
                    </CardHeader>
                    <CardContent className="p-[24px] pt-0">
                        <div className="flex flex-wrap gap-[8px]">
                            {searchHistory.map((item, idx) => (
                                <Badge
                                    key={idx}
                                    variant={item.isValid ? "default" : "destructive"}
                                    className={`cursor-pointer font-bold px-[12px] py-[6px] rounded-[8px] ${item.isValid ? "bg-slate-900 hover:bg-muted text-white" : ""}`}
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
