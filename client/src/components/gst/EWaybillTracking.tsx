import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  MoreVertical,
  Edit,
  AlertCircle,
  Navigation,
  Package,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils";
import { gstService } from "../../services/modules.service";
import { toast } from "sonner";

interface EWaybill {
  id: string;
  ewaybillNumber?: string;
  documentNumber: string;
  documentType: string;
  fromGstin: string;
  fromPlace: string;
  toGstin: string;
  toPlace: string;
  vehicleNumber?: string;
  vehicleType?: string;
  distance: number;
  value: number;
  status: string;
  validUpto?: string;
  createdAt: string;
  errorMessage?: string;
}

export function EWaybillTracking() {
  const [loading, setLoading] = useState(true);
  const [ewaybills, setEWaybills] = useState<EWaybill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEWB, setSelectedEWB] = useState<EWaybill | null>(null);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Form state for creating e-waybill
  const [formData, setFormData] = useState({
    documentType: "",
    documentNumber: "",
    fromGstin: "",
    toGstin: "",
    fromPlace: "",
    toPlace: "",
    vehicleNumber: "",
    vehicleType: "Regular",
    distance: "",
    value: "",
    transactionType: "Outward",
    supplyType: "Outward Supply",
  });

  const fetchEWaybills = async () => {
    setLoading(true);
    try {
      const response = await gstService.getEWaybills();
      if (response.success && response.data) {
        setEWaybills(response.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch e-waybills:", error);
      toast.error("Failed to load e-waybills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEWaybills();
  }, []);

  const handleCreateEWaybill = async () => {
    setCreateLoading(true);
    try {
      const response = await gstService.createEWaybill({
        ...formData,
        distance: Number(formData.distance),
        value: Number(formData.value),
      });
      if (response.success) {
        toast.success("E-Waybill creation initiated");
        setIsCreateDialogOpen(false);
        setFormData({
          documentType: "",
          documentNumber: "",
          fromGstin: "",
          toGstin: "",
          fromPlace: "",
          toPlace: "",
          vehicleNumber: "",
          vehicleType: "Regular",
          distance: "",
          value: "",
          transactionType: "Outward",
          supplyType: "Outward Supply",
        });
        fetchEWaybills();
      } else {
        toast.error(response.message || "Failed to create e-waybill");
      }
    } catch (error) {
      console.error("Failed to create e-waybill:", error);
      toast.error("Failed to create e-waybill");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCancelEWaybill = async (ewb: EWaybill) => {
    try {
      const response = await gstService.cancelEWaybill(ewb.id, "Cancelled by user");
      if (response.success) {
        toast.success("E-Waybill cancelled successfully");
        fetchEWaybills();
      } else {
        toast.error(response.message || "Failed to cancel e-waybill");
      }
    } catch (error) {
      console.error("Failed to cancel e-waybill:", error);
      toast.error("Failed to cancel e-waybill");
    }
  };

  const filteredEWaybills = ewaybills.filter((ewb) => {
    const matchesSearch =
      (ewb.ewaybillNumber && ewb.ewaybillNumber.includes(searchQuery)) ||
      ewb.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ewb.vehicleNumber && ewb.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const normalizedStatus = ewb.status.charAt(0).toUpperCase() + ewb.status.slice(1).toLowerCase();
    const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "expired":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "active":
        return <Truck className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "expired":
        return <Clock className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handleTrackEWaybill = (ewb: EWaybill) => {
    setSelectedEWB(ewb);
    setIsTrackingDialogOpen(true);
  };

  const stats = {
    total: ewaybills.length,
    active: ewaybills.filter((e) => e.status.toLowerCase() === "active").length,
    completed: ewaybills.filter((e) => e.status.toLowerCase() === "completed").length,
    expired: ewaybills.filter((e) => e.status.toLowerCase() === "expired").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Truck className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">E-Waybill Management</h2>
              <p className="text-muted-foreground text-sm">
                Generate, manage, and track E-Waybills for goods movement
              </p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-10">
                <Plus className="size-4" />
                Generate E-Waybill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate E-Waybill</DialogTitle>
                <DialogDescription>
                  Create a new E-Waybill for goods transportation
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label>Document Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Tax Invoice</SelectItem>
                      <SelectItem value="bill">Bill of Supply</SelectItem>
                      <SelectItem value="challan">Delivery Challan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Document Number *</Label>
                  <Input placeholder="INV-2024-001" />
                </div>
                <div className="space-y-2">
                  <Label>Document Date *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>From GSTIN *</Label>
                  <Input placeholder="27AABCU9603R1ZM" />
                </div>
                <div className="space-y-2">
                  <Label>To GSTIN *</Label>
                  <Input placeholder="07AABCP1234F1Z5" />
                </div>
                <div className="space-y-2">
                  <Label>From Place *</Label>
                  <Input placeholder="City, State" />
                </div>
                <div className="space-y-2">
                  <Label>To Place *</Label>
                  <Input placeholder="City, State" />
                </div>
                <div className="space-y-2">
                  <Label>Transport Mode *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="road">Road</SelectItem>
                      <SelectItem value="rail">Rail</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="ship">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Input placeholder="MH-01-AB-1234" />
                </div>
                <div className="space-y-2">
                  <Label>Distance (km) *</Label>
                  <Input type="number" placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label>Total Value (₹) *</Label>
                  <Input type="number" placeholder="50000" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Generate E-Waybill
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <Package className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Total E-Waybills</p>
          <h3 className="text-2xl font-bold text-foreground">{stats.total}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-50 p-2.5 rounded-lg">
              <Truck className="size-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Active</p>
          <h3 className="text-2xl font-bold text-emerald-600">{stats.active}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <CheckCircle className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Completed</p>
          <h3 className="text-2xl font-bold text-blue-600">{stats.completed}</h3>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-50 p-2.5 rounded-lg">
              <Clock className="size-5 text-amber-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Expired</p>
          <h3 className="text-2xl font-bold text-amber-600">{stats.expired}</h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-900 font-medium mb-1">E-Waybill Requirements</p>
              <p className="text-blue-700">
                E-Waybill is mandatory for movement of goods worth &gt; ₹50,000. Validity depends on distance: 1 day for up to 200 km, additional day for every 200 km.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by E-Waybill number, document, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All E-Waybills
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Active")}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Completed")}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Expired")}>
                  Expired
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Cancelled")}>
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="h-10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* E-Waybills Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-muted/30 border-b border-border/50">
                <TableHead className="font-medium text-muted-foreground">E-Waybill No.</TableHead>
                <TableHead className="font-medium text-muted-foreground">Document</TableHead>
                <TableHead className="font-medium text-muted-foreground">Route</TableHead>
                <TableHead className="font-medium text-muted-foreground">Vehicle</TableHead>
                <TableHead className="font-medium text-muted-foreground">Distance</TableHead>
                <TableHead className="font-medium text-muted-foreground">Value</TableHead>
                <TableHead className="font-medium text-muted-foreground">Valid Until</TableHead>
                <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-medium text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEWaybills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No e-waybills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEWaybills.map((ewb) => (
                  <TableRow key={ewb.id} className="hover:bg-muted/20 border-b border-border/50">
                    <TableCell className="font-mono font-medium text-foreground">
                      {ewb.ewaybillNumber || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-foreground">{ewb.documentNumber}</div>
                        <div className="text-muted-foreground text-xs">
                          {ewb.documentType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-xs mb-1">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          <span className="truncate max-w-[120px] text-foreground">{ewb.fromPlace}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-rose-600" />
                          <span className="truncate max-w-[120px] text-foreground">{ewb.toPlace}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ewb.vehicleNumber ? (
                        <div className="text-sm">
                          <div className="font-mono text-foreground">{ewb.vehicleNumber}</div>
                          <div className="text-muted-foreground text-xs">
                            {ewb.vehicleType || 'Road'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">{ewb.distance} km</TableCell>
                    <TableCell className="text-foreground">₹{Number(ewb.value).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      {ewb.validUpto ? (
                        <>
                          <div className="text-sm text-foreground">
                            {new Date(ewb.validUpto).toLocaleDateString("en-IN")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ewb.validUpto).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1", getStatusColor(ewb.status))}>
                        {getStatusIcon(ewb.status)}
                        {ewb.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTrackEWaybill(ewb)}>
                            <Navigation className="h-4 w-4 mr-2" />
                            Track Shipment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {ewb.status.toLowerCase() === "active" && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Update Vehicle
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          {ewb.status.toLowerCase() === "active" && (
                            <DropdownMenuItem className="text-rose-600 focus:text-rose-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel E-Waybill
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Tracking Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Track E-Waybill Shipment</DialogTitle>
            <DialogDescription>
              Real-time tracking and status updates for E-Waybill: {selectedEWB?.ewaybillNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedEWB && (
            <div className="space-y-6">
              {/* Route Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">From</Label>
                  <div className="font-medium mt-1">{selectedEWB.fromPlace}</div>
                  <div className="text-xs text-muted-foreground">{selectedEWB.fromGstin}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">To</Label>
                  <div className="font-medium mt-1">{selectedEWB.toPlace}</div>
                  <div className="text-xs text-muted-foreground">{selectedEWB.toGstin}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Vehicle</Label>
                  <div className="font-medium font-mono mt-1">{selectedEWB.vehicleNumber || "N/A"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Distance</Label>
                  <div className="font-medium mt-1">{selectedEWB.distance} km</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Value</Label>
                  <div className="font-medium mt-1">₹{Number(selectedEWB.value).toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={cn("gap-1", getStatusColor(selectedEWB.status))}>
                      {getStatusIcon(selectedEWB.status)}
                      {selectedEWB.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* No tracking updates available */}
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-border border-dashed">
                <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tracking details will be available once the e-waybill is generated on the NIC portal</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}