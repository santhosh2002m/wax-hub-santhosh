// FILE: app.ts (updated for HTTPS with IP address)
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import https from "https";
import fs from "fs";
import path from "path";
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

// Middleware
app.use(
  helmet({
    // Disable content security policy for development
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: ["https://68.178.168.156:3000", "http://localhost:3000"], // Add your frontend URLs
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Database sync and special counter creation
sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log("Database synced");
    await createSpecialCounter();
    scheduleDailyCleanup();

    setTimeout(async () => {
      try {
        await cleanupOldTickets();
        console.log("Initial cleanup completed");
      } catch (error) {
        console.error("Initial cleanup failed:", error);
      }
    }, 5000);
  })
  .catch((err) => console.error("Database sync error:", err));

// Error handling middleware
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

const PORT = process.env.PORT || 3000;

// HTTPS configuration with self-signed certificate
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "..", "ssl", "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "..", "ssl", "cert.pem")),
  rejectUnauthorized: false,
};
// Create HTTPS server
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://68.178.168.156:${PORT}`);
});

// Optional: Also create HTTP server that redirects to HTTPS
import http from "http";
const HTTP_PORT = 3001;

http
  .createServer((req, res) => {
    const httpsUrl = `https://68.178.168.156:${PORT}${req.url}`;
    res.writeHead(301, { Location: httpsUrl });
    res.end();
  })
  .listen(HTTP_PORT, () => {
    console.log(`HTTP redirect server running on port ${HTTP_PORT}`);
  });
