import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const getConnectionString = () => {
  const url = process.env.DATABASE_URL;
  if (!url || url === "undefined" || url.trim() === "") {
    return "postgresql://placeholder:placeholder@placeholder:5432/placeholder?sslmode=require";
  }
  return url;
};

const connectionString = getConnectionString();
const adapter = new PrismaNeon({ connectionString });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
