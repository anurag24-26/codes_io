import { NextFunction, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "./auth";

/**
 * Verifies that req.params.restaurantId (or :id on restaurant routes)
 * belongs to the authenticated user. Never trust a restaurant id supplied
 * by the client without this check.
 */
export async function requireRestaurantOwnership(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const restaurantId = req.params.restaurantId || req.params.id;

  if (!restaurantId) {
    return res.status(400).json({ error: "Missing restaurant id" });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  if (restaurant.ownerId !== req.userId) {
    return res.status(403).json({ error: "Forbidden: you do not own this restaurant" });
  }

  (req as any).restaurant = restaurant;
  next();
}

/**
 * For category/menu-item routes: resolves the parent restaurant via the
 * category/menu item id and verifies ownership through it. Restaurant
 * ownership is always derived server-side, never taken from the body.
 */
export async function requireCategoryOwnership(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const categoryId = req.params.id;
  if (!categoryId) return res.status(400).json({ error: "Missing category id" });

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { restaurant: true },
  });

  if (!category) return res.status(404).json({ error: "Category not found" });
  if (category.restaurant.ownerId !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  (req as any).category = category;
  next();
}

export async function requireMenuItemOwnership(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const itemId = req.params.id;
  if (!itemId) return res.status(400).json({ error: "Missing menu item id" });

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { restaurant: true },
  });

  if (!item) return res.status(404).json({ error: "Menu item not found" });
  if (item.restaurant.ownerId !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  (req as any).menuItem = item;
  next();
}
