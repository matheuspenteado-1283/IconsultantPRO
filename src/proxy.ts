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
    // secureCookie must be explicit: getToken()'s protocol auto-detection is
    // unreliable behind Vercel's proxy, so it was looking for the plain
    // "authjs.session-token" cookie while the login response actually sets
    // "__Secure-authjs.session-token" (HTTPS in production) — the mismatch
    // made every session look logged-out here even right after a valid login.
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
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
