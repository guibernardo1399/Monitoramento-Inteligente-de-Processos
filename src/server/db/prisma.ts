import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;

  return new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });
}

export const prisma =
  globalForPrisma.prisma ||
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
