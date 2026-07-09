import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Prisma 7's "client" engine has no embedded query engine binary — it always
  // requires a driver adapter, even when DATABASE_URL is undefined at module
  // load time (e.g. build-time page data collection). pg.Pool doesn't
  // validate the connection string eagerly, so this stays build-safe.
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter: adapter as any,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
