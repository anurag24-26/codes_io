import { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "./auth";
import { limitsForPlan, ProFeature, PRO_ONLY_FEATURES } from "../services/plans/planLimits";
import { Plan, SubscriptionStatus } from "@prisma/client";

const ACTIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

export async function getEffectivePlan(userId: string): Promise<Plan> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return "FREE";
  if (sub.plan === "PRO" && ACTIVE_STATUSES.includes(sub.status)) return "PRO";
  return "FREE";
}

/** Attaches req.plan for use in controllers. */
export async function attachPlan(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.userId) {
    (req as any).plan = await getEffectivePlan(req.userId);
  }
  next();
}

/** Blocks the request unless the user's effective plan is PRO. */
export function requireProFeature(feature: ProFeature) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
    const plan = await getEffectivePlan(req.userId);
    if (plan !== "PRO") {
      return res.status(403).json({
        error: "PRO_FEATURE_LOCKED",
        feature,
        message: `${PRO_ONLY_FEATURES[feature]} is a Pro feature.`,
      });
    }
    (req as any).plan = plan;
    next();
  };
}

export async function enforceRestaurantCreateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
  const plan = await getEffectivePlan(req.userId);
  const limits = limitsForPlan(plan);
  const count = await prisma.restaurant.count({ where: { ownerId: req.userId } });
  if (count >= limits.maxRestaurants) {
    return res.status(403).json({
      error: "PLAN_LIMIT_REACHED",
      message: "You've reached your Free plan limit of 1 restaurant. Upgrade to Pro for unlimited restaurants.",
    });
  }
  next();
}

export async function enforceCategoryCreateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  const restaurant = (req as any).restaurant;
  if (!req.userId || !restaurant) return res.status(400).json({ error: "Missing restaurant context" });
  const plan = await getEffectivePlan(req.userId);
  const limits = limitsForPlan(plan);
  const count = await prisma.category.count({ where: { restaurantId: restaurant.id } });
  if (count >= limits.maxCategoriesPerRestaurant) {
    return res.status(403).json({
      error: "PLAN_LIMIT_REACHED",
      message: "You've reached your Free plan limit of 3 categories. Upgrade to Pro for unlimited categories.",
    });
  }
  next();
}

export async function enforceMenuItemCreateLimit(req: AuthedRequest, res: Response, next: NextFunction) {
  const restaurantId = req.body?.restaurantId;
  if (!req.userId || !restaurantId) return res.status(400).json({ error: "Missing restaurantId" });

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.ownerId !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const plan = await getEffectivePlan(req.userId);
  const limits = limitsForPlan(plan);
  const count = await prisma.menuItem.count({ where: { restaurantId } });
  if (count >= limits.maxMenuItemsPerRestaurant) {
    return res.status(403).json({
      error: "PLAN_LIMIT_REACHED",
      message: "You've reached your Free plan limit of 20 menu items. Upgrade to Pro for unlimited menu items.",
    });
  }
  (req as any).restaurant = restaurant;
  next();
}
