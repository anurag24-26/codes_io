import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export interface Variant {
  name: string;
  priceDelta: number;
}
export interface AddOn {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isVeg: boolean;
  isSpicy: boolean;
  isBestseller: boolean;
  allergens?: string | null;
  variants: Variant[];
  addOns: AddOn[];
  sortOrder: number;
  categoryId: string;
  restaurantId: string;
  category?: { id: string; name: string };
}

export function useMenuItems(restaurantId?: string) {
  return useQuery({
    queryKey: ["menu-items", restaurantId],
    queryFn: () =>
      api.get<{ menuItems: MenuItem[] }>(`/menu-items/restaurant/${restaurantId}`).then((r) => r.menuItems),
    enabled: !!restaurantId,
  });
}

export function useCreateMenuItem(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      isFeatured?: boolean;
      isVeg?: boolean;
      isSpicy?: boolean;
      isBestseller?: boolean;
      allergens?: string;
      variants?: Variant[];
      addOns?: AddOn[];
    }) =>
      api
        .post<{ menuItem: MenuItem }>(`/menu-items`, { ...data, restaurantId })
        .then((r) => r.menuItem),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items", restaurantId] });
      qc.invalidateQueries({ queryKey: ["restaurant-usage", restaurantId] });
    },
  });
}

export function useUpdateMenuItem(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MenuItem> & { id: string }) =>
      api.put<{ menuItem: MenuItem }>(`/menu-items/${id}`, data).then((r) => r.menuItem),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items", restaurantId] }),
  });
}

export function useDeleteMenuItem(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu-items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items", restaurantId] });
      qc.invalidateQueries({ queryKey: ["restaurant-usage", restaurantId] });
    },
  });
}

export function useReorderMenuItems(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, orderedIds }: { categoryId: string; orderedIds: string[] }) =>
      api.put(`/menu-items/category/${categoryId}/reorder`, { orderedIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items", restaurantId] }),
  });
}

export function useUploadMenuItemImage(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("image", file);
      return api.post<{ menuItem: MenuItem }>(`/menu-items/${id}/image`, form).then((r) => r.menuItem);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items", restaurantId] }),
  });
}

export { ApiError };
