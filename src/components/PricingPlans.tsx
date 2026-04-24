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
  /** If true, renders buttons that trigger onSelect with a loading state. Otherwise renders Link to /auth. */
  mode: "trial" | "subscribe";
  loadingPlan?: PlanId | null;
  onSelect?: (plan: PlanId) => void;
}

export function PricingPlans({ ctaLabel, mode, loadingPlan, onSelect }: PricingPlansProps) {
  const { t } = useLanguage();

  const features = [
    t("featUnlimitedMenus"),
    t("featRealtimeUpdates"),
    t("featQrNfc"),
    t("featAllergenInfo"),
    t("featPhotoUploads"),
    t("featBilingual"),
  ];

  const plans: Array<{
    id: PlanId;
    name: string;
    price: string;
    billing: string;
    badge?: string;
    secondaryBadge?: string;
    highlighted?: boolean;
  }> = [
    {
      id: "monthly",
      name: t("planMonthly"),
      price: "€35",
      billing: t("billedMonthly"),
    },
    {
      id: "quarterly",
      name: t("planQuarterly"),
      price: "€29",
      billing: t("billedQuarterly"),
      badge: t("save17"),
    },
    {
      id: "annual",
      name: t("planAnnual"),
      price: "€25",
      billing: t("billedAnnually"),
      badge: t("mostPopular"),
      secondaryBadge: t("save29"),
      highlighted: true,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative flex flex-col",
            plan.highlighted && "border-2 border-foreground shadow-lg md:scale-[1.02]"
          )}
        >
          {plan.highlighted && plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="px-3 py-1">{plan.badge}</Badge>
            </div>
          )}

          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              {!plan.highlighted && plan.badge && (
                <Badge variant="secondary">{plan.badge}</Badge>
              )}
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
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

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