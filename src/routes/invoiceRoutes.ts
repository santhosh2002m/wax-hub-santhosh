import express from "express";
import { InvoiceNumberGenerator } from "../utils/invoiceNumberGenerator";
import { authenticateJWT, authorizeAdmin } from "../middlewares/authMiddleware";
import InvoiceCounter from "../models/InvoiceCounter";

const router = express.Router();

// Admin route to check current invoice counters
router.get("/counters", authenticateJWT, authorizeAdmin, async (req, res) => {
  try {
    const counter = await InvoiceCounter.findOne();
    res.json({
      last_user_invoice: counter?.last_user_invoice || 0,
      last_special_invoice: counter?.last_special_invoice || 0,
    });
  } catch (error) {
    console.error("Error getting invoice counters:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin route to reset counters (for testing)
router.post("/reset", authenticateJWT, authorizeAdmin, async (req, res) => {
  try {
    await InvoiceNumberGenerator.resetCounters();
    res.json({ message: "Invoice counters reset successfully" });
  } catch (error) {
    console.error("Error resetting invoice counters:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
