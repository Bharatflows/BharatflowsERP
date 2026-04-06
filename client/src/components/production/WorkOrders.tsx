import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Plus, Loader2, RefreshCw, Calendar as CalendarIcon, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { productionService } from "@/services/modules.service";
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

interface WorkOrder {
  id: string;
  orderNumber: string;
  productName: string;
  plannedQty: number;
  completedQty: number;
  status: string;
  priority: string;
  progress: number;
  startDate?: string;
  dueDate?: string;
}

interface BOM {
  id: string;
  name: string;
  code: string;
  finishedProduct: {
    name: string;
  };
}

export function WorkOrders() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bomId: "",
    plannedQty: "",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
    notes: "",
  });

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const response = await productionService.getWorkOrders();
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch work orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchBOMs = async () => {
    try {
      const response = await productionService.getBOMs();
      if (response.success && response.data) {
        setBoms(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch BOMs");
    }
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchBOMs();
  }, []);

  const handleSubmit = async () => {
    if (!formData.bomId || !formData.plannedQty) {
      toast.error("BOM and planned quantity are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await productionService.createWorkOrder({
        ...formData,
        plannedQty: parseInt(formData.plannedQty),
      });

      if (response.success) {
        toast.success("Work order created successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchWorkOrders();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create work order");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bomId: "",
      plannedQty: "",
      priority: "MEDIUM",
      startDate: "",
      dueDate: "",
      notes: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS": return "bg-primary text-white";
      case "PENDING": return "bg-warning text-white";
      case "COMPLETED": return "bg-success text-white";
      case "CANCELLED": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "text-red-600";
      case "HIGH": return "text-orange-600";
      case "MEDIUM": return "text-yellow-600";
      case "LOW": return "text-green-600";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Work Orders</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchWorkOrders} disabled={loading}>
              <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="size-4" />
              Create Work Order
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="size-12 mb-4 opacity-20" />
            <p>No work orders found</p>
            <Button variant="link" onClick={() => setIsDialogOpen(true)}>
              Create your first work order
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="hidden md:table-cell">Start Date</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-foreground font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.productName}</TableCell>
                    <TableCell>{order.completedQty} / {order.plannedQty} units</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {order.startDate ? new Date(order.startDate).toLocaleDateString("en-IN") : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {order.dueDate ? new Date(order.dueDate).toLocaleDateString("en-IN") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-accent rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground">{order.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
            <DialogDescription>
              Assign a new production task based on an existing Bill of Materials.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Bill of Materials (BOM) *</Label>
              <Select
                value={formData.bomId}
                onValueChange={(value) => setFormData({ ...formData, bomId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a BOM" />
                </SelectTrigger>
                <SelectContent>
                  {boms.map((bom) => (
                    <SelectItem key={bom.id} value={bom.id}>
                      {bom.name} ({bom.finishedProduct.name})
                    </SelectItem>
                  ))}
                  {boms.length === 0 && (
                    <div className="p-2 text-sm text-center text-muted-foreground">
                      No BOMs found. Create one first.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Planned Quantity *</Label>
                <Input
                  type="number"
                  value={formData.plannedQty}
                  onChange={(e) => setFormData({ ...formData, plannedQty: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional instructions..."
                rows={3}
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
                  Creating...
                </>
              ) : (
                "Create Work Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
