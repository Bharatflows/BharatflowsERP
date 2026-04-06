import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
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
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);
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

interface ProductionPlan {
  id: string;
  planNumber: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  workOrders: any[];
  createdAt: string;
}

export function ProductionPlanning() {
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await productionService.getProductionPlans();
      if (response.success) {
        setPlans(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch production plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Name and dates are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await productionService.createProductionPlan(formData);
      if (response.success) {
        toast.success("Production plan created");
        setIsDialogOpen(false);
        fetchPlans();
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-slate-500 text-white";
      case "APPROVED": return "bg-blue-600 text-white";
      case "IN_PROGRESS": return "bg-orange-500 text-white";
      case "COMPLETED": return "bg-emerald-600 text-white";
      case "CANCELLED": return "bg-rose-600 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  return (
    <div className="space-y-[24px] animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Production Planning</h2>
          <p className="text-body-sm font-medium text-muted-foreground mt-[4px]">Schedule and manage production runs and timelines.</p>
        </div>
        <div className="flex gap-[12px]">
          <Button variant="outline" size="sm" onClick={fetchPlans} disabled={loading} className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
            <MIcon name="sync" className={`text-[18px] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="gap-[8px] h-[40px] px-[24px] rounded-[8px] font-bold" onClick={() => setIsDialogOpen(true)}>
            <MIcon name="add" className="text-[20px]" />
            Create Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
        <Card className="p-[24px] flex items-center gap-[16px] border border-border shadow-sm rounded-[16px] bg-card">
          <div className="p-[12px] bg-blue-50 dark:bg-blue-900/20 rounded-[12px]">
            <MIcon name="event" className="text-[28px] text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Active Plans</p>
            <p className="text-3xl font-bold text-foreground">
              {plans.filter(p => p.status === 'IN_PROGRESS' || p.status === 'APPROVED').length}
            </p>
          </div>
        </Card>
        <Card className="p-[24px] flex items-center gap-[16px] border border-border shadow-sm rounded-[16px] bg-card">
          <div className="p-[12px] bg-emerald-50 dark:bg-emerald-900/20 rounded-[12px]">
            <MIcon name="rule" className="text-[28px] text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Total Work Orders</p>
            <p className="text-3xl font-bold text-foreground">
              {plans.reduce((sum, p) => sum + (p.workOrders?.length || 0), 0)}
            </p>
          </div>
        </Card>
        <Card className="p-[24px] flex items-center gap-[16px] border border-border shadow-sm rounded-[16px] bg-card">
          <div className="p-[12px] bg-amber-50 dark:bg-amber-900/20 rounded-[12px]">
            <MIcon name="schedule" className="text-[28px] text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Draft Plans</p>
            <p className="text-3xl font-bold text-foreground">
              {plans.filter(p => p.status === 'DRAFT').length}
            </p>
          </div>
        </Card>
      </div>

      <Card className="border border-border shadow-sm bg-card rounded-[16px]">
        <CardContent className="p-[24px]">
          {loading ? (
            <div className="flex items-center justify-center p-[48px]">
              <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[48px] text-muted-foreground">
              <MIcon name="event" className="text-[48px] mb-[16px] opacity-20" />
              <p className="font-medium text-body">No production plans found</p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)} className="mt-[8px] font-bold">
                Create your first production plan
              </Button>
            </div>
          ) : (
            <div className="rounded-[12px] border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted dark:bg-slate-950">
                  <TableRow className="border-b border-border">
                    <TableHead className="font-bold text-foreground dark:text-muted-foreground">Plan #</TableHead>
                    <TableHead className="font-bold text-foreground dark:text-muted-foreground">Plan Name</TableHead>
                    <TableHead className="font-bold text-foreground dark:text-muted-foreground">Period</TableHead>
                    <TableHead className="font-bold text-foreground dark:text-muted-foreground">Work Orders</TableHead>
                    <TableHead className="font-bold text-foreground dark:text-muted-foreground">Status</TableHead>
                    <TableHead className="font-bold text-foreground dark:text-muted-foreground text-right">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} className="border-b border-border">
                      <TableCell className="font-bold text-foreground">{plan.planNumber}</TableCell>
                      <TableCell className="font-medium text-foreground dark:text-muted-foreground">{plan.name}</TableCell>
                      <TableCell className="text-body-sm text-muted-foreground font-medium">
                        {new Date(plan.startDate).toLocaleDateString("en-IN")} - {new Date(plan.endDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-foreground dark:text-muted-foreground font-medium">{plan.workOrders?.length || 0} orders</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(plan.status)} border-0 font-bold text-[11px] rounded-[4px]`}>
                          {plan.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-medium text-body-sm">
                        {new Date(plan.createdAt).toLocaleDateString("en-IN")}
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
        <DialogContent className="max-w-lg sm:rounded-[16px] p-[24px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Create Production Plan</DialogTitle>
            <DialogDescription className="text-body-sm font-medium text-muted-foreground mt-[4px]">
              Define a new timeframe for production activities.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-[24px] py-[16px]">
            <div className="space-y-[8px]">
              <Label className="text-body-sm font-bold text-foreground">Plan Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q1 Production Run"
                className="h-[44px] rounded-[8px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-[16px]">
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="h-[44px] rounded-[8px]"
                />
              </div>
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="h-[44px] rounded-[8px]"
                />
              </div>
            </div>

            <div className="space-y-[8px]">
              <Label className="text-body-sm font-bold text-foreground">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-[44px] rounded-[8px] bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-[8px]">
              <Label className="text-body-sm font-bold text-foreground">Description</Label>
              <Textarea
                placeholder="Plan details, scope, or objectives..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[120px] rounded-[12px] border-slate-200"
              />
            </div>
          </div>

          <DialogFooter className="mt-[24px]">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting} className="rounded-[8px] h-[40px] px-[24px] font-bold border-border">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-[8px] h-[40px] px-[24px] font-bold">
              {submitting ? (
                <>
                  <MIcon name="sync" className="mr-[8px] text-[18px] animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
