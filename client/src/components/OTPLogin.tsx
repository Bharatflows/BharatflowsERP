import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Smartphone, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { AuthLayout } from "./layout/AuthLayout";
import { Logo } from "./common/Logo";

export function OTPLogin() {
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate sending OTP
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await verifyOTP(phone, otp);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
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

        {/* Icon + Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in with OTP
            </h2>
            <p className="text-sm text-muted-foreground">
              {step === "phone"
                ? "Enter your phone number to receive a code"
                : "Enter the 6-digit code sent to your phone"}
            </p>
          </div>
        </div>

        {/* Phone Step */}
        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm text-foreground">
              <p className="font-medium">Demo mode</p>
              <p className="text-muted-foreground mt-0.5">Enter any phone number. OTP: <span className="font-mono font-semibold text-foreground">123456</span></p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone number
              </Label>
              <div className="flex">
                <div className="flex items-center justify-center px-3 border border-r-0 border-input bg-muted rounded-l-md text-muted-foreground text-sm font-medium">
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="h-10 rounded-l-none"
                  placeholder="98765 43210"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={phone.length < 10 || isLoading}
              className="w-full h-10 font-medium shadow-sm transition-all"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : null}
              {isLoading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          /* OTP Step */
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm border border-destructive/20">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="text-center p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">OTP sent to</p>
              <p className="font-semibold text-foreground mt-0.5">+91 {phone}</p>
            </div>

            <div className="flex justify-center py-2">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <InputOTPSlot
                      key={idx}
                      index={idx}
                      className="w-10 h-12 text-lg font-semibold border-input"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-10 font-medium shadow-sm transition-all"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : null}
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                }}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Back navigation */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              if (step === "otp") {
                setStep("phone");
                setOtp("");
              } else {
                navigate("/login");
              }
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            {step === "otp" ? "Change number" : "Back to sign in"}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
