import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

type PageState = "loading" | "form" | "done" | "invalid";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Tapli — Reset Password";

    // Supabase embeds the recovery tokens in the URL hash when the user
    // clicks the reset link in their email. onAuthStateChange fires with
    // event "PASSWORD_RECOVERY" once those tokens are exchanged.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("form");
      } else if (event === "SIGNED_IN" && pageState === "loading") {
        // Already signed in, no recovery token in URL — invalid landing
        setPageState("invalid");
      }
    });

    // Also handle the case where the hash is present but onAuthStateChange
    // fires before this effect (race condition guard).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && pageState === "loading") {
        // A session was established via the recovery link
        setPageState("form");
      } else if (!session && pageState === "loading") {
        // No session and no recovery event — bad link or already expired
        setTimeout(() => {
          setPageState((prev) => (prev === "loading" ? "invalid" : prev));
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: t("passwordsDontMatch"), description: t("passwordsMatchDesc"), variant: "destructive" });
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast({ title: t("weakPassword"), description: t("weakPasswordDesc"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPageState("done");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-8">
      <div className="fixed top-4 right-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src={theme === "dark" ? tapliLogoDark : tapliLogo}
            alt="Tapli"
            className="mx-auto mb-2 h-10 w-auto"
          />
          <CardDescription>
            {pageState === "done"
              ? t("passwordUpdatedDesc")
              : pageState === "invalid"
              ? t("resetLinkSentDesc")
              : t("forgotPasswordDesc")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {pageState === "loading" && (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {pageState === "invalid" && (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground text-sm">
                This link is invalid or has already been used. Request a new one from the sign-in page.
              </p>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                {t("backToSignIn")}
              </Button>
            </div>
          )}

          {pageState === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder={t("newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <Input
                type="password"
                placeholder={t("confirmNewPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t("updatingPassword") : t("updatePassword")}
              </Button>
            </form>
          )}

          {pageState === "done" && (
            <div className="space-y-4 text-center">
              <p className="text-4xl">✅</p>
              <p className="text-sm text-muted-foreground">{t("passwordUpdatedDesc")}</p>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                {t("signIn")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
