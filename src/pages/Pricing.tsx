import { useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PricingPlans } from "@/components/PricingPlans";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Pricing() {
  const { t } = useLanguage();

  useEffect(() => { document.title = "Tapli — Pricing"; }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* Back to home button — same style as the Auth page */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Tapli
          </Button>
        </Link>
      </div>

      <section className="px-4 pt-16 pb-10 text-center max-w-3xl mx-auto">
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