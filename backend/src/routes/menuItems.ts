import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRestaurantOwnership, requireMenuItemOwnership, requireCategoryOwnership } from "../middleware/ownership";
import { enforceMenuItemCreateLimit } from "../middleware/planAccess";
import { imageUpload } from "../middleware/upload";
import {
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuItemImage,
  reorderMenuItems,
} from "../controllers/menuItemController";

const router = Router();

router.use(requireAuth);

router.get("/restaurant/:restaurantId", requireRestaurantOwnership, listMenuItems);

// restaurantId comes from the validated body but ownership + limit are
// verified server-side in enforceMenuItemCreateLimit before creation.
router.post("/", enforceMenuItemCreateLimit, createMenuItem);

// :id here is a categoryId; requireCategoryOwnership verifies it belongs to the caller
router.put("/category/:id/reorder", requireCategoryOwnership, reorderMenuItems);

router.put("/:id", requireMenuItemOwnership, updateMenuItem);
router.delete("/:id", requireMenuItemOwnership, deleteMenuItem);
router.post("/:id/image", requireMenuItemOwnership, imageUpload.single("image"), uploadMenuItemImage);

export default router;
