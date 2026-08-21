import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { createMenuItemSchema, updateMenuItemSchema, reorderSchema } from "../validations/schemas";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../lib/cloudinary";
import { getEffectivePlan } from "../middleware/planAccess";

function serializeItem(item: any) {
  return {
    ...item,
    variants: item.variants ? JSON.parse(item.variants) : [],
    addOns: item.addOns ? JSON.parse(item.addOns) : [],
  };
}

export async function listMenuItems(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  const items = await prisma.menuItem.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { category: true },
  });
  res.json({ menuItems: items.map(serializeItem) });
}

export async function createMenuItem(req: AuthedRequest, res: Response) {
  // req.restaurant is set by enforceMenuItemCreateLimit after verifying ownership
  const restaurant = (req as any).restaurant;
  const parsed = createMenuItemSchema.safeParse({
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : undefined,
  });
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  if (parsed.data.restaurantId !== restaurant.id) {
    return res.status(403).json({ error: "restaurantId does not match verified restaurant" });
  }

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category || category.restaurantId !== restaurant.id) {
    return res.status(400).json({ error: "Invalid categoryId for this restaurant" });
  }

  if (parsed.data.isFeatured) {
    const plan = await getEffectivePlan(req.userId!);
    if (plan !== "PRO") {
      return res.status(403).json({
        error: "PRO_FEATURE_LOCKED",
        feature: "featuredItems",
        message: "Featured items are a Pro feature.",
      });
    }
  }

  const item = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      isFeatured: parsed.data.isFeatured ?? false,
      isVeg: parsed.data.isVeg ?? true,
      isSpicy: parsed.data.isSpicy ?? false,
      isBestseller: parsed.data.isBestseller ?? false,
      allergens: parsed.data.allergens,
      variants: parsed.data.variants ? JSON.stringify(parsed.data.variants) : undefined,
      addOns: parsed.data.addOns ? JSON.stringify(parsed.data.addOns) : undefined,
    },
  });

  res.status(201).json({ menuItem: serializeItem(item) });
}

export async function updateMenuItem(req: AuthedRequest, res: Response) {
  const item = (req as any).menuItem;
  const parsed = updateMenuItemSchema.safeParse({
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : undefined,
  });
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  if (parsed.data.isFeatured) {
    const plan = await getEffectivePlan(req.userId!);
    if (plan !== "PRO") {
      return res.status(403).json({
        error: "PRO_FEATURE_LOCKED",
        feature: "featuredItems",
        message: "Featured items are a Pro feature.",
      });
    }
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
    if (!category || category.restaurantId !== item.restaurantId) {
      return res.status(400).json({ error: "Invalid categoryId for this restaurant" });
    }
  }

  const { variants, addOns, ...rest } = parsed.data;

  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: {
      ...rest,
      ...(variants !== undefined ? { variants: JSON.stringify(variants) } : {}),
      ...(addOns !== undefined ? { addOns: JSON.stringify(addOns) } : {}),
    },
  });

  res.json({ menuItem: serializeItem(updated) });
}

// Bulk-reorder menu items within a category.
export async function reorderMenuItems(req: AuthedRequest, res: Response) {
  const category = (req as any).category; // set by requireCategoryOwnership-style check below
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const items = await prisma.menuItem.findMany({ where: { categoryId: category.id } });
  const validIds = new Set(items.map((i: { id: string }) => i.id));
  const allBelong = parsed.data.orderedIds.every((id) => validIds.has(id));
  if (!allBelong) {
    return res.status(400).json({ error: "orderedIds contains an item not in this category" });
  }

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.menuItem.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  res.json({ success: true });
}

export async function deleteMenuItem(req: AuthedRequest, res: Response) {
  const item = (req as any).menuItem;
  if (item.imagePublicId) await deleteFromCloudinary(item.imagePublicId);
  await prisma.menuItem.delete({ where: { id: item.id } });
  res.json({ success: true });
}

export async function uploadMenuItemImage(req: AuthedRequest, res: Response) {
  const item = (req as any).menuItem;
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const { url, publicId } = await uploadBufferToCloudinary(
    file.buffer,
    `codes-io/menu-items/${item.restaurantId}`
  );

  if (item.imagePublicId) await deleteFromCloudinary(item.imagePublicId);

  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: { imageUrl: url, imagePublicId: publicId },
  });

  res.json({ menuItem: serializeItem(updated) });
}
