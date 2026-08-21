import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCreateRestaurant, useMyRestaurants } from "@/hooks/useRestaurants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { ApiError } from "@/lib/api";
import { UpgradeModal } from "@/components/UpgradeModal";
import toast from "react-hot-toast";

export function DashboardIndexPage() {
  const { data: restaurants, isLoading } = useMyRestaurants();
  const navigate = useNavigate();
  const createRestaurant = useCreateRestaurant();
  const [name, setName] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) {
    return <div className="text-sm text-neutral-500">Loading…</div>;
  }

  if (restaurants && restaurants.length > 0) {
    return <Navigate to={`/dashboard/restaurants/${restaurants[0].id}`} replace />;
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const restaurant = await createRestaurant.mutateAsync({ name });
      toast.success("Restaurant created!");
      navigate(`/dashboard/restaurants/${restaurant.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setShowUpgrade(true);
      } else {
        toast.error("Could not create restaurant");
      }
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-bold text-neutral-900">Create your restaurant</h1>
      <p className="mt-1 text-sm text-neutral-500">
        This becomes your public menu URL and QR code destination.
      </p>
      <Card className="mt-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="rname">Restaurant name</Label>
            <Input id="rname" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Demo Diner" />
          </div>
          <Button type="submit" className="w-full" isLoading={createRestaurant.isPending}>
            Create restaurant
          </Button>
        </form>
      </Card>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Free plan limit reached"
        message="You've reached your Free plan limit of 1 restaurant. Upgrade to Pro for unlimited restaurants."
      />
    </div>
  );
}
