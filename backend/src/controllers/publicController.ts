import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getEffectivePlan } from "../middleware/planAccess";
import QRCode from "qrcode";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function computeIsOpenNow(openingHoursJson: string | null): boolean | null {
  if (!openingHoursJson) return null;
  try {
    const hours = JSON.parse(openingHoursJson);
    const now = new Date();
    const dayKey = DAY_KEYS[now.getDay()];
    const today = hours?.[dayKey];
    if (!today || today.closed || !today.open || !today.close) return false;

    const [openH, openM] = today.open.split(":").map(Number);
    const [closeH, closeM] = today.close.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (closeMinutes > openMinutes) {
      return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
    }
    // overnight window, e.g. 18:00 - 02:00
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  } catch {
    return null;
  }
}

export async function getPublicMenu(req: Request, res: Response) {
  const { slug } = req.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          menuItems: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  const plan = await getEffectivePlan(restaurant.ownerId);
  const isPro = plan === "PRO";

  res.json({
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      logoUrl: restaurant.logoUrl,
      accentColor: restaurant.accentColor,
      address: restaurant.address,
      phone: restaurant.phone,
      whatsapp: restaurant.whatsapp,
      instagram: restaurant.instagram,
      openingHours: restaurant.openingHours ? JSON.parse(restaurant.openingHours) : null,
      isOpenNow: computeIsOpenNow(restaurant.openingHours),
      // Pro-only presentation fields — fall back to defaults for Free so an
      // expired/downgraded subscription doesn't keep serving Pro visuals.
      bannerUrl: isPro ? restaurant.bannerUrl : null,
      fontFamily: isPro ? restaurant.fontFamily : "inter",
      layoutTemplate: isPro ? restaurant.layoutTemplate : "classic",
      showPoweredBy: !isPro,
    },
    categories: restaurant.categories.map((c: (typeof restaurant.categories)[number]) => ({
      id: c.id,
      name: c.name,
      menuItems: c.menuItems
        .filter((i: (typeof c.menuItems)[number]) => i.isAvailable)
        .map((i: (typeof c.menuItems)[number]) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          imageUrl: i.imageUrl,
          isFeatured: i.isFeatured,
          isVeg: i.isVeg,
          isSpicy: i.isSpicy,
          isBestseller: i.isBestseller,
          allergens: i.allergens,
          variants: i.variants ? JSON.parse(i.variants) : [],
          addOns: i.addOns ? JSON.parse(i.addOns) : [],
        })),
    })),
  });
}

export async function getPublicMenuQrPng(req: Request, res: Response) {
  const { slug } = req.params;

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  const plan = await getEffectivePlan(restaurant.ownerId);
  const isPro = plan === "PRO";

  const appUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
  const menuUrl = `${appUrl}/menu/${restaurant.slug}`;

  const color = isPro && restaurant.qrColor ? restaurant.qrColor : "#111827";

  const pngBuffer = await QRCode.toBuffer(menuUrl, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: color, light: "#ffffffff" },
  });

  // Embedding a logo into the raster PNG server-side would need an extra
  // image-compositing dependency; the frontend QR component (Pro) overlays
  // the restaurant logo on the canvas version instead, which is what the
  // owner previews and downloads.

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `inline; filename="${restaurant.slug}-qr.png"`);
  res.send(pngBuffer);
}
