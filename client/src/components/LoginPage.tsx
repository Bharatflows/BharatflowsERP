import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Zap, Mail, Lock, Eye, EyeOff, Smartphone, LogIn, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { GoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!emailOrPhone.trim()) return "Please enter your Email or Phone";
    if (!password) return "Please enter your Password";
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
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
      await login(emailOrPhone, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl shadow-lg mb-6"
              >
                <Zap className="size-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">
                Sign in to manage your business
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
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

              <div className="space-y-4">
                {/* Email/Phone Input */}
                <div className="space-y-2">
                  <Label htmlFor="emailOrPhone" className="text-gray-700 font-medium">Email or Phone Number</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="emailOrPhone"
                      type="text"
                      placeholder="name@example.com or 9876543210"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="pl-10 h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <LogIn className="size-5" />
                  </div>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <Separator className="flex-1 bg-gray-200" />
              <span className="text-muted-foreground text-sm font-medium">OR CONTINUE WITH</span>
              <Separator className="flex-1 bg-gray-200" />
            </div>

            {/* Google Login Button */}
            <div className="mb-4">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      await googleLogin(credentialResponse.credential);
                      navigate('/dashboard');
                    } catch (err) {
                      console.error("Google Login Error:", err);
                    }
                  }
                }}
                onError={() => {
                  console.log('Login Failed');
                  toast.error('Google Login Failed');
                }}
                useOneTap
                theme="filled_blue"
                shape="pill"
                width="100%"
              />
            </div>

            {/* OTP Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium rounded-xl transition-all"
              onClick={() => navigate('/otp-login')}
            >
              <Smartphone className="size-5 text-blue-600" />
              Login with OTP
            </Button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50/50 p-6 text-center border-t border-gray-100">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-muted-foreground/60 mt-8 text-sm">
          Protected by BharatFlow Security • Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}