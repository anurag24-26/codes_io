import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRestaurant, useUpdateRestaurant } from "@/hooks/useRestaurants";
import { useSubscription } from "@/hooks/useSubscription";
import { QRCodeCard } from "@/components/qr/QRCode";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ApiError } from "@/lib/api";
import toast from "react-hot-toast";

const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || "http://localhost:5173";

export function QrCodePage() {
  const { restaurantId } = useParams();
  const { data: restaurant } = useRestaurant(restaurantId);
  const { data: subscription } = useSubscription();
  const updateRestaurant = useUpdateRestaurant(restaurantId!);
  const isPro = subscription?.plan === "PRO";

  const [color, setColor] = useState("#111827");
  const [includeLogo, setIncludeLogo] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setColor(restaurant.qrColor || "#111827");
      setIncludeLogo(!!restaurant.qrIncludeLogo);
    }
  }, [restaurant]);

  if (!restaurant) return <div className="text-sm text-neutral-500">Loading…</div>;

  const menuUrl = `${PUBLIC_APP_URL}/menu/${restaurant.slug}`;

  const handleColorChange = async (value: string) => {
    setColor(value);
    try {
      await updateRestaurant.mutateAsync({ qrColor: value });
    } catch (err) {
      if (err instanceof ApiError && err.payload?.error === "PRO_FEATURE_LOCKED") {
        setShowUpgrade(true);
      } else {
        toast.error("Could not save QR color");
      }
    }
  };

  const handleToggleLogo = async () => {
    const next = !includeLogo;
    setIncludeLogo(next);
    try {
      await updateRestaurant.mutateAsync({ qrIncludeLogo: next });
    } catch (err) {
      setIncludeLogo(!next);
      if (err instanceof ApiError && err.payload?.error === "PRO_FEATURE_LOCKED") {
        setShowUpgrade(true);
      } else {
        toast.error("Could not save setting");
      }
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">QR Code</h1>
      <Card>
        <p className="mb-4 text-sm text-neutral-600">
          This QR always points to your permanent menu URL. You can change your menu anytime — the QR never
          needs to be reprinted.
        </p>
        <QRCodeCard
          url={menuUrl}
          slug={restaurant.slug}
          color={isPro ? color : "#111827"}
          logoUrl={isPro && includeLogo ? restaurant.logoUrl : null}
        />
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-neutral-900">Customize QR</h2>
          {!isPro && <Badge variant="pro">PRO</Badge>}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">QR color</span>
            <input
              type="color"
              disabled={!isPro}
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">Embed logo in QR</span>
            <button
              type="button"
              disabled={!isPro || !restaurant.logoUrl}
              onClick={handleToggleLogo}
              className={`h-6 w-11 rounded-full transition-colors ${
                includeLogo ? "bg-brand-600" : "bg-neutral-300"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span
                className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform ${
                  includeLogo ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          {isPro && !restaurant.logoUrl && (
            <p className="text-xs text-neutral-400">Upload a logo in Restaurant details to enable this.</p>
          )}
          {!isPro && (
            <button onClick={() => setShowUpgrade(true)} className="text-xs font-medium text-brand-600 hover:underline">
              Unlock QR customization with Pro
            </button>
          )}
        </div>
      </Card>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
