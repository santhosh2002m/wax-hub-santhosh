import express from "express";
import { login, editProfile } from "../controllers/authController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/login", login);
router.put("/profile", authenticateJWT, editProfile);

export default router;
