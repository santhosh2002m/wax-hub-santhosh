// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import morgan from "morgan";
// import helmet from "helmet";
// import sequelize from "./config/database";
// import counterRoutes from "./routes/counterRoutes";
// import authRoutes from "./routes/authRoutes";
// import ticketRoutes from "./routes/ticketRoutes";
// import guideRoutes from "./routes/guideRoutes"; // Add this import
// import analyticsRoutes from "./routes/analyticsRoutes";
// import messageRoutes from "./routes/messageRoutes";
// import userTicketRoutes from "./routes/userTicketRoutes";
// import userGuideRoutes from "./routes/userGuideRoutes";
// import specialTicketRoutes from "./routes/specialTicketRoutes";
// import userAuthRoutes from "./routes/userAuthRoutes";
// import { createSpecialCounter } from "./controllers/counterController";
// import twilioRoutes from "./routes/twilioRoutes";
// import { scheduleDailyCleanup, cleanupOldTickets } from "./utils/dailyCleanup";

// dotenv.config();

// const app = express();

// // Middleware
// app.use(helmet());
// app.use(cors());
// app.use(express.json());
// app.use(morgan("dev"));

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/counters", counterRoutes);
// app.use("/api/tickets", ticketRoutes);
// app.use("/api/guides", guideRoutes); // Add this line to register /api/guides
// app.use("/api/analytics", analyticsRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/user/tickets", userTicketRoutes);
// app.use("/api/user/guides", userGuideRoutes);
// app.use("/api/special/tickets", specialTicketRoutes);
// app.use("/api/user/auth", userAuthRoutes);
// // Add this import

// // Add this route registration (after other routes)
// app.use("/api/twilio", twilioRoutes);
// // Database sync and special counter creation
// // FILE: app.ts (add this after database sync)

// // Add this after database sync
// sequelize
//   .sync({ alter: true })
//   .then(async () => {
//     console.log("Database synced");
//     await createSpecialCounter(); // Create special counter on startup

//     // Schedule daily cleanup
//     scheduleDailyCleanup();

//     // Also run cleanup on startup to clear any old tickets
//     setTimeout(async () => {
//       try {
//         await cleanupOldTickets();
//         console.log("Initial cleanup completed");
//       } catch (error) {
//         console.error("Initial cleanup failed:", error);
//       }
//     }, 5000); // Wait 5 seconds after startup
//   })
//   .catch((err) => console.error("Database sync error:", err));

// // Error handling middleware
// app.use(
//   (
//     err: any,
//     req: express.Request,
//     res: express.Response,
//     next: express.NextFunction
//   ) => {
//     console.error(err.stack);
//     res.status(500).json({ message: "Internal server error" });
//   }
// );

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
import twilioRoutes from "./routes/twilioRoutes";
import { createSpecialCounter } from "./controllers/counterController";
import { scheduleDailyCleanup, cleanupOldTickets } from "./utils/dailyCleanup";

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
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

// Database sync + initial setup
// Only run once per cold start in serverless
(async () => {
  try {
    await sequelize.sync({ alter: true });
    await createSpecialCounter();
    scheduleDailyCleanup();
    await cleanupOldTickets();
    console.log("Database synced and initial setup done");
  } catch (err) {
    console.error("Database setup error:", err);
  }
})();

export default app; // <- Export app for Vercel
