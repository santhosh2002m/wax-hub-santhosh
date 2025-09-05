import express from "express";
import {
  getUserGuides,
  getUserGuide,
  createUserGuide,
  updateUserGuide,
  deleteUserGuide,
  getTopPerformers,
} from "../controllers/userGuideController";
import {
  authenticateJWT,
  authorizeAdmin,
  authorizeForGuides, // Use the new authorization
} from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", authenticateJWT, authorizeForGuides, getUserGuides);
router.get("/top", authenticateJWT, authorizeForGuides, getTopPerformers);
router.get("/:id", authenticateJWT, authorizeForGuides, getUserGuide);
router.post("/", authenticateJWT, authorizeAdmin, createUserGuide);
router.put("/:id", authenticateJWT, authorizeAdmin, updateUserGuide);
router.delete("/:id", authenticateJWT, authorizeAdmin, deleteUserGuide);

export default router;
