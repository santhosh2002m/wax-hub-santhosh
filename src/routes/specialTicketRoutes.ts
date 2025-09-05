// FILE: routes/specialTicketRoutes.ts - FIXED
import express from "express";
import {
  createSpecialTicket,
  getSpecialTickets,
  deleteSpecialTicket,
} from "../controllers/specialTicketController";
import {
  authenticateJWT,
  authorizeSpecialUser, // Use strict special user authorization
  authorizeAdminOrManager,
} from "../middlewares/authMiddleware";

const router = express.Router();

// STRICT separation - only special users can create special tickets
router.post("/", authenticateJWT, authorizeSpecialUser, createSpecialTicket);

// Admin/manager can view, but special users can only view their own (handled in controller)
router.get("/", authenticateJWT, authorizeAdminOrManager, getSpecialTickets);

// Special users can delete their own, admins can delete any
router.delete(
  "/:id",
  authenticateJWT,
  authorizeAdminOrManager,
  deleteSpecialTicket
);

export default router;
