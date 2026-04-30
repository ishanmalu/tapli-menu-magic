import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, BarChart3, ArrowRight, ExternalLink, CheckCircle2, Menu, X } from "lucide-react";
import { trackSignupStarted, trackDemoClicked, trackNavClicked } from "@/lib/posthog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useRef, useState, useCallback } from "react";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

/* ── Scroll-reveal hook ────────────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Reveal wrapper ────────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
  from = "bottom",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: "bottom" | "left" | "right";
}) {
  const { ref, inView } = useInView();
  const translate =
    from === "left" ? "-translate-x-8" : from === "right" ? "translate-x-8" : "translate-y-8";
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${translate}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Glass card ────────────────────────────────────────────────────────────── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-foreground/[0.08] bg-foreground/[0.03] backdrop-blur-md transition-all duration-300 hover:border-foreground/[0.15] hover:bg-foreground/[0.05] hover:shadow-lg hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function Index() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    { icon: QrCode,      title: t("featureQr"),       desc: t("featureQrDesc") },
    { icon: Smartphone,  title: t("featureMobile"),    desc: t("featureMobileDesc") },
    { icon: BarChart3,   title: t("featureRealtime"),  desc: t("featureRealtimeDesc") },
  ];

  const trustBadges = [
    t("featureQr"),
    t("featureMobile"),
    t("featureRealtime"),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">

      {/* ── Floating glass nav ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "top-0 py-2" : "top-3 py-0"
        }`}
      >
        <div
          className={`max-w-5xl mx-auto px-4 transition-all duration-300 ${
            scrolled
              ? "px-4"
              : "px-4"
          }`}
        >
          <div
            className={`rounded-2xl border transition-all duration-300 ${
              scrolled
                ? "border-foreground/[0.08] bg-background/90 backdrop-blur-xl shadow-lg"
                : "border-transparent bg-transparent"
            } px-5 h-14 grid grid-cols-[1fr_auto_1fr] items-center`}
          >
            {/* Logo — left col */}
            <Link to="/" className="flex items-center gap-2 shrink-0 justify-self-start">
              <img
                src={theme === "dark" ? tapliLogoDark : tapliLogo}
                alt="Tapli"
                className="h-7 w-auto"
              />
            </Link>

            {/* Desktop links — truly centered col */}
            <div className="hidden sm:flex items-center gap-0.5">
              <Link to="/why" onClick={() => trackNavClicked({ page: "why" })}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("whyNav")}
                </Button>
              </Link>
              <Link to="/pricing" onClick={() => trackNavClicked({ page: "pricing" })}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("pricing")}
                </Button>
              </Link>
              <Link to="/contact" onClick={() => trackNavClicked({ page: "contact" })}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("contact")}
                </Button>
              </Link>
            </div>
            {/* Spacer on mobile so right col aligns correctly */}
            <div className="sm:hidden" />

            {/* Right controls — right col */}
            <div className="flex items-center gap-2 justify-self-end">
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/auth" onClick={() => trackNavClicked({ page: "signin" })}>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    {t("signIn")}
                  </Button>
                </Link>
                <Link to="/auth" onClick={() => trackSignupStarted({ button: "get_started_nav" })}>
                  <Button size="sm" className="rounded-xl">
                    {t("getStarted")}
                  </Button>
                </Link>
              </div>
              <LanguageToggle />
              <ThemeToggle />
              {/* Mobile menu toggle */}
              <button
                className="sm:hidden p-1.5 rounded-lg hover:bg-foreground/5 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <div className="sm:hidden mt-2 rounded-2xl border border-foreground/[0.08] bg-background/95 backdrop-blur-xl shadow-xl p-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { to: "/why",     label: t("whyNav"),   page: "why" },
                { to: "/pricing", label: t("pricing"),  page: "pricing" },
                { to: "/contact", label: t("contact"),  page: "contact" },
                { to: "/auth",    label: t("signIn"),   page: "signin" },
              ].map(({ to, label, page }) => (
                <Link
                  key={page}
                  to={to}
                  onClick={() => { trackNavClicked({ page }); setMobileOpen(false); }}
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                >
                  {label}
                </Link>
              ))}
              <div className="pt-2 border-t border-foreground/[0.06]">
                <Link to="/auth" onClick={() => { trackSignupStarted({ button: "get_started_mobile" }); setMobileOpen(false); }}>
                  <Button className="w-full rounded-xl mt-1">{t("getStarted")}</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center overflow-hidden">

        {/* Subtle background texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-foreground/[0.025] blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">

          {/* Tapli wordmark — slow rise */}
          <div
            className="animate-in fade-in slide-in-from-bottom-6 duration-[1100ms]"
            style={{ animationFillMode: "both" }}
          >
            <span className="font-garet text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-foreground select-none">
              tapli
            </span>
          </div>

          {/* Tagline — fades in just after */}
          <p
            className="text-sm sm:text-base font-medium tracking-widest uppercase text-muted-foreground/60 animate-in fade-in slide-in-from-bottom-3 duration-[1000ms]"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            {t("heroChip")}
          </p>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.08] tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "350ms", animationFillMode: "both" }}
          >
            {t("heroTitle")}
          </h1>

          {/* Description */}
          <p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "460ms", animationFillMode: "both" }}
          >
            {t("heroDesc")}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center justify-center gap-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "560ms", animationFillMode: "both" }}
          >
            <Link to="/auth" onClick={() => trackSignupStarted({ button: "start_for_free" })}>
              <Button
                size="lg"
                className="gap-2 text-base px-8 rounded-xl h-12 transition-all duration-200 hover:scale-[1.03] hover:shadow-md active:scale-[0.98]"
              >
                {t("startFree")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://tapliapp.com/menu/tapli-demo"
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackDemoClicked}
            >
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base px-8 rounded-xl h-12 border-foreground/20 hover:bg-foreground/5 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              >
                <ExternalLink className="h-4 w-4" /> {t("viewDemo")}
              </Button>
            </a>
          </div>

          {/* Trust badges */}
          <div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 animate-in fade-in duration-700"
            style={{ animationDelay: "680ms", animationFillMode: "both" }}
          >
            {trustBadges.map((badge) => (
              <span key={badge} className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 pb-28 max-w-5xl mx-auto w-full">
        <Reveal className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground/50 uppercase mb-3">
            {t("whyNav")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {t("featureQr")}
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 100}>
              <GlassCard className="p-7 h-full flex flex-col">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.04]">
                  <Icon className="h-5 w-5 text-foreground/70" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{desc}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="px-4 pb-28 max-w-5xl mx-auto w-full">
        <Reveal>
          <GlassCard className="relative overflow-hidden p-10 sm:p-14 text-center">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-foreground/[0.03] blur-2xl" />
            </div>
            <div className="relative z-10 space-y-5 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {t("heroTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("heroDesc")}
              </p>
              <Link to="/auth" onClick={() => trackSignupStarted({ button: "cta_banner" })}>
                <Button
                  size="lg"
                  className="gap-2 text-base px-10 rounded-xl h-12 mt-2 transition-all duration-200 hover:scale-[1.03] hover:shadow-md active:scale-[0.98]"
                >
                  {t("startFree")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-foreground/[0.06] py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img
            src={theme === "dark" ? tapliLogoDark : tapliLogo}
            alt="Tapli"
            className="h-6 w-auto opacity-60"
          />
          <p className="text-sm text-muted-foreground/60">
            © {new Date().getFullYear()} Tapli. {t("footerText")}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/50">
            <Link to="/why" className="hover:text-foreground/70 transition-colors">{t("whyNav")}</Link>
            <Link to="/pricing" className="hover:text-foreground/70 transition-colors">{t("pricing")}</Link>
            <Link to="/contact" className="hover:text-foreground/70 transition-colors">{t("contact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
