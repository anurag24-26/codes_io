import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";

interface QRCodeProps {
  url: string;
  slug: string;
  size?: number;
  color?: string;
  logoUrl?: string | null;
}

export function QRCodeCard({ url, slug, size = 220, color = "#111827", logoUrl }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    QRCode.toCanvas(canvas, url, { width: size, margin: 2, color: { dark: color, light: "#ffffff" } }, (err) => {
      if (err) {
        setError("Could not generate QR code.");
        return;
      }
      setError(null);

      if (logoUrl) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const logoSize = size * 0.22;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
          ctx.drawImage(img, x, y, logoSize, logoSize);
        };
        img.onerror = () => {
          // logo failed to load (e.g. CORS) — QR still works without it
        };
        img.src = logoUrl;
      }
    });
  }, [url, size, color, logoUrl]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${slug}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <canvas ref={canvasRef} width={size} height={size} />
        )}
      </div>
      <p className="break-all text-center text-xs text-neutral-500">{url}</p>
      <Button variant="outline" onClick={handleDownload}>
        Download PNG
      </Button>
    </div>
  );
}
