import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
  Shield,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  Network,
  Building,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { settingsService } from "../../services/modules.service";
import { toast } from "sonner";

interface IPWhitelist {
  id: string;
  ipAddress: string;
  description?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdBy?: { id: string; name: string; email: string };
}

export function IPWhitelisting() {
  const [loading, setLoading] = useState(true);
  const [ipWhitelists, setIPWhitelists] = useState<IPWhitelist[]>([]);
  const [isWhitelistingEnabled, setIsWhitelistingEnabled] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addingIP, setAddingIP] = useState(false);
  const [newIP, setNewIP] = useState({
    ipAddress: "",
    description: "",
  });

  const fetchIPWhitelist = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getIPWhitelist();
      if (response.success && response.data) {
        setIPWhitelists(response.data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch IP whitelist:", error);
      toast.error("Failed to load IP whitelist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPWhitelist();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await settingsService.toggleIPWhitelist(id);
      if (response.success) {
        toast.success(response.message || "IP status updated");
        fetchIPWhitelist();
      } else {
        toast.error(response.message || "Failed to update IP status");
      }
    } catch (error) {
      console.error("Failed to toggle IP status:", error);
      toast.error("Failed to update IP status");
    }
  };

  const handleDeleteIP = async (id: string) => {
    try {
      const response = await settingsService.removeIPFromWhitelist(id);
      if (response.success) {
        toast.success("IP removed from whitelist");
        fetchIPWhitelist();
      } else {
        toast.error("Failed to remove IP from whitelist");
      }
    } catch (error) {
      console.error("Failed to delete IP:", error);
      toast.error("Failed to remove IP from whitelist");
    }
  };

  const handleAddIP = async () => {
    if (!newIP.ipAddress) {
      toast.error("IP address is required");
      return;
    }

    setAddingIP(true);
    try {
      const response = await settingsService.addIPToWhitelist({
        ipAddress: newIP.ipAddress,
        description: newIP.description || undefined,
      });
      if (response.success) {
        toast.success("IP added to whitelist");
        setNewIP({ ipAddress: "", description: "" });
        setIsAddDialogOpen(false);
        fetchIPWhitelist();
      } else {
        toast.error(response.message || "Failed to add IP to whitelist");
      }
    } catch (error) {
      console.error("Failed to add IP:", error);
      toast.error("Failed to add IP to whitelist");
    } finally {
      setAddingIP(false);
    }
  };

  const stats = {
    total: ipWhitelists.length,
    active: ipWhitelists.filter((ip) => ip.isActive).length,
    disabled: ipWhitelists.filter((ip) => !ip.isActive).length,
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
          <h2 className="text-foreground mb-1">IP Whitelisting</h2>
          <p className="text-muted-foreground text-sm">
            Restrict access to your account from specific IP addresses or ranges
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchIPWhitelist} className="gap-2">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add IP Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add IP to Whitelist</DialogTitle>
                <DialogDescription>
                  Add a new IP address or range to the whitelist
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>IP Address *</Label>
                  <Input
                    placeholder="e.g., 192.168.1.100 or 192.168.1.0/24"
                    value={newIP.ipAddress}
                    onChange={(e) => setNewIP({ ...newIP, ipAddress: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports single IP, IP ranges, or CIDR notation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="e.g., Office Network, Home Office, VPN Server"
                    value={newIP.description}
                    onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddIP}
                  disabled={!newIP.ipAddress || addingIP}
                  className="bg-primary"
                >
                  {addingIP && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Add to Whitelist
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
                <div className="text-muted-foreground text-sm mb-1">Total IPs</div>
                <div className="text-2xl font-semibold text-foreground">{stats.total}</div>
              </div>
              <div className="bg-primary p-3 rounded-xl">
                <Network className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Active Rules</div>
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
                <div className="text-muted-foreground text-sm mb-1">Disabled Rules</div>
                <div className="text-2xl font-semibold text-error">{stats.disabled}</div>
              </div>
              <div className="bg-error p-3 rounded-xl">
                <XCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enable/Disable Whitelisting */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-primary p-3 rounded-xl">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Enable IP Whitelisting
                </h3>
                <p className="text-sm text-muted-foreground">
                  When enabled, only requests from whitelisted IPs will be allowed. Be careful not to lock yourself out!
                </p>
              </div>
            </div>
            <Switch
              checked={isWhitelistingEnabled}
              onCheckedChange={setIsWhitelistingEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warning Banner */}
      {isWhitelistingEnabled && stats.active > 0 && (
        <Card className="border-0 shadow-sm bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-orange-900 font-medium mb-1">IP Whitelisting is Active</p>
                <p className="text-orange-700">
                  Access is restricted to the whitelisted IP addresses below. Make sure your current IP is included to avoid being locked out.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IP Whitelist Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Whitelisted IP Addresses</CardTitle>
          <CardDescription>
            Manage IP addresses and ranges allowed to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ipWhitelists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Network className="size-12 mx-auto mb-4 opacity-50" />
                      <p>No IP addresses whitelisted yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  ipWhitelists.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell>
                        <div className="font-mono text-sm font-medium">{ip.ipAddress}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{ip.description || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(ip.createdAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>{ip.createdBy?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            ip.isActive
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }
                        >
                          {ip.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleStatus(ip.id)}>
                              {ip.isActive ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteIP(ip.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Whitelist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Network className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-info font-medium mb-2">IP Whitelisting Guide</p>
              <ul className="text-info/80 space-y-1 list-disc list-inside">
                <li><strong>Single IP:</strong> Whitelist one specific IP (e.g., 192.168.1.100)</li>
                <li><strong>IP Range:</strong> Whitelist a range of IPs (e.g., 192.168.1.0-192.168.1.255)</li>
                <li><strong>CIDR:</strong> Whitelist using CIDR notation (e.g., 192.168.1.0/24)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
