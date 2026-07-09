import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Prisma 7's "client" engine has no embedded query engine binary — it always
  // requires a driver adapter, even when DATABASE_URL is undefined at module
  // load time (e.g. build-time page data collection). PrismaNeon doesn't
  // validate the connection string eagerly, so this stays build-safe.
  //
  // Uses the Neon serverless driver (WebSocket-based) instead of plain `pg`:
  // `pg` over Neon's pooled (pgbouncer=true) connection string causes
  // "prepared statement already exists" errors under serverless concurrency,
  // since PgBouncer transaction pooling doesn't preserve named prepared
  // statements across reused physical connections.
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })

  return new PrismaClient({
    adapter: adapter as any,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
