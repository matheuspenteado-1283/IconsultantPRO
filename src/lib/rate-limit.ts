import { NextRequest, NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 5

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "127.0.0.1"
}

function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

export function checkRateLimit(
  request: NextRequest,
  opts?: { windowMs?: number; maxRequests?: number; key?: string }
): { allowed: boolean; remaining: number; resetAt: number } {
  const windowMs = opts?.windowMs ?? WINDOW_MS
  const maxRequests = opts?.maxRequests ?? MAX_REQUESTS
  const ip = getClientIp(request)
  const key = opts?.key ?? `rate-limit:${ip}`
  const now = Date.now()

  cleanupExpiredEntries()

  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  existing.count++

  if (existing.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt }
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return new NextResponse(
    JSON.stringify({ message: "Muitas tentativas. Tente novamente em breve." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  )
}

export function checkServerActionRateLimit(
  opts?: { windowMs?: number; maxRequests?: number; key?: string }
): { allowed: boolean; remaining: number; resetAt: number } {
  const windowMs = opts?.windowMs ?? WINDOW_MS
  const maxRequests = opts?.maxRequests ?? MAX_REQUESTS
  const key = opts?.key ?? "rate-limit:server-action"
  const now = Date.now()

  cleanupExpiredEntries()

  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  existing.count++

  if (existing.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt }
}
