import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { createCategorySchema, updateCategorySchema, reorderSchema } from "../validations/schemas";

export async function listCategories(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { sortOrder: "asc" },
  });
  res.json({ categories });
}

export async function createCategory(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  if (parsed.data.restaurantId !== restaurant.id) {
    return res.status(403).json({ error: "restaurantId does not match verified restaurant" });
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder ?? 0,
      restaurantId: restaurant.id,
    },
  });

  res.status(201).json({ category });
}

export async function updateCategory(req: AuthedRequest, res: Response) {
  const category = (req as any).category;
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const updated = await prisma.category.update({
    where: { id: category.id },
    data: parsed.data,
  });

  res.json({ category: updated });
}

export async function deleteCategory(req: AuthedRequest, res: Response) {
  const category = (req as any).category;
  await prisma.category.delete({ where: { id: category.id } });
  res.json({ success: true });
}

// Bulk-reorder categories within a restaurant. Ownership of the restaurant
// is verified upstream by requireRestaurantOwnership; here we additionally
// confirm every id in the payload actually belongs to this restaurant
// before writing anything.
export async function reorderCategories(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const items = await prisma.category.findMany({ where: { restaurantId: restaurant.id } });
  const validIds = new Set(items.map((c: { id: string }) => c.id));
  const allBelong = parsed.data.orderedIds.every((id) => validIds.has(id));
  if (!allBelong) {
    return res.status(400).json({ error: "orderedIds contains a category not in this restaurant" });
  }

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.category.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  res.json({ success: true });
}
