import express from "express";
import cors from "cors";
import { config } from "./config";
import { prisma } from "./config/database";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
// Routes
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import conversationRoutes from "./routes/conversations";
import walletRoutes from "./routes/wallet";
import transactionRoutes from "./routes/transactions";
import userRoutes from "./routes/user";
import { requestLogger } from "./middleware/requestLogger";

// -----------------------------
// Initialize app
// -----------------------------
const app = express();

// -----------------------------
// Global middleware
// -----------------------------
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowed = config.cors.allowedOrigins.includes(origin);
      if (allowed) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// Request logging
app.use((req, _res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    path: req.path,
  });
  next();
});

// -----------------------------
// Routes
// -----------------------------
app.use(authRoutes);
app.use(chatRoutes);
app.use(conversationRoutes);
app.use(walletRoutes);
app.use(transactionRoutes);
app.use(userRoutes);
app.use(errorHandler);
app.use(requestLogger);

// -----------------------------
// Health check
// -----------------------------
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------
// 404 handler
// -----------------------------
app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// -----------------------------
// Global error handler
// -----------------------------
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error("Unhandled error", err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
);

// -----------------------------
// Start server
// -----------------------------
const server = app.listen(config.server.port, async () => {
  try {
    // Verify DB connection
    await prisma.$connect();

    logger.info("🚀 Nexis backend started", {
      port: config.server.port,
      env: config.server.env,
    });

    logger.info("Available routes", {
      auth: "/api/auth/*",
      chat: "/api/chat",
      conversations: "/api/conversations",
      wallet: "/api/wallet/*",
      transactions: "/api/transactions/*",
      user: "/api/user/*",
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
});

// -----------------------------
// Graceful shutdown
// -----------------------------
const shutdown = async (signal: string) => {
  logger.info("Shutting down server", { signal });

  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info("Database disconnected");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", error);
      process.exit(1);
    }
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
