import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Plus, Loader2, RefreshCw, CheckCircle2, AlertCircle, Search, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { productionService, productsService } from "@/services/modules.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface Inspection {
  id: string;
  inspectionNumber: string;
  workOrder: { orderNumber: string };
  product: { name: string; code: string };
  totalQty: number;
  passedQty: number;
  failedQty: number;
  inspectorName: string;
  status: string;
  createdAt: string;
}

export function QualityControl() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    workOrderId: "",
    productId: "",
    totalQty: "",
    passedQty: "",
    failedQty: "0",
    inspectorName: "",
    status: "PASSED",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insRes, woRes, prodRes] = await Promise.all([
        productionService.getInspections(),
        productionService.getWorkOrders({ status: "IN_PROGRESS" }),
        productsService.getAll()
      ]);

      if (insRes.success) setInspections(insRes.data || []);
      if (woRes.success) setWorkOrders(woRes.data || []);
      if (prodRes.success) {
        const prodData = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data as any).items || [];
        setProducts(prodData);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch quality data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.productId || !formData.totalQty || !formData.passedQty) {
      toast.error("Product and quantities are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await productionService.createInspection({
        ...formData,
        totalQty: parseFloat(formData.totalQty),
        passedQty: parseFloat(formData.passedQty),
        failedQty: parseFloat(formData.failedQty),
      });

      if (response.success) {
        toast.success("Inspection record saved");
        setIsDialogOpen(false);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save inspection");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASSED": return "bg-success text-white";
      case "FAILED": return "bg-error text-white";
      case "PENDING": return "bg-amber-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quality Control</h2>
          <p className="text-muted-foreground text-sm font-medium">Manage inspections and track product quality.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="size-4" />
            New Inspection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-emerald-50/50 border-emerald-100">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Passed Rate</p>
            <p className="text-2xl font-bold text-foreground">
              {inspections.length > 0
                ? Math.round((inspections.filter(i => i.status === 'PASSED').length / inspections.length) * 100)
                : 0}%
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-rose-50/50 border-rose-100">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <AlertCircle className="size-6 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Failed Items</p>
            <p className="text-2xl font-bold text-foreground">
              {inspections.reduce((sum, i) => sum + i.failedQty, 0)}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 bg-blue-50/50 border-blue-100">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Search className="size-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Inspections</p>
            <p className="text-2xl font-bold text-foreground">{inspections.length}</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardCheck className="size-12 mb-4 opacity-20" />
              <p>No quality inspections found</p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                Record your first inspection
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inspection #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Result (Pass/Fail)</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell className="font-medium">{ins.inspectionNumber}</TableCell>
                      <TableCell>{ins.product.name}</TableCell>
                      <TableCell>{ins.workOrder?.orderNumber || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600 font-medium">{ins.passedQty}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-rose-600 font-medium">{ins.failedQty}</span>
                        </div>
                      </TableCell>
                      <TableCell>{ins.inspectorName}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ins.status)}>
                          {ins.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(ins.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Record Quality Inspection</DialogTitle>
            <DialogDescription>
              Log inspection results for a production batch.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Work Order (Optional)</Label>
                <Select
                  value={formData.workOrderId}
                  onValueChange={(val) => setFormData({ ...formData, workOrderId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Work Order" />
                  </SelectTrigger>
                  <SelectContent>
                    {workOrders.map((wo) => (
                      <SelectItem key={wo.id} value={wo.id}>{wo.orderNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(val) => setFormData({ ...formData, productId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total Qty *</Label>
                <Input
                  type="number"
                  value={formData.totalQty}
                  onChange={(e) => setFormData({ ...formData, totalQty: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Passed Qty *</Label>
                <Input
                  type="number"
                  value={formData.passedQty}
                  onChange={(e) => setFormData({ ...formData, passedQty: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Failed Qty</Label>
                <Input
                  type="number"
                  value={formData.failedQty}
                  onChange={(e) => setFormData({ ...formData, failedQty: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Inspector Name</Label>
                <Input
                  value={formData.inspectorName}
                  onChange={(e) => setFormData({ ...formData, inspectorName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Final Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Passed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Quality issues, reason for failure..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Inspection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
