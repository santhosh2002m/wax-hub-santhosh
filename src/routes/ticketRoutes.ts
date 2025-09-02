import express from "express";
import {
  getTickets,
  addTicket,
  updateTicket,
  deleteTicket,
  getTicketById,
} from "../controllers/ticketController";
import {
  authenticateJWT,
  authorizeAdmin,
  authorizeAdminOrUser,
  authorizeAdminOrManager,
} from "../middlewares/authMiddleware";

const router = express.Router();

// Allow both admin, manager, and user to read tickets
router.get("/", authenticateJWT, authorizeAdminOrUser, getTickets);
router.get("/:id", authenticateJWT, authorizeAdminOrUser, getTicketById);

// Only admin and managers can modify tickets
router.post("/", authenticateJWT, authorizeAdminOrManager, addTicket);
router.put("/:id", authenticateJWT, authorizeAdminOrManager, updateTicket);
router.delete("/:id", authenticateJWT, authorizeAdminOrManager, deleteTicket);

export default router;
