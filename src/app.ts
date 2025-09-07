// FILE: app.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import sequelize from "./config/database";
import counterRoutes from "./routes/counterRoutes";
import authRoutes from "./routes/authRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import guideRoutes from "./routes/guideRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import messageRoutes from "./routes/messageRoutes";
import userTicketRoutes from "./routes/userTicketRoutes";
import userGuideRoutes from "./routes/userGuideRoutes";
import specialTicketRoutes from "./routes/specialTicketRoutes";
import userAuthRoutes from "./routes/userAuthRoutes";
import { createSpecialCounter } from "./controllers/counterController";
import twilioRoutes from "./routes/twilioRoutes";
import { scheduleDailyCleanup, cleanupOldTickets } from "./utils/dailyCleanup";

dotenv.config();

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // disable CSP for local dev
  })
);

// CORS setup
app.use(
  cors({
    origin: [
      "https://finalprojects.io", // frontend (production)
      "https://api.finalprojects.io", // backend domain
      "http://localhost:3000", // local frontend dev
      "http://localhost:8080", // Vite default
      "http://localhost:8081", // fallback Vite port
      "http://localhost:8082",
      "https://thermosandmuseum.icu",
      "https://admin.thermosandmuseum.icu",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/counters", counterRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/user/tickets", userTicketRoutes);
app.use("/api/user/guides", userGuideRoutes);
app.use("/api/special/tickets", specialTicketRoutes);
app.use("/api/user/auth", userAuthRoutes);
app.use("/api/twilio", twilioRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Database setup
sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("✅ Database synced");
    await createSpecialCounter();
    scheduleDailyCleanup();

    setTimeout(async () => {
      try {
        await cleanupOldTickets();
        console.log("🧹 Initial cleanup completed");
      } catch (error) {
        console.error("Cleanup failed:", error);
      }
    }, 5000);
  })
  .catch((err) => console.error("Database sync error:", err));

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
  }
);

// Ensure PORT is always a number
const PORT: number = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});
