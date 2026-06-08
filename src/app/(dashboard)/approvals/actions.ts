"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function resendApprovalEmail(approverId: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  try {
    const approver = await db.projectApprover.findFirst({
      where: {
        id: approverId,
        project: { organizationId: orgId },
      },
      include: { project: true },
    })

    if (!approver) {
      return { error: "Aprovador não encontrado." }
    }

    if (!approver.approvalToken) {
      return { error: "Aprovador não possui um token de validação ativo." }
    }

    const { sendApprovalEmail } = await import("@/lib/email")

    await sendApprovalEmail(
      approver.email,
      approver.name,
      approver.project.name,
      approver.approvalToken
    )

    return { success: true }
  } catch (error: any) {
    console.error("Error resending approval email:", error)
    return { error: "Erro ao reenviar e-mail de aprovação." }
  }
}

export async function deleteApproverDirect(approverId: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  try {
    await db.projectApprover.delete({
      where: {
        id: approverId,
        project: { organizationId: orgId },
      },
    })

    revalidatePath("/approvals")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting approver:", error)
    return { error: "Erro ao excluir aprovador." }
  }
}
