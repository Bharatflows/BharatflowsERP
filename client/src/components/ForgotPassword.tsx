import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
      toast.success("Password reset link sent to your email!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Login
        </Button>

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <Zap className="size-8 text-white" />
            </div>
          </div>
          <h1 className="mb-2">Forgot Password?</h1>
          <p className="text-muted-foreground">
            {emailSent
              ? "Check your email for reset instructions"
              : "Enter your email to receive reset instructions"}
          </p>
        </div>

        {/* Reset Form or Success Message */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle className="size-16 text-green-600" />
                </div>
              </div>
              <h3 className="text-foreground">Email Sent Successfully!</h3>
              <p className="text-muted-foreground">
                We've sent password reset instructions to{" "}
                <span className="text-foreground">{email}</span>
              </p>
              <p className="text-muted-foreground">
                Please check your inbox and spam folder.
              </p>
              <Button
                className="w-full h-12 mt-4"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Demo Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2"><strong>Demo Mode:</strong></p>
                <p className="text-sm text-blue-600">Enter any email to simulate password reset</p>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>

              {/* Additional Info */}
              <p className="text-center text-muted-foreground">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}