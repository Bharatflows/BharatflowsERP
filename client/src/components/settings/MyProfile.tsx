import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Bell,
  Globe,
  Palette,
  Save,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "../ui/separator";
import { profileService } from "../../services/modules.service";
import { TwoFactorSetup } from "./TwoFactorSetup";

export function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    designation: "",
    bio: "",
    language: "English",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "Indian",
    theme: "Light",
  });

  const [notifications, setNotifications] = useState({
    emailInvoice: true,
    emailPayment: true,
    emailLowStock: true,
    emailGST: false,
    mobileInvoice: true,
    mobilePayment: true,
    mobileLowStock: false,
    mobileGST: false,
    whatsappInvoice: false,
    whatsappPayment: true,
    whatsappLowStock: false,
    whatsappGST: false,
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileService.getProfile();
      if (res.success && res.data) {
        const data = res.data;
        setProfile({
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          department: data.companyName, // Using Company Name as Dept/Org for now or separate field
          designation: data.designation || "",
          bio: data.bio || "",
          language: data.preferences?.language || "English",
          timezone: data.preferences?.timezone || "Asia/Kolkata",
          dateFormat: data.preferences?.dateFormat || "DD/MM/YYYY",
          numberFormat: "Indian", // Not in schema yet?
          theme: data.preferences?.theme || "Light",
        });
        if (data.notificationSettings) {
          setNotifications({ ...notifications, ...data.notificationSettings });
        }
      }
    } catch (error) {
      console.error("Error fetching profile", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const payload = {
        name: profile.name,
        phone: profile.phone,
        designation: profile.designation,
        bio: profile.bio,
        preferences: {
          language: profile.language,
          timezone: profile.timezone,
          dateFormat: profile.dateFormat,
          theme: profile.theme
        },
        notificationSettings: notifications
      };

      await profileService.updateProfile(payload);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile", error);
      toast.error("Failed to update profile");
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await profileService.updateNotificationSettings(notifications);
      toast.success("Notification settings saved");
    } catch (error: any) {
      console.error("Error saving notifications", error);
      toast.error(error?.response?.data?.message || "Failed to save notification settings");
    }
  };

  const handleChangePassword = async () => {
    // Client-side validation
    if (!password.current) {
      toast.error("Please enter your current password");
      return;
    }
    if (password.new.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (password.new !== password.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await profileService.changePassword({
        currentPassword: password.current,
        newPassword: password.new,
        confirmPassword: password.confirm
      });
      toast.success("Password changed successfully");
      setPassword({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      console.error("Error changing password", error);
      const errorMessage = error?.response?.data?.errors?.currentPassword
        || error?.response?.data?.message
        || "Failed to change password";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-6">
      <Tabs defaultValue="profile" className="space-y-6">
        {/* Underline-style tabs instead of filled */}
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-0">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-muted-foreground data-[state=active]:text-primary"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-muted-foreground data-[state=active]:text-primary"
          >
            Preferences
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-muted-foreground data-[state=active]:text-primary"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-muted-foreground data-[state=active]:text-primary"
          >
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture - Using primary color instead of purple */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <span className="text-3xl font-medium">{profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'RK'}</span>
                  </div>
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                    aria-label="Change profile photo"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                  <p className="text-muted-foreground">
                    JPG or PNG, max 2MB
                  </p>
                </div>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="pl-10 bg-muted cursor-not-allowed"
                      title="Email cannot be changed. Contact support if needed."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={profile.role} disabled />
                  <p className="text-muted-foreground">
                    Contact admin to change your role
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-purple-light p-3 rounded-lg">
                  <Globe className="h-6 w-6 text-purple" />
                </div>
                <div>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>Customize your regional settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => setProfile({ ...profile, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">हिंदी (Hindi)</SelectItem>
                      <SelectItem value="Tamil">தமிழ் (Tamil)</SelectItem>
                      <SelectItem value="Telugu">తెలుగు (Telugu)</SelectItem>
                      <SelectItem value="Kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                      <SelectItem value="Marathi">मराठी (Marathi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">
                        IST (UTC +5:30)
                      </SelectItem>
                      <SelectItem value="Asia/Dubai">
                        GST (UTC +4:00)
                      </SelectItem>
                      <SelectItem value="America/New_York">
                        EST (UTC -5:00)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={profile.dateFormat}
                    onValueChange={(value) => setProfile({ ...profile, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">
                        DD/MM/YYYY (24/11/2024)
                      </SelectItem>
                      <SelectItem value="MM/DD/YYYY">
                        MM/DD/YYYY (11/24/2024)
                      </SelectItem>
                      <SelectItem value="YYYY-MM-DD">
                        YYYY-MM-DD (2024-11-24)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberFormat">Number Format</Label>
                  <Select
                    value={profile.numberFormat}
                    onValueChange={(value) => setProfile({ ...profile, numberFormat: value })}
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
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-warning-light p-3 rounded-lg">
                  <Palette className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the app looks for you</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${profile.theme === "Light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                      }`}
                    onClick={() => setProfile({ ...profile, theme: "Light" })}
                  >
                    <div className="bg-white rounded p-4 space-y-2 mb-3">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <p className="text-foreground text-center">Light</p>
                  </div>
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${profile.theme === "Dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                      }`}
                    onClick={() => setProfile({ ...profile, theme: "Dark" })}
                  >
                    <div className="bg-gray-800 rounded p-4 space-y-2 mb-3">
                      <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <p className="text-foreground text-center">Dark</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Appearance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-success-light p-3 rounded-lg">
                  <Bell className="h-6 w-6 text-success" />
                </div>
                <div>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about important events
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple" />
                  <h3 className="text-foreground">Email Notifications</h3>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">Invoice Created</p>
                      <p className="text-muted-foreground">
                        Get notified when a new invoice is created
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailInvoice}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailInvoice: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">Payment Received</p>
                      <p className="text-muted-foreground">
                        Get notified when payment is received
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailPayment}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailPayment: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">Low Stock Alert</p>
                      <p className="text-muted-foreground">
                        Get notified when stock is running low
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailLowStock}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailLowStock: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">GST Filing Reminder</p>
                      <p className="text-muted-foreground">
                        Get reminded about GST filing deadlines
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailGST}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailGST: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Mobile Notifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-success" />
                  <h3 className="text-foreground">Mobile Push Notifications</h3>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">Invoice Created</p>
                    </div>
                    <Switch
                      checked={notifications.mobileInvoice}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, mobileInvoice: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">Payment Received</p>
                    </div>
                    <Switch
                      checked={notifications.mobilePayment}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, mobilePayment: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">Low Stock Alert</p>
                    </div>
                    <Switch
                      checked={notifications.mobileLowStock}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, mobileLowStock: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* WhatsApp Notifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-success" />
                  <h3 className="text-foreground">WhatsApp Notifications</h3>
                  <Badge variant="outline" className="bg-success/10 text-success">
                    Premium
                  </Badge>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">Invoice Created</p>
                    </div>
                    <Switch
                      checked={notifications.whatsappInvoice}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, whatsappInvoice: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-foreground">Payment Received</p>
                    </div>
                    <Switch
                      checked={notifications.whatsappPayment}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, whatsappPayment: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-error-light p-3 rounded-lg">
                  <Lock className="h-6 w-6 text-error" />
                </div>
                <div>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                  />
                  <p className="text-muted-foreground">
                    Must be at least 8 characters with letters and numbers
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleChangePassword} className="gap-2">
                  <Save className="h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <TwoFactorSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
