import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Shield,
  Smartphone,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Filter,
  Search,
  Lock,
  Key,
  Save,
  GitBranch,
  Monitor,
  Network,
} from "lucide-react";
import { toast } from "sonner";
import { ApprovalWorkflow } from "./ApprovalWorkflow";
import { DeviceManagement } from "./DeviceManagement";
import { IPWhitelisting } from "./IPWhitelisting";
import AuditLogViewer from "../audit/AuditLogViewer";

interface LoginHistory {
  id: string;
  device: string;
  location: string;
  ip: string;
  time: string;
  status: "success" | "failed";
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

interface Device {
  id: string;
  name: string;
  type: string;
  lastActive: string;
  location: string;
  current: boolean;
}

export function SecurityAudit() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [allowedIPs, setAllowedIPs] = useState<string[]>([
    "192.168.1.100",
    "203.0.113.45",
  ]);
  const [newIP, setNewIP] = useState("");

  const [loginHistory] = useState<LoginHistory[]>([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "Bangalore, Karnataka",
      ip: "203.0.113.45",
      time: "2024-11-24 10:30 AM",
      status: "success",
    },
    {
      id: "2",
      device: "Mobile App - Android",
      location: "Bangalore, Karnataka",
      ip: "203.0.113.45",
      time: "2024-11-24 08:15 AM",
      status: "success",
    },
    {
      id: "3",
      device: "Firefox on Mac",
      location: "Mumbai, Maharashtra",
      ip: "198.51.100.23",
      time: "2024-11-23 06:45 PM",
      status: "failed",
    },
    {
      id: "4",
      device: "Chrome on Windows",
      location: "Bangalore, Karnataka",
      ip: "203.0.113.45",
      time: "2024-11-23 02:20 PM",
      status: "success",
    },
  ]);

  const [devices] = useState<Device[]>([
    {
      id: "1",
      name: "Chrome on Windows 11",
      type: "Desktop",
      lastActive: "Active now",
      location: "Bangalore, Karnataka",
      current: true,
    },
    {
      id: "2",
      name: "Mobile App - Android",
      type: "Mobile",
      lastActive: "2 hours ago",
      location: "Bangalore, Karnataka",
      current: false,
    },
    {
      id: "3",
      name: "Safari on iPhone",
      type: "Mobile",
      lastActive: "Yesterday",
      location: "Bangalore, Karnataka",
      current: false,
    },
  ]);

  const [auditLogs] = useState<AuditLog[]>([
    {
      id: "1",
      user: "Rajesh Kumar",
      action: "Created Invoice",
      module: "Sales",
      details: "Invoice #INV-2024-245 created for ₹45,000",
      timestamp: "2024-11-24 10:45 AM",
      ipAddress: "203.0.113.45",
    },
    {
      id: "2",
      user: "Priya Sharma",
      action: "Updated Settings",
      module: "Settings",
      details: "Changed business GST number",
      timestamp: "2024-11-24 09:30 AM",
      ipAddress: "203.0.113.46",
    },
    {
      id: "3",
      user: "Amit Patel",
      action: "Added Customer",
      module: "Parties",
      details: "New customer 'ABC Corp' added",
      timestamp: "2024-11-24 08:15 AM",
      ipAddress: "203.0.113.47",
    },
    {
      id: "4",
      user: "Rajesh Kumar",
      action: "Stock Adjustment",
      module: "Inventory",
      details: "Stock adjusted for Product #PRD-123",
      timestamp: "2024-11-23 05:30 PM",
      ipAddress: "203.0.113.45",
    },
    {
      id: "5",
      user: "Neha Gupta",
      action: "Generated Report",
      module: "Reports",
      details: "Sales Report for November 2024",
      timestamp: "2024-11-23 03:20 PM",
      ipAddress: "203.0.113.48",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === "all" || log.module === filterModule;
    const matchesUser = filterUser === "all" || log.user === filterUser;
    return matchesSearch && matchesModule && matchesUser;
  });

  const handleAddIP = () => {
    if (newIP && !allowedIPs.includes(newIP)) {
      setAllowedIPs([...allowedIPs, newIP]);
      setNewIP("");
      toast.success("IP address added to whitelist");
    }
  };

  const handleRemoveIP = (ip: string) => {
    setAllowedIPs(allowedIPs.filter((i) => i !== ip));
    toast.success("IP address removed from whitelist");
  };

  const handleSaveSecuritySettings = () => {
    toast.success("Security settings saved successfully");
  };

  const handleRevokeDevice = (deviceId: string) => {
    toast.success("Device access revoked");
  };

  const handleExportAuditLogs = () => {
    toast.success("Audit logs exported successfully");
  };

  return (
    <div className="p-6">
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="login">Login History</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-error-light p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-error" />
                </div>
                <div>
                  <CardTitle>Authentication Settings</CardTitle>
                  <CardDescription>
                    Configure authentication and access control
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-4 w-4 text-purple" />
                    <p className="text-foreground">
                      Two-Factor Authentication (2FA)
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    Require additional verification code during login
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="never">Never (not recommended)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground">
                  Automatically log out after period of inactivity
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4 text-purple" />
                    <p className="text-foreground">Force Password Change</p>
                  </div>
                  <p className="text-muted-foreground">
                    Require all users to change password every 90 days
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecuritySettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IP Whitelist</CardTitle>
              <CardDescription>
                Restrict access to specific IP addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="text-foreground">Enable IP Whitelisting</p>
                  <p className="text-muted-foreground">
                    Only allow access from approved IP addresses
                  </p>
                </div>
                <Switch
                  checked={ipWhitelistEnabled}
                  onCheckedChange={setIpWhitelistEnabled}
                />
              </div>

              {ipWhitelistEnabled && (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter IP address (e.g., 192.168.1.1)"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                    <Button onClick={handleAddIP}>Add IP</Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Allowed IP Addresses</Label>
                    <div className="border rounded-lg divide-y">
                      {allowedIPs.map((ip, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground font-mono">{ip}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveIP(ip)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-cyan-light p-3 rounded-lg">
                  <Smartphone className="h-6 w-6 text-cyan" />
                </div>
                <div>
                  <CardTitle>Active Devices</CardTitle>
                  <CardDescription>
                    Manage devices with access to your account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devices.map((device) => (
                  <Card key={device.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="bg-cyan-light p-3 rounded-lg">
                            <Smartphone className="h-5 w-5 text-cyan" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-foreground">{device.name}</p>
                              {device.current && (
                                <Badge className="badge-success">
                                  Current Device
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-0.5 text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>{device.lastActive}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>{device.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {!device.current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeDevice(device.id)}
                          >
                            Revoke Access
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="login" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-success-light p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div>
                  <CardTitle>Login History</CardTitle>
                  <CardDescription>
                    Recent login attempts and activity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead className="hidden md:table-cell">Location</TableHead>
                      <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.map((login) => (
                      <TableRow key={login.id}>
                        <TableCell>
                          <div>
                            <p className="text-foreground">{login.device}</p>
                            <p className="text-muted-foreground md:hidden">
                              {login.location}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {login.location}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-sm">
                          {login.ip}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {login.time}
                        </TableCell>
                        <TableCell>
                          {login.status === "success" ? (
                            <Badge className="badge-success">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-error border-error">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <CardContent className="space-y-4">
            <AuditLogViewer showGlobal={true} />
          </CardContent>
        </TabsContent>
      </Tabs>
    </div>
  );
}
