import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { cn } from "../../lib/utils";

// Reusable icon component
const MIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={cn("material-icons-outlined", className)} style={{ fontSize: 'inherit' }}>
    {name}
  </span>
);
import { userService, roleService } from "../../services/modules.service";
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
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        userService.getUsers(),
        roleService.getRoles()
      ]);

      const standardRoles: Role[] = [
        { id: "admin", name: "Admin", description: "Full system access", userCount: 0, isCustom: false },
        { id: "accountant", name: "Accountant", description: "Financial operations", userCount: 0, isCustom: false },
        { id: "salesman", name: "Salesman", description: "Sales and customer management", userCount: 0, isCustom: false },
        { id: "manager", name: "Manager", description: "Department management", userCount: 0, isCustom: false },
      ];

      if (rolesRes.data) {
        setRoles([...standardRoles, ...rolesRes.data]);
      } else {
        setRoles(standardRoles);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Suppress visible error as per user request if it's just empty/initial load issues
      // toast.error("Failed to load users and roles");
    } finally {
      setLoading(false);
    }
  };

  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [permissions, setPermissions] = useState<Permission[]>([
    { module: "Sales", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "Purchase", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "Inventory", view: true, create: true, edit: true, delete: true, approve: false },
    { module: "Parties", view: true, create: true, edit: true, delete: true, approve: false },
    { module: "Expenses", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "Banking", view: true, create: true, edit: true, delete: false, approve: false },
    { module: "GST", view: true, create: true, edit: true, delete: false, approve: false },
    { module: "HR", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "CRM", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "Production", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "Barcode", view: true, create: true, edit: true, delete: true, approve: false },
    { module: "Documents", view: true, create: true, edit: true, delete: true, approve: false },
    { module: "Analytics", view: true, create: true, edit: false, delete: false, approve: false },
    { module: "Reports", view: true, create: false, edit: false, delete: false, approve: false },
    { module: "Accounting", view: true, create: true, edit: true, delete: true, approve: true },
    { module: "Settings", view: true, create: false, edit: true, delete: false, approve: false },
  ]);

  // Load permissions when role selected
  useEffect(() => {
    const role = roles.find(r => r.id === selectedRole);
    if (role && (role as any).permissions) {
      // Ensure permissions match the structure
      setPermissions((role as any).permissions);
    }
  }, [selectedRole, roles]);


  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Salesman",
    password: "",
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone || !newUser.role || !newUser.password) {
      toast.error("Please fill all required fields including password");
      return;
    }

    try {
      const res = await userService.inviteUser({ ...newUser });
      if (res.success) {
        toast.success("User added successfully");
        fetchData(); // Refresh list
        setIsAddUserOpen(false);
        setIsAddUserOpen(false);
        setNewUser({ name: "", email: "", phone: "", role: "Salesman", password: "" });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userService.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      toast.success("User deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await userService.updateUser(userId, { status: newStatus });

      setUsers(
        users.map((u) =>
          u.id === userId
            ? { ...u, status: newStatus as any }
            : u
        )
      );
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error("Failed to update user status");
    }
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

  const handleSavePermissions = async () => {
    const role = roles.find(r => r.id === selectedRole);
    if (!role) return;

    if (!role.isCustom && role.id === 'admin') {
      toast.error("Cannot modify Admin permissions");
      return;
    }

    if (!role.isCustom) {
      toast.error("Can only edit custom roles currently.");
      return;
    }

    try {
      await roleService.updateRole(selectedRole, { permissions });
      toast.success("Permissions saved successfully");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to save permissions");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && !role.isCustom) {
      toast.error("Cannot delete default roles");
      return;
    }

    if (!window.confirm("Delete this role?")) return;

    try {
      await roleService.deleteRole(roleId);
      setRoles(roles.filter((r) => r.id !== roleId));
      if (selectedRole === roleId) setSelectedRole("admin");
      toast.success("Role deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete role");
    }
  };

  return (
    <div className="p-[24px] animate-fade-in">
      <Tabs defaultValue="users" className="space-y-[24px]">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 gap-[8px] h-auto p-[8px] bg-muted rounded-[12px]">
          <TabsTrigger value="users" className="h-[40px] rounded-[8px] font-bold text-body-sm data-[state=active]:shadow-sm">Users</TabsTrigger>
          <TabsTrigger value="roles" className="h-[40px] rounded-[8px] font-bold text-body-sm data-[state=active]:shadow-sm">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="access" className="h-[40px] rounded-[8px] font-bold text-body-sm data-[state=active]:shadow-sm">Access Control</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-[24px] focus-visible:outline-none">
          <Card className="border border-border shadow-sm bg-card rounded-[16px]">
            <CardHeader className="p-[24px] border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[16px]">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">User Management</CardTitle>
                  <CardDescription className="text-body-sm font-medium text-muted-foreground mt-[4px]">
                    Manage team members and their access
                  </CardDescription>
                </div>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-[8px] h-[40px] px-[24px] rounded-[8px] font-bold">
                      <MIcon name="person_add" className="text-[20px]" />
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
                        <Label htmlFor="userPassword">Password *</Label>
                        <Input
                          id="userPassword"
                          type="password"
                          value={newUser.password || ""}
                          onChange={(e) =>
                            setNewUser({ ...newUser, password: e.target.value })
                          }
                          placeholder="Enter password"
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
                      <div className="flex justify-end gap-[12px] pt-[16px]">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddUserOpen(false)}
                          className="rounded-[8px] h-[40px] px-[24px] font-bold border-border"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddUser} className="rounded-[8px] h-[40px] px-[24px] font-bold">Add User</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-[24px]">
              {/* Search */}
              <div className="mb-[16px]">
                <div className="relative">
                  <MIcon name="search" className="absolute left-[12px] top-[calc(50%+8px)] -translate-y-1/2 text-[18px] text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-[36px] h-[44px] rounded-[8px] bg-muted dark:bg-slate-950 border-border font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-[12px] border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted dark:bg-slate-950">
                    <TableRow className="border-b border-border">
                      <TableHead className="font-bold text-foreground dark:text-muted-foreground">Name</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-foreground dark:text-muted-foreground">Email</TableHead>
                      <TableHead className="hidden lg:table-cell font-bold text-foreground dark:text-muted-foreground">Phone</TableHead>
                      <TableHead className="font-bold text-foreground dark:text-muted-foreground">Role</TableHead>
                      <TableHead className="hidden sm:table-cell font-bold text-foreground dark:text-muted-foreground">Status</TableHead>
                      <TableHead className="hidden xl:table-cell font-bold text-foreground dark:text-muted-foreground">Last Login</TableHead>
                      <TableHead className="text-right font-bold text-foreground dark:text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-b border-border">
                        <TableCell>
                          <div>
                            <p className="text-foreground font-bold">{user.name}</p>
                            <p className="text-muted-foreground text-[12px] font-medium md:hidden">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground font-medium">
                          {user.email}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground font-medium">
                          {user.phone}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold text-[11px] rounded-[4px]">{user.role}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-[8px]">
                            {user.status === "active" ? (
                              <Badge
                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors shadow-none font-bold text-[11px] rounded-[4px]"
                                onClick={() => toggleUserStatus(user.id, user.status)}
                              >
                                <MIcon name="check_circle" className="text-[12px] mr-[4px]" />
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground border-border cursor-pointer hover:bg-muted transition-colors font-bold text-[11px] rounded-[4px]"
                                onClick={() => toggleUserStatus(user.id, user.status)}
                              >
                                <MIcon name="cancel" className="text-[12px] mr-[4px]" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground font-medium text-[12px]">
                          {user.lastLogin}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-[4px]">
                            <Button variant="ghost" size="sm" className="h-[32px] w-[32px] p-0 rounded-[8px] text-muted-foreground hover:text-primary">
                              <MIcon name="edit" className="text-[18px]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[32px] w-[32px] p-0 rounded-[8px] text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <MIcon name="delete" className="text-[18px]" />
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
        <TabsContent value="roles" className="space-y-[24px] focus-visible:outline-none">
          {/* Roles List */}
          <Card className="border border-border shadow-sm bg-card rounded-[16px]">
            <CardHeader className="p-[24px] border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">Roles</CardTitle>
                  <CardDescription className="text-body-sm font-medium text-muted-foreground mt-[4px]">Manage user roles and their permissions</CardDescription>
                </div>
                <Button className="gap-[8px] h-[40px] px-[24px] rounded-[8px] font-bold">
                  <MIcon name="add" className="text-[20px]" />
                  Create Role
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-[24px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
                {roles.map((role) => (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-all border rounded-[12px] bg-card ${selectedRole === role.id ? "border-primary shadow-md ring-1 ring-primary" : "border-border shadow-sm hover:border-primary/50"
                      }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <CardHeader className="p-[20px] pb-[12px]">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-[12px]">
                          <div className="bg-primary/10 p-[10px] rounded-[10px]">
                            <MIcon name="security" className="text-[20px] text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-body font-bold text-foreground">{role.name}</CardTitle>
                            {role.isCustom && (
                              <Badge variant="outline" className="mt-[4px] text-[10px] uppercase font-bold tracking-wider py-0 rounded-[4px]">Custom</Badge>
                            )}
                          </div>
                        </div>
                        {role.isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-[32px] w-[32px] p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[8px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.id);
                            }}
                          >
                            <MIcon name="delete" className="text-[18px]" />
                          </Button>
                        )}
                      </div>
                      <CardDescription className="text-body-sm text-muted-foreground font-medium mt-[12px]">{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-[20px] pt-0">
                      <div className="flex items-center gap-[6px] text-muted-foreground">
                        <MIcon name="group" className="text-[16px]" />
                        <span className="text-[13px] font-bold">
                          {role.userCount} {role.userCount === 1 ? "user" : "users"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permission Matrix */}
          <Card className="border border-border shadow-sm bg-card rounded-[16px]">
            <CardHeader className="p-[24px] border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">Permission Matrix</CardTitle>
                  <CardDescription className="text-body-sm font-medium text-muted-foreground mt-[4px]">
                    Configure permissions for {roles.find((r) => r.id === selectedRole)?.name} role
                  </CardDescription>
                </div>
                <Button onClick={handleSavePermissions} className="gap-[8px] h-[40px] px-[24px] rounded-[8px] font-bold">
                  <MIcon name="save" className="text-[20px]" />
                  Save Permissions
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-[24px]">
              <div className="rounded-[12px] border border-border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted dark:bg-slate-950">
                    <TableRow className="border-b border-border">
                      <TableHead className="w-[200px] font-bold text-foreground dark:text-muted-foreground">Module</TableHead>
                      <TableHead className="text-center font-bold text-foreground dark:text-muted-foreground">
                        <div className="flex flex-col items-center gap-[4px] py-[8px]">
                          <span>View</span>
                          <div className="flex gap-[4px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => selectAll("view")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => deselectAll("view")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold text-foreground dark:text-muted-foreground">
                        <div className="flex flex-col items-center gap-[4px] py-[8px]">
                          <span>Create</span>
                          <div className="flex gap-[4px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => selectAll("create")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => deselectAll("create")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold text-foreground dark:text-muted-foreground">
                        <div className="flex flex-col items-center gap-[4px] py-[8px]">
                          <span>Edit</span>
                          <div className="flex gap-[4px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => selectAll("edit")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => deselectAll("edit")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold text-foreground dark:text-muted-foreground">
                        <div className="flex flex-col items-center gap-[4px] py-[8px]">
                          <span>Delete</span>
                          <div className="flex gap-[4px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => selectAll("delete")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => deselectAll("delete")}
                            >
                              None
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-bold text-foreground dark:text-muted-foreground">
                        <div className="flex flex-col items-center gap-[4px] py-[8px]">
                          <span>Approve</span>
                          <div className="flex gap-[4px]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
                              onClick={() => selectAll("approve")}
                            >
                              All
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-[24px] px-[8px] text-[11px] font-bold rounded-[4px]"
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
                      <TableRow key={perm.module} className="border-b border-border">
                        <TableCell className="font-bold text-foreground">{perm.module}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.view}
                            onCheckedChange={() => togglePermission(index, "view")}
                            className="w-[18px] h-[18px] rounded-[4px] border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.create}
                            onCheckedChange={() => togglePermission(index, "create")}
                            className="w-[18px] h-[18px] rounded-[4px] border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.edit}
                            onCheckedChange={() => togglePermission(index, "edit")}
                            className="w-[18px] h-[18px] rounded-[4px] border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.delete}
                            onCheckedChange={() => togglePermission(index, "delete")}
                            className="w-[18px] h-[18px] rounded-[4px] border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.approve}
                            onCheckedChange={() => togglePermission(index, "approve")}
                            className="w-[18px] h-[18px] rounded-[4px] border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
        <TabsContent value="access" className="space-y-[24px] focus-visible:outline-none">
          <Card className="border border-border shadow-sm bg-card rounded-[16px]">
            <CardHeader className="p-[24px] border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-2xl font-bold text-foreground">Advanced Access Control</CardTitle>
              <CardDescription className="text-body-sm font-medium text-muted-foreground mt-[4px]">
                Configure visibility and limits for users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-[24px] p-[24px]">
              <div className="space-y-[16px]">
                <h3 className="text-body font-bold text-foreground">User Visibility Controls</h3>
                <p className="text-body-sm font-medium text-muted-foreground">
                  Control what data each user can access based on their role and assignment
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                  <div className="p-[16px] border border-border bg-muted/50 dark:bg-card rounded-[12px] space-y-[12px]">
                    <div className="flex items-center justify-between">
                      <Label className="text-body-sm font-bold text-foreground">Restrict to Assigned Customers</Label>
                      <Switch />
                    </div>
                    <p className="text-[12px] text-muted-foreground font-medium">
                      Users can only see customers assigned to them
                    </p>
                  </div>

                  <div className="p-[16px] border border-border bg-muted/50 dark:bg-card rounded-[12px] space-y-[12px]">
                    <div className="flex items-center justify-between">
                      <Label className="text-body-sm font-bold text-foreground">Restrict to Assigned Warehouses</Label>
                      <Switch />
                    </div>
                    <p className="text-[12px] text-muted-foreground font-medium">
                      Users can only access assigned warehouse data
                    </p>
                  </div>

                  <div className="p-[16px] border border-border bg-muted/50 dark:bg-card rounded-[12px] space-y-[12px]">
                    <div className="flex items-center justify-between">
                      <Label className="text-body-sm font-bold text-foreground">Hide Cost Price</Label>
                      <Switch />
                    </div>
                    <p className="text-[12px] text-muted-foreground font-medium">
                      Hide cost price from sales team
                    </p>
                  </div>

                  <div className="p-[16px] border border-border bg-muted/50 dark:bg-card rounded-[12px] space-y-[12px]">
                    <div className="flex items-center justify-between">
                      <Label className="text-body-sm font-bold text-foreground">Restrict Financial Reports</Label>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-[12px] text-muted-foreground font-medium">
                      Only admins can view P&L and balance sheet
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-[16px] border-t border-border pt-[24px]">
                <h3 className="text-body font-bold text-foreground">Transaction Limits</h3>
                <p className="text-body-sm font-medium text-muted-foreground">
                  Set limits on transaction values for different roles
                </p>

                <div className="space-y-[12px]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] items-end">
                    <div className="space-y-[8px]">
                      <Label className="text-body-sm font-bold text-foreground">Role</Label>
                      <Select defaultValue="salesman">
                        <SelectTrigger className="h-[44px] rounded-[8px] bg-white border-slate-200 hover:bg-muted">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salesman">Salesman</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-[8px]">
                      <Label className="text-body-sm font-bold text-foreground">Max Invoice Amount (₹)</Label>
                      <Input type="number" placeholder="100000" className="h-[44px] rounded-[8px]" />
                    </div>
                    <div className="space-y-[8px]">
                      <Label className="text-body-sm font-bold text-foreground">Max Discount %</Label>
                      <Input type="number" placeholder="10" className="h-[44px] rounded-[8px]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-[16px]">
                <Button className="gap-[8px] h-[40px] px-[24px] rounded-[8px] font-bold">
                  <MIcon name="save" className="text-[20px]" />
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
