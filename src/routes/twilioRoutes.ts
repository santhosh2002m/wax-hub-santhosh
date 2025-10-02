import express from "express";
import twilioController from "../controllers/twilioController";
import {
  authenticateJWT,
  authorizeAdmin,
  authorizeAdminOrManager,
} from "../middlewares/authMiddleware";

const router = express.Router();

// Public webhook for Twilio status updates (NO AUTH NEEDED)
router.post("/webhook", twilioController);

// Protected routes
router.post("/send", authenticateJWT, authorizeAdmin, twilioController);
router.post("/send-bulk", authenticateJWT, authorizeAdmin, twilioController);
router.get("/", authenticateJWT, authorizeAdminOrManager, twilioController);
router.get(
  "/stats",
  authenticateJWT,
  authorizeAdminOrManager,
  twilioController
);
router.get("/:id", authenticateJWT, authorizeAdminOrManager, twilioController);
router.post(
  "/refresh-status/:messageSid",
  authenticateJWT,
  authorizeAdminOrManager,
  twilioController
);

export default router;
