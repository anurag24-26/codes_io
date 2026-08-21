import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRestaurantOwnership, requireCategoryOwnership } from "../middleware/ownership";
import { enforceCategoryCreateLimit } from "../middleware/planAccess";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../controllers/categoryController";

const router = Router();

router.use(requireAuth);

// Listing/creating is scoped under a restaurant to guarantee ownership checks
router.get("/restaurant/:restaurantId", requireRestaurantOwnership, listCategories);
router.post("/restaurant/:restaurantId", requireRestaurantOwnership, enforceCategoryCreateLimit, createCategory);
router.put("/restaurant/:restaurantId/reorder", requireRestaurantOwnership, reorderCategories);

router.put("/:id", requireCategoryOwnership, updateCategory);
router.delete("/:id", requireCategoryOwnership, deleteCategory);

export default router;
