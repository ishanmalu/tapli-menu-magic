import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BASE_URL = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") || window.location.origin;

interface Props {
  slug: string;
  restaurantName: string;
}

export function QRCodeCard({ slug, restaurantName }: Props) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const menuUrl = `${BASE_URL}/menu/${slug}`;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Draw QR onto a padded canvas for a clean white-background PNG
    const size = canvas.width;
    const pad = Math.round(size * 0.08);
    const out = document.createElement("canvas");
    out.width  = size + pad * 2;
    out.height = size + pad * 2;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, pad, pad);

    const link = document.createElement("a");
    link.download = `tapli-qr-${slug}.png`;
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
        <CardTitle className="text-lg flex items-center gap-2">
          {t("qrCode")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("qrCodeDesc")}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* QR code */}
        <div className="flex justify-center">
          <div ref={canvasRef} className="p-4 bg-white rounded-xl border shadow-sm inline-block">
            <QRCodeCanvas
              value={menuUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Menu URL */}
        <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs text-muted-foreground break-all text-center">
          {menuUrl}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleDownload} size="sm" className="flex-1 gap-1.5">
            <Download className="h-4 w-4" /> {t("downloadQr")}
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1 gap-1.5">
            {copied ? <><Check className="h-4 w-4" /> {t("linkCopied")}</> : <><Copy className="h-4 w-4" /> {t("copyLink")}</>}
          </Button>
          <Button asChild variant="ghost" size="sm" className="px-2" title="Open menu">
            <a href={menuUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
