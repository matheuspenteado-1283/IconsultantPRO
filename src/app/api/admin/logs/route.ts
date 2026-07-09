import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { getAccessLogs } from "@/lib/access-log"
import type { AccessAction } from "@prisma/client"

export async function GET(req: NextRequest) {
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

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const userId = url.searchParams.get("userId") || undefined
    const action = url.searchParams.get("action") as AccessAction | undefined
    const startDate = url.searchParams.get("startDate") ? new Date(url.searchParams.get("startDate")!) : undefined
    const endDate = url.searchParams.get("endDate") ? new Date(url.searchParams.get("endDate")!) : undefined

    const result = await getAccessLogs({ page, limit, userId, action, startDate, endDate })

    return NextResponse.json(result)
  } catch (error) {
    console.error("GET logs error:", error)
    return NextResponse.json({ message: "Erro ao buscar logs." }, { status: 500 })
  }
}
