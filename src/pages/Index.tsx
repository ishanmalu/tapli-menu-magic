import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, BarChart3, ArrowRight, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

export default function Index() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="border-b bg-card sticky top-0 z-50 will-change-transform [transform:translateZ(0)]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={theme === "dark" ? tapliLogoDark : tapliLogo} alt="Tapli" className="h-7 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            {/* Text links — hidden on mobile, visible from sm up */}
            <div className="hidden sm:flex items-center gap-1">
              <Link to="/why">
                <Button variant="ghost" size="sm">{t("whyNav")}</Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" size="sm">{t("pricing")}</Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" size="sm">{t("contact")}</Button>
              </Link>
              <Link to="/auth">
                <Button variant="ghost" size="sm">{t("signIn")}</Button>
              </Link>
            </div>
            <Link to="/auth">
              <Button size="sm">{t("getStarted")}</Button>
            </Link>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-20 pb-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-6">
          <QrCode className="h-4 w-4" /> {t("heroChip")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
          {t("heroTitle")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          {t("heroDesc")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="gap-2 text-base px-8">
              {t("startFree")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="https://tapli-menu-magic.pages.dev/menu/tapli-demo" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="gap-2 text-base px-8">
              <ExternalLink className="h-4 w-4" /> {t("viewDemo")}
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20 max-w-4xl mx-auto flex-1">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: QrCode, title: t("featureQr"), desc: t("featureQrDesc") },
            { icon: Smartphone, title: t("featureMobile"), desc: t("featureMobileDesc") },
            { icon: BarChart3, title: t("featureRealtime"), desc: t("featureRealtimeDesc") },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <Icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Tapli. {t("footerText")}
      </footer>
    </div>
  );
}
