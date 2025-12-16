import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { RefreshCw, Loader2, GripVertical, DollarSign, User, Calendar, Phone, Mail } from "lucide-react";
import { crmService } from "@/services/modules.service";
import { toast } from "sonner";

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

const PIPELINE_STAGES = [
  { id: "NEW", label: "New", color: "bg-blue-500" },
  { id: "CONTACTED", label: "Contacted", color: "bg-yellow-500" },
  { id: "QUALIFIED", label: "Qualified", color: "bg-purple-500" },
  { id: "PROPOSAL", label: "Proposal", color: "bg-orange-500" },
  { id: "NEGOTIATION", label: "Negotiation", color: "bg-cyan-500" },
  { id: "WON", label: "Won", color: "bg-green-500" },
  { id: "LOST", label: "Lost", color: "bg-red-500" },
];

export function SalesPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

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

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.status === stageId);
  };

  const getStageValue = (stageId: string) => {
    return getLeadsByStage(stageId).reduce((sum, lead) => sum + (lead.value || 0), 0);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.status === stageId) {
      setDraggedLead(null);
      return;
    }

    try {
      await crmService.updateStatus(draggedLead.id, stageId);
      // Update local state
      setLeads(leads.map(l =>
        l.id === draggedLead.id ? { ...l, status: stageId } : l
      ));
      toast.success(`Moved "${draggedLead.name}" to ${stageId}`);
    } catch (error) {
      toast.error("Failed to update lead status");
    }
    setDraggedLead(null);
  };

  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const wonValue = getStageValue("WON");
  const activeValue = totalValue - wonValue - getStageValue("LOST");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading pipeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Drag leads between stages to update status</p>
        </div>
        <Button variant="outline" onClick={fetchLeads}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-bold">{leads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pipeline Value</p>
            <p className="text-2xl font-bold text-blue-600">₹{activeValue.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Won Value</p>
            <p className="text-2xl font-bold text-green-600">₹{wonValue.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold text-purple-600">
              {leads.length > 0 ? Math.round((getLeadsByStage("WON").length / leads.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = getLeadsByStage(stage.id);
          const stageValue = getStageValue(stage.id);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <Card className="h-full min-h-[400px]">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stageLeads.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ₹{stageValue.toLocaleString("en-IN")}
                  </p>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        className={`p-3 bg-muted/50 rounded-lg border cursor-grab hover:bg-muted transition-colors ${draggedLead?.id === lead.id ? "opacity-50" : ""
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lead.name}</p>
                            {lead.company && (
                              <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {lead.value && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ₹{lead.value.toLocaleString("en-IN")}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(lead.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

