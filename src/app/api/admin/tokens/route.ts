import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getAllAgentTokens, updateTokenAllocation, resolveRenewalRequest } from "@/lib/tokens"
import { z } from "zod"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
    }

    const isAdmin = await db.userProfile.findFirst({
      where: {
        userId: session.user.id,
        profile: { name: { in: ["ADM_SIST", "MANAGER"] } },
      },
    })
    if (!isAdmin) {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 })
    }

    const tokens = await getAllAgentTokens()
    return NextResponse.json({ tokens })
  } catch (error) {
    console.error("GET tokens error:", error)
    return NextResponse.json({ message: "Erro ao buscar tokens." }, { status: 500 })
  }
}

const updateSchema = z.object({
  tokenId: z.string().min(1),
  totalAllocated: z.number().int().positive(),
})

const resolveSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
    }

    const isAdmin = await db.userProfile.findFirst({
      where: {
        userId: session.user.id,
        profile: { name: { in: ["ADM_SIST", "MANAGER"] } },
      },
    })
    if (!isAdmin) {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 })
    }

    const body = await req.json()
    const { action } = body

    if (action === "update-allocation") {
      const parsed = updateSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ message: "Dados inválidos." }, { status: 400 })
      }

      await updateTokenAllocation(parsed.data.tokenId, parsed.data.totalAllocated)
      return NextResponse.json({ message: "Alocação atualizada com sucesso." })
    }

    if (action === "resolve-request") {
      const parsed = resolveSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ message: "Dados inválidos." }, { status: 400 })
      }

      await resolveRenewalRequest(parsed.data.requestId, parsed.data.status, session.user.id)
      return NextResponse.json({ message: `Solicitação ${parsed.data.status === "APPROVED" ? "aprovada" : "rejeitada"} com sucesso.` })
    }

    return NextResponse.json({ message: "Ação desconhecida." }, { status: 400 })
  } catch (error) {
    console.error("PATCH tokens error:", error)
    const message = error instanceof Error ? error.message : "Erro ao processar ação."
    return NextResponse.json({ message }, { status: 500 })
  }
}
