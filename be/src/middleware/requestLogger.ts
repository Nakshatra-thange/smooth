import express ,{ type Request, type Response, type NextFunction } from "express";
import { logger } from "../utils/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("HTTP request", {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      userId: req.user?.id ?? "anonymous",
      ip: req.ip,
    });
  });

  next();
};
