import express from "express";
import {
  getUserGuides,
  createUserGuide,
  updateUserGuide,
  deleteUserGuide,
} from "../controllers/userGuideController";
import {
  authenticateJWT,
  authorizeAdmin,
  authorizeAdminOrManager, // Changed from authorizeAdminOrUser to authorizeAdminOrManager
} from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", authenticateJWT, authorizeAdminOrManager, getUserGuides); // Updated middleware
router.post("/", authenticateJWT, authorizeAdmin, createUserGuide);
router.put("/:id", authenticateJWT, authorizeAdmin, updateUserGuide);
router.delete("/:id", authenticateJWT, authorizeAdmin, deleteUserGuide);

export default router;
