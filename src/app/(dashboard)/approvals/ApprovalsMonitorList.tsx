"use client"

import { useState } from "react"
import { resendApprovalEmail, deleteApproverDirect } from "./actions"

interface Approver {
  id: string
  name: string
  email: string
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
  approvalToken: string | null
  approvedAt: Date | null
  comments: string | null
  createdAt: Date
  project: {
    id: string
    name: string
    client: {
      name: string
    } | null
  }
}

interface ApprovalsMonitorListProps {
  initialApprovers: Approver[]
}

const statusLabels = {
  PENDING: { label: "Pendente ⌛", color: "badge-yellow" },
  APPROVED: { label: "Aprovado ✅", color: "badge-green" },
  REJECTED: { label: "Recusado ❌", color: "badge-red" },
}

export default function ApprovalsMonitorList({ initialApprovers }: ApprovalsMonitorListProps) {
  const [approvers, setApprovers] = useState<Approver[]>(initialApprovers)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Copy link to clipboard
  const handleCopyLink = (token: string, id: string) => {
    const link = `${window.location.origin}/approve/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Resend approval email
  const handleResendEmail = async (id: string) => {
    setLoadingId(id)
    const res = await resendApprovalEmail(id)
    setLoadingId(null)
    if (res && res.success) {
      alert("E-mail de aprovação reenviado com sucesso!")
    } else {
      alert(res?.error || "Erro ao reenviar e-mail.")
    }
  }

  // Delete approver
  const handleDeleteApprover = async (id: string) => {
    if (confirm("Deseja realmente excluir este aprovador do projeto?")) {
      const res = await deleteApproverDirect(id)
      if (res && res.success) {
        setApprovers((prev) => prev.filter((appr) => appr.id !== id))
      } else {
        alert(res?.error || "Erro ao excluir aprovador.")
      }
    }
  }

  const filteredApprovers = approvers.filter((appr) => {
    const query = searchQuery.toLowerCase()
    return (
      appr.name.toLowerCase().includes(query) ||
      appr.email.toLowerCase().includes(query) ||
      appr.project.name.toLowerCase().includes(query) ||
      (appr.project.client?.name || "").toLowerCase().includes(query)
    )
  })

  // Group KPIs
  const total = approvers.length
  const pending = approvers.filter(a => a.approvalStatus === "PENDING").length
  const approved = approvers.filter(a => a.approvalStatus === "APPROVED").length
  const rejected = approvers.filter(a => a.approvalStatus === "REJECTED").length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Top statistics summary panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div className="kpi-card">
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Total de Solicitações</div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px" }}>{total}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "4px solid #fbbf24" }}>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Aprovações Pendentes</div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px", color: "#fbbf24" }}>{pending}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "4px solid #34d399" }}>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Escopos Aprovados</div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px", color: "#34d399" }}>{approved}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: "4px solid #f87171" }}>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Escopos Recusados</div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "6px", color: "#f87171" }}>{rejected}</div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="card" style={{ display: "flex", gap: "16px", padding: "16px 20px", alignItems: "center" }}>
        <span style={{ fontSize: "20px" }}>🔍</span>
        <input
          type="text"
          className="input"
          style={{ flex: 1, margin: 0, padding: "8px 12px" }}
          placeholder="Buscar por aprovador, e-mail, projeto ou cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table view */}
      <div className="card" style={{ padding: "20px" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Aprovador / E-mail</th>
                <th>Projeto / Cliente</th>
                <th>Status</th>
                <th>Parecer / Comentários</th>
                <th>Data da Decisão</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovers.map((appr) => {
                const status = statusLabels[appr.approvalStatus]
                const clientName = appr.project.client?.name || "Sem Cliente"
                const decisionDate = appr.approvedAt 
                  ? new Date(appr.approvedAt).toLocaleDateString("pt-BR") 
                  : "—"

                return (
                  <tr key={appr.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{appr.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{appr.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{appr.project.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{clientName}</div>
                    </td>
                    <td>
                      <span className={`badge ${status.color}`}>{status.label}</span>
                    </td>
                    <td style={{ maxWidth: "200px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: appr.comments ? "var(--color-text-secondary)" : "var(--color-text-muted)",
                          fontStyle: appr.comments ? "normal" : "italic",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={appr.comments || ""}
                      >
                        {appr.comments || "Sem observações."}
                      </div>
                    </td>
                    <td>{decisionDate}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        
                        {/* Copy link button */}
                        {appr.approvalToken && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(appr.approvalToken!, appr.id)}
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            title="Copiar Link de Aprovação do Cliente"
                          >
                            {copiedId === appr.id ? "✅ Copiado!" : "🔗 Link"}
                          </button>
                        )}

                        {/* Resend email button */}
                        {appr.approvalStatus === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleResendEmail(appr.id)}
                            className="btn-secondary"
                            style={{
                              padding: "6px 10px",
                              fontSize: "12px",
                              background: "rgba(59, 130, 246, 0.05)",
                              borderColor: "rgba(59, 130, 246, 0.15)",
                              color: "#60a5fa",
                            }}
                            disabled={loadingId === appr.id}
                            title="Reenviar E-mail de Notificação"
                          >
                            {loadingId === appr.id ? "..." : "📧 E-mail"}
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteApprover(appr.id)}
                          className="btn-secondary"
                          style={{
                            padding: "6px 8px",
                            fontSize: "12px",
                            background: "rgba(239, 68, 68, 0.05)",
                            borderColor: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                          }}
                          title="Excluir Aprovador"
                        >
                          ✕
                        </button>

                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredApprovers.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
              Nenhum aprovador ou solicitação localizada.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
