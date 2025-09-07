import express from "express";
import {
  getTodayOverview,
  getLast7Days,
  getLast30Days,
  getAnnualPerformance,
  getCalendarView,
  deleteCalendarTransaction,
  updateCalendarTransaction,
} from "../controllers/analyticsController";
import {
  authenticateJWT,
  authorizeAdminOrManager,
} from "../middlewares/authMiddleware";
import { transactionUpdateSchema } from "../schemas/transactionSchema";

const router = express.Router();

// Add validation middleware for update route
const validateUpdate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { error } = transactionUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation error",
      details: error.details.map((err) => err.message),
    });
  }
  next();
};

router.get(
  "/today",
  authenticateJWT,
  authorizeAdminOrManager,
  getTodayOverview
);
router.get(
  "/last7days",
  authenticateJWT,
  authorizeAdminOrManager,
  getLast7Days
);
router.get(
  "/last30days",
  authenticateJWT,
  authorizeAdminOrManager,
  getLast30Days
);
router.get(
  "/annual",
  authenticateJWT,
  authorizeAdminOrManager,
  getAnnualPerformance
);
router.get(
  "/calendar",
  authenticateJWT,
  authorizeAdminOrManager,
  getCalendarView
);
router.delete(
  "/calendar/:invoice_no",
  authenticateJWT,
  authorizeAdminOrManager,
  deleteCalendarTransaction
);
router.put(
  "/calendar/:invoice_no",
  authenticateJWT,
  authorizeAdminOrManager,
  validateUpdate, // Add validation middleware
  updateCalendarTransaction
);

export default router;
