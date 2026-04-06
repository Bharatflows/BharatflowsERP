import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { crmService } from "@/services/modules.service";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/constants/crm";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  status: string;
  value?: number;
  notes?: string;
  createdAt: string;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    QUALIFIED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    PROPOSAL: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    NEGOTIATION: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    WON: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "WEBSITE",
    status: "NEW",
    value: "",
    notes: "",
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
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const leadData = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined,
      };

      if (editingLead) {
        await crmService.updateLead(editingLead.id, leadData);
        toast.success("Lead updated successfully");
      } else {
        await crmService.createLead(leadData);
        toast.success("Lead created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to save lead");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      await crmService.deleteLead(id);
      toast.success("Lead deleted successfully");
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete lead");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await crmService.updateStatus(id, status);
      toast.success("Status updated");
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source,
      status: lead.status,
      value: lead.value?.toString() || "",
      notes: lead.notes || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLead(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "WEBSITE",
      status: "NEW",
      value: "",
      notes: "",
    });
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "NEW").length,
    qualified: leads.filter((l) => l.status === "QUALIFIED").length,
    won: leads.filter((l) => l.status === "WON").length,
    totalValue: leads.reduce((sum, l) => sum + (l.value || 0), 0),
  };

  return (
    <div className="space-y-[24px] p-[24px] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lead Management</h1>
          <p className="text-body-sm font-medium text-muted-foreground mt-[4px]">Track and manage your sales leads</p>
        </div>
        <div className="flex gap-[12px]">
          <Button variant="outline" onClick={fetchLeads} disabled={loading} className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border">
            <MIcon name="sync" className={`text-[18px] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-[8px] h-[40px] px-[24px] rounded-[8px] font-bold">
            <MIcon name="add" className="text-[20px]" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[16px]">
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Total Leads</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">New</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Qualified</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.qualified}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Won</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.won}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Pipeline Value</p>
            <p className="text-3xl font-bold text-foreground">₹{stats.totalValue.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-[16px]">
        <div className="relative flex-1">
          <MIcon name="search" className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-[40px] h-[44px] rounded-[8px] bg-card border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-[44px] rounded-[8px] bg-card border-border">
            <div className="flex items-center gap-[8px]">
              <MIcon name="filter_list" className="text-[18px] text-muted-foreground" />
              <span>{statusFilter === "all" ? "All Statuses" : LEAD_STATUSES.find(s => s === statusFilter)}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card className="border border-border shadow-sm bg-card rounded-[16px] overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-[48px]">
              <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[48px] text-muted-foreground">
              <MIcon name="person_add" className="text-[48px] mb-[16px] opacity-20" />
              <p className="font-medium text-body">No leads found</p>
              <Button variant="link" onClick={() => { resetForm(); setIsDialogOpen(true); }} className="mt-[8px] font-bold">
                Add your first lead
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted dark:bg-slate-950">
                <TableRow className="border-b border-border">
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">Name</TableHead>
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">Company</TableHead>
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">Contact</TableHead>
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">Source</TableHead>
                  <TableHead className="font-bold text-foreground dark:text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right font-bold text-foreground dark:text-muted-foreground">Value</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-border">
                    <TableCell className="font-bold text-foreground">{lead.name}</TableCell>
                    <TableCell className="text-foreground dark:text-muted-foreground font-medium">{lead.company || "-"}</TableCell>
                    <TableCell>
                      <div className="space-y-[4px]">
                        {lead.email && (
                          <div className="flex items-center gap-[6px] text-body-sm text-muted-foreground font-medium">
                            <MIcon name="mail" className="text-[14px]" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-[6px] text-body-sm text-muted-foreground font-medium">
                            <MIcon name="phone" className="text-[14px]" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground dark:text-muted-foreground font-medium">{lead.source}</TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleStatusChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-[140px] h-[32px] rounded-[6px] border-slate-200 bg-white">
                          <Badge className={`${getStatusColor(lead.status)} border-0 font-bold text-[11px] rounded-[4px]`}>{lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {lead.value ? `₹${lead.value.toLocaleString("en-IN")}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-[32px] w-[32px] text-muted-foreground rounded-[8px]">
                            <MIcon name="more_vert" className="text-[20px]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-[12px] p-[8px] min-w-[160px]">
                          <DropdownMenuItem onClick={() => openEditDialog(lead)} className="gap-[8px] font-medium rounded-[6px] cursor-pointer">
                            <MIcon name="edit" className="text-[18px]" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(lead.id)}
                            className="text-red-600 focus:bg-red-50 focus:text-red-700 gap-[8px] font-medium rounded-[6px] cursor-pointer cursor-pointer"
                          >
                            <MIcon name="delete" className="text-[18px]" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg sm:rounded-[16px] p-[24px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
            <DialogDescription className="text-body-sm font-medium text-muted-foreground mt-[4px]">
              {editingLead ? "Update lead information" : "Enter details for the new lead"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-[24px] py-[16px]">
            <div className="grid grid-cols-2 gap-[16px]">
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Lead name"
                  className="h-[44px] rounded-[8px]"
                />
              </div>
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                  className="h-[44px] rounded-[8px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[16px]">
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="h-[44px] rounded-[8px]"
                />
              </div>
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="h-[44px] rounded-[8px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[16px]">
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger className="h-[44px] rounded-[8px] border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>{source.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-[8px]">
                <Label className="text-body-sm font-bold text-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-[44px] rounded-[8px] border-slate-200">
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
            <div className="space-y-[8px]">
              <Label className="text-body-sm font-bold text-foreground">Estimated Value (₹)</Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0"
                className="h-[44px] rounded-[8px]"
              />
            </div>
            <div className="space-y-[8px]">
              <Label className="text-body-sm font-bold text-foreground">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this lead..."
                rows={3}
                className="rounded-[12px] border-slate-200"
              />
            </div>
          </div>
          <DialogFooter className="mt-[24px]">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-[8px] h-[40px] px-[24px] font-bold border-border">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="rounded-[8px] h-[40px] px-[24px] font-bold">
              {editingLead ? "Update Lead" : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

