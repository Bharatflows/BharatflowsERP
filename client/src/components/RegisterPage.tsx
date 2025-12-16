import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Zap, Building2, User, Mail, Smartphone, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    businessType: "",
    gstin: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError("");
  };

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }

    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      return "Please enter a valid 10-digit phone number";
    }

    // Password strength
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long";
    }

    // Password match
    if (formData.password !== formData.confirmPassword) {
      return "Passwords don't match";
    }

    // Required fields
    if (!formData.businessName.trim()) return "Business Name is required";
    if (!formData.ownerName.trim()) return "Owner Name is required";
    if (!formData.businessType) return "Please select a Business Type";
    if (!agreedToTerms) return "Please agree to the Terms and Conditions";

    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.ownerName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        companyName: formData.businessName,
        gstin: formData.gstin,
      });
      // Navigation is handled in AuthContext or component will unmount
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-emerald-50 flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 hover:bg-white/50 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Login
        </Button>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl shadow-lg mb-6"
              >
                <Zap className="size-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 mb-3">
                Create Your Account
              </h1>
              <p className="text-muted-foreground text-lg">
                Join thousands of businesses growing with BharatFlow
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl flex items-center gap-3 text-red-600"
                >
                  <AlertCircle className="size-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Business Details */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-blue-600 font-semibold border-b border-blue-100 pb-2">
                    <Building2 className="size-5" />
                    <h3>Business Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="businessName"
                        placeholder="e.g. Sharma Enterprises"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                        className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.businessType}
                        onValueChange={(value) => handleInputChange("businessType", value)}
                      >
                        <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retail">Retail Shop</SelectItem>
                          <SelectItem value="wholesale">Wholesale / Distribution</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="services">Services / Consulting</SelectItem>
                          <SelectItem value="trading">Trading</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gstin">GST Number <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                      <Input
                        id="gstin"
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstin}
                        onChange={(e) => handleInputChange("gstin", e.target.value)}
                        className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all uppercase"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold border-b border-emerald-100 pb-2">
                    <User className="size-5" />
                    <h3>Owner Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="ownerName"
                        placeholder="e.g. Rahul Sharma"
                        value={formData.ownerName}
                        onChange={(e) => handleInputChange("ownerName", e.target.value)}
                        className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="rahul@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="pl-9 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="98765 43210"
                          value={formData.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            handleInputChange("phone", val);
                          }}
                          className="pl-9 bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-5 pt-4">
                <div className="flex items-center gap-2 text-purple-600 font-semibold border-b border-purple-100 pb-2">
                  <Lock className="size-5" />
                  <h3>Security</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="pr-10 bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="pr-10 bg-white/50 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  I agree to the <a href="#" className="text-blue-600 hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>. I consent to receive updates via email/SMS.
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create Account
                    <CheckCircle2 className="size-5" />
                  </div>
                )}
              </Button>
            </form>
          </div>

          <div className="bg-gray-50/50 p-6 text-center border-t border-gray-100">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
