// FILE: routes/userTicketRoutes.ts - FIXED
import express from "express";
import {
  createUserTicket,
  getUserTickets,
  deleteUserTicket,
} from "../controllers/userTicketController";
import {
  authenticateJWT,
  authorizeRegularUser, // Use strict regular user authorization
} from "../middlewares/authMiddleware";

const router = express.Router();

// STRICT separation - only regular users can access these routes
router.post("/", authenticateJWT, authorizeRegularUser, createUserTicket);
router.get("/", authenticateJWT, authorizeRegularUser, getUserTickets);
router.delete("/:id", authenticateJWT, authorizeRegularUser, deleteUserTicket);

export default router;
