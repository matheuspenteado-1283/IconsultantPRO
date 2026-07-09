import { NextRequest, NextResponse } from "next/server"

// TEMPORARY diagnostic route — deploy-only, no secret values exposed.
// Remove after diagnosing the production DB connection issue.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key")
  if (key !== "diag-8d13e27") {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  const dbUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    hasDatabaseUrl: !!dbUrl,
    databaseUrlLength: dbUrl?.length ?? 0,
    databaseUrlHostPreview: dbUrl ? dbUrl.split("@")[1]?.split("/")[0] : null,
    hasDirectUrl: !!directUrl,
    directUrlHostPreview: directUrl ? directUrl.split("@")[1]?.split("/")[0] : null,
    hasAuthSecret: !!process.env.AUTH_SECRET,
  })
}
