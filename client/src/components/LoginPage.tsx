import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { AuthLayout } from "./layout/AuthLayout";
import { Logo } from "./common/Logo";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !password) {
      toast.error("Please enter both email/phone and password");
      return;
    }

    setLoading(true);
    try {
      await login(emailOrPhone, password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login failed", err);
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
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
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to your workspace
          </p>
        </div>

        {/* Google Sign-In */}
        <div className="flex items-center justify-center">
          <GoogleLogin
            onSuccess={() => toast.success("Google Login Logic")}
            onError={() => toast.error("Login Failed")}
            width="400"
            shape="rectangular"
            theme="outline"
            text="signin_with"
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
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email or Phone
            </Label>
            <Input
              id="email"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="h-10"
              placeholder="name@company.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 pr-10"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="remember" className="rounded" />
            <label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Remember me for 30 days
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-10 font-medium shadow-sm transition-all"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : null}
            Sign in
            {!loading && <ArrowRight className="ml-2" size={16} />}
          </Button>
        </form>

        {/* OTP Login */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/otp-login')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in with OTP instead
          </button>
        </div>

        {/* Sign up */}
        <Separator />
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Create account
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}