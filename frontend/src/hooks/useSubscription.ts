import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Subscription {
  id: string;
  plan: "FREE" | "PRO";
  status: string;
  provider: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string | null;
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.get<{ subscription: Subscription | null }>("/billing/subscription").then((r) => r.subscription),
  });
}

export function useUpgradeToPro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ subscription: Subscription }>("/billing/checkout").then((r) => r.subscription),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });
}

export function useCancelPro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ subscription: Subscription }>("/billing/cancel").then((r) => r.subscription),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscription"] }),
  });
}
