// routes/specialTicketRoutes.ts
import express from "express";
import {
  createSpecialTicket,
  getSpecialTickets,
  deleteSpecialTicket,
} from "../controllers/specialTicketController";
import {
  authenticateJWT,
  authorizeSpecialCounter,
  authorizeAdminOrManager, // Changed from authorizeAdminOrManager to allow managers
} from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/", authenticateJWT, authorizeSpecialCounter, createSpecialTicket);
router.get("/", authenticateJWT, authorizeAdminOrManager, getSpecialTickets); // Changed to allow managers
router.delete(
  "/:id",
  authenticateJWT,
  authorizeAdminOrManager, // Changed to allow managers
  deleteSpecialTicket
);

export default router;
