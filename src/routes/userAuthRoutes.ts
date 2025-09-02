// src/routes/userAuthRoutes.ts
import express from "express";
import {
  userLogin,
  userRegister,
  userChangePassword,
} from "../controllers/userAuthController";
import { authenticateJWT, authorizeAdmin } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/login", userLogin);
router.post("/register", authenticateJWT, authorizeAdmin, userRegister);
router.put("/change-password", authenticateJWT, userChangePassword);

export default router;
