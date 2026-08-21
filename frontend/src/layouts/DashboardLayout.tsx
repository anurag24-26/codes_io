import { Link, NavLink, Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";
import { useMyRestaurants } from "@/hooks/useRestaurants";

const navItems = (restaurantId: string) => [
  { to: `/dashboard/restaurants/${restaurantId}`, label: "Dashboard" },
  { to: `/dashboard/restaurants/${restaurantId}/details`, label: "Restaurant" },
  { to: `/dashboard/restaurants/${restaurantId}/categories`, label: "Categories" },
  { to: `/dashboard/restaurants/${restaurantId}/menu`, label: "Menu" },
  { to: `/dashboard/restaurants/${restaurantId}/qr`, label: "QR Code" },
  { to: `/dashboard/restaurants/${restaurantId}/analytics`, label: "Analytics" },
  { to: `/dashboard/billing`, label: "Billing" },
];

export function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const { restaurantId } = useParams();
  const { data: restaurants } = useMyRestaurants();

  if (loading) return <div className="p-10 text-center text-sm text-neutral-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const activeRestaurantId = restaurantId || restaurants?.[0]?.id || "";

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white md:block">
        <div className="flex h-16 items-center border-b border-neutral-200 px-5">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            codes<span className="text-brand-600">.io</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {activeRestaurantId ? (
            navItems(activeRestaurantId).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.endsWith(activeRestaurantId)}
                className={({ isActive }) =>
                  clsx(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))
          ) : (
            <NavLink
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Dashboard
            </NavLink>
          )}
        </nav>
        <div className="mt-auto p-4">
          <Button variant="outline" size="sm" className="w-full" onClick={() => logout()}>
            Log out
          </Button>
        </div>
      </aside>
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:hidden">
          <Link to="/" className="text-lg font-extrabold">
            codes<span className="text-brand-600">.io</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Log out
          </Button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
