import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type PlanId = "monthly" | "quarterly" | "annual";

interface PricingPlansProps {
  ctaLabel: string;
  /** trial = links to /auth, subscribe = triggers onSelect with loading state */
  mode: "trial" | "subscribe";
  loadingPlan?: PlanId | null;
  onSelect?: (plan: PlanId) => void;
}

export function PricingPlans({ ctaLabel, mode, loadingPlan, onSelect }: PricingPlansProps) {
  const { t } = useLanguage();

  // Features shown on each plan card
  // Monthly gets 8 core features
  // Quarterly gets everything Monthly has + 6 more
  // Annual gets everything Quarterly has + 6 premium features
  const monthlyFeatures = [
    t("feat1Menu"),
    t("feat50Items"),
    t("featQrNfc"),
    t("featAllergenInfo"),
    t("featPhotoUploads"),
    t("featBilingual"),
    t("featRealtimeUpdates"),
    t("featCustomColours"),
  ];

  const quarterlyFeatures = [
    ...monthlyFeatures,
    t("feat3Menus"),
    t("featUnlimitedItems"),
    t("featItemBadges"),
    t("featAnalytics"),
    t("featPdfExport"),
    t("featPrioritySupport"),
  ];

  const annualFeatures = [
    ...quarterlyFeatures,
    t("featExtraLanguages"),
    t("featUnlimitedMenus"),
    t("featTimedMenus"),
    t("featCustomQr"),
    t("featOnboarding"),
    t("featAccountManager"),
  ];

  const plans: Array<{
    id: PlanId;
    name: string;
    price: string;
    billing: string;
    badge?: string;
    secondaryBadge?: string;
    highlighted?: boolean;
    features: string[];
  }> = [
    {
      id: "monthly",
      name: t("planMonthly"),
      price: "€35",
      billing: t("billedMonthly"),
      features: monthlyFeatures,
    },
    {
      id: "quarterly",
      name: t("planQuarterly"),
      price: "€29",
      billing: t("billedQuarterly"),
      badge: t("save17"),
      features: quarterlyFeatures,
    },
    {
      id: "annual",
      name: t("planAnnual"),
      price: "€25",
      billing: t("billedAnnually"),
      badge: t("mostPopular"),
      secondaryBadge: t("save29"),
      highlighted: true,
      features: annualFeatures,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3 items-stretch">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative flex flex-col",
            plan.highlighted && "border-2 border-foreground shadow-lg md:scale-[1.02]"
          )}
        >
          {/* Most Popular badge pinned above the card */}
          {plan.highlighted && plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="px-3 py-1">{plan.badge}</Badge>
            </div>
          )}

          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              {/* Save % badge for non-highlighted plans */}
              {!plan.highlighted && plan.badge && (
                <Badge variant="secondary">{plan.badge}</Badge>
              )}
              {/* Save % secondary badge for highlighted plan */}
              {plan.highlighted && plan.secondaryBadge && (
                <Badge variant="secondary">{plan.secondaryBadge}</Badge>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{plan.billing}</p>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-6">
            {/* Feature list — differs per plan */}
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA button — links to /auth on pricing page, triggers Stripe on upgrade page */}
            <div className="mt-auto">
              {mode === "trial" ? (
                <Link to="/auth" className="block">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {ctaLabel}
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={loadingPlan !== null}
                  onClick={() => onSelect?.(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    ctaLabel
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
