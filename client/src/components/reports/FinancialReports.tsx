import { useState } from "react";
import { Download, Calendar, Printer } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function FinancialReports() {
    const [period, setPeriod] = useState("FY 2024-25");

    return (
        <div className="p-6 space-y-6">
            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Financial Statements</h2>
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
                        <Calendar className="size-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">{period}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Printer className="size-4" /> Print
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-4" /> Download PDF
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="pl" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
                </TabsList>

                {/* Profit & Loss Content */}
                <TabsContent value="pl">
                    <div className="space-y-6">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg font-semibold">Profit & Loss Statement</CardTitle>
                                    <span className="text-sm text-muted-foreground">Apr 1, 2024 - Mar 31, 2025</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Income Section */}
                                <div className="p-6 border-b border-border/50">
                                    <h3 className="font-semibold text-emerald-600 mb-4 text-base uppercase tracking-wide">Total Income</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Sales Revenue</span>
                                            <span className="font-medium">₹24,50,000</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Other Income</span>
                                            <span className="font-medium">₹15,000</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t border-border/50 pt-3 mt-2 text-foreground">
                                            <span>Total Income (A)</span>
                                            <span>₹24,65,000</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expenses Section */}
                                <div className="p-6 border-b border-border/50">
                                    <h3 className="font-semibold text-rose-600 mb-4 text-base uppercase tracking-wide">Total Expenses</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Purchase Cost (COGS)</span>
                                            <span className="font-medium">₹12,50,000</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Operating Expenses</span>
                                            <span className="font-medium">₹3,20,000</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Employee Salaries</span>
                                            <span className="font-medium">₹5,50,000</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t border-border/50 pt-3 mt-2 text-foreground">
                                            <span>Total Expenses (B)</span>
                                            <span>₹21,20,000</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Profit Section */}
                                <div className="p-6 bg-emerald-50/30 rounded-b-xl">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">Net Profit</h3>
                                            <p className="text-sm text-muted-foreground">(A - B)</p>
                                        </div>
                                        <div className="text-2xl font-bold text-emerald-600">
                                            ₹3,45,000
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Balance Sheet Content */}
                <TabsContent value="bs">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/50">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold">Balance Sheet</CardTitle>
                                <span className="text-sm text-muted-foreground">As of Mar 31, 2025</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Liabilities */}
                                <div>
                                    <h3 className="font-semibold text-base uppercase tracking-wide mb-4 border-b border-border/50 pb-2 text-foreground">Liabilities</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Capital Account</span>
                                            <span className="font-medium">₹10,00,000</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Loans (Liability)</span>
                                            <span className="font-medium">₹5,00,000</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Current Liabilities</span>
                                            <span className="font-medium">₹2,50,000</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t border-border/50 pt-3 mt-4 text-lg text-foreground">
                                            <span>Total</span>
                                            <span>₹17,50,000</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Assets */}
                                <div>
                                    <h3 className="font-semibold text-base uppercase tracking-wide mb-4 border-b border-border/50 pb-2 text-foreground">Assets</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fixed Assets</span>
                                            <span className="font-medium">₹8,00,000</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Current Assets</span>
                                            <span className="font-medium">₹6,00,000</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cash & Bank</span>
                                            <span className="font-medium">₹3,50,000</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t border-border/50 pt-3 mt-4 text-lg text-foreground">
                                            <span>Total</span>
                                            <span>₹17,50,000</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
