import { Link, useParams } from "react-router-dom";
import { useRestaurant, useRestaurantUsage } from "@/hooks/useRestaurants";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = !isFinite(limit);
  const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const atLimit = !isUnlimited && used >= limit;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className={atLimit ? "font-semibold text-amber-600" : "text-neutral-500"}>
          {used} / {isUnlimited ? "∞" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={atLimit ? "h-full bg-amber-500" : "h-full bg-brand-600"}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function RestaurantOverviewPage() {
  const { restaurantId } = useParams();
  const { data: restaurant } = useRestaurant(restaurantId);
  const { data: usage } = useRestaurantUsage(restaurantId);

  if (!restaurant) return <div className="text-sm text-neutral-500">Loading…</div>;

  const limits = usage?.plan === "PRO"
    ? { restaurants: Infinity, categories: Infinity, menuItems: Infinity }
    : { restaurants: 1, categories: 3, menuItems: 20 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900">{restaurant.name}</h1>
            <Badge variant={usage?.plan === "PRO" ? "pro" : "default"}>{usage?.plan ?? "FREE"}</Badge>
          </div>
          <p className="text-sm text-neutral-500">/{restaurant.slug}</p>
        </div>
        <Link to={`/menu/${restaurant.slug}`} target="_blank">
          <Button variant="outline">View public menu ↗</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <UsageBar label="Restaurants" used={usage?.restaurants ?? 0} limit={limits.restaurants} />
        </Card>
        <Card>
          <UsageBar label="Categories" used={usage?.categories ?? 0} limit={limits.categories} />
        </Card>
        <Card>
          <UsageBar label="Menu items" used={usage?.menuItems ?? 0} limit={limits.menuItems} />
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-neutral-900">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/dashboard/restaurants/${restaurant.id}/categories`}>
            <Button variant="outline" size="sm">Manage categories</Button>
          </Link>
          <Link to={`/dashboard/restaurants/${restaurant.id}/menu`}>
            <Button variant="outline" size="sm">Manage menu</Button>
          </Link>
          <Link to={`/dashboard/restaurants/${restaurant.id}/qr`}>
            <Button variant="outline" size="sm">Get QR code</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
