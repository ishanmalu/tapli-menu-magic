import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ExternalLink,
  Menu,
  X,
  CheckCircle2,
  Pencil,
  Globe,
  Leaf,
  BarChart3,
  QrCode,
  Users,
  Zap,
  Smartphone,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useState } from "react";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";
import { useTheme } from "@/components/ThemeProvider";

export default function Index() {
  const { theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ───────── NAV ───────── */}
      <nav className="fixed top-0 w-full z-50 px-4 pt-3">
        <div className="max-w-6xl mx-auto rounded-2xl px-6 h-14 flex items-center justify-between
          bg-background/80 backdrop-blur-md border border-white/10">

          <img
            src={theme === "dark" ? tapliLogoDark : tapliLogo}
            className="h-6"
          />

          <div className="hidden sm:flex gap-6 text-sm text-muted-foreground">
            <Link to="/why" className="hover:text-foreground transition-colors">Why Tapli</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
            <LanguageToggle />
            <ThemeToggle />
            <button className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden mt-2 bg-background border rounded-xl p-4 space-y-2">
            <Link to="/why" className="block py-1">Why Tapli</Link>
            <Link to="/pricing" className="block py-1">Pricing</Link>
            <Link to="/contact" className="block py-1">Contact Us</Link>
            <Link to="/auth">
              <Button className="w-full mt-2">Get Started</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* ───────── HERO ───────── */}
      <section className="min-h-screen flex items-center px-6 pt-28 pb-20 overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-8 items-center w-full">

          {/* LEFT */}
          <div className="space-y-6">
            <p className="inline-block text-xs px-3 py-1 rounded-full
              bg-foreground/5 border border-foreground/10
              uppercase tracking-widest text-muted-foreground">
              Digital menus for modern restaurants
            </p>

            <h1 className="text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
              Your menu,<br />one scan away
            </h1>

            <p className="text-lg text-muted-foreground max-w-sm">
              Create beautiful digital menus with NFC and QR codes.
              Show allergens, calories, and dietary info.
              Update in real time.
            </p>

            <div className="flex gap-4 flex-wrap">
              <Button size="lg" className="px-6 rounded-xl shadow-md hover:shadow-lg transition">
                Start for free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="px-6 rounded-xl border-white/20 hover:bg-white/5">
                <ExternalLink className="mr-2 w-4 h-4" />
                View live demo
              </Button>
            </div>

            {/* Features row */}
            <div className="flex gap-6 text-sm text-muted-foreground pt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-foreground font-medium text-xs">QR &amp; NFC Ready</div>
                  <div className="text-xs">Open menus instantly</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-foreground font-medium text-xs">Mobile First</div>
                  <div className="text-xs">Perfect on any device</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-foreground font-medium text-xs">Real-Time Updates</div>
                  <div className="text-xs">Changes go live instantly</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — image assets */}
          <div className="relative flex justify-center items-center min-h-[640px] lg:min-h-[740px]">

            {/* Ambient glow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[600px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 55%, transparent 75%)", filter: "blur(50px)" }} />

            {/* Phone — taller, shifted left to make room for QR stand */}
            <img
              src="/phone.png"
              alt="Tapli menu app"
              className="relative z-10 w-[280px] lg:w-[320px] xl:w-[360px]"
              style={{
                filter: "drop-shadow(0 50px 90px rgba(0,0,0,0.65))",
                transform: "translateY(-10px)",
              }}
            />



          </div>
        </div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section className="py-24 px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-2">Everything you need in one place</h2>
        <p className="text-muted-foreground mb-12">Designed to save you time and help you sell more.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Pencil className="w-5 h-5" />,
              iconBg: "bg-emerald-500/20 text-emerald-400",
              title: "Easy to manage",
              desc: "Update your menu in seconds. No tech skills needed."
            },
            {
              icon: <Globe className="w-5 h-5" />,
              iconBg: "bg-blue-500/20 text-blue-400",
              title: "Auto translations",
              desc: "Translate your menu into multiple languages automatically."
            },
            {
              icon: <Leaf className="w-5 h-5" />,
              iconBg: "bg-purple-500/20 text-purple-400",
              title: "Dietary filters",
              desc: "Highlight vegan, vegetarian, gluten-free, halal and more."
            },
            {
              icon: <BarChart3 className="w-5 h-5" />,
              iconBg: "bg-orange-500/20 text-orange-400",
              title: "Increase orders",
              desc: "Better menu experience leads to more happy customers and higher sales."
            }
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border bg-foreground/5 text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.iconBg}`}>
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── BUILT FOR RESTAURANTS ───────── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="rounded-3xl border bg-foreground/[0.03] overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_1.6fr] gap-0">

            {/* LEFT text */}
            <div className="p-10 flex flex-col justify-center space-y-6">
              <h2 className="text-3xl font-bold leading-tight">
                Built for restaurants,<br />loved by customers
              </h2>
              <ul className="space-y-3">
                {[
                  "Beautiful on any device",
                  "Lightning fast loading",
                  "No app needed",
                  "Works offline",
                  "Secure and reliable",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT dashboard mockup */}
            <div className="relative p-6 flex gap-4 items-start overflow-hidden">
              {/* Dashboard card */}
              <div className="flex-1 rounded-2xl border bg-background/60 backdrop-blur p-4 space-y-4 text-xs min-w-0">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-foreground/10" />
                    <span className="font-semibold text-sm">tapli</span>
                  </div>
                  <span className="text-muted-foreground text-xs">Good morning, Alex!</span>
                </div>

                {/* Sidebar + content */}
                <div className="flex gap-3">
                  <div className="w-24 space-y-1 text-muted-foreground flex-shrink-0">
                    {["Dashboard","Menus","Categories","Items","Translations","QR / NFC","Analytics","Settings"].map((item) => (
                      <div key={item} className={`px-2 py-1 rounded text-xs truncate ${item === "Dashboard" ? "bg-foreground/10 text-foreground font-medium" : ""}`}>
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <p className="text-muted-foreground text-xs">Here's what's happening with your menus.</p>
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Total views", val: "3,246", sub: "+12%" },
                        { label: "Menu items", val: "128", sub: "+8%" },
                        { label: "Languages", val: "4", sub: "" },
                        { label: "Orders", val: "742", sub: "+15%" },
                      ].map((s) => (
                        <div key={s.label} className="bg-foreground/5 rounded-lg p-2">
                          <div className="text-muted-foreground" style={{fontSize:"9px"}}>{s.label}</div>
                          <div className="font-bold text-sm">{s.val}</div>
                          {s.sub && <div className="text-emerald-500" style={{fontSize:"9px"}}>{s.sub}</div>}
                        </div>
                      ))}
                    </div>
                    {/* Menu items */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground" style={{fontSize:"9px"}}>Recent menu</span>
                        <span className="font-medium" style={{fontSize:"9px"}}>Bella Italia</span>
                      </div>
                      {[
                        { name: "Bruschetta", price: "6,50 €", on: true },
                        { name: "Salmon Pasta", price: "14,90 €", on: true, badge: "Popular" },
                        { name: "Margherita Pizza", price: "11,90 €", on: false },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-2 py-1 border-b border-foreground/5 last:border-0">
                          <div className="w-4 h-4 rounded bg-foreground/10 flex-shrink-0" />
                          <span className="flex-1 truncate" style={{fontSize:"10px"}}>{item.name}</span>
                          {item.badge && (
                            <span className="text-blue-400 bg-blue-400/10 px-1 rounded" style={{fontSize:"8px"}}>{item.badge}</span>
                          )}
                          <span className="text-muted-foreground" style={{fontSize:"10px"}}>{item.price}</span>
                          <div className={`w-6 h-3 rounded-full flex-shrink-0 ${item.on ? "bg-emerald-500" : "bg-foreground/20"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* QR card */}
              <div className="w-28 flex-shrink-0 rounded-2xl border bg-background/60 backdrop-blur p-3 text-center space-y-2">
                <img src="/tapli_demoqr.png" alt="Scan to view demo menu" className="w-20 h-20 mx-auto rounded-xl" />
                <p className="text-xs text-muted-foreground leading-tight">Scan to view live demo menu</p>
                <div className="text-xs">↗</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section className="py-24 px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-16">How it works</h2>

        <div className="grid sm:grid-cols-4 gap-6 text-sm relative">
          {/* Connector lines */}
          <div className="hidden sm:block absolute top-10 left-[12.5%] right-[12.5%] border-t border-dashed border-foreground/20 z-0" />

          {[
            { icon: <Pencil className="w-5 h-5" />, bg: "bg-emerald-500/20 text-emerald-400", num: "1.", label: "Create", desc: "Add your menu, items and prices in minutes." },
            { icon: <Globe className="w-5 h-5" />, bg: "bg-blue-500/20 text-blue-400", num: "2.", label: "Customize", desc: "Add translations, dietary tags and organize your menu." },
            { icon: <QrCode className="w-5 h-5" />, bg: "bg-purple-500/20 text-purple-400", num: "3.", label: "Share", desc: "Generate QR code or use NFC tag at your table." },
            { icon: <Users className="w-5 h-5" />, bg: "bg-orange-500/20 text-orange-400", num: "4.", label: "Grow", desc: "Delight your guests and grow your business." },
          ].map((step) => (
            <div key={step.label} className="space-y-3 relative z-10">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center border-2 border-background ${step.bg}`}>
                {step.icon}
              </div>
              <div className="font-bold">{step.num} {step.label}</div>
              <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="py-20 px-6 border-t">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Ready to upgrade your menu?</h2>
            <p className="text-muted-foreground">
              Join restaurants that use Tapli to create better experiences and increase their sales.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="flex gap-3">
              <Button size="lg" className="px-8 rounded-xl">
                Start for free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 rounded-xl">
                <ExternalLink className="mr-2 w-4 h-4" />
                View live demo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="py-8 px-6 border-t text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <img
            src={theme === "dark" ? tapliLogoDark : tapliLogo}
            className="h-5 opacity-60"
          />
          <p>© {new Date().getFullYear()} Tapli</p>
          <div className="flex gap-4">
            <Link to="/why" className="hover:text-foreground transition-colors">Why</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}