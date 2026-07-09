import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, { windowMs: 60_000, maxRequests: 3, key: "rate-limit:forgot-password" })
  if (!rateLimit.allowed) {
    return rateLimitResponse(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
  }

  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    const user = await db.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "Se o e-mail existir, você receberá o link em breve." })
    }

    // Invalidate previous tokens
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    // Create new token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    await sendPasswordResetEmail(email, token, user.name || undefined)

    return NextResponse.json({ message: "Link de redefinição enviado!" })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 })
  }
}
