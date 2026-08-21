import { useCancelPro, useSubscription, useUpgradeToPro } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export function BillingPage() {
  const { data: subscription, isLoading } = useSubscription();
  const upgrade = useUpgradeToPro();
  const cancel = useCancelPro();

  const isPro = subscription?.plan === "PRO" && subscription.status === "ACTIVE";

  const handleUpgrade = async () => {
    try {
      await upgrade.mutateAsync();
      toast.success("Upgraded to Pro (mock billing — no real charge made)");
    } catch {
      toast.error("Could not upgrade");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your Pro subscription?")) return;
    try {
      await cancel.mutateAsync();
      toast.success("Subscription canceled");
    } catch {
      toast.error("Could not cancel");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Billing</h1>

      <Card className="bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Development mode:</strong> No payment provider is connected yet. Upgrading here uses mock
          billing and does not charge real money.
        </p>
      </Card>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Current plan</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-bold">{subscription?.plan ?? "FREE"}</span>
                <Badge variant={isPro ? "success" : "default"}>{subscription?.status ?? "ACTIVE"}</Badge>
              </div>
            </div>
            {isPro ? (
              <Button variant="outline" onClick={handleCancel} isLoading={cancel.isPending}>
                Cancel subscription
              </Button>
            ) : (
              <Button onClick={handleUpgrade} isLoading={upgrade.isPending}>
                Upgrade to Pro
              </Button>
            )}
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="mt-3 text-xs text-neutral-400">
              Current period ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
