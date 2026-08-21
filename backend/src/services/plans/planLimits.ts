import { Plan } from "@prisma/client";

/**
 * Single source of truth for Free vs Pro limits and feature flags.
 * Every enforcement point (controllers, middleware) must read from here,
 * never hardcode a number inline.
 */
export const PLAN_LIMITS = {
  FREE: {
    maxRestaurants: 1,
    maxCategoriesPerRestaurant: 3,
    maxMenuItemsPerRestaurant: 20,
  },
  PRO: {
    maxRestaurants: Infinity,
    maxCategoriesPerRestaurant: Infinity,
    maxMenuItemsPerRestaurant: Infinity,
  },
} as const;

export const PRO_ONLY_FEATURES = {
  logoUpload: "Custom restaurant logo",
  customBranding: "Custom accent colors / branding",
  removePoweredBy: 'Remove "Powered by Codes.io"',
  analytics: "Menu analytics",
  featuredItems: "Featured / popular items",
  specialOffers: "Special offers",
  bannerUpload: "Background wallpaper / banner image",
  customFont: "Custom menu font",
  layoutTemplate: "Custom layout template",
  customQr: "Custom QR color and embedded logo",
} as const;

export type ProFeature = keyof typeof PRO_ONLY_FEATURES;

export function limitsForPlan(plan: Plan) {
  return PLAN_LIMITS[plan as "FREE" | "PRO"];
}

export function isProFeatureAllowed(plan: Plan): boolean {
  return plan === "PRO";
}
