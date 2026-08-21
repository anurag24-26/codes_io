import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  restaurantId: string;
}

export function useCategories(restaurantId?: string) {
  return useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: () =>
      api.get<{ categories: Category[] }>(`/categories/restaurant/${restaurantId}`).then((r) => r.categories),
    enabled: !!restaurantId,
  });
}

export function useCreateCategory(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; sortOrder?: number }) =>
      api
        .post<{ category: Category }>(`/categories/restaurant/${restaurantId}`, {
          ...data,
          restaurantId,
        })
        .then((r) => r.category),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", restaurantId] });
      qc.invalidateQueries({ queryKey: ["restaurant-usage", restaurantId] });
    },
  });
}

export function useUpdateCategory(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; sortOrder?: number }) =>
      api.put<{ category: Category }>(`/categories/${id}`, data).then((r) => r.category),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", restaurantId] }),
  });
}

export function useDeleteCategory(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", restaurantId] });
      qc.invalidateQueries({ queryKey: ["restaurant-usage", restaurantId] });
    },
  });
}

export function useReorderCategories(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.put(`/categories/restaurant/${restaurantId}/reorder`, { orderedIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", restaurantId] }),
  });
}
