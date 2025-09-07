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

const router = express.Router();

// Remove strict validation - allow any field to be edited
const validateUpdate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Allow any field to be updated without validation
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
  validateUpdate, // Updated validation middleware
  updateCalendarTransaction
);

export default router;
