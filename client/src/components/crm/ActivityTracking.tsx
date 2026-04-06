import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
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
  Plus, Phone, Mail, Calendar, FileText, Users, Clock, Loader2, RefreshCw,
  MessageSquare, Video, CheckCircle
} from "lucide-react";
import { crmService } from "@/services/modules.service";
import { toast } from "sonner";

interface Activity {
  id: string;
  leadId: string;
  type: string;
  subject: string;
  description?: string;
  date: string;
  createdAt: string;
  lead?: {
    name: string;
    company?: string;
  };
}

interface Lead {
  id: string;
  name: string;
  company?: string;
}

const ACTIVITY_TYPES = [
  { id: "CALL", label: "Call", icon: Phone, color: "text-blue-500" },
  { id: "EMAIL", label: "Email", icon: Mail, color: "text-green-500" },
  { id: "MEETING", label: "Meeting", icon: Users, color: "text-purple-500" },
  { id: "NOTE", label: "Note", icon: FileText, color: "text-orange-500" },
  { id: "TASK", label: "Task", icon: CheckCircle, color: "text-cyan-500" },
];

const getActivityIcon = (type: string) => {
  const activityType = ACTIVITY_TYPES.find(t => t.id === type);
  return activityType || { icon: FileText, color: "text-gray-500" };
};

export function ActivityTracking() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    leadId: "",
    type: "NOTE",
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, activitiesRes] = await Promise.all([
        crmService.getLeads(),
        crmService.getActivities({})
      ]);

      if (leadsRes.success && leadsRes.data) {
        setLeads(leadsRes.data);
      }

      if (activitiesRes.success && activitiesRes.data) {
        setActivities(activitiesRes.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.leadId || !formData.title.trim()) {
      toast.error("Please select a lead and add a title");
      return;
    }

    try {
      await crmService.addActivity({
        leadId: formData.leadId,
        type: formData.type,
        subject: formData.title,
        description: formData.description,
        date: formData.date,
      });

      toast.success("Activity added successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add activity");
    }
  };

  const resetForm = () => {
    setFormData({
      leadId: "",
      type: "NOTE",
      title: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
    });
  };

  const groupActivitiesByDate = () => {
    const groups: Record<string, Activity[]> = {};

    activities.forEach(activity => {
      const date = new Date(activity.date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    return Object.entries(groups).sort((a, b) =>
      new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime()
    );
  };

  const stats = {
    total: activities.length,
    calls: activities.filter(a => a.type === "CALL").length,
    emails: activities.filter(a => a.type === "EMAIL").length,
    meetings: activities.filter(a => a.type === "MEETING").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading activities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Tracking</h1>
          <p className="text-muted-foreground">Log and track all interactions with leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calls</p>
                <p className="text-2xl font-bold text-blue-600">{stats.calls}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emails</p>
                <p className="text-2xl font-bold text-green-600">{stats.emails}</p>
              </div>
              <Mail className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meetings</p>
                <p className="text-2xl font-bold text-purple-600">{stats.meetings}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <p>No activities logged yet</p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                Log your first activity
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupActivitiesByDate().map(([date, dateActivities]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary">{date}</Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-3 ml-4 border-l-2 border-muted pl-4">
                    {dateActivities.map(activity => {
                      const { icon: Icon, color } = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="relative">
                          <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                            <Icon className={`h-2.5 w-2.5 ${color}`} />
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{activity.subject}</p>
                                {activity.lead && (
                                  <p className="text-sm text-muted-foreground">
                                    {activity.lead.name}
                                    {activity.lead.company && ` - ${activity.lead.company}`}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {activity.type}
                              </Badge>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Activity Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>
              Record an interaction with a lead
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Lead *</Label>
              <Select
                value={formData.leadId}
                onValueChange={(value) => setFormData({ ...formData, leadId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} {lead.company && `(${lead.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Follow-up call"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

