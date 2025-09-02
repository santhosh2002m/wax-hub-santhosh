import express from "express";
import {
  getMessages,
  addMessage,
  deleteMessage,
} from "../controllers/messageController";
import {
  authenticateJWT,
  authorizeAdmin,
  authorizeAdminOrManager,
} from "../middlewares/authMiddleware"; // Added authorizeAdminOrManager

const router = express.Router();

router.get("/", authenticateJWT, authorizeAdminOrManager, getMessages); // Changed to allow managers
router.post("/", authenticateJWT, addMessage);
router.delete("/:id", authenticateJWT, authorizeAdmin, deleteMessage);

export default router;
