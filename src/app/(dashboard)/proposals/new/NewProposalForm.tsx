"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import FormSubmitButton from "@/components/FormSubmitButton"
import { createProposal } from "../actions"

interface PreCalculatedProject {
  id: string
  name: string
  clientName: string
  baseHours: number
  baseCost: number
}

interface NewProposalFormProps {
  projects: PreCalculatedProject[]
}

export default function NewProposalForm({ projects }: NewProposalFormProps) {
  const router = useRouter()
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ""
  )
  const [title, setTitle] = useState<string>("")
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // 30 days default
  )
  const [notes, setNotes] = useState<string>("")

  // Contingency & Discount sliders
  const [contingency, setContingency] = useState<number>(10) // default 10%
  const [discount, setDiscount] = useState<number>(0) // default 0%
  
  const [error, setError] = useState<string | null>(null)

  // Find currently selected project
  const currentProject = projects.find((p) => p.id === selectedProjectId)
  const baseHours = currentProject?.baseHours || 0
  const baseCost = currentProject?.baseCost || 0

  // Real-time calculations
  const adjustedHours = baseHours * (1 + contingency / 100)
  const costWithContingency = baseCost * (1 + contingency / 100)
  const finalPrice = costWithContingency * (1 - discount / 100)

  // Format currency in BRL
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  // Handle dropdown change, and generate dynamic title proposal suggestion
  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId)
    const proj = projects.find((p) => p.id === projId)
    if (proj) {
      setTitle(`Proposta Comercial — ${proj.name}`)
    }
  }

  // Initialize title if project exists
  useState(() => {
    if (projects[0]) {
      setTitle(`Proposta Comercial — ${projects[0].name}`)
    }
  })

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    formData.set("projectId", selectedProjectId)
    formData.set("title", title)
    formData.set("contingency", contingency.toString())
    formData.set("discount", discount.toString())
    formData.set("validUntil", validUntil)
    formData.set("notes", notes)

    const res = await createProposal(formData)
    if (res && res.error) {
      setError(res.error)
    } else {
      router.push("/proposals")
      router.refresh()
    }
  }

  return (
    <form action={handleSubmit} className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {error && (
        <div className="card" style={{ borderLeft: "4px solid var(--color-danger)", background: "rgba(239, 68, 68, 0.05)", color: "var(--color-danger)", padding: "16px", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
        
        {/* Proposal Details Form */}
        <div style={{ gridColumn: "span 7" }} className="card">
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
            📄 Detalhes da Proposta
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div>
              <label className="input-label">Selecione o Projeto *</label>
              <select
                className="input"
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                required
              >
                <option value="" disabled>Selecione um projeto</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.clientName || "Sem Cliente"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Título da Proposta *</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Proposta Comercial - Rollout MM/SD"
                required
              />
            </div>

            <div>
              <label className="input-label">Data de Validade da Proposta</label>
              <input
                type="date"
                className="input"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
                Data sugerida: 30 dias a partir de hoje.
              </span>
            </div>

            {/* Adjustments Section */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px", marginTop: "8px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "var(--color-text-secondary)" }}>
                ⚙️ Ajustes e Margens Comerciais
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span className="input-label" style={{ margin: 0 }}>Margem de Contingência</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#60a5fa" }}>+{contingency}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={contingency}
                    onChange={(e) => setContingency(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span className="input-label" style={{ margin: 0 }}>Desconto Comercial</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#f87171" }}>-{discount}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={discount}
                    onChange={(e) => setDiscount(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: "#ef4444", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="input-label">Visão Geral do Escopo / Notas Adicionais</label>
              <textarea
                className="input"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Esta proposta comercial abrange o levantamento, configuração, desenvolvimento e validação dos processos descritos no escopo inicial do backlog."
                style={{ resize: "none" }}
              />
            </div>

          </div>
        </div>

        {/* Real-time Summary Card (Right Side) */}
        <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="card shadow-lg" style={{ borderLeft: "4px solid #3b82f6", background: "rgba(30, 41, 59, 0.4)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px" }}>📊 Consolidação Financeira</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Esforço Estimado (Base)</span>
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{baseHours} Horas</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Esforço Ajustado (+{contingency}%)</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#60a5fa" }}>{adjustedHours.toFixed(1)} Horas</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Preço Estimado (Base)</span>
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{formatBRL(baseCost)}</span>
              </div>

              {contingency > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Acréscimo de Risco (+{contingency}%)</span>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#60a5fa" }}>{formatBRL(costWithContingency - baseCost)}</span>
                </div>
              )}

              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Desconto Aplicado (-{discount}%)</span>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#ef4444" }}>-{formatBRL(costWithContingency * (discount / 100))}</span>
                </div>
              )}

              <div style={{ marginTop: "12px", background: "rgba(52, 211, 153, 0.05)", border: "1px solid rgba(52, 211, 153, 0.15)", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#34d399", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Valor Comercial Líquido
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#34d399", marginTop: "4px" }}>
                  {formatBRL(finalPrice)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px" }}>
                  Valores em Reais (BRL), calculados automaticamente a partir das estimativas de backlog vigentes.
                </div>
              </div>

            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/proposals" className="btn-secondary" style={{ flex: 1, textAlign: "center", textDecoration: "none" }}>
              Voltar
            </Link>
            <div style={{ flex: 2 }}>
              <FormSubmitButton label="Gerar Proposta" pendingLabel="Gerando Proposta..." className="btn-primary w-full" />
            </div>
          </div>

        </div>

      </div>

    </form>
  )
}
