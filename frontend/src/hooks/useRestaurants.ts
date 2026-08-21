import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}
export interface OpeningHours {
  mon?: DayHours;
  tue?: DayHours;
  wed?: DayHours;
  thu?: DayHours;
  fri?: DayHours;
  sat?: DayHours;
  sun?: DayHours;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  accentColor?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  openingHours?: OpeningHours | null;
  bannerUrl?: string | null;
  fontFamily?: "inter" | "playfair" | "poppins" | null;
  layoutTemplate?: "classic" | "grid" | "minimal" | null;
  qrColor?: string | null;
  qrIncludeLogo?: boolean;
  createdAt: string;
}

export function useMyRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: () => api.get<{ restaurants: Restaurant[] }>("/restaurants").then((r) => r.restaurants),
  });
}

export function useRestaurant(id?: string) {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => api.get<{ restaurant: Restaurant }>(`/restaurants/${id}`).then((r) => r.restaurant),
    enabled: !!id,
  });
}

export function useRestaurantUsage(id?: string) {
  return useQuery({
    queryKey: ["restaurant-usage", id],
    queryFn: () =>
      api.get<{ plan: string; restaurants: number; categories: number; menuItems: number }>(
        `/restaurants/${id}/usage`
      ),
    enabled: !!id,
  });
}

export function useCreateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; address?: string; phone?: string }) =>
      api.post<{ restaurant: Restaurant }>("/restaurants", data).then((r) => r.restaurant),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurants"] }),
  });
}

export function useUpdateRestaurant(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Restaurant>) =>
      api.put<{ restaurant: Restaurant }>(`/restaurants/${id}`, data).then((r) => r.restaurant),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurant", id] });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
}

export function useUploadLogo(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("logo", file);
      return api.post<{ restaurant: Restaurant }>(`/restaurants/${id}/logo`, form).then((r) => r.restaurant);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant", id] }),
  });
}

export function useUploadBanner(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("banner", file);
      return api.post<{ restaurant: Restaurant }>(`/restaurants/${id}/banner`, form).then((r) => r.restaurant);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant", id] }),
  });
}

