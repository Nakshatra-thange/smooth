export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "BLOCKCHAIN_ERROR"
  | "AI_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  statusCode: number;
  code: ErrorCode;
  details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: unknown
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Convenience subclasses
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super("AUTHENTICATION_ERROR", message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Not authorized") {
    super("AUTHORIZATION_ERROR", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class BlockchainError extends AppError {
  constructor(message: string, details?: unknown) {
    super("BLOCKCHAIN_ERROR", message, 500, details);
  }
}

export class AIError extends AppError {
  constructor(message: string, details?: unknown) {
    super("AI_ERROR", message, 500, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super("DATABASE_ERROR", message, 500, details);
  }
}
