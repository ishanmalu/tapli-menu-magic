import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Leaf } from "lucide-react";

const RESTAURANT_ROLES = [
  "Owner",
  "General Manager",
  "Head Chef",
  "Sous Chef",
  "Floor Manager",
  "Marketing Manager",
  "Operations Manager",
];

type Step = "form" | "verify";

export default function Auth() {
  const { user, loading, signIn, signUp, verifyOtp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<Step>("form");

  // Sign-up fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are identical.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const finalRole = role === "Other" ? customRole : role;
    const { error } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      restaurant_name: restaurantName,
      role: finalRole,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setStep("verify");
      toast({ title: "Verification code sent!", description: "Check your email for the 6-digit code." });
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await verifyOtp(email, otpCode);
    setSubmitting(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Tapli</CardTitle>
          <CardDescription>
            {step === "verify"
              ? "Enter the verification code sent to your email"
              : isLogin
              ? "Sign in to manage your menu"
              : "Create your restaurant account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || otpCode.length < 6}>
                {submitting ? "Verifying..." : "Verify Email"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={() => { setStep("form"); setOtpCode(""); }}
                  className="text-primary underline-offset-4 hover:underline font-medium"
                >
                  Go back
                </button>
              </p>
            </form>
          ) : isLogin ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <Input placeholder="Restaurant name" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Your position at the restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {RESTAURANT_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {role === "Other" && (
                <Input placeholder="Enter your position" value={customRole} onChange={(e) => setCustomRole(e.target.value)} required />
              )}
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}
          {step === "form" && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary underline-offset-4 hover:underline font-medium">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}