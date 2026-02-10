import express ,{ type Request, type Response, type NextFunction } from "express";
import { AppError } from "../errors/appError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else {
    error = new AppError(
      "INTERNAL_ERROR",
      "Internal server error",
      500
    );
  }

  logger.error("Request failed", {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(error.statusCode).json({
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  });
};
