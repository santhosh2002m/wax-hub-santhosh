import express from "express";
import {
  addCounter,
  deleteCounter,
  getCounters,
  registerAdmin,
  changePassword,
} from "../controllers/counterController";
import {
  authenticateJWT,
  authorizeAdmin,
  authorizeAdminOrManager,
} from "../middlewares/authMiddleware"; // Added authorizeAdminOrManager

const router = express.Router();

router.post("/", authenticateJWT, authorizeAdmin, addCounter);
router.delete("/:username", authenticateJWT, authorizeAdmin, deleteCounter);
router.get("/", authenticateJWT, authorizeAdminOrManager, getCounters); // Changed to allow managers
router.post("/register", authenticateJWT, authorizeAdmin, registerAdmin);
router.put("/password", authenticateJWT, changePassword);

export default router;
