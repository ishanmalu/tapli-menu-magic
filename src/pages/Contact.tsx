import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.26 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.73a4.85 4.85 0 0 1-1-.04z" />
  </svg>
);

export default function Contact() {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const socials = [
    {
      label: "Instagram",
      handle: "@tapli.app",
      href: "https://instagram.com/tapli.app",
      icon: <InstagramIcon />,
    },
    {
      label: "X / Twitter",
      handle: "@tapli.app",
      href: "https://x.com/tapli.app",
      icon: <XIcon />,
    },
    {
      label: "TikTok",
      handle: "@tapli.app",
      href: "https://tiktok.com/@tapli.app",
      icon: <TikTokIcon />,
    },
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
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> {t("returnHome")}
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">{t("contactTitle")}</h1>
          <p className="text-muted-foreground mb-10">{t("contactSubtitle")}</p>

          {/* Email */}
          <a
            href="mailto:taplibusiness@gmail.com"
            className="flex items-center gap-4 rounded-xl border bg-card p-4 mb-3 hover:border-primary transition-colors group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t("contactEmail")}</p>
              <p className="text-sm font-semibold text-foreground">taplibusiness@gmail.com</p>
            </div>
          </a>

          {/* Socials */}
          <div className="space-y-3 mt-6">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("contactFollowUs")}</p>
            {socials.map(({ label, handle, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:border-primary transition-colors group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{handle}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Tapli. {t("footerText")}
      </footer>
    </div>
  );
}
