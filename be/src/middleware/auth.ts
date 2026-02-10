import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { extractToken, verifyToken } from "../utils/jwt";

/**
 * Extend Request type to include authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
  };
}

/**
 * Authentication middleware
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = extractToken(authHeader);
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err: any) {
      if (err.message === "JWT_EXPIRED") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
    };

    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication failed" });
  }
};
