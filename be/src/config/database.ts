import { PrismaClient } from "@prisma/client";

/**
 * Use globalThis to prevent multiple Prisma instances
 * during hot reloads / dev restarts
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown
 */
const shutdown = async (signal: string) => {
  console.log(`[Prisma] Received ${signal}. Disconnecting...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
