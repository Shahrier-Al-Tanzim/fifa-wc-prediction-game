import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: any };

const databaseUrl = process.env.DATABASE_URL || "prisma+postgres://localhost:51213/?api_key=dummy";

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    accelerateUrl: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
