import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "fi" : "en")}
      className="font-medium text-xs px-2 uppercase tracking-wide"
    >
      {language === "en" ? "FI" : "EN"}
    </Button>
  );
}