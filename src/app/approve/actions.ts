"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { checkServerActionRateLimit } from "@/lib/rate-limit"

export async function submitApproval(token: string, decision: "approve" | "reject", comments: string) {
  const rateLimit = checkServerActionRateLimit({ windowMs: 60_000, maxRequests: 5, key: "rate-limit:approve" })
  if (!rateLimit.allowed) {
    return { error: "Muitas tentativas. Tente novamente em breve." }
  }

  if (!token) {
    return { error: "Token de aprovação inválido." }
  }

  try {
    const approver = await db.projectApprover.findUnique({
      where: { approvalToken: token },
      include: { project: true },
    })

    if (!approver) {
      return { error: "Aprovador não localizado ou link expirado." }
    }

    if (approver.approvalStatus !== "PENDING") {
      return { error: "Esta solicitação de aprovação já foi concluída anteriormente." }
    }

    const newStatus = decision === "approve" ? "APPROVED" : "REJECTED"

    await db.projectApprover.update({
      where: { id: approver.id },
      data: {
        approvalStatus: newStatus,
        approvedAt: new Date(),
        comments: comments || null,
      },
    })

    // If approved, let's see if we should also update the project status or log it.
    // For now, revalidating is sufficient.
    revalidatePath(`/projects/${approver.projectId}`)
    return { success: true }

  } catch (err) {
    console.error("Error submitting approval:", err)
    return { error: "Erro interno do servidor ao processar aprovação." }
  }
}
