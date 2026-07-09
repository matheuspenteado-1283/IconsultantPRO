// proxy.ts — Runs on Edge/Node Runtime
// Handles auth redirects without using NextAuth middleware directly
// (NextAuth's auth() is not compatible with Next.js 16 proxy format)
import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/approvals",
  "/approve",
  "/_next",
  "/favicon",
  "/500",
  "/404",
]

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    if (
      PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
      pathname === "/500" ||
      pathname === "/404"
    ) {
      return NextResponse.next()
    }

    // Check JWT session token
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    })

    const isLoggedIn = !!token

    // Redirect to login if not authenticated
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Proxy auth error:", error)
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
