import express from "express";
import cors from "cors";
import "dotenv/config";

import { config } from "./config";
import { prisma } from "./config/database";
import { logger } from "./utils/logger";

import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import conversationRoutes from "./routes/conversations";
import walletRoutes from "./routes/wallet";
import transactionRoutes from "./routes/transactions";
import userRoutes from "./routes/user";

const app = express();

// =============================
// GLOBAL MIDDLEWARE
// =============================


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://smoooth-peach.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb", strict: false }));
app.use(requestLogger);

// =============================
// HEALTH ROUTE
// =============================
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// =============================
// 🔥 API ROUTES (MUST BE HERE)
// =============================
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/user", userRoutes);

// =============================
// 404 HANDLER
// =============================
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// =============================
// ERROR HANDLER (LAST)
// =============================
app.use(errorHandler);

// =============================
// START SERVER
// =============================
app.listen(config.server.port, async () => {
  await prisma.$connect();
  logger.info("🚀 Server started", { port: config.server.port });
});
