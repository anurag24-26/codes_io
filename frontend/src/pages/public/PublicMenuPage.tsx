import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";

interface PublicMenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  imageUrl?: string | null;
  isFeatured: boolean;
  isVeg: boolean;
  isSpicy: boolean;
  isBestseller: boolean;
  allergens?: string | null;
  variants: { name: string; priceDelta: number }[];
  addOns: { name: string; price: number }[];
}
interface PublicCategory {
  id: string;
  name: string;
  menuItems: PublicMenuItem[];
}
interface OpeningHoursDay {
  open?: string;
  close?: string;
  closed?: boolean;
}
interface PublicMenuData {
  restaurant: {
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    accentColor?: string | null;
    address?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
    openingHours?: Record<string, OpeningHoursDay> | null;
    isOpenNow: boolean | null;
    bannerUrl?: string | null;
    fontFamily?: string | null;
    layoutTemplate?: string | null;
    showPoweredBy: boolean;
  };
  categories: PublicCategory[];
}

const FONT_STACKS: Record<string, string> = {
  inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
  playfair: '"Playfair Display", ui-serif, Georgia, serif',
  poppins: '"Poppins", ui-sans-serif, system-ui, sans-serif',
};

function VegBadge({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-2 ${
        isVeg ? "border-emerald-600" : "border-red-600"
      }`}
    >
      <span className={`block h-1.5 w-1.5 rounded-full ${isVeg ? "bg-emerald-600" : "bg-red-600"}`} />
    </span>
  );
}

function ItemCard({ item, accent, grid }: { item: PublicMenuItem; accent: string; grid?: boolean }) {
  return (
    <div className={`flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 ${grid ? "flex-col" : ""}`}>
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className={grid ? "h-32 w-full rounded-xl object-cover" : "h-16 w-16 shrink-0 rounded-xl object-cover"}
        />
      )}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <VegBadge isVeg={item.isVeg} />
            <h3 className="font-semibold text-neutral-900">{item.name}</h3>
            {item.isSpicy && <span className="text-xs">🌶️</span>}
            {item.isBestseller && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                Bestseller
              </span>
            )}
            {item.isFeatured && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                Popular
              </span>
            )}
          </div>
          <span className="shrink-0 font-semibold" style={{ color: accent }}>
            ₹{Number(item.price).toFixed(0)}
          </span>
        </div>
        {item.description && <p className="mt-0.5 text-sm text-neutral-500">{item.description}</p>}
        {item.allergens && (
          <p className="mt-1 text-xs text-neutral-400">Allergens: {item.allergens}</p>
        )}
        {item.variants?.length > 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            {item.variants.map((v) => `${v.name} +₹${v.priceDelta}`).join(" · ")}
          </p>
        )}
        {item.addOns?.length > 0 && (
          <p className="mt-0.5 text-xs text-neutral-400">
            Add-ons: {item.addOns.map((a) => `${a.name} (₹${a.price})`).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

export function PublicMenuPage() {
  const { slug } = useParams();
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<PublicMenuData>(`/public/menu/${slug}`)
      .then((res) => {
        setData(res);
        document.title = `${res.restaurant.name} — Digital Menu`;
      })
      .catch((err) => {
        setError(err instanceof ApiError && err.status === 404 ? "Restaurant not found" : "Could not load menu");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="p-10 text-center text-sm text-neutral-500">Loading menu…</div>;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-10 text-center">
        <h1 className="text-xl font-bold text-neutral-900">{error || "Menu unavailable"}</h1>
        <p className="text-sm text-neutral-500">Please check the QR code or link and try again.</p>
      </div>
    );
  }

  const { restaurant } = data;
  const accent = restaurant.accentColor || "#111827";
  const fontStack = FONT_STACKS[restaurant.fontFamily || "inter"] || FONT_STACKS.inter;
  const isGrid = restaurant.layoutTemplate === "grid";
  const isMinimal = restaurant.layoutTemplate === "minimal";

  const whatsappHref = restaurant.whatsapp
    ? `https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi, I'd like to know more about ${restaurant.name}`
      )}`
    : null;
  const instagramHref = restaurant.instagram
    ? `https://instagram.com/${restaurant.instagram.replace(/^@/, "")}`
    : null;

  return (
    <div className="min-h-screen bg-neutral-50" style={{ fontFamily: fontStack }}>
      <header className="relative border-b border-neutral-200 bg-white">
        {restaurant.bannerUrl && (
          <div
            className="h-36 w-full bg-cover bg-center sm:h-48"
            style={{ backgroundImage: `url(${restaurant.bannerUrl})` }}
          />
        )}
        <div className="mx-auto max-w-xl px-4 py-6 text-center">
          {restaurant.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt={`${restaurant.name} logo`}
              className={`mx-auto mb-3 h-16 w-16 rounded-full border-4 border-white object-cover shadow-sm ${
                restaurant.bannerUrl ? "-mt-14" : ""
              }`}
            />
          )}
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-extrabold" style={{ color: accent }}>
              {restaurant.name}
            </h1>
            {restaurant.isOpenNow !== null && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  restaurant.isOpenNow ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {restaurant.isOpenNow ? "Open now" : "Closed"}
              </span>
            )}
          </div>
          {!isMinimal && restaurant.description && (
            <p className="mt-1 text-sm text-neutral-600">{restaurant.description}</p>
          )}
          {!isMinimal && (restaurant.address || restaurant.phone) && (
            <p className="mt-2 text-xs text-neutral-400">
              {[restaurant.address, restaurant.phone].filter(Boolean).join(" · ")}
            </p>
          )}
          {(whatsappHref || instagramHref) && (
            <div className="mt-3 flex justify-center gap-2">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                >
                  WhatsApp
                </a>
              )}
              {instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {data.categories.length === 0 && (
          <p className="py-16 text-center text-sm text-neutral-500">This menu doesn't have any items yet.</p>
        )}

        <div className="space-y-8">
          {data.categories.map((cat) => (
            <section key={cat.id}>
              <h2 className="mb-3 text-lg font-bold text-neutral-900">{cat.name}</h2>
              {cat.menuItems.length === 0 ? (
                <p className="text-sm text-neutral-400">No items in this category yet.</p>
              ) : isGrid ? (
                <div className="grid grid-cols-2 gap-3">
                  {cat.menuItems.map((item) => (
                    <ItemCard key={item.id} item={item} accent={accent} grid />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {cat.menuItems.map((item) => (
                    <ItemCard key={item.id} item={item} accent={accent} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      {restaurant.showPoweredBy && (
        <footer className="py-6 text-center text-xs text-neutral-400">Powered by Codes.io</footer>
      )}
    </div>
  );
}
