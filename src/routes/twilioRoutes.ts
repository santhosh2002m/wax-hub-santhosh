import express from "express";
import {
  sendSingleMessage,
  sendBulkMessages,
  getMessages,
  getMessageById,
  getMessageStats,
  handleTwilioWebhook,
} from "../controllers/twilioController";
import {
  authenticateJWT,
  authorizeAdmin,
  authorizeAdminOrManager,
} from "../middlewares/authMiddleware"; // Added authorizeAdminOrManager

const router = express.Router();

// Public webhook for Twilio status updates
router.post("/webhook", handleTwilioWebhook);

// Protected routes
router.post("/send", authenticateJWT, authorizeAdmin, sendSingleMessage);
router.post("/send-bulk", authenticateJWT, authorizeAdmin, sendBulkMessages);
router.get("/", authenticateJWT, authorizeAdminOrManager, getMessages); // Changed to allow managers
router.get("/stats", authenticateJWT, authorizeAdminOrManager, getMessageStats); // Changed to allow managers
router.get("/:id", authenticateJWT, authorizeAdminOrManager, getMessageById); // Changed to allow managers

export default router;
