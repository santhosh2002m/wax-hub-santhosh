import express from "express";
import {
  createUserTicket,
  getUserTickets,
  deleteUserTicket,
} from "../controllers/userTicketController";
import {
  authenticateJWT,
  authorizeUser, // Changed from authorizeManager to authorizeUser
} from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", authenticateJWT, authorizeUser, createUserTicket); // Changed middleware
router.get("/", authenticateJWT, authorizeUser, getUserTickets); // Changed middleware
router.delete("/:id", authenticateJWT, authorizeUser, deleteUserTicket); // Changed middleware

export default router;
