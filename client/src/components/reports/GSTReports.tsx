import { useState } from "react";
import { Download, Filter, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function GSTReports() {
  const [period, setPeriod] = useState("Nov 2024");

  return (
    <div className="p-6 space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">GST Reports</h2>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
            <Calendar className="size-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{period}</span>
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" /> Export All
            </Button>
        </div>
      </div>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Output Tax (Sales)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹37,890</div>
            <div className="text-xs text-muted-foreground mt-1 grid grid-cols-2 gap-2">
                <span>CGST: ₹18,945</span>
                <span>SGST: ₹18,945</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Input Tax Credit (Purchases)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹24,500</div>
             <div className="text-xs text-muted-foreground mt-1 grid grid-cols-2 gap-2">
                <span>CGST: ₹12,250</span>
                <span>SGST: ₹12,250</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹13,390</div>
            <p className="text-xs text-muted-foreground mt-1">Due by 20th Dec</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
            <CardHeader>
                <CardTitle>GSTR-1 Summary (Outward)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">B2B Invoices</span>
                    <span className="font-medium">₹25,400</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">B2C Large Invoices</span>
                    <span className="font-medium">₹8,200</span>
                </div>
                 <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">B2C Small Invoices</span>
                    <span className="font-medium">₹4,290</span>
                </div>
                 <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">Total Tax Liability</span>
                    <span className="font-bold text-blue-600">₹37,890</span>
                </div>
                 <Button className="w-full mt-2" variant="secondary">View Detailed GSTR-1 Report</Button>
            </CardContent>
        </Card>

        <Card className="border-border">
            <CardHeader>
                <CardTitle>GSTR-3B Summary (Monthly)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">Total Outward Supplies</span>
                    <span className="font-medium">₹2,10,500</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">Eligible ITC</span>
                    <span className="font-medium text-green-600">₹24,500</span>
                </div>
                 <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm">Reverse Charge Tax</span>
                    <span className="font-medium">₹0</span>
                </div>
                 <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">Net Tax Payable</span>
                    <span className="font-bold text-red-600">₹13,390</span>
                </div>
                <Button className="w-full mt-2" variant="secondary">View Detailed GSTR-3B Report</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
