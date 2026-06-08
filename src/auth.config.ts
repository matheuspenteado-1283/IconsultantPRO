import type { NextAuthConfig } from "next-auth"

// Edge-compatible config — NO database imports here!
// This file is used by the proxy (middleware) which runs on Edge Runtime.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const publicPaths = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/api/auth",
        "/api/approvals",
      ]
      const isPublicPath = publicPaths.some((p) => nextUrl.pathname.startsWith(p))

      if (isPublicPath) {
        // If logged in and trying to access auth pages, redirect to dashboard
        if (isLoggedIn && !nextUrl.pathname.startsWith("/api")) {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }

      // Protected routes — must be logged in
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).organizationId = token.organizationId
      }
      return session
    },
  },
  providers: [], // Providers are added in auth.ts (Node.js only)
}
