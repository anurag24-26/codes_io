import { Response } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { createRestaurantSchema, updateRestaurantSchema, slugify } from "../validations/schemas";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../lib/cloudinary";
import { getEffectivePlan } from "../middleware/planAccess";

export async function listMyRestaurants(req: AuthedRequest, res: Response) {
  const restaurants = await prisma.restaurant.findMany({
    where: { ownerId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ restaurants: restaurants.map(serialize) });
}

export async function createRestaurant(req: AuthedRequest, res: Response) {
  const parsed = createRestaurantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const base = slugify(parsed.data.name) || "restaurant";
  let slug = base;
  let attempt = 0;
  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${nanoid(5).toLowerCase()}`;
    if (attempt > 5) break;
  }

  const restaurant = await prisma.restaurant.create({
    data: { ...parsed.data, slug, ownerId: req.userId! },
  });

  res.status(201).json({ restaurant: serialize(restaurant) });
}

function serialize(restaurant: any) {
  return { ...restaurant, openingHours: restaurant.openingHours ? JSON.parse(restaurant.openingHours) : null };
}

export async function getMyRestaurant(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  res.json({ restaurant: serialize(restaurant) });
}

// Fields that require Pro, mapped to the feature key used for the error payload.
const PRO_GATED_FIELDS: Record<string, keyof typeof import("../services/plans/planLimits").PRO_ONLY_FEATURES> = {
  accentColor: "customBranding",
  fontFamily: "customFont",
  layoutTemplate: "layoutTemplate",
  qrColor: "customQr",
  qrIncludeLogo: "customQr",
};

export async function updateRestaurant(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  const parsed = updateRestaurantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const { openingHours, ...rest } = parsed.data;

  // Gate Pro-only fields server-side, regardless of what the frontend hides.
  const changedProField = Object.keys(rest).find(
    (key) => key in PRO_GATED_FIELDS && (rest as any)[key] !== (restaurant as any)[key]
  );
  if (changedProField) {
    const plan = await getEffectivePlan(req.userId!);
    if (plan !== "PRO") {
      const feature = PRO_GATED_FIELDS[changedProField];
      return res.status(403).json({
        error: "PRO_FEATURE_LOCKED",
        feature,
        message: `${feature} is a Pro feature.`,
      });
    }
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      ...rest,
      ...(openingHours !== undefined ? { openingHours: JSON.stringify(openingHours) } : {}),
    },
  });

  res.json({ restaurant: { ...updated, openingHours: updated.openingHours ? JSON.parse(updated.openingHours) : null } });
}

export async function deleteRestaurant(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  if (restaurant.logoPublicId) await deleteFromCloudinary(restaurant.logoPublicId);
  await prisma.restaurant.delete({ where: { id: restaurant.id } });
  res.json({ success: true });
}

export async function uploadLogo(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const { url, publicId } = await uploadBufferToCloudinary(file.buffer, `codes-io/logos/${restaurant.id}`);

  if (restaurant.logoPublicId) await deleteFromCloudinary(restaurant.logoPublicId);

  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { logoUrl: url, logoPublicId: publicId },
  });

  res.json({ restaurant: serialize(updated) });
}

export async function uploadBanner(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const { url, publicId } = await uploadBufferToCloudinary(file.buffer, `codes-io/banners/${restaurant.id}`);

  if (restaurant.bannerPublicId) await deleteFromCloudinary(restaurant.bannerPublicId);

  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { bannerUrl: url, bannerPublicId: publicId },
  });

  res.json({ restaurant: serialize(updated) });
}

export async function getUsage(req: AuthedRequest, res: Response) {
  const restaurant = (req as any).restaurant;
  const plan = await getEffectivePlan(req.userId!);
  const [restaurantCount, categoryCount, menuItemCount] = await Promise.all([
    prisma.restaurant.count({ where: { ownerId: req.userId } }),
    prisma.category.count({ where: { restaurantId: restaurant.id } }),
    prisma.menuItem.count({ where: { restaurantId: restaurant.id } }),
  ]);

  res.json({
    plan,
    restaurants: restaurantCount,
    categories: categoryCount,
    menuItems: menuItemCount,
  });
}
