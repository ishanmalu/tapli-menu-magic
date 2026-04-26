import { Link } from "react-router-dom";
import { QrCode, Nfc, RefreshCw, ShieldCheck, Banknote, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

export default function Why() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const reasons = [
    { icons: [QrCode, Nfc], title: t("why1Title"), desc: t("why1Desc") },
    { icons: [RefreshCw],   title: t("why2Title"), desc: t("why2Desc") },
    { icons: [ShieldCheck], title: t("why3Title"), desc: t("why3Desc") },
    { icons: [Banknote],    title: t("why4Title"), desc: t("why4Desc") },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
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

      {/* Content */}
      <main className="flex-1 px-4 py-16 max-w-2xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> {t("returnHome")}
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">{t("whyTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("whySubtitle")}</p>
        </div>

        <div className="space-y-4">
          {reasons.map(({ icons, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                {icons.map((Icon, i) => (
                  <div key={i} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                ))}
                <h3 className="font-semibold text-foreground text-base ml-1">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              {t("startFree")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Tapli. {t("footerText")}
      </footer>
    </div>
  );
}
