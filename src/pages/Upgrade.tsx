import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PricingPlans } from "@/components/PricingPlans";
import { useLanguage } from "@/contexts/LanguageContext";

type PlanId = "monthly" | "quarterly" | "annual";

export default function Upgrade() {
  const { t } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const handleSelect = (plan: PlanId) => {
    setLoadingPlan(plan);
    // Placeholder — Stripe will be connected later
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      <section className="px-4 pt-16 pb-10 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          {t("upgradeTitle")}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">{t("upgradeSubtitle")}</p>
        <p className="text-sm text-muted-foreground">{t("freeTrialNote")}</p>
      </section>

      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <PricingPlans
          mode="subscribe"
          ctaLabel={t("subscribeNow")}
          loadingPlan={loadingPlan}
          onSelect={handleSelect}
        />
      </section>
    </div>
  );
}