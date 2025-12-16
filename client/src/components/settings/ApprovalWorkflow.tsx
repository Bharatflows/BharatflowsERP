import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
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
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  GitBranch,
  CheckCircle,
  XCircle,
  User,
  FileText,
  ShoppingCart,
  IndianRupee,
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
import { Switch } from "../ui/switch";
import { settingsService } from "../../services/modules.service";
import { toast } from "sonner";

interface Workflow {
  id: string;
  name: string;
  documentType: string;
  minAmount?: number;
  maxAmount?: number;
  approvers: string[];
  conditions: any;
  isActive: boolean;
  createdAt: string;
}

const documentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Sales Invoice": FileText,
  Invoice: FileText,
  "Purchase Order": ShoppingCart,
  "Purchase Bill": FileText,
  Expense: IndianRupee,
  Payment: IndianRupee,
};

export function ApprovalWorkflow() {
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    documentType: "",
    minAmount: "",
    maxAmount: "",
    approvers: [] as string[],
    isActive: true,
  });

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getWorkflows();
      if (response.success && response.data) {
        setWorkflows(response.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await settingsService.toggleWorkflow(id);
      if (response.success) {
        toast.success(response.message || "Workflow status updated");
        fetchWorkflows();
      } else {
        toast.error(response.message || "Failed to update workflow status");
      }
    } catch (error) {
      console.error("Failed to toggle workflow status:", error);
      toast.error("Failed to update workflow status");
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const response = await settingsService.deleteWorkflow(id);
      if (response.success) {
        toast.success("Workflow deleted successfully");
        fetchWorkflows();
      } else {
        toast.error("Failed to delete workflow");
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      toast.error("Failed to delete workflow");
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name || !newWorkflow.documentType) {
      toast.error("Name and document type are required");
      return;
    }

    setCreatingWorkflow(true);
    try {
      const response = await settingsService.createWorkflow({
        name: newWorkflow.name,
        documentType: newWorkflow.documentType,
        minAmount: newWorkflow.minAmount ? Number(newWorkflow.minAmount) : 0,
        maxAmount: newWorkflow.maxAmount ? Number(newWorkflow.maxAmount) : undefined,
        approvers: newWorkflow.approvers,
        isActive: newWorkflow.isActive,
      });
      if (response.success) {
        toast.success("Workflow created successfully");
        setNewWorkflow({
          name: "",
          documentType: "",
          minAmount: "",
          maxAmount: "",
          approvers: [],
          isActive: true,
        });
        setIsCreateDialogOpen(false);
        fetchWorkflows();
      } else {
        toast.error(response.message || "Failed to create workflow");
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
      toast.error("Failed to create workflow");
    } finally {
      setCreatingWorkflow(false);
    }
  };

  const getDocumentIcon = (type: string) => {
    const Icon = documentIcons[type] || FileText;
    return <Icon className="h-4 w-4 text-white" />;
  };

  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.isActive).length,
    inactive: workflows.filter((w) => !w.isActive).length,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">Approval Workflows</h2>
          <p className="text-muted-foreground text-sm">
            Configure multi-level approval processes for documents and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchWorkflows} className="gap-2">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Approval Workflow</DialogTitle>
                <DialogDescription>
                  Set up a new approval workflow for documents
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Workflow Name *</Label>
                    <Input
                      placeholder="e.g., High Value Purchase Approval"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Document Type *</Label>
                    <Select
                      value={newWorkflow.documentType}
                      onValueChange={(value) => setNewWorkflow({ ...newWorkflow, documentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Invoice">Sales Invoice</SelectItem>
                        <SelectItem value="Purchase Order">Purchase Order</SelectItem>
                        <SelectItem value="Purchase Bill">Purchase Bill</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                        <SelectItem value="Payment">Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newWorkflow.minAmount}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, minAmount: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Maximum Amount (₹) - Optional</Label>
                    <Input
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={newWorkflow.maxAmount}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, maxAmount: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Workflow triggers when document amount is within this range
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable this workflow immediately
                    </p>
                  </div>
                  <Switch
                    checked={newWorkflow.isActive}
                    onCheckedChange={(checked) => setNewWorkflow({ ...newWorkflow, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary"
                  onClick={handleCreateWorkflow}
                  disabled={!newWorkflow.name || !newWorkflow.documentType || creatingWorkflow}
                >
                  {creatingWorkflow && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Create Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Total Workflows</div>
                <div className="text-2xl font-semibold text-foreground">{stats.total}</div>
              </div>
              <div className="bg-primary p-3 rounded-xl">
                <GitBranch className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Active Workflows</div>
                <div className="text-2xl font-semibold text-success">{stats.active}</div>
              </div>
              <div className="bg-success p-3 rounded-xl">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Inactive Workflows</div>
                <div className="text-2xl font-semibold text-error">{stats.inactive}</div>
              </div>
              <div className="bg-error p-3 rounded-xl">
                <XCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-foreground mb-2">No Approval Workflows</h3>
            <p className="text-muted-foreground mb-4">
              Create your first approval workflow to streamline document approvals
            </p>
            <Button className="bg-primary" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary p-3 rounded-xl">
                      {getDocumentIcon(workflow.documentType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            workflow.isActive
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }
                        >
                          {workflow.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {workflow.documentType}
                        </span>
                        {(workflow.minAmount !== undefined || workflow.maxAmount !== undefined) && (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {workflow.minAmount !== undefined && workflow.minAmount > 0
                              ? `₹${workflow.minAmount.toLocaleString("en-IN")}`
                              : "₹0"}
                            {workflow.maxAmount !== undefined
                              ? ` - ₹${workflow.maxAmount.toLocaleString("en-IN")}`
                              : "+"}
                          </span>
                        )}
                        {workflow.approvers && workflow.approvers.length > 0 && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {workflow.approvers.length} Approver{workflow.approvers.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStatus(workflow.id)}>
                        {workflow.isActive ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Workflow
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
