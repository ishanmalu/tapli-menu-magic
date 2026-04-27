import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Role values stored in the database — always English keys
const RESTAURANT_ROLE_KEYS = [
  "Owner",
  "General Manager",
  "Head Chef",
  "Sous Chef",
  "Floor Manager",
  "Marketing Manager",
  "Operations Manager",
] as const;

type Step = "form" | "verify" | "forgot" | "forgot-sent";

export default function Auth() {
  const { user, loading, signIn, signUp, verifyOtp, resetPassword } = useAuth();
  const { t } = useLanguage();

  // Role labels mapped to translations — values stored in DB stay English, display is translated
  const roleLabels: Record<string, string> = {
    "Owner": t("owner"),
    "General Manager": t("generalManager"),
    "Head Chef": t("headChef"),
    "Sous Chef": t("sousChef"),
    "Floor Manager": t("floorManager"),
    "Marketing Manager": t("marketingManager"),
    "Operations Manager": t("operationsManager"),
  };
  const { theme } = useTheme();
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

  useEffect(() => {
    if (step === "forgot" || step === "forgot-sent") document.title = "Tapli — Reset Password";
    else document.title = isLogin ? "Tapli — Sign In" : "Tapli — Sign Up";
  }, [isLogin, step]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t("passwordsDontMatch"), description: t("passwordsMatchDesc"), variant: "destructive" });
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({ title: t("weakPassword"), description: t("weakPasswordDesc"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const finalRole = role === "Other" ? customRole : role;
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        restaurant_name: restaurantName,
        role: finalRole,
      });
      if (error) throw error;
      setStep("verify");
      toast({ title: t("verificationSent"), description: t("checkEmail") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await verifyOtp(email, otpCode);
      if (error) throw error;
    } catch (err: any) {
      toast({ title: t("verificationFailed"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setStep("forgot-sent");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-8">
      <div className="fixed top-4 right-4">
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <div className="fixed top-4 left-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Tapli
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={theme === "dark" ? tapliLogoDark : tapliLogo} alt="Tapli" className="mx-auto mb-2 h-10 w-auto" />
          <CardDescription>
            {step === "verify"
              ? t("verifyDesc")
              : step === "forgot"
              ? t("forgotPasswordDesc")
              : step === "forgot-sent"
              ? t("resetLinkSentDesc")
              : isLogin
              ? t("signInDesc")
              : t("createAccount")}
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
                {submitting ? t("verifying") : t("verifyEmail")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("didntReceive")}{" "}
                <button
                  type="button"
                  onClick={() => { setStep("form"); setOtpCode(""); }}
                  className="text-primary underline-offset-4 hover:underline font-medium"
                >
                  {t("goBack")}
                </button>
              </p>
            </form>
          ) : step === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t("sendingResetLink") : t("sendResetLink")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-primary underline-offset-4 hover:underline font-medium"
                >
                  {t("backToSignIn")}
                </button>
              </p>
            </form>
          ) : step === "forgot-sent" ? (
            <div className="space-y-4 text-center">
              <p className="text-4xl">📧</p>
              <p className="text-sm text-muted-foreground">{t("resetLinkSentDesc")}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setStep("form"); setEmail(""); }}
              >
                {t("backToSignIn")}
              </Button>
            </div>
          ) : isLogin ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setStep("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  {t("forgotPassword")}
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t("signingIn") : t("signIn")}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <Input placeholder={t("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <Input placeholder={t("restaurantName")} value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t("yourPosition")} />
                </SelectTrigger>
                <SelectContent>
                  {RESTAURANT_ROLE_KEYS.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                  <SelectItem value="Other">{t("other")}</SelectItem>
                </SelectContent>
              </Select>
              {role === "Other" && (
                <Input placeholder={t("enterPosition")} value={customRole} onChange={(e) => setCustomRole(e.target.value)} required />
              )}
              <Input type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <Input type="password" placeholder={t("confirmPassword")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t("creatingAccount") : t("createAccount")}
              </Button>
            </form>
          )}
          {step === "form" && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isLogin ? t("noAccount") : t("haveAccount")}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary underline-offset-4 hover:underline font-medium">
                {isLogin ? t("signUp") : t("signIn")}
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}