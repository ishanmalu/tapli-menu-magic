import { useEffect } from "react";
import { PricingPlans } from "@/components/PricingPlans";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

export default function Pricing() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  useEffect(() => { document.title = "Tapli — Pricing"; }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={theme === "dark" ? tapliLogoDark : tapliLogo} alt="Tapli" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <section className="px-4 pt-10 pb-10 text-center max-w-3xl mx-auto">
        <div className="flex justify-start mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t("returnHome")}
          </Link>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          {t("pricingTitle")}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">{t("pricingSubtitle")}</p>
        <p className="text-sm text-muted-foreground">{t("freeTrialNote")}</p>
      </section>

      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <PricingPlans mode="trial" ctaLabel={t("startFreeTrial")} />
      </section>
    </div>
  );
}