import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useUpgradeToPro } from "@/hooks/useSubscription";
import toast from "react-hot-toast";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function UpgradeModal({
  open,
  onClose,
  title = "Unlock this feature with Pro",
  message = "Customize your menu, remove branding, and unlock advanced restaurant features.",
}: UpgradeModalProps) {
  const upgrade = useUpgradeToPro();

  const handleUpgrade = async () => {
    try {
      await upgrade.mutateAsync();
      toast.success("You're now on Pro! (mock billing — no real charge)");
      onClose();
    } catch {
      toast.error("Could not upgrade. Please try again.");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          ✦
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={handleUpgrade} isLoading={upgrade.isPending} className="w-full">
            Upgrade to Pro
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
