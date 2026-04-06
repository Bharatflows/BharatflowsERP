import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, Globe, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { masterDataService, BusinessType } from "../services/masterData.service";
import { INDIAN_STATES } from "../constants";
import { AuthLayout } from "./layout/AuthLayout";
import { GoogleLogin } from "@react-oauth/google";
import { Logo } from "./common/Logo";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    phone: "",
    country: "India",
    state: "",
    city: "",
    businessType: "MANUFACTURER",
    ownerName: "",
    gstin: "",
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  const fetchBusinessTypes = async () => {
    try {
      const types = await masterDataService.getBusinessTypes();
      setBusinessTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error("Failed to load business types", err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms & Conditions");
      return;
    }

    if (!formData.businessName || !formData.email || !formData.password || !formData.phone || !formData.state) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const name = formData.ownerName || formData.businessName;

      await register({
        name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        companyName: formData.businessName,
        gstin: formData.gstin || undefined,
        businessType: formData.businessType,
        sector: "MANUFACTURING",
        city: formData.city || "Mumbai",
        state: formData.state,
        industryIds: [],
        productNames: [],
      });
      navigate("/setup");
      toast.success("Account created successfully!");
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="mb-4">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="text-sm text-muted-foreground">
            Get started with BharatFlow in minutes
          </p>
        </div>

        {/* Google Sign-Up */}
        <div className="flex items-center justify-center">
          <GoogleLogin
            onSuccess={() => toast.success("Google Login logic here (placeholder)")}
            onError={() => toast.error("Login Failed")}
            width="400"
            shape="rectangular"
            theme="outline"
            text="signup_with"
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              or continue with email
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Business Name + Your Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-sm font-medium text-foreground">
                Business name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
                className="h-10"
                placeholder="Acme Industries"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ownerName" className="text-sm font-medium text-foreground">
                Your name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => handleInputChange("ownerName", e.target.value)}
                className="h-10"
                placeholder="Full name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="h-10"
              placeholder="name@company.com"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="h-10"
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone <span className="text-destructive">*</span>
            </Label>
            <div className="flex">
              <div className="flex items-center justify-center px-3 border border-r-0 border-input bg-muted rounded-l-md text-muted-foreground text-sm font-medium">
                +91
              </div>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="h-10 rounded-l-none"
                placeholder="98765 43210"
              />
            </div>
          </div>

          {/* Country & State */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Country</Label>
              <div className="h-10 w-full px-3 border border-input rounded-md bg-muted text-muted-foreground flex items-center text-sm font-medium cursor-not-allowed">
                <Globe size={14} className="mr-2 shrink-0" /> India
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-sm font-medium text-foreground">
                State <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.state} onValueChange={(v) => handleInputChange("state", v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-2 pt-1">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(c) => setAgreedToTerms(!!c)}
              className="mt-0.5 rounded"
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
            >
              I agree to the{" "}
              <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-10 font-medium shadow-sm transition-all"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Create account
            {!isLoading && <ArrowRight className="ml-2" size={16} />}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Your data will be stored in <span className="font-semibold text-foreground">India</span> data center.
          </p>
        </form>

        {/* Sign in */}
        <Separator />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
