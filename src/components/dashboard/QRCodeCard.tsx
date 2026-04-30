import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";

const BASE_URL = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") || window.location.origin;

interface Props {
  restaurant: Tables<"restaurants">;
}

export function QRCodeCard({ restaurant }: Props) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const fs = (restaurant.filter_settings as any) ?? {};
  const qrFgColor  = (fs.qrFgColor  as string) || "#000000";
  const qrBgColor  = (fs.qrBgColor  as string) || "#ffffff";
  const qrShowLogo = (fs.qrShowLogo as boolean) && !!restaurant.logo_url;

  const menuUrl = `${BASE_URL}/menu/${restaurant.slug}`;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const size = canvas.width;
    const pad = Math.round(size * 0.08);
    const out = document.createElement("canvas");
    out.width = size + pad * 2;
    out.height = size + pad * 2;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = qrBgColor;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, pad, pad);
    const link = document.createElement("a");
    link.download = `tapli-qr-${restaurant.slug}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">{t("qrCode")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("qrCodeDesc")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div ref={canvasRef} className="p-4 rounded-xl border shadow-sm inline-block" style={{ backgroundColor: qrBgColor }}>
            <QRCodeCanvas
              value={menuUrl}
              size={180}
              bgColor={qrBgColor}
              fgColor={qrFgColor}
              level={qrShowLogo ? "H" : "M"}
              includeMargin={false}
              imageSettings={qrShowLogo ? {
                src: restaurant.logo_url!,
                height: 40,
                width: 40,
                excavate: true,
              } : undefined}
            />
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs text-muted-foreground break-all text-center">
          {menuUrl}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} size="sm" className="flex-1 gap-1.5">
            <Download className="h-4 w-4" /> {t("downloadQr")}
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1 gap-1.5">
            {copied ? <><Check className="h-4 w-4" /> {t("linkCopied")}</> : <><Copy className="h-4 w-4" /> {t("copyLink")}</>}
          </Button>
          <Button asChild variant="ghost" size="sm" className="px-2">
            <a href={menuUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
