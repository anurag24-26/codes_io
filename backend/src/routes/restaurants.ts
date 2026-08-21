import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRestaurantOwnership } from "../middleware/ownership";
import { enforceRestaurantCreateLimit, requireProFeature } from "../middleware/planAccess";
import { imageUpload } from "../middleware/upload";
import {
  listMyRestaurants,
  createRestaurant,
  getMyRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadLogo,
  uploadBanner,
  getUsage,
} from "../controllers/restaurantController";

const router = Router();

router.use(requireAuth);

router.get("/", listMyRestaurants);
router.post("/", enforceRestaurantCreateLimit, createRestaurant);

router.get("/:id", requireRestaurantOwnership, getMyRestaurant);
router.put("/:id", requireRestaurantOwnership, updateRestaurant);
router.delete("/:id", requireRestaurantOwnership, deleteRestaurant);

router.get("/:id/usage", requireRestaurantOwnership, getUsage);

// Logo, banner, and custom branding are Pro-only
router.post(
  "/:id/logo",
  requireRestaurantOwnership,
  requireProFeature("logoUpload"),
  imageUpload.single("logo"),
  uploadLogo
);

router.post(
  "/:id/banner",
  requireRestaurantOwnership,
  requireProFeature("bannerUpload"),
  imageUpload.single("banner"),
  uploadBanner
);

export default router;
