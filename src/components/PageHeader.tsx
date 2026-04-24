import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

export function PageHeader() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={theme === "dark" ? tapliLogoDark : tapliLogo}
            alt="Tapli"
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/pricing">
            <Button variant="ghost" size="sm">{t("pricing")}</Button>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" size="sm">{t("signIn")}</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm">{t("getStarted")}</Button>
          </Link>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}