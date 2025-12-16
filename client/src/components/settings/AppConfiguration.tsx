import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import {
  ShoppingCart,
  Users,
  Package,
  FileText,
  Receipt,
  IndianRupee,
  MessageSquare,
  BarChart3,
  Settings,
  Save,
  Plus,
  Trash2,
  GitBranch,
  CheckCircle2,
  Monitor,
  Network,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { ApprovalWorkflow } from "./ApprovalWorkflow";
import { DeviceManagement } from "./DeviceManagement";
import { IPWhitelisting } from "./IPWhitelisting";
import { DocumentNumberSettings } from "./DocumentNumberSettings";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  features: Feature[];
}

interface Feature {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
}

interface Workflow {
  id: string;
  name: string;
  module: string;
  trigger: string;
  approvers: string[];
  condition: string;
  status: "active" | "inactive";
}

export function AppConfiguration() {
  const [modules, setModules] = useState<Module[]>([
    {
      id: "sales",
      name: "Sales",
      description: "Invoices, Estimates, and Sales Orders",
      icon: ShoppingCart,
      enabled: true,
      features: [
        { id: "e-invoice", name: "E-Invoice Integration", enabled: true },
        { id: "payment-links", name: "Payment Links", enabled: true },
        { id: "round-off", name: "Auto Round-off", enabled: true },
        { id: "discount", name: "Discount on Invoice", enabled: true },
        { id: "multi-currency", name: "Multi-Currency Support", enabled: false },
      ],
    },
    {
      id: "purchase",
      name: "Purchase",
      description: "Purchase Orders and Bills",
      icon: FileText,
      enabled: true,
      features: [
        { id: "grn", name: "Goods Receipt Note (GRN)", enabled: true },
        { id: "po-approval", name: "PO Approval Workflow", enabled: true },
        { id: "auto-reconcile", name: "Auto Reconciliation", enabled: false },
      ],
    },
    {
      id: "inventory",
      name: "Inventory",
      description: "Stock and Warehouse Management",
      icon: Package,
      enabled: true,
      features: [
        { id: "batch-tracking", name: "Batch Tracking", enabled: true },
        { id: "serial-numbers", name: "Serial Number Tracking", enabled: false },
        { id: "multi-warehouse", name: "Multi-Warehouse", enabled: true },
        { id: "barcode", name: "Barcode Scanning", enabled: true },
        { id: "low-stock-alerts", name: "Low Stock Alerts", enabled: true },
      ],
    },
    {
      id: "parties",
      name: "Parties",
      description: "Customers and Suppliers",
      icon: Users,
      enabled: true,
      features: [
        { id: "credit-limit", name: "Credit Limit Management", enabled: true },
        { id: "party-groups", name: "Party Groups/Categories", enabled: true },
        { id: "price-lists", name: "Custom Price Lists", enabled: false },
      ],
    },
    {
      id: "gst",
      name: "GST Compliance",
      description: "GST Returns and E-Way Bills",
      icon: Receipt,
      enabled: true,
      features: [
        { id: "gstr1", name: "GSTR-1 Filing", enabled: true },
        { id: "gstr3b", name: "GSTR-3B Filing", enabled: true },
        { id: "e-waybill", name: "E-Way Bill Generation", enabled: true },
        { id: "itc", name: "ITC Reconciliation", enabled: true },
      ],
    },
    {
      id: "banking",
      name: "Banking & Payments",
      description: "Bank Accounts and Transactions",
      icon: IndianRupee,
      enabled: true,
      features: [
        { id: "reconciliation", name: "Bank Reconciliation", enabled: true },
        { id: "payment-reminders", name: "Payment Reminders", enabled: true },
        { id: "upi-integration", name: "UPI Integration", enabled: false },
      ],
    },
    {
      id: "messaging",
      name: "Messaging",
      description: "WhatsApp & SMS Notifications",
      icon: MessageSquare,
      enabled: false,
      features: [
        { id: "whatsapp", name: "WhatsApp Notifications", enabled: false },
        { id: "sms", name: "SMS Notifications", enabled: false },
        { id: "email", name: "Email Notifications", enabled: true },
      ],
    },
    {
      id: "reports",
      name: "Reports & Analytics",
      description: "Business Intelligence",
      icon: BarChart3,
      enabled: true,
      features: [
        { id: "custom-reports", name: "Custom Report Builder", enabled: false },
        { id: "export", name: "Export to Excel/PDF", enabled: true },
        { id: "scheduled-reports", name: "Scheduled Reports", enabled: false },
      ],
    },
  ]);

  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "1",
      name: "High Value Invoice Approval",
      module: "Sales",
      trigger: "Invoice Amount > ₹1,00,000",
      approvers: ["Manager", "Director"],
      condition: "Amount > 100000",
      status: "active",
    },
    {
      id: "2",
      name: "Purchase Order Approval",
      module: "Purchase",
      trigger: "PO Amount > ₹50,000",
      approvers: ["Purchase Manager"],
      condition: "Amount > 50000",
      status: "active",
    },
  ]);

  const [operatingSettings, setOperatingSettings] = useState({
    financialYear: "2024-2025",
    defaultCurrency: "INR",
    taxType: "GST",
    placeOfSupply: "Karnataka",
    decimalPlaces: "2",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "Indian",
  });

  const toggleModule = (moduleId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId ? { ...m, enabled: !m.enabled } : m
      )
    );
    toast.success(`Module ${modules.find(m => m.id === moduleId)?.name} ${!modules.find(m => m.id === moduleId)?.enabled ? 'enabled' : 'disabled'}`);
  };

  const toggleFeature = (moduleId: string, featureId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
            ...m,
            features: m.features.map((f) =>
              f.id === featureId ? { ...f, enabled: !f.enabled } : f
            ),
          }
          : m
      )
    );
  };

  const handleSaveOperatingSettings = () => {
    toast.success("Operating settings saved successfully");
  };

  const deleteWorkflow = (workflowId: string) => {
    setWorkflows(workflows.filter((w) => w.id !== workflowId));
    toast.success("Workflow deleted successfully");
  };

  return (
    <div className="p-6">
      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="operating">Operating Settings</TabsTrigger>
          <TabsTrigger value="numbering">Document Numbers</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Management</CardTitle>
              <CardDescription>
                Enable or disable modules for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Card
                      key={module.id}
                      className={`${module.enabled ? "border-primary" : "opacity-60"
                        }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${module.enabled
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                                }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {module.name}
                              </CardTitle>
                            </div>
                          </div>
                          <Switch
                            checked={module.enabled}
                            onCheckedChange={() => toggleModule(module.id)}
                          />
                        </div>
                        <CardDescription>{module.description}</CardDescription>
                      </CardHeader>
                      {module.enabled && (
                        <CardContent>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Configure Features
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Feature Level Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Feature-Level Configuration</CardTitle>
              <CardDescription>
                Fine-tune individual features for each module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {modules
                  .filter((m) => m.enabled)
                  .map((module) => {
                    const Icon = module.icon;
                    return (
                      <AccordionItem key={module.id} value={module.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-purple" />
                            <span>{module.name}</span>
                            <Badge variant="outline">
                              {module.features.filter((f) => f.enabled).length}/
                              {module.features.length} enabled
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            {module.features.map((feature) => (
                              <div
                                key={feature.id}
                                className="flex items-center justify-between p-3 rounded-lg border"
                              >
                                <div className="flex-1">
                                  <p className="text-foreground">
                                    {feature.name}
                                  </p>
                                  {feature.description && (
                                    <p className="text-muted-foreground">
                                      {feature.description}
                                    </p>
                                  )}
                                </div>
                                <Switch
                                  checked={feature.enabled}
                                  onCheckedChange={() =>
                                    toggleFeature(module.id, feature.id)
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operating Settings Tab */}
        <TabsContent value="operating" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Operating Settings</CardTitle>
              <CardDescription>
                Configure financial year, tax settings, and defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="financialYear">Financial Year</Label>
                  <Select
                    value={operatingSettings.financialYear}
                    onValueChange={(value) =>
                      setOperatingSettings({
                        ...operatingSettings,
                        financialYear: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select
                    value={operatingSettings.defaultCurrency}
                    onValueChange={(value) =>
                      setOperatingSettings({
                        ...operatingSettings,
                        defaultCurrency: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxType">Tax Type</Label>
                  <Select
                    value={operatingSettings.taxType}
                    onValueChange={(value) =>
                      setOperatingSettings({
                        ...operatingSettings,
                        taxType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST</SelectItem>
                      <SelectItem value="Non-GST">Non-GST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfSupply">
                    Default Place of Supply
                  </Label>
                  <Select
                    value={operatingSettings.placeOfSupply}
                    onValueChange={(value) =>
                      setOperatingSettings({
                        ...operatingSettings,
                        placeOfSupply: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="decimalPlaces">Decimal Places</Label>
                  <Select
                    value={operatingSettings.decimalPlaces}
                    onValueChange={(value) =>
                      setOperatingSettings({
                        ...operatingSettings,
                        decimalPlaces: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={operatingSettings.dateFormat}
                    onValueChange={(value) =>
                      setOperatingSettings({
                        ...operatingSettings,
                        dateFormat: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberFormat">Number Format</Label>
                  <Select
                    value={operatingSettings.numberFormat}
                    onValueChange={(value) =>
                      setOperatingSettings({
                        ...operatingSettings,
                        numberFormat: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indian">
                        Indian (1,23,456.78)
                      </SelectItem>
                      <SelectItem value="International">
                        International (123,456.78)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveOperatingSettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Operating Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Numbers Tab */}
        <TabsContent value="numbering" className="space-y-6">
          <DocumentNumberSettings />
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Approval Workflows</CardTitle>
                  <CardDescription>
                    Configure approval flows for documents
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Workflow
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="bg-purple-light p-3 rounded-lg">
                            <GitBranch className="h-5 w-5 text-purple" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-foreground">
                                {workflow.name}
                              </h3>
                              <Badge
                                className={
                                  workflow.status === "active"
                                    ? "bg-success text-white"
                                    : "bg-muted"
                                }
                              >
                                {workflow.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Module</p>
                                <p className="text-foreground">
                                  {workflow.module}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Trigger</p>
                                <p className="text-foreground">
                                  {workflow.trigger}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Approvers
                                </p>
                                <p className="text-foreground">
                                  {workflow.approvers.join(" → ")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Builder Info */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Workflow</CardTitle>
              <CardDescription>
                Define custom approval workflows for your business processes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workflowName">Workflow Name</Label>
                  <Input id="workflowName" placeholder="e.g., Large Invoice Approval" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflowModule">Module</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="expenses">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Trigger Condition</Label>
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                      <SelectItem value="customer">Customer Type</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">Greater than</SelectItem>
                      <SelectItem value="lt">Less than</SelectItem>
                      <SelectItem value="eq">Equal to</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Value" className="flex-1" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Create Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
