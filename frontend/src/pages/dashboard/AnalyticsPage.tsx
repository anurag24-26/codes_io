import { useParams } from "react-router-dom";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { UpgradeModal } from "@/components/UpgradeModal";

export function AnalyticsPage() {
  const { restaurantId } = useParams();
  const { data: subscription } = useSubscription();
  const { data: items } = useMenuItems(restaurantId);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isPro = subscription?.plan === "PRO";

  if (!isPro) {
    return (
      <div className="mx-auto max-w-md text-center">
        <Card>
          <div className="mb-2 flex justify-center">
            <Badge variant="pro">PRO</Badge>
          </div>
          <h1 className="text-lg font-bold text-neutral-900">Menu analytics</h1>
          <p className="mt-2 text-sm text-neutral-600">
            See which items get the most attention, track menu views, and understand your customers better.
          </p>
          <Button className="mt-4" onClick={() => setShowUpgrade(true)}>
            Upgrade to Pro
          </Button>
        </Card>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </div>
    );
  }

  const totalItems = items?.length ?? 0;
  const featured = items?.filter((i) => i.isFeatured).length ?? 0;
  const unavailable = items?.filter((i) => !i.isAvailable).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Menu analytics</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-neutral-500">Total items</p>
          <p className="mt-1 text-2xl font-bold">{totalItems}</p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Featured items</p>
          <p className="mt-1 text-2xl font-bold">{featured}</p>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Unavailable items</p>
          <p className="mt-1 text-2xl font-bold">{unavailable}</p>
        </Card>
      </div>
      <Card>
        <p className="text-sm text-neutral-500">
          Menu view tracking and per-item engagement metrics are on the roadmap — this section will grow as more
          data is collected.
        </p>
      </Card>
    </div>
  );
}
