import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { message: "Este e-mail já está em uso." },
        { status: 400 }
      )
    }

    // Check if the email is pre-registered (authorized)
    const allowed = await db.allowedEmail.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!allowed) {
      return NextResponse.json(
        { message: "Este e-mail não está cadastrado. Apenas e-mails previamente autorizados podem acessar a ferramenta." },
        { status: 403 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Create a default organization for the user
    const organization = await db.organization.create({
      data: { name: `Organização de ${name}` },
    })

    // Map to legacy role for compatibility (ADM_SIST -> ADMIN, others -> CONSULTANT)
    const legacyRole = allowed.profile.name === "ADM_SIST" ? "ADMIN" : "CONSULTANT"

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: legacyRole as any,
        organizationId: organization.id,
      },
    })

    // Create UserProfile relation
    await db.userProfile.create({
      data: {
        userId: user.id,
        profileId: allowed.profileId,
      },
    })

    return NextResponse.json(
      { message: "Conta criada com sucesso!", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Dados inválidos." }, { status: 400 })
    }
    console.error("Register error:", error)
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 })
  }
}
