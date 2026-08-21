import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getSubscription, mockCheckout, mockCancel, webhook } from "../controllers/billingController";

const router = Router();

router.get("/subscription", requireAuth, getSubscription);
router.post("/checkout", requireAuth, mockCheckout);
router.post("/cancel", requireAuth, mockCancel);
router.post("/webhook", webhook); // no requireAuth: called by external provider

export default router;
