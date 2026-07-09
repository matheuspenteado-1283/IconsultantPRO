import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { requestTokenRenewal } from "@/lib/tokens"
import { z } from "zod"
import type { TokenType } from "@prisma/client"

const schema = z.object({
  tokenType: z.enum(["CLAUDE", "WHISPER", "VEXA", "EMAIL"]),
  amount: z.number().int().min(1).max(10000),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos." }, { status: 400 })
    }

    const { tokenType, amount, notes } = parsed.data

    const renewal = await requestTokenRenewal(session.user.id, tokenType as TokenType, amount, notes)
    return NextResponse.json({ message: "Solicitação de renovação enviada.", renewal }, { status: 201 })
  } catch (error) {
    console.error("Token renew error:", error)
    const message = error instanceof Error ? error.message : "Erro ao solicitar renovação."
    return NextResponse.json({ message }, { status: 500 })
  }
}
