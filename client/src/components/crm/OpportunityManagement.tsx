import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Plus, Loader2, RefreshCw, MoreVertical, Calendar, DollarSign, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { crmService } from "@/services/modules.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/constants/crm";

const STAGES = [
  { id: "NEW", label: "New", color: "bg-muted text-foreground border-slate-200" },
  { id: "CONTACTED", label: "Contacted", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "QUALIFIED", label: "Qualified", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "PROPOSAL", label: "Proposal", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "NEGOTIATION", label: "Negotiation", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "WON", label: "Closed Won", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "LOST", label: "Closed Lost", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export function OpportunityManagement() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    source: "DIRECT",
    status: "NEW",
    value: "",
    notes: ""
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await crmService.getLeads();
      if (response.success && response.data) {
        setLeads(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateStage = async (id: string, newStage: string) => {
    try {
      const response = await crmService.updateStatus(id, newStage);
      if (response.success) {
        toast.success(`Stage updated to ${newStage}`);
        fetchLeads();
      }
    } catch (error) {
      toast.error("Failed to update stage");
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    try {
      const response = await crmService.createLead(formData);
      if (response.success) {
        toast.success("Opportunity created successfully");
        setIsDialogOpen(false);
        setFormData({
          name: "",
          company: "",
          email: "",
          phone: "",
          source: "DIRECT",
          status: "NEW",
          value: "",
          notes: ""
        });
        fetchLeads();
      }
    } catch (error) {
      toast.error("Failed to create opportunity");
    }
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(l => l.status === stageId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Opportunity Pipeline</h2>
          <p className="text-muted-foreground text-sm font-medium">Track your deals and sales progression.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="size-4" />
            New Deal
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
        {STAGES.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          return (
            <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider">{stage.label}</h3>
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-2xs">
                    {stageLeads.length}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 bg-muted/50 rounded-xl border border-dashed border-slate-200 p-2 space-y-3">
                {stageLeads.map((lead) => (
                  <Card key={lead.id} className="shadow-sm hover:shadow-md transition-shadow cursor-grab border-slate-200 overflow-hidden group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{lead.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Building2 className="size-3" />
                            <span className="line-clamp-1">{lead.company || "No Company"}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 -mr-2 -mt-1 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="size-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs font-medium">View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-medium">Edit Opportunity</DropdownMenuItem>
                            <div className="h-px bg-muted my-1" />
                            <div className="px-2 py-1.5 text-2xs uppercase font-bold text-muted-foreground">Move to</div>
                            {STAGES.filter(s => s.id !== stage.id).map(s => (
                              <DropdownMenuItem
                                key={s.id}
                                className="text-xs"
                                onClick={() => updateStage(lead.id, s.id)}
                              >
                                {s.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <DollarSign className="size-3" />
                          <span>{lead.value ? parseFloat(lead.value).toLocaleString("en-IN") : "0"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-2xs text-muted-foreground font-medium">
                          <Calendar className="size-3" />
                          <span>{new Date(lead.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                      {lead.activities > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-bold text-3xs px-1.5 py-0">
                            {lead.activities} ACTIVITIES
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {stageLeads.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground opacity-40">
                    <p className="text-2xs font-bold uppercase tracking-widest">No deals</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Opportunity</DialogTitle>
            <DialogDescription>
              Enter details for the new deal or lead.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>{source.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estimated Value (₹)</Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this deal..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
