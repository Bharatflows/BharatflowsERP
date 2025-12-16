import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Shield,
  Users,
  Lock,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface RoleAccess {
  role: string;
  totalUsers: number;
  permissions: {
    viewDashboard: boolean;
    manageSales: boolean;
    managePurchase: boolean;
    manageExpenses: boolean;
    manageInventory: boolean;
    viewReports: boolean;
    manageGST: boolean;
    viewFinancials: boolean;
    manageUsers: boolean;
    approveTransactions: boolean;
  };
  dataAccess: {
    allCustomers: boolean;
    assignedCustomersOnly: boolean;
    allWarehouses: boolean;
    assignedWarehousesOnly: boolean;
    viewCostPrice: boolean;
    viewProfitMargins: boolean;
  };
  limits: {
    maxDiscountPercent: number;
    maxTransactionAmount: number;
    requireApprovalAbove: number;
  };
}

export function RoleBasedAccess() {
  const [roles, setRoles] = useState<RoleAccess[]>([
    {
      role: "Admin",
      totalUsers: 1,
      permissions: {
        viewDashboard: true,
        manageSales: true,
        managePurchase: true,
        manageExpenses: true,
        manageInventory: true,
        viewReports: true,
        manageGST: true,
        viewFinancials: true,
        manageUsers: true,
        approveTransactions: true,
      },
      dataAccess: {
        allCustomers: true,
        assignedCustomersOnly: false,
        allWarehouses: true,
        assignedWarehousesOnly: false,
        viewCostPrice: true,
        viewProfitMargins: true,
      },
      limits: {
        maxDiscountPercent: 100,
        maxTransactionAmount: 10000000,
        requireApprovalAbove: 10000000,
      },
    },
    {
      role: "Accountant",
      totalUsers: 1,
      permissions: {
        viewDashboard: true,
        manageSales: true,
        managePurchase: true,
        manageExpenses: true,
        manageInventory: false,
        viewReports: true,
        manageGST: true,
        viewFinancials: true,
        manageUsers: false,
        approveTransactions: true,
      },
      dataAccess: {
        allCustomers: true,
        assignedCustomersOnly: false,
        allWarehouses: true,
        assignedWarehousesOnly: false,
        viewCostPrice: true,
        viewProfitMargins: true,
      },
      limits: {
        maxDiscountPercent: 15,
        maxTransactionAmount: 500000,
        requireApprovalAbove: 200000,
      },
    },
    {
      role: "Salesman",
      totalUsers: 1,
      permissions: {
        viewDashboard: true,
        manageSales: true,
        managePurchase: false,
        manageExpenses: false,
        manageInventory: false,
        viewReports: false,
        manageGST: false,
        viewFinancials: false,
        manageUsers: false,
        approveTransactions: false,
      },
      dataAccess: {
        allCustomers: false,
        assignedCustomersOnly: true,
        allWarehouses: false,
        assignedWarehousesOnly: true,
        viewCostPrice: false,
        viewProfitMargins: false,
      },
      limits: {
        maxDiscountPercent: 5,
        maxTransactionAmount: 100000,
        requireApprovalAbove: 50000,
      },
    },
    {
      role: "Manager",
      totalUsers: 1,
      permissions: {
        viewDashboard: true,
        manageSales: true,
        managePurchase: true,
        manageExpenses: true,
        manageInventory: true,
        viewReports: true,
        manageGST: false,
        viewFinancials: true,
        manageUsers: false,
        approveTransactions: true,
      },
      dataAccess: {
        allCustomers: true,
        assignedCustomersOnly: false,
        allWarehouses: true,
        assignedWarehousesOnly: false,
        viewCostPrice: true,
        viewProfitMargins: true,
      },
      limits: {
        maxDiscountPercent: 20,
        maxTransactionAmount: 1000000,
        requireApprovalAbove: 500000,
      },
    },
    {
      role: "Inventory Manager",
      totalUsers: 0,
      permissions: {
        viewDashboard: true,
        manageSales: false,
        managePurchase: true,
        manageExpenses: false,
        manageInventory: true,
        viewReports: true,
        manageGST: false,
        viewFinancials: false,
        manageUsers: false,
        approveTransactions: false,
      },
      dataAccess: {
        allCustomers: false,
        assignedCustomersOnly: false,
        allWarehouses: true,
        assignedWarehousesOnly: false,
        viewCostPrice: true,
        viewProfitMargins: false,
      },
      limits: {
        maxDiscountPercent: 0,
        maxTransactionAmount: 300000,
        requireApprovalAbove: 100000,
      },
    },
  ]);

  const [selectedRole, setSelectedRole] = useState("Admin");

  const selectedRoleData = roles.find((r) => r.role === selectedRole);

  const togglePermission = (permission: keyof RoleAccess["permissions"]) => {
    if (selectedRole === "Admin") {
      toast.error("Cannot modify Admin permissions");
      return;
    }
    setRoles(
      roles.map((r) =>
        r.role === selectedRole
          ? {
            ...r,
            permissions: {
              ...r.permissions,
              [permission]: !r.permissions[permission],
            },
          }
          : r
      )
    );
    toast.success("Permission updated");
  };

  const toggleDataAccess = (access: keyof RoleAccess["dataAccess"]) => {
    if (selectedRole === "Admin") {
      toast.error("Cannot modify Admin data access");
      return;
    }
    setRoles(
      roles.map((r) =>
        r.role === selectedRole
          ? {
            ...r,
            dataAccess: {
              ...r.dataAccess,
              [access]: !r.dataAccess[access],
            },
          }
          : r
      )
    );
    toast.success("Data access updated");
  };

  return (
    <div className="space-y-6">
      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {roles.map((role) => (
          <Card
            key={role.role}
            className={`cursor-pointer transition-all ${selectedRole === role.role ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              }`}
            onClick={() => setSelectedRole(role.role)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${selectedRole === role.role
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary"
                    }`}
                >
                  <Shield className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground">{role.role}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="size-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {role.totalUsers} user{role.totalUsers !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Details */}
      {selectedRoleData && (
        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="permissions">Module Permissions</TabsTrigger>
            <TabsTrigger value="data">Data Access</TabsTrigger>
            <TabsTrigger value="limits">Transaction Limits</TabsTrigger>
          </TabsList>

          {/* Module Permissions */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Module Permissions - {selectedRole}</CardTitle>
                    <CardDescription>
                      Control which modules this role can access
                    </CardDescription>
                  </div>
                  {selectedRole === "Admin" && (
                    <Badge variant="outline" className="badge-success">
                      Full Access
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedRoleData.permissions).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {value ? (
                          <CheckCircle className="size-5 text-success" />
                        ) : (
                          <XCircle className="size-5 text-error" />
                        )}
                        <Label className="cursor-pointer">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={() =>
                          togglePermission(key as keyof RoleAccess["permissions"])
                        }
                        disabled={selectedRole === "Admin"}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Access Control */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Access Control - {selectedRole}</CardTitle>
                <CardDescription>
                  Define what data users with this role can see
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Customer Access */}
                  <div className="space-y-3">
                    <h4 className="text-foreground flex items-center gap-2">
                      <Eye className="size-4" />
                      Customer Visibility
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {selectedRoleData.dataAccess.allCustomers ? (
                            <CheckCircle className="size-5 text-success" />
                          ) : (
                            <XCircle className="size-5 text-error" />
                          )}
                          <Label>All Customers</Label>
                        </div>
                        <Switch
                          checked={selectedRoleData.dataAccess.allCustomers}
                          onCheckedChange={() => toggleDataAccess("allCustomers")}
                          disabled={selectedRole === "Admin"}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {selectedRoleData.dataAccess.assignedCustomersOnly ? (
                            <CheckCircle className="size-5 text-success" />
                          ) : (
                            <XCircle className="size-5 text-error" />
                          )}
                          <Label>Assigned Customers Only</Label>
                        </div>
                        <Switch
                          checked={selectedRoleData.dataAccess.assignedCustomersOnly}
                          onCheckedChange={() => toggleDataAccess("assignedCustomersOnly")}
                          disabled={selectedRole === "Admin"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Access */}
                  <div className="space-y-3">
                    <h4 className="text-foreground flex items-center gap-2">
                      <Lock className="size-4" />
                      Warehouse Visibility
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {selectedRoleData.dataAccess.allWarehouses ? (
                            <CheckCircle className="size-5 text-success" />
                          ) : (
                            <XCircle className="size-5 text-error" />
                          )}
                          <Label>All Warehouses</Label>
                        </div>
                        <Switch
                          checked={selectedRoleData.dataAccess.allWarehouses}
                          onCheckedChange={() => toggleDataAccess("allWarehouses")}
                          disabled={selectedRole === "Admin"}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {selectedRoleData.dataAccess.assignedWarehousesOnly ? (
                            <CheckCircle className="size-5 text-success" />
                          ) : (
                            <XCircle className="size-5 text-error" />
                          )}
                          <Label>Assigned Warehouses Only</Label>
                        </div>
                        <Switch
                          checked={selectedRoleData.dataAccess.assignedWarehousesOnly}
                          onCheckedChange={() => toggleDataAccess("assignedWarehousesOnly")}
                          disabled={selectedRole === "Admin"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Data Access */}
                  <div className="space-y-3">
                    <h4 className="text-foreground flex items-center gap-2">
                      <Settings className="size-4" />
                      Financial Data
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {selectedRoleData.dataAccess.viewCostPrice ? (
                            <CheckCircle className="size-5 text-success" />
                          ) : (
                            <XCircle className="size-5 text-error" />
                          )}
                          <Label>View Cost Price</Label>
                        </div>
                        <Switch
                          checked={selectedRoleData.dataAccess.viewCostPrice}
                          onCheckedChange={() => toggleDataAccess("viewCostPrice")}
                          disabled={selectedRole === "Admin"}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {selectedRoleData.dataAccess.viewProfitMargins ? (
                            <CheckCircle className="size-5 text-success" />
                          ) : (
                            <XCircle className="size-5 text-error" />
                          )}
                          <Label>View Profit Margins</Label>
                        </div>
                        <Switch
                          checked={selectedRoleData.dataAccess.viewProfitMargins}
                          onCheckedChange={() => toggleDataAccess("viewProfitMargins")}
                          disabled={selectedRole === "Admin"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction Limits */}
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Limits - {selectedRole}</CardTitle>
                <CardDescription>
                  Set financial and operational limits for this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-warning" />
                        <Label>Max Discount %</Label>
                      </div>
                      <p className="text-foreground">
                        {selectedRoleData.limits.maxDiscountPercent}%
                      </p>
                      <p className="text-muted-foreground">
                        Maximum discount allowed on transactions
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-warning" />
                        <Label>Max Transaction Amount</Label>
                      </div>
                      <p className="text-foreground">
                        ₹{selectedRoleData.limits.maxTransactionAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-muted-foreground">
                        Maximum single transaction value
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-5 text-warning" />
                        <Label>Approval Required Above</Label>
                      </div>
                      <p className="text-foreground">
                        ₹{selectedRoleData.limits.requireApprovalAbove.toLocaleString("en-IN")}
                      </p>
                      <p className="text-muted-foreground">
                        Transactions above this require approval
                      </p>
                    </div>
                  </div>

                  {selectedRole !== "Admin" && (
                    <div className="p-4 bg-warning-light border border-warning/30 rounded-lg">
                      <div className="flex gap-3">
                        <AlertTriangle className="size-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-foreground">Transaction Limit Notice</p>
                          <p className="text-muted-foreground mt-1">
                            Users with this role will be prevented from creating transactions
                            exceeding these limits. Transactions above the approval threshold will
                            require manager/admin approval.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

