import { db } from "@/lib/db"
import ApprovalLandingForm from "../ApprovalLandingForm"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Revisão e Aprovação de Escopo",
}

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ decision?: string }>
}

export default async function ApprovePage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { decision } = await searchParams

  const initialDecision = decision === "approve" ? "approve" : decision === "reject" ? "reject" : null

  // Fetch approver details, project, client and backlog
  const approver = await db.projectApprover.findUnique({
    where: { approvalToken: token },
    include: {
      project: {
        include: {
          client: true,
          backlogItems: {
            include: {
              sapModule: true,
              effortEstimates: true,
            },
            orderBy: {
              backlogCode: "asc",
            },
          },
        },
      },
    },
  })

  // If approver token is invalid or expired
  if (!approver) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--color-bg-primary)", padding: "20px" }}>
        <div className="card shadow-xl" style={{ maxWidth: "480px", textAlign: "center", padding: "40px", borderTop: "4px solid var(--color-danger)" }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>⚠️</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px", color: "var(--color-text-primary)" }}>
            Link de Aprovação Inválido
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "28px" }}>
            O link de revisão que você tentou acessar não existe, foi expirado pelo consultor ou já foi excluído do sistema.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Iconsultant Pro — Central de Validação
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-primary)", padding: "48px 24px" }}>
      
      {/* Small top navbar branding */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
        <img
          src="/logo_iconsultant_dark.png"
          alt="Iconsultant Pro Logo"
          style={{
            height: "36px",
            objectFit: "contain",
          }}
        />
      </div>

      <ApprovalLandingForm
        token={token}
        initialDecision={initialDecision as "approve" | "reject" | null}
        projectName={approver.project.name}
        clientName={approver.project.client?.name || "Sem Cliente Vinculado"}
        approverName={approver.name}
        approverEmail={approver.email}
        backlogItems={approver.project.backlogItems}
        status={approver.approvalStatus}
        approvedAt={approver.approvedAt}
        comments={approver.comments}
      />

    </div>
  )
}
