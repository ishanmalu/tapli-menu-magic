import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 rounded-md border bg-muted/50 p-0.5 text-xs font-medium">
      <button
        onClick={() => setLanguage("en")}
        className={`rounded px-2 py-1 transition-colors ${
          language === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("fi")}
        className={`rounded px-2 py-1 transition-colors ${
          language === "fi"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        FI
      </button>
    </div>
  );
}