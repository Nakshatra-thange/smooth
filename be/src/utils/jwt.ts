import jwt from "jsonwebtoken"
import JwtPayload from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || "15m";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export interface AuthTokenPayload {
  userId: string;
  walletAddress: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token
 */
export const generateToken = (
  userId: string,
  walletAddress: string
): string => {
  const payload = {
    userId,
    walletAddress,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded.userId || !decoded.walletAddress) {
      throw new Error("Invalid token payload");
    }

    return decoded as AuthTokenPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("JWT_EXPIRED");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("JWT_INVALID");
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractToken = (
  authHeader?: string
): string | null => {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};
