import { useState, useEffect } from "react";
import { Download, Calendar, Printer, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { reportsService } from "../../services/modules.service";
import { toast } from "sonner";

export function FinancialReports() {
    const [loading, setLoading] = useState(true);
    const [pnlData, setPnlData] = useState<any>(null);
    const [balanceSheetData, setBalanceSheetData] = useState<any>(null);
    const [periodLabel, setPeriodLabel] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            // Calculate financial year start (April 1st)
            const now = new Date();
            const startYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
            const startDate = `${startYear}-04-01`;
            const endDate = now.toISOString().split('T')[0];

            setPeriodLabel(`FY ${startYear}-${(startYear + 1).toString().slice(2)}`);

            const [pnlRes, bsRes] = await Promise.all([
                reportsService.getProfitLoss({ startDate, endDate }),
                reportsService.getBalanceSheet({ asOfDate: endDate })
            ]);

            if (pnlRes.success) setPnlData(pnlRes.data);
            if (bsRes.success) setBalanceSheetData(bsRes.data);
        } catch (error) {
            console.error("Error fetching financial reports:", error);
            toast.error("Failed to load financial reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Generating financial statements...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Financial Statements</h2>
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{periodLabel}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
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
                    {!pnlData ? (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl border-border bg-muted/20">
                            <AlertCircle className="size-10 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Insufficient data to generate Profit & Loss statement</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>Try Again</Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <Card className="border-border/50 shadow-sm overflow-hidden">
                                <CardHeader className="bg-muted/30 border-b border-border/50">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg font-semibold">Profit & Loss Statement</CardTitle>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(pnlData.period.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(pnlData.period.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Income Section */}
                                    <div className="p-6 border-b border-border/50">
                                        <h3 className="font-semibold text-emerald-600 mb-4 text-base uppercase tracking-wide">Total Income</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Sales Revenue</span>
                                                <span className="font-medium">₹{pnlData.revenue.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            {/* We can expand breakdown here if the API provides it */}
                                            <div className="flex justify-between font-bold border-t border-border/50 pt-3 mt-2 text-foreground">
                                                <span>Total Income (A)</span>
                                                <span>₹{pnlData.revenue.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expenses Section */}
                                    <div className="p-6 border-b border-border/50">
                                        <h3 className="font-semibold text-rose-600 mb-4 text-base uppercase tracking-wide">Total Expenses</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Cost of Goods Sold (Purchases)</span>
                                                <span className="font-medium">₹{pnlData.costOfGoodsSold.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            {Object.entries(pnlData.operatingExpenses.breakdown).map(([category, amount]) => (
                                                <div className="flex justify-between" key={category}>
                                                    <span className="text-muted-foreground capitalize">{category} Expenses</span>
                                                    <span className="font-medium">₹{(amount as number).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-bold border-t border-border/50 pt-3 mt-2 text-foreground">
                                                <span>Total Expenses (B)</span>
                                                <span>₹{(pnlData.costOfGoodsSold + pnlData.operatingExpenses.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
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
                                            <div className={`text-2xl font-bold ${pnlData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ₹{pnlData.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* Balance Sheet Content */}
                <TabsContent value="bs">
                    {!balanceSheetData ? (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl border-border bg-muted/20">
                            <AlertCircle className="size-10 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Insufficient data to generate Balance Sheet</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>Try Again</Button>
                        </div>
                    ) : (
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg font-semibold">Balance Sheet</CardTitle>
                                    <span className="text-sm text-muted-foreground">As of {new Date(balanceSheetData.asOf).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Liabilities */}
                                    <div>
                                        <h3 className="font-semibold text-base uppercase tracking-wide mb-4 border-b border-border/50 pb-2 text-foreground">Liabilities & Equity</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Accounts Payable</span>
                                                <span className="font-medium">₹{balanceSheetData.liabilities.currentLiabilities.accountsPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Retained Earnings</span>
                                                <span className="font-medium">₹{balanceSheetData.equity.retainedEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between font-bold border-t border-border/50 pt-3 mt-4 text-lg text-foreground">
                                                <span>Total</span>
                                                <span>₹{(balanceSheetData.liabilities.totalLiabilities + balanceSheetData.equity.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assets */}
                                    <div>
                                        <h3 className="font-semibold text-base uppercase tracking-wide mb-4 border-b border-border/50 pb-2 text-foreground">Assets</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Accounts Receivable</span>
                                                <span className="font-medium">₹{balanceSheetData.assets.currentAssets.accountsReceivable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Stock-in-Hand (Inventory)</span>
                                                <span className="font-medium">₹{balanceSheetData.assets.currentAssets.inventory.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            {/* Add Cash & Bank if available in API */}
                                            <div className="flex justify-between font-bold border-t border-border/50 pt-3 mt-4 text-lg text-foreground">
                                                <span>Total</span>
                                                <span>₹{balanceSheetData.assets.totalAssets.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
