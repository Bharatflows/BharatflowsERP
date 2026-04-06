import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { authService } from "../services/auth.service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AuthLayout } from "./layout/AuthLayout";
import { Logo } from "./common/Logo";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div className="mb-4">
          <Logo />
        </div>

        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Reset your password
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                  placeholder="name@company.com"
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-medium shadow-sm transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Mail className="mr-2" size={16} />
                )}
                Send reset link
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
                >
                  <ArrowLeft size={14} className="mr-1.5" />
                  Back to sign in
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-semibold text-foreground">Check your inbox</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="w-full h-10 mt-4"
            >
              <ArrowLeft size={14} className="mr-1.5" />
              Back to sign in
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}