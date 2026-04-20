import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, QrCode, Smartphone, BarChart3, ArrowRight } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">Tapli</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-20 pb-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-6">
          <QrCode className="h-4 w-4" /> Digital menus for modern restaurants
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
          Your menu, one scan away
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Create beautiful digital menus with NFC and QR codes. Show allergens, calories, and dietary info. Update in real time.
        </p>
        <Link to="/auth">
          <Button size="lg" className="gap-2 text-base px-8">
            Start for free <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="px-4 pb-20 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: QrCode, title: "QR & NFC Ready", desc: "Customers scan to view your menu instantly on their phone." },
            { icon: Smartphone, title: "Mobile First", desc: "Beautiful, fast menus designed for every screen size." },
            { icon: BarChart3, title: "Real-Time Updates", desc: "Change prices, items, or availability — reflected instantly." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <Icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Tapli. Digital menus made simple.
      </footer>
    </div>
  );
}
