import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  MoreVertical,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { settingsService } from "../../services/modules.service";
import { toast } from "sonner";

interface Device {
  id: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActiveAt: string;
  createdAt: string;
  status: string;
  trusted: boolean;
  userId: string;
  user?: { id: string; name: string; email: string };
}

export function DeviceManagement() {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [summary, setSummary] = useState({
    totalDevices: 0,
    activeDevices: 0,
    blockedDevices: 0,
    trustedDevices: 0,
  });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const [devicesResponse, summaryResponse] = await Promise.all([
        settingsService.getDevices(),
        settingsService.getDeviceSummary(),
      ]);

      if (devicesResponse.success && devicesResponse.data) {
        setDevices(devicesResponse.data.items || []);
      }
      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleBlockDevice = async (id: string) => {
    try {
      const response = await settingsService.blockDevice(id);
      if (response.success) {
        toast.success("Device blocked successfully");
        fetchDevices();
      } else {
        toast.error(response.message || "Failed to block device");
      }
    } catch (error) {
      console.error("Failed to block device:", error);
      toast.error("Failed to block device");
    }
  };

  const handleUnblockDevice = async (id: string) => {
    try {
      const response = await settingsService.unblockDevice(id);
      if (response.success) {
        toast.success("Device unblocked successfully");
        fetchDevices();
      } else {
        toast.error(response.message || "Failed to unblock device");
      }
    } catch (error) {
      console.error("Failed to unblock device:", error);
      toast.error("Failed to unblock device");
    }
  };

  const getDeviceIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case "desktop":
      case "laptop":
        return <Monitor className="h-5 w-5 text-white" />;
      case "mobile":
      case "phone":
        return <Smartphone className="h-5 w-5 text-white" />;
      case "tablet":
        return <Tablet className="h-5 w-5 text-white" />;
      default:
        return <Monitor className="h-5 w-5 text-white" />;
    }
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
          <h2 className="text-foreground mb-1">Device Management</h2>
          <p className="text-muted-foreground text-sm">
            Monitor and manage all devices with access to your account
          </p>
        </div>
        <Button variant="outline" onClick={fetchDevices} className="gap-2">
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Total Devices</div>
                <div className="text-2xl font-semibold text-foreground">{summary.totalDevices}</div>
              </div>
              <div className="bg-primary p-3 rounded-xl">
                <Monitor className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Active Sessions</div>
                <div className="text-2xl font-semibold text-success">{summary.activeDevices}</div>
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
                <div className="text-muted-foreground text-sm mb-1">Blocked</div>
                <div className="text-2xl font-semibold text-error">{summary.blockedDevices}</div>
              </div>
              <div className="bg-error p-3 rounded-xl">
                <XCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Trusted</div>
                <div className="text-2xl font-semibold text-blue-600">{summary.trustedDevices}</div>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alert */}
      <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-info font-medium mb-1">Security Tip</p>
              <p className="text-info/80">
                Review your active devices regularly. If you notice any unfamiliar device, revoke access immediately and change your password.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Active Devices</CardTitle>
          <CardDescription>
            Devices that currently have or had access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="size-12 mx-auto mb-4 opacity-50" />
              <p>No devices registered yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <Card key={device.id} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl ${device.status.toLowerCase() === "active"
                            ? "bg-primary"
                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                            }`}
                        >
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{device.deviceName}</h4>
                            {device.trusted && (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-700 border-blue-300"
                              >
                                Trusted
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={
                                device.status.toLowerCase() === "active"
                                  ? "bg-green-100 text-green-700 border-green-300"
                                  : "bg-red-100 text-red-700 border-red-300"
                              }
                            >
                              {device.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Browser:</span>
                              <div className="font-medium flex items-center gap-1">
                                <Chrome className="h-3 w-3" />
                                {device.browser || '-'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">OS:</span>
                              <div className="font-medium">{device.os || '-'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">IP Address:</span>
                              <div className="font-mono text-xs">{device.ipAddress || '-'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <div className="flex items-center gap-1 font-medium">
                                <MapPin className="h-3 w-3" />
                                {device.location || '-'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Active:</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {device.lastActiveAt
                                  ? new Date(device.lastActiveAt).toLocaleString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                  : '-'}
                              </div>
                            </div>
                            {device.user && (
                              <div>
                                <span className="text-muted-foreground">User:</span>
                                <div className="font-medium">{device.user.name}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {device.status.toLowerCase() === "active" ? (
                              <DropdownMenuItem
                                onClick={() => handleBlockDevice(device.id)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Block Device
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleUnblockDevice(device.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unblock Device
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
