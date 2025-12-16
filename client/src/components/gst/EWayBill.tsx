import { useState } from "react";
import { Search, Plus, Download, Eye, Edit, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface EWayBillData {
  id: string;
  ewbNumber: string;
  date: string;
  invoiceNumber: string;
  customerName: string;
  fromState: string;
  toState: string;
  distance: number;
  vehicleNumber: string;
  transportMode: string;
  amount: number;
  status: "active" | "expired" | "cancelled";
  validUpto: string;
}

export function EWayBill() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock e-way bill data
  const ewayBills: EWayBillData[] = [
    {
      id: "1",
      ewbNumber: "351234567890",
      date: "2024-11-22",
      invoiceNumber: "INV-2024-045",
      customerName: "Sharma Traders Pvt Ltd",
      fromState: "Maharashtra",
      toState: "Gujarat",
      distance: 450,
      vehicleNumber: "MH12AB1234",
      transportMode: "Road",
      amount: 245600,
      status: "active",
      validUpto: "2024-11-25",
    },
    {
      id: "2",
      ewbNumber: "351234567891",
      date: "2024-11-20",
      invoiceNumber: "INV-2024-043",
      customerName: "Patel Distributors",
      fromState: "Maharashtra",
      toState: "Rajasthan",
      distance: 780,
      vehicleNumber: "MH14CD5678",
      transportMode: "Road",
      amount: 567800,
      status: "active",
      validUpto: "2024-11-27",
    },
    {
      id: "3",
      ewbNumber: "351234567892",
      date: "2024-11-15",
      invoiceNumber: "INV-2024-040",
      customerName: "Kumar Enterprises",
      fromState: "Maharashtra",
      toState: "Karnataka",
      distance: 850,
      vehicleNumber: "MH02EF9012",
      transportMode: "Road",
      amount: 456700,
      status: "expired",
      validUpto: "2024-11-18",
    },
    {
      id: "4",
      ewbNumber: "351234567893",
      date: "2024-11-18",
      invoiceNumber: "INV-2024-041",
      customerName: "Reddy Industries Ltd",
      fromState: "Maharashtra",
      toState: "Telangana",
      distance: 680,
      vehicleNumber: "MH20GH3456",
      transportMode: "Road",
      amount: 678900,
      status: "cancelled",
      validUpto: "2024-11-21",
    },
  ];

  const filteredBills = ewayBills.filter((bill) => {
    const matchesSearch =
      bill.ewbNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalActive = ewayBills.filter((b) => b.status === "active").length;
  const totalExpired = ewayBills.filter((b) => b.status === "expired").length;
  const totalValue = ewayBills.reduce((sum, b) => sum + b.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]";
      case "expired":
        return "bg-[#fef3c7] text-[#92400e] border-[#fde68a]";
      case "cancelled":
        return "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="size-3" />;
      case "expired":
        return <Clock className="size-3" />;
      case "cancelled":
        return <XCircle className="size-3" />;
      default:
        return null;
    }
  };

  const handleGenerateEWay = () => {
    toast.info("E-Way Bill generation form will open");
  };

  const handleCancelBill = (ewbNumber: string) => {
    toast.success(`E-Way Bill ${ewbNumber} cancelled successfully`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-foreground mb-1">E-Way Bills</h2>
            <p className="text-muted-foreground">
              Generate and manage e-way bills for goods transportation
            </p>
          </div>
          <Button onClick={handleGenerateEWay} className="gap-2 bg-primary">
            <Plus className="size-4" />
            Generate E-Way Bill
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-primary text-white rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="size-5" />
            <p className="opacity-90">Total E-Way Bills</p>
          </div>
          <h3 className="text-2xl">{ewayBills.length}</h3>
        </div>

        <div className="bg-success text-white rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="size-5" />
            <p className="opacity-90">Active</p>
          </div>
          <h3 className="text-2xl">{totalActive}</h3>
        </div>

        <div className="bg-warning text-white rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-5" />
            <p className="opacity-90">Expired</p>
          </div>
          <h3 className="text-2xl">{totalExpired}</h3>
        </div>

        <div className="bg-purple text-white rounded-xl p-5">
          <p className="opacity-90 mb-2">Total Value</p>
          <h3 className="text-2xl">₹{(totalValue / 100000).toFixed(1)}L</h3>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by EWB number, invoice number, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* E-Way Bills Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-muted-foreground">EWB Number</th>
                <th className="text-left px-6 py-4 text-muted-foreground">Invoice</th>
                <th className="text-left px-6 py-4 text-muted-foreground">Customer</th>
                <th className="text-left px-6 py-4 text-muted-foreground">Route</th>
                <th className="text-left px-6 py-4 text-muted-foreground">Vehicle</th>
                <th className="text-right px-6 py-4 text-muted-foreground">Amount</th>
                <th className="text-left px-6 py-4 text-muted-foreground">Valid Upto</th>
                <th className="text-center px-6 py-4 text-muted-foreground">Status</th>
                <th className="text-center px-6 py-4 text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill, index) => (
                <tr
                  key={bill.id}
                  className={cn(
                    "border-b border-border hover:bg-[#f8fafc] transition-colors",
                    index === filteredBills.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-6 py-4">
                    <p className="text-foreground">{bill.ewbNumber}</p>
                    <p className="text-muted-foreground">
                      {new Date(bill.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground">{bill.invoiceNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground">{bill.customerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground">
                      {bill.fromState} → {bill.toState}
                    </p>
                    <p className="text-muted-foreground">{bill.distance} km</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground">{bill.vehicleNumber}</p>
                    <p className="text-muted-foreground">{bill.transportMode}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-foreground">
                      ₹{bill.amount.toLocaleString("en-IN")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground">
                      {new Date(bill.validUpto).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <Badge
                        variant="outline"
                        className={cn("gap-1", getStatusColor(bill.status))}
                      >
                        {getStatusIcon(bill.status)}
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="size-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="size-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="size-4 mr-2" />
                            Update Vehicle
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Truck className="size-4 mr-2" />
                            Extend Validity
                          </DropdownMenuItem>
                          {bill.status === "active" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleCancelBill(bill.ewbNumber)}
                            >
                              <XCircle className="size-4 mr-2" />
                              Cancel EWB
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* E-Way Bill Requirements */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="text-foreground mb-4">E-Way Bill Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-foreground">When is E-Way Bill Required?</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-[#10b981]">✓</span>
                <span>For movement of goods worth more than ₹50,000</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#10b981]">✓</span>
                <span>For inter-state movement of goods</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#10b981]">✓</span>
                <span>For intra-state movement in some states</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#10b981]">✓</span>
                <span>For import/export of goods</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-foreground">Validity Period</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-[#2563eb]">•</span>
                <span>Less than 100 km: 1 day</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#2563eb]">•</span>
                <span>100-300 km: 3 days</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#2563eb]">•</span>
                <span>300-500 km: 5 days</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#2563eb]">•</span>
                <span>More than 1000 km: 15 days</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-[#dbeafe] border border-[#93c5fd] rounded-xl p-6">
        <div className="flex gap-3">
          <Truck className="size-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-foreground mb-2">Important Information</h4>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>E-Way Bill must be generated before commencement of movement of goods</li>
              <li>Vehicle number can be updated during transit if required</li>
              <li>Validity can be extended before expiry in case of transit delay</li>
              <li>Penalty for non-compliance: 100% of tax due or ₹10,000, whichever is higher</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

