import { auth } from "@/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import ProposalsList from "./ProposalsList"
import type { Metadata } from "next"

import { enforceModuleAccess } from "@/lib/access"

export const metadata: Metadata = {
  title: "Propostas Comerciais",
}

export default async function ProposalsPage() {
  await enforceModuleAccess("proposals")
  
  const session = await auth()
  const user = session?.user as any

  if (!user || !user.organizationId) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Configurando sua organização...</p>
      </div>
    )
  }

  // Fetch proposals from organization
  const proposals = await db.proposal.findMany({
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>📄 Propostas Comerciais</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Gerencie propostas comerciais profissionais geradas a partir do backlog técnico.
          </p>
        </div>
        <Link href="/proposals/new" className="btn-primary" style={{ textDecoration: "none" }}>
          + Nova Proposta
        </Link>
      </div>

      <ProposalsList initialProposals={proposals} />
    </div>
  )
}
