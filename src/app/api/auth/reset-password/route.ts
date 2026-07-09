import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

const schema = z.object({
  token: z.string(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, { windowMs: 60_000, maxRequests: 3, key: "rate-limit:reset-password" })
  if (!rateLimit.allowed) {
    return rateLimitResponse(Math.ceil((rateLimit.resetAt - Date.now()) / 1000))
  }

  try {
    const body = await req.json()
    const { token, password } = schema.parse(body)

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json({ message: "Token inválido." }, { status: 400 })
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ message: "Este link já foi utilizado." }, { status: 400 })
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ message: "Este link expirou. Solicite um novo." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: "Senha redefinida com sucesso!" })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 })
  }
}
