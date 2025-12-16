import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
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
} from "../ui/dialog";
import {
  Users,
  UserPlus,
  Shield,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { RoleBasedAccess } from "./RoleBasedAccess";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive";
  lastLogin: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  isCustom: boolean;
}

interface Permission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Rajesh Kumar",
      email: "rajesh@sharmaenterprises.com",
      phone: "+91 98765 43210",
      role: "Admin",
      status: "active",
      lastLogin: "2 hours ago",
    },
    {
      id: "2",
      name: "Priya Sharma",
      email: "priya@sharmaenterprises.com",
      phone: "+91 98765 43211",
      role: "Accountant",
      status: "active",
      lastLogin: "5 hours ago",
    },
    {
      id: "3",
      name: "Amit Patel",
      email: "amit@sharmaenterprises.com",
      phone: "+91 98765 43212",
      role: "Salesman",
      status: "active",
      lastLogin: "1 day ago",
    },
    {
      id: "4",
      name: "Neha Gupta",
      email: "neha@sharmaenterprises.com",
      phone: "+91 98765 43213",
      role: "Manager",
      status: "inactive",
      lastLogin: "3 days ago",
    },
  ]);

  const [roles, setRoles] = useState<Role[]>([
    {
      id: "admin",
      name: "Admin",
      description: "Full system access",
      userCount: 1,
      isCustom: false,
    },
    {
      id: "accountant",
      name: "Accountant",
      description: "Financial operations",
      userCount: 1,
      isCustom: false,
    },
    {
      id: "salesman",
      name: "Salesman",
      description: "Sales and customer management",
      userCount: 1,
      isCustom: false,
    },
    {
      id: "manager",
      name: "Manager",
      description: "Department management",
      userCount: 1,
      isCustom: false,
    },
    {
      id: "inventory",
      name: "Inventory Manager",
      description: "Stock and warehouse operations",
      userCount: 0,
      isCustom: true,
    },
  ]);

  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [permissions, setPermissions] = useState<Permission[]>([
    { module: "Sales", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "Purchase", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "Inventory", view: true, create: true, edit: true, delete: true, approve: false },
    { module: "Parties", view: true, create: true, edit: true, delete: true, approve: false },
    { module: "GST", view: true, create: true, edit: true, delete: false, approve: false },
    { module: "Banking", view: true, create: true, edit: true, delete: false, approve: false },
    { module: "Reports", view: true, create: false, edit: false, delete: false, approve: false },
    { module: "Settings", view: true, create: false, edit: true, delete: false, approve: false },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Salesman",
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    const user: User = {
      id: String(users.length + 1),
      ...newUser,
      status: "active",
      lastLogin: "Never",
    };
    setUsers([...users, user]);
    setIsAddUserOpen(false);
    setNewUser({ name: "", email: "", phone: "", role: "Salesman" });
    toast.success("User added successfully");
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
    toast.success("User deleted successfully");
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    );
  };

  const togglePermission = (
    moduleIndex: number,
    permType: keyof Omit<Permission, "module">
  ) => {
    const newPermissions = [...permissions];
    newPermissions[moduleIndex][permType] = !newPermissions[moduleIndex][permType];
    setPermissions(newPermissions);
  };

  const selectAll = (permType: keyof Omit<Permission, "module">) => {
    setPermissions(permissions.map((p) => ({ ...p, [permType]: true })));
  };

  const deselectAll = (permType: keyof Omit<Permission, "module">) => {
    setPermissions(permissions.map((p) => ({ ...p, [permType]: false })));
  };

  const handleSavePermissions = () => {
    toast.success("Permissions saved successfully");
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && !role.isCustom) {
      toast.error("Cannot delete default roles");
      return;
    }
    setRoles(roles.filter((r) => r.id !== roleId));
    toast.success("Role deleted successfully");
  };

  return (
    <div className="p-6">
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 gap-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage team members and their access
                  </CardDescription>
                </div>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Add a new team member to your organization
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="userName">Full Name *</Label>
                        <Input
                          id="userName"
                          value={newUser.name}
                          onChange={(e) =>
                            setNewUser({ ...newUser, name: e.target.value })
                          }
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userEmail">Email *</Label>
                        <Input
                          id="userEmail"
                          type="email"
                          value={newUser.email}
                          onChange={(e) =>
                            setNewUser({ ...newUser, email: e.target.value })
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userPhone">Phone *</Label>
                        <Input
                          id="userPhone"
                          value={newUser.phone}
                          onChange={(e) =>
                            setNewUser({ ...newUser, phone: e.target.value })
                          }
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userRole">Role *</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) =>
                            setNewUser({ ...newUser, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddUserOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddUser}>Add User</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="text-foreground">{user.name}</p>
                            <p className="text-muted-foreground md:hidden">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.email}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.phone}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            {user.status === "active" ? (
                              <Badge className="badge-success">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {user.lastLogin}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Roles List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>Manage user roles and their permissions</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-all ${selectedRole === role.id ? "border-primary shadow-md" : ""
                      }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-light p-2 rounded-lg">
                            <Shield className="h-5 w-5 text-purple" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{role.name}</CardTitle>
                            {role.isCustom && (
                              <Badge variant="outline" className="mt-1">Custom</Badge>
                            )}
                          </div>
                        </div>
                        {role.isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {role.userCount} {role.userCount === 1 ? "user" : "users"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permission Matrix */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permission Matrix</CardTitle>
                  <CardDescription>
                    Configure permissions for {roles.find((r) => r.id === selectedRole)?.name} role
                  </CardDescription>
                </div>
                <Button onClick={handleSavePermissions} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Permissions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Module</TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span>View</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => selectAll("view")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => deselectAll("view")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span>Create</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => selectAll("create")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => deselectAll("create")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span>Edit</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => selectAll("edit")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => deselectAll("edit")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span>Delete</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => selectAll("delete")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => deselectAll("delete")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span>Approve</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => selectAll("approve")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => deselectAll("approve")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((perm, index) => (
                      <TableRow key={perm.module}>
                        <TableCell className="font-medium">{perm.module}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.view}
                            onCheckedChange={() => togglePermission(index, "view")}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.create}
                            onCheckedChange={() => togglePermission(index, "create")}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.edit}
                            onCheckedChange={() => togglePermission(index, "edit")}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.delete}
                            onCheckedChange={() => togglePermission(index, "delete")}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.approve}
                            onCheckedChange={() => togglePermission(index, "approve")}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Access Control</CardTitle>
              <CardDescription>
                Configure visibility and limits for users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-foreground">User Visibility Controls</h3>
                <p className="text-muted-foreground">
                  Control what data each user can access based on their role and assignment
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Restrict to Assigned Customers</Label>
                      <Switch />
                    </div>
                    <p className="text-muted-foreground">
                      Users can only see customers assigned to them
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Restrict to Assigned Warehouses</Label>
                      <Switch />
                    </div>
                    <p className="text-muted-foreground">
                      Users can only access assigned warehouse data
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Hide Cost Price</Label>
                      <Switch />
                    </div>
                    <p className="text-muted-foreground">
                      Hide cost price from sales team
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Restrict Financial Reports</Label>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-muted-foreground">
                      Only admins can view P&L and balance sheet
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-foreground">Transaction Limits</h3>
                <p className="text-muted-foreground">
                  Set limits on transaction values for different roles
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select defaultValue="salesman">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salesman">Salesman</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Invoice Amount</Label>
                      <Input type="number" placeholder="100000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Discount %</Label>
                      <Input type="number" placeholder="10" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Access Controls
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
