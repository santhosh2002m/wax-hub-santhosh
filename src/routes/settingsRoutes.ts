import express from "express";
import { getCounterSettings, updateCounterSettings } from "../controllers/settingsController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", authenticateJWT, getCounterSettings);
router.post("/reset-date", authenticateJWT, updateCounterSettings);

export default router;
