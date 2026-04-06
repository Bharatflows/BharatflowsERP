import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { crmService } from "@/services/modules.service";
import { toast } from "sonner";
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
      <div className="flex items-center justify-center p-[48px]">
        <MIcon name="sync" className="text-[32px] animate-spin text-primary" />
        <span className="ml-[12px] font-medium text-muted-foreground">Loading pipeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-[24px] animate-fade-in p-[24px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-body-sm font-medium text-muted-foreground mt-[4px]">Drag leads between stages to update status</p>
        </div>
        <Button variant="outline" onClick={fetchLeads} className="gap-[8px] h-[40px] px-[16px] rounded-[8px] font-bold border-border bg-card">
          <MIcon name="sync" className="text-[18px]" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[16px]">
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Total Leads</p>
            <p className="text-3xl font-bold text-foreground">{leads.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Pipeline Value</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{activeValue.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Won Value</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₹{wonValue.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm rounded-[16px] bg-card">
          <CardContent className="p-[20px]">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-[4px]">Win Rate</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {leads.length > 0 ? Math.round((getLeadsByStage("WON").length / leads.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-[16px] overflow-x-auto pb-[16px]">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = getLeadsByStage(stage.id);
          const stageValue = getStageValue(stage.id);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-[300px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="h-full min-h-[400px] border border-border shadow-sm rounded-[16px] bg-muted/50 flex flex-col">
                <div className="p-[16px] pb-[12px] border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                      <div className={`w-[12px] h-[12px] rounded-full ${stage.color}`} />
                      <h3 className="text-body font-bold text-foreground">{stage.label}</h3>
                    </div>
                    <Badge variant="secondary" className="font-bold text-[11px] rounded-[4px] py-0">
                      {stageLeads.length}
                    </Badge>
                  </div>
                  <p className="text-[12px] font-medium text-muted-foreground mt-[4px]">
                    ₹{stageValue.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-[12px] space-y-[12px] flex-1 overflow-y-auto min-h-[100px]">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-[32px] text-muted-foreground font-medium text-[12px]">
                      No leads in this stage
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        className={`p-[16px] bg-background rounded-[12px] border border-border shadow-sm cursor-grab hover:border-border dark:hover:border-slate-700 transition-colors ${draggedLead?.id === lead.id ? "opacity-50 border-primary" : ""
                          }`}
                      >
                        <div className="flex items-start gap-[8px]">
                          <MIcon name="drag_indicator" className="text-[18px] text-muted-foreground mt-[2px] cursor-grab shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate text-body-sm">{lead.name}</p>
                            {lead.company && (
                              <p className="text-[12px] font-medium text-muted-foreground truncate mt-[2px]">{lead.company}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-[12px] mt-[8px] text-[12px] font-medium text-muted-foreground">
                              {lead.value && (
                                <span className="flex items-center gap-[4px]">
                                  <MIcon name="attach_money" className="text-[14px]" />
                                  ₹{lead.value.toLocaleString("en-IN")}
                                </span>
                              )}
                              <span className="flex items-center gap-[4px]">
                                <MIcon name="event" className="text-[14px]" />
                                {new Date(lead.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

