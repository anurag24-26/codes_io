import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export { slugify };

export const createRestaurantSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
});

const dayHoursSchema = z.object({
  open: z.string().optional(),
  close: z.string().optional(),
  closed: z.boolean().optional(),
});

export const openingHoursSchema = z.object({
  mon: dayHoursSchema.optional(),
  tue: dayHoursSchema.optional(),
  wed: dayHoursSchema.optional(),
  thu: dayHoursSchema.optional(),
  fri: dayHoursSchema.optional(),
  sat: dayHoursSchema.optional(),
  sun: dayHoursSchema.optional(),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(20).optional(),
  instagram: z.string().max(60).optional(),
  openingHours: openingHoursSchema.optional(),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  // Pro-only fields (enforced in controller)
  fontFamily: z.enum(["inter", "playfair", "poppins"]).optional(),
  layoutTemplate: z.enum(["classic", "grid", "minimal"]).optional(),
  qrColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  qrIncludeLogo: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(1).max(60),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(60).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const variantSchema = z.object({
  name: z.string().min(1).max(40),
  priceDelta: z.number().max(100000),
});

const addOnSchema = z.object({
  name: z.string().min(1).max(40),
  price: z.number().nonnegative().max(100000),
});

export const createMenuItemSchema = z.object({
  restaurantId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().nonnegative().max(100000),
  isFeatured: z.boolean().optional(),
  isVeg: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  allergens: z.string().max(200).optional(),
  variants: z.array(variantSchema).max(10).optional(),
  addOns: z.array(addOnSchema).max(15).optional(),
});

export const updateMenuItemSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().nonnegative().max(100000).optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isVeg: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  allergens: z.string().max(200).optional(),
  variants: z.array(variantSchema).max(10).optional(),
  addOns: z.array(addOnSchema).max(15).optional(),
});

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
