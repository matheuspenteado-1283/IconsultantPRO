"use client"

import { useState } from "react"
import Link from "next/link"
import { deleteProposal, updateProposalStatus } from "./actions"
import { ProposalStatus } from "@prisma/client"

interface Proposal {
  id: string
  title: string
  totalEffort: number
  totalPrice: number
  contingency: number
  discount: number
  finalPrice: number
  status: ProposalStatus
  validUntil: Date | null
  generatedPdfUrl: string | null
  createdAt: Date
  project: {
    name: string
    client: {
      name: string
    } | null
  }
}

interface ProposalsListProps {
  initialProposals: Proposal[]
}

const statusLabels: Record<ProposalStatus, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "badge-gray" },
  SENT: { label: "Enviada", color: "badge-blue" },
  APPROVED: { label: "Aprovada", color: "badge-green" },
  REJECTED: { label: "Recusada", color: "badge-red" },
  EXPIRED: { label: "Expirada", color: "badge-yellow" },
}

export default function ProposalsList({ initialProposals }: ProposalsListProps) {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  
  // Format currency
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  // Handle status update
  const handleStatusChange = async (id: string, status: ProposalStatus) => {
    const res = await updateProposalStatus(id, status)
    if (res && res.success) {
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      )
    } else {
      alert(res?.error || "Erro ao atualizar status.")
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir esta proposta comercial?")) {
      const res = await deleteProposal(id)
      if (res && res.success) {
        setProposals((prev) => prev.filter((p) => p.id !== id))
      } else {
        alert(res?.error || "Erro ao excluir proposta.")
      }
    }
  }

  const filteredProposals = proposals.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false
    return true
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Filter panel */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Filtrar por Status:</span>
          <select
            className="input"
            style={{ width: "160px", padding: "6px 12px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos os status</option>
            {Object.entries(statusLabels).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          Total de propostas: <strong>{filteredProposals.length}</strong>
        </div>
      </div>

      {filteredProposals.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
          <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Nenhuma proposta encontrada</h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>
            {statusFilter !== "ALL"
              ? "Experimente mudar os filtros selecionados acima."
              : "Gere propostas com backlog, esforço e valores calculados automaticamente"}
          </p>
          {statusFilter === "ALL" && (
            <Link href="/proposals/new" className="btn-primary" style={{ textDecoration: "none" }}>
              Gerar Proposta
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
          {filteredProposals.map((prop) => {
            const status = statusLabels[prop.status]
            const clientName = prop.project.client?.name || "Sem Cliente"
            const creationDate = new Date(prop.createdAt).toLocaleDateString("pt-BR")
            const validDate = prop.validUntil
              ? new Date(prop.validUntil).toLocaleDateString("pt-BR")
              : "N/D"

            return (
              <div
                key={prop.id}
                className="card animate-fade-in"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(12, 1fr)",
                  gap: "20px",
                  alignItems: "center",
                  padding: "24px",
                  borderLeft: `4px solid ${
                    prop.status === "APPROVED"
                      ? "#34d399"
                      : prop.status === "REJECTED"
                      ? "#f87171"
                      : "var(--color-border)"
                  }`,
                }}
              >
                {/* Info block */}
                <div style={{ gridColumn: "span 4" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                    <span className={`badge ${status.color}`}>{status.label}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>ID: {prop.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px", color: "var(--color-text-primary)" }}>
                    {prop.title}
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
                    Projeto: <strong>{prop.project.name}</strong> ({clientName})
                  </p>
                </div>

                {/* Totals block */}
                <div style={{ gridColumn: "span 3" }}>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                    Esforço: <strong>{prop.totalEffort}h</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                    Ajuste: Contingência (+{prop.contingency}%) | Desconto (-{prop.discount}%)
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#34d399" }}>
                    {formatBRL(prop.finalPrice)}
                  </div>
                </div>

                {/* Dates block */}
                <div style={{ gridColumn: "span 2", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  <div>Criado: <strong>{creationDate}</strong></div>
                  <div style={{ marginTop: "4px" }}>Validade: <strong style={{ color: prop.status === "EXPIRED" ? "#fbbf24" : "inherit" }}>{validDate}</strong></div>
                </div>

                {/* Actions Block */}
                <div style={{ gridColumn: "span 3", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
                  
                  {prop.generatedPdfUrl && (
                    <a
                      href={prop.generatedPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        textDecoration: "none",
                        background: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        color: "#60a5fa",
                      }}
                      title="Ver PDF Comercial"
                    >
                      📄 PDF
                    </a>
                  )}

                  {/* Change Status Dropdown */}
                  <select
                    className="input"
                    style={{ width: "110px", padding: "6px 8px", fontSize: "12px" }}
                    value={prop.status}
                    onChange={(e) => handleStatusChange(prop.id, e.target.value as ProposalStatus)}
                  >
                    <option value="DRAFT">Rascunho</option>
                    <option value="SENT">Enviada</option>
                    <option value="APPROVED">Aprovada</option>
                    <option value="REJECTED">Recusada</option>
                    <option value="EXPIRED">Expirada</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDelete(prop.id)}
                    className="btn-secondary"
                    style={{
                      padding: "6px 10px",
                      fontSize: "12px",
                      background: "rgba(239, 68, 68, 0.05)",
                      borderColor: "rgba(239, 68, 68, 0.15)",
                      color: "#f87171",
                    }}
                    title="Excluir Proposta"
                  >
                    Excluir
                  </button>

                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
