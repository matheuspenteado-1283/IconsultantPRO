import { auth } from "@/auth"
import { db } from "@/lib/db"
import ApprovalsMonitorList from "./ApprovalsMonitorList"
import type { Metadata } from "next"

import { enforceModuleAccess } from "@/lib/access"

export const metadata: Metadata = {
  title: "Controle de Aprovações",
}

export default async function ApprovalsPage() {
  await enforceModuleAccess("approvals")
  
  const session = await auth()
  const user = session?.user as any

  if (!user || !user.organizationId) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Configurando sua organização...</p>
      </div>
    )
  }

  // Query all approvers across all organization projects
  const approvers = await db.projectApprover.findMany({
    where: {
      project: {
        organizationId: user.organizationId,
      },
    },
    include: {
      project: {
        include: {
          client: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>🤝 Controle de Aprovações</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Monitore o status de aprovação de escopo enviado por e-mail para os stakeholders externos de cada projeto.
        </p>
      </div>

      <ApprovalsMonitorList initialApprovers={approvers} />
    </div>
  )
}
