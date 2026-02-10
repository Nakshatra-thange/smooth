import type { Request, Response, NextFunction } from "express";

/**
 * Parse allowed origins from environment
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const origin = req.headers.origin;

  // Validate origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Reject disallowed origins explicitly (optional but safer)
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "CORS origin not allowed" });
  }

  next();
};
