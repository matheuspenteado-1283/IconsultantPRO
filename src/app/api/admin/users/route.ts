import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { ensureUserTokens } from "@/lib/tokens"

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

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        userProfiles: { include: { profile: { select: { id: true, name: true } } } },
        agentTokens: true,
        _count: { select: { accessLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("GET users error:", error)
    return NextResponse.json({ message: "Erro ao buscar usuários." }, { status: 500 })
  }
}

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
    const { action, userId } = body

    if (action === "toggle-enabled") {
      if (!userId) return NextResponse.json({ message: "userId é obrigatório." }, { status: 400 })

      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 })

      if (user.id === session.user.id) {
        return NextResponse.json({ message: "Você não pode desabilitar a si mesmo." }, { status: 400 })
      }

      const updated = await db.user.update({
        where: { id: userId },
        data: { enabled: !user.enabled },
        select: { id: true, name: true, email: true, enabled: true },
      })

      return NextResponse.json({ message: `Usuário ${updated.enabled ? "habilitado" : "desabilitado"} com sucesso.`, user: updated })
    }

    if (action === "ensure-tokens") {
      if (!userId) return NextResponse.json({ message: "userId é obrigatório." }, { status: 400 })

      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user?.organizationId) return NextResponse.json({ message: "Usuário sem organização." }, { status: 400 })

      const tokens = await ensureUserTokens(userId, user.organizationId)
      return NextResponse.json({ message: `${tokens.length} tokens criados.`, tokens })
    }

    return NextResponse.json({ message: "Ação desconhecida." }, { status: 400 })
  } catch (error) {
    console.error("PATCH users error:", error)
    return NextResponse.json({ message: "Erro ao processar ação." }, { status: 500 })
  }
}
