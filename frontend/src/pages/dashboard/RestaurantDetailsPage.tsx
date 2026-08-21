import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { OpeningHours, useRestaurant, useUpdateRestaurant, useUploadBanner, useUploadLogo } from "@/hooks/useRestaurants";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { UpgradeModal } from "@/components/UpgradeModal";
import toast from "react-hot-toast";

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const FONTS = [
  { value: "inter", label: "Inter (default)" },
  { value: "playfair", label: "Playfair (elegant serif)" },
  { value: "poppins", label: "Poppins (rounded)" },
];

const LAYOUTS = [
  { value: "classic", label: "Classic — list view" },
  { value: "grid", label: "Grid — photo-first cards" },
  { value: "minimal", label: "Minimal — text only" },
];

export function RestaurantDetailsPage() {
  const { restaurantId } = useParams();
  const { data: restaurant, refetch } = useRestaurant(restaurantId);
  const { data: subscription } = useSubscription();
  const updateRestaurant = useUpdateRestaurant(restaurantId!);
  const uploadLogo = useUploadLogo(restaurantId!);
  const uploadBanner = useUploadBanner(restaurantId!);
  const isPro = subscription?.plan === "PRO";

  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    accentColor: "#111827",
    fontFamily: "inter" as "inter" | "playfair" | "poppins",
    layoutTemplate: "classic" as "classic" | "grid" | "minimal",
  });
  const [hours, setHours] = useState<OpeningHours>({});
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name,
        description: restaurant.description || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        whatsapp: restaurant.whatsapp || "",
        instagram: restaurant.instagram || "",
        accentColor: restaurant.accentColor || "#111827",
        fontFamily: restaurant.fontFamily || "inter",
        layoutTemplate: restaurant.layoutTemplate || "classic",
      });
      setHours(restaurant.openingHours || {});
    }
  }, [restaurant]);

  const handleProError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.payload?.error === "PRO_FEATURE_LOCKED") {
      setShowUpgrade(true);
    } else {
      toast.error(fallback);
    }
  };

  const handleSave = async (e: FormEvent | React.MouseEvent) => {
    e.preventDefault();
    try {
      await updateRestaurant.mutateAsync({ ...form, openingHours: hours });
      toast.success("Saved");
    } catch (err) {
      handleProError(err, "Could not save changes");
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadLogo.mutateAsync(file);
      toast.success("Logo updated");
      refetch();
    } catch (err) {
      handleProError(err, "Could not upload logo");
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadBanner.mutateAsync(file);
      toast.success("Banner updated");
      refetch();
    } catch (err) {
      handleProError(err, "Could not upload banner");
    }
  };

  const updateDay = (day: keyof OpeningHours, patch: Partial<OpeningHours[keyof OpeningHours]>) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  if (!restaurant) return <div className="text-sm text-neutral-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Restaurant details</h1>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="whatsapp">WhatsApp number</Label>
              <Input
                id="whatsapp"
                placeholder="e.g. 919876543210"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram handle</Label>
              <Input
                id="instagram"
                placeholder="e.g. mydiner"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <Label htmlFor="accent" className="mb-0">Accent color</Label>
              {!isPro && <Badge variant="pro">PRO</Badge>}
            </div>
            <input
              id="accent"
              type="color"
              disabled={!isPro}
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <Label className="mb-0">Menu font</Label>
              {!isPro && <Badge variant="pro">PRO</Badge>}
            </div>
            <select
              disabled={!isPro}
              value={form.fontFamily}
              onChange={(e) => setForm({ ...form, fontFamily: e.target.value as "inter" | "playfair" | "poppins" })}
              className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm disabled:opacity-50"
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <Label className="mb-0">Menu layout</Label>
              {!isPro && <Badge variant="pro">PRO</Badge>}
            </div>
            <select
              disabled={!isPro}
              value={form.layoutTemplate}
              onChange={(e) => setForm({ ...form, layoutTemplate: e.target.value as "classic" | "grid" | "minimal" })}
              className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm disabled:opacity-50"
            >
              {LAYOUTS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {!isPro && (
            <button type="button" onClick={() => setShowUpgrade(true)} className="text-xs font-medium text-brand-600 hover:underline">
              Unlock branding, fonts & layouts with Pro
            </button>
          )}

          <Button type="submit" isLoading={updateRestaurant.isPending}>
            Save changes
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-1 flex items-center gap-2">
          <h2 className="font-semibold text-neutral-900">Logo</h2>
          {!isPro && <Badge variant="pro">PRO</Badge>}
        </div>
        <p className="mb-3 text-sm text-neutral-500">Shown on your public menu page and optionally your QR code.</p>
        <div className="flex items-center gap-4">
          {restaurant.logoUrl && (
            <img src={restaurant.logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover" />
          )}
          <div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!isPro || uploadLogo.isPending}
              onChange={handleLogoChange}
              className="text-sm"
            />
            {!isPro && (
              <button type="button" onClick={() => setShowUpgrade(true)} className="mt-1 block text-xs font-medium text-brand-600 hover:underline">
                Unlock logo upload with Pro
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-1 flex items-center gap-2">
          <h2 className="font-semibold text-neutral-900">Background wallpaper / banner</h2>
          {!isPro && <Badge variant="pro">PRO</Badge>}
        </div>
        <p className="mb-3 text-sm text-neutral-500">A wide banner image shown at the top of your public menu.</p>
        <div className="space-y-3">
          {restaurant.bannerUrl && (
            <img src={restaurant.bannerUrl} alt="Banner" className="h-28 w-full rounded-xl object-cover" />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={!isPro || uploadBanner.isPending}
            onChange={handleBannerChange}
            className="text-sm"
          />
          {!isPro && (
            <button type="button" onClick={() => setShowUpgrade(true)} className="block text-xs font-medium text-brand-600 hover:underline">
              Unlock banner upload with Pro
            </button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-neutral-900">Opening hours</h2>
        <p className="mb-3 text-sm text-neutral-500">Shown as an "Open now" badge on your public menu.</p>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const day = hours[key] || {};
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-10 text-sm font-medium text-neutral-600">{label}</span>
                <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <input
                    type="checkbox"
                    checked={!day.closed}
                    onChange={(e) => updateDay(key, { closed: !e.target.checked })}
                  />
                  Open
                </label>
                <input
                  type="time"
                  disabled={day.closed}
                  value={day.open || "09:00"}
                  onChange={(e) => updateDay(key, { open: e.target.value })}
                  className="h-8 rounded-lg border border-neutral-300 px-2 text-xs disabled:opacity-40"
                />
                <span className="text-xs text-neutral-400">to</span>
                <input
                  type="time"
                  disabled={day.closed}
                  value={day.close || "22:00"}
                  onChange={(e) => updateDay(key, { close: e.target.value })}
                  className="h-8 rounded-lg border border-neutral-300 px-2 text-xs disabled:opacity-40"
                />
              </div>
            );
          })}
        </div>
        <Button className="mt-4" size="sm" onClick={handleSave} isLoading={updateRestaurant.isPending}>
          Save hours
        </Button>
      </Card>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
