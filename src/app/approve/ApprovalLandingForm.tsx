"use client"

import { useState, useTransition } from "react"
import { submitApproval } from "./actions"

interface BacklogItem {
  id: string
  backlogCode: string
  description: string
  category: string
  type: string
  priority: string
  sapModule: { code: string; name: string } | null
  effortEstimates: Array<{ hours: number }>
}

interface ApprovalLandingFormProps {
  token: string
  initialDecision: "approve" | "reject" | null
  projectName: string
  clientName: string
  approverName: string
  approverEmail: string
  backlogItems: BacklogItem[]
  status: "PENDING" | "APPROVED" | "REJECTED"
  approvedAt: Date | null
  comments: string | null
}

export default function ApprovalLandingForm({
  token,
  initialDecision,
  projectName,
  clientName,
  approverName,
  approverEmail,
  backlogItems,
  status: initialStatus,
  approvedAt: initialApprovedAt,
  comments: initialComments,
}: ApprovalLandingFormProps) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(initialDecision)
  const [comments, setComments] = useState<string>("")
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">(initialStatus)
  const [approvedAt, setApprovedAt] = useState<Date | null>(initialApprovedAt)
  const [dbComments, setDbComments] = useState<string | null>(initialComments)
  
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDecisionSubmit = async (selectedDecision: "approve" | "reject") => {
    setError(null)
    setDecision(selectedDecision)

    startTransition(async () => {
      const res = await submitApproval(token, selectedDecision, comments)
      if (res && res.error) {
        setError(res.error)
      } else {
        setStatus(selectedDecision === "approve" ? "APPROVED" : "REJECTED")
        setApprovedAt(new Date())
        setDbComments(comments || null)
      }
    })
  }

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  const totalHours = backlogItems.reduce(
    (sum, item) => sum + item.effortEstimates.reduce((s, e) => s + e.hours, 0),
    0
  )

  const priorityColors: Record<string, string> = {
    CRITICAL: "badge-red",
    HIGH: "badge-yellow",
    MEDIUM: "badge-blue",
    LOW: "badge-gray",
  }

  const priorityLabels: Record<string, string> = {
    CRITICAL: "Crítica",
    HIGH: "Alta",
    MEDIUM: "Média",
    LOW: "Baixa",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* Header card with project details */}
      <div className="card shadow-lg" style={{ background: "rgba(30, 41, 59, 0.4)", borderLeft: "4px solid #3b82f6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "1px" }}>
              Portal do Aprovador
            </span>
            <h1 style={{ fontSize: "28px", fontWeight: 800, marginTop: "4px", color: "var(--color-text-primary)" }}>
              {projectName}
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
              Cliente: <strong>{clientName}</strong>
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            {status === "PENDING" && (
              <span className="badge badge-yellow" style={{ fontSize: "13px", padding: "6px 12px" }}>
                Aprovação Pendente ⌛
              </span>
            )}
            {status === "APPROVED" && (
              <span className="badge badge-green" style={{ fontSize: "13px", padding: "6px 12px" }}>
                Proposta Aprovada ✅
              </span>
            )}
            {status === "REJECTED" && (
              <span className="badge badge-red" style={{ fontSize: "13px", padding: "6px 12px" }}>
                Proposta Recusada ❌
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "13px", color: "var(--color-text-secondary)" }}>
          <div>
            Aprovador: <strong>{approverName}</strong>
          </div>
          <div>
            E-mail: <strong>{approverEmail}</strong>
          </div>
          <div>
            Escopo Total: <strong>{backlogItems.length} Requisitos</strong>
          </div>
          <div>
            Esforço Consolidado: <strong style={{ color: "#60a5fa" }}>{totalHours} Horas</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: "4px solid var(--color-danger)", background: "rgba(239, 68, 68, 0.05)", color: "var(--color-danger)", padding: "16px", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Decision completed banner */}
      {status !== "PENDING" && (
        <div className="card shadow-lg animate-fade-in" style={{ borderLeft: `4px solid ${status === "APPROVED" ? "#10b981" : "#ef4444"}`, background: "rgba(30, 41, 59, 0.6)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px", color: status === "APPROVED" ? "#34d399" : "#f87171" }}>
            {status === "APPROVED" ? "✅ Revisão Concluída — Proposta Aprovada" : "❌ Revisão Concluída — Ajustes Solicitados"}
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
            {status === "APPROVED" 
              ? "Sua decisão de aprovação foi registrada com sucesso no sistema. O consultor responsável foi notificado para prosseguir com a emissão contratual."
              : "Sua decisão de recusa e solicitação de ajustes foi salva. O consultor responsável revisará as considerações listadas abaixo."}
          </p>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Notas / Comentários Registrados
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-primary)", marginTop: "6px", fontStyle: dbComments ? "normal" : "italic" }}>
              {dbComments || "Nenhuma observação informada."}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "12px", textAlign: "right" }}>
              Registrado em: {approvedAt ? new Date(approvedAt).toLocaleString("pt-BR") : "N/D"}
            </div>
          </div>
        </div>
      )}

      {/* Table listing backlog scope */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>📋 Detalhamento do Escopo Técnico</h3>
        
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição do Requisito</th>
                <th>Módulo</th>
                <th>Categoria</th>
                <th>Prioridade</th>
                <th>Estimativa (h)</th>
              </tr>
            </thead>
            <tbody>
              {backlogItems.map((item) => {
                const itemHours = item.effortEstimates.reduce((sum, e) => sum + e.hours, 0)
                const priority = priorityColors[item.priority] || "badge-gray"
                const label = priorityLabels[item.priority] || item.priority

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ fontWeight: 700, color: "#60a5fa" }}>{item.backlogCode}</td>
                    <td style={{ fontWeight: 600 }}>{item.description}</td>
                    <td>
                      {item.sapModule ? (
                        <span className="badge badge-blue">{item.sapModule.code}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item.category === "IMPLEMENTATION" ? "badge-purple" : "badge-green"}`}>
                        {item.category === "IMPLEMENTATION" ? "Implementação" : "Melhoria"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${priority}`}>{label}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{itemHours}h</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {backlogItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
              Este projeto não possui nenhum requisito no backlog cadastrado atualmente.
            </div>
          )}
        </div>
      </div>

      {/* Action panel if pending */}
      {status === "PENDING" && (
        <div className="card shadow-lg" style={{ background: "rgba(30, 41, 59, 0.4)", borderTop: "4px solid #fbbf24", padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>✍️ Registre sua Decisão</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
            Após revisar o escopo detalhado acima, insira quaisquer comentários ou observações técnicas adicionais e formalize seu parecer:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label className="input-label">Observações e Feedback do Aprovador</label>
              <textarea
                className="input"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ex: Escopo de acordo com o planejado. Considerar prazos de homologação detalhados no anexo."
                style={{ resize: "none" }}
                disabled={isPending}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => handleDecisionSubmit("reject")}
              className="btn-secondary"
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                background: "rgba(239, 68, 68, 0.15)",
                borderColor: "rgba(239, 68, 68, 0.3)",
                color: "#f87171",
              }}
              disabled={isPending}
            >
              {isPending && decision === "reject" ? "Processando..." : "❌ Recusar / Solicitar Ajustes"}
            </button>

            <button
              type="button"
              onClick={() => handleDecisionSubmit("approve")}
              className="btn-primary"
              style={{
                padding: "12px 28px",
                fontSize: "14px",
                background: "linear-gradient(135deg, #059669, #10b981)",
                border: "none",
                color: "white",
              }}
              disabled={isPending}
            >
              {isPending && decision === "approve" ? "Processando..." : "✅ Aprovar Proposta de Escopo"}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
