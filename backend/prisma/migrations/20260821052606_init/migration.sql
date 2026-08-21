-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "addOns" TEXT,
ADD COLUMN     "allergens" TEXT,
ADD COLUMN     "isBestseller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSpicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVeg" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "variants" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "bannerPublicId" TEXT,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "fontFamily" TEXT DEFAULT 'inter',
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "layoutTemplate" TEXT DEFAULT 'classic',
ADD COLUMN     "openingHours" TEXT,
ADD COLUMN     "qrColor" TEXT DEFAULT '#111827',
ADD COLUMN     "qrIncludeLogo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" TEXT;
