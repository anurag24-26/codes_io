import { Router } from "express";
import { getPublicMenu, getPublicMenuQrPng } from "../controllers/publicController";

const router = Router();

router.get("/menu/:slug", getPublicMenu);
router.get("/menu/:slug/qr.png", getPublicMenuQrPng);

export default router;
