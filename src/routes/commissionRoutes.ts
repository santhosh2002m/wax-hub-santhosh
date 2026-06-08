import { Router } from "express";
import {
  getCommissionTickets,
  markCommissionPaid,
} from "../controllers/commissionController";
import {
  authenticateJWT,
  authorizeCommission,
} from "../middlewares/authMiddleware";

const router = Router();

router.get("/tickets", authenticateJWT, authorizeCommission, getCommissionTickets);
router.put(
  "/tickets/:id/paid",
  authenticateJWT,
  authorizeCommission,
  markCommissionPaid
);

export default router;
