import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/students.js";
import paymentRoutes from "./routes/payments.js";
import dashboardRoutes from "./routes/dashboard.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.get("/api/health", (req, res) => res.json({ status: "ok", database: "connected" }));
app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});
app.listen(PORT, () => {
  console.log(`Smart Bus Fee Verification API running at http://localhost:${PORT}`);
  console.log(`Database ready. Sample data loaded if database was empty.`);
});
