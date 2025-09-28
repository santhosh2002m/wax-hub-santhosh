import express from "express";
import {
  sendSingleMessage,
  sendBulkMessages,
  getMessages,
  getMessageById,
  getMessageStats,
  handleTwilioWebhook,
  refreshMessageStatus, // ADDED NEW FUNCTION
} from "../controllers/twilioController";
import {
  authenticateJWT,
  authorizeAdmin,
  authorizeAdminOrManager,
} from "../middlewares/authMiddleware";

const router = express.Router();

// Public webhook for Twilio status updates (NO AUTH NEEDED)
router.post("/webhook", handleTwilioWebhook);

// Protected routes
router.post("/send", authenticateJWT, authorizeAdmin, sendSingleMessage);
router.post("/send-bulk", authenticateJWT, authorizeAdmin, sendBulkMessages);
router.get("/", authenticateJWT, authorizeAdminOrManager, getMessages);
router.get("/stats", authenticateJWT, authorizeAdminOrManager, getMessageStats);
router.get("/:id", authenticateJWT, authorizeAdminOrManager, getMessageById);
router.post(
  "/refresh-status/:messageSid",
  authenticateJWT,
  authorizeAdminOrManager,
  refreshMessageStatus
); // NEW ROUTE

export default router;
