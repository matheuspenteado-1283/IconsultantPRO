"use client"

import { useState } from "react"
import FormSubmitButton from "@/components/FormSubmitButton"
import { createEffortEstimate, deleteEffortEstimate } from "../../actions"

interface Project {
  id: string
  name: string
  client: { name: string } | null
  backlogItems: Array<{
    id: string
    backlogCode: string
    description: string
    category: string
    type: string
    moduleId: string | null
    sapModule: { code: string; name: string } | null
    effortEstimates: Array<{
      id: string
      estimateType: string
      complexity: string | null
      hours: number
      notes: string | null
    }>
  }>
}

interface AbapEffort {
  id: string
  type: string
  complexity: string
  standardHours: number
}

interface FunctionalEffort {
  id: string
  moduleId: string
  activityType: string
  complexity: string
  standardHours: number
}

interface SapModule {
  id: string
  code: string
  name: string
}

interface EffortOnlyDashboardProps {
  projects: Project[]
  abapEfforts: AbapEffort[]
  functionalEfforts: FunctionalEffort[]
  sapModules: SapModule[]
}

export default function EffortOnlyDashboard({
  projects,
  abapEfforts,
  functionalEfforts,
  sapModules,
}: EffortOnlyDashboardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ""
  )
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  // Estimation form states
  const [estimateType, setEstimateType] = useState<string>("ABAP")
  const [hours, setHours] = useState<string>("")
  const [complexity, setComplexity] = useState<string>("MEDIUM")
  const [notes, setNotes] = useState<string>("")

  // ABAP sub-states
  const [abapType, setAbapType] = useState<string>("REPORT")

  // Functional sub-states
  const [funcModuleId, setFuncModuleId] = useState<string>("")
  const [funcActivity, setFuncActivity] = useState<string>("")

  const activeProject = projects.find((p) => p.id === selectedProjectId)
  const activeItem = activeProject?.backlogItems.find((i) => i.id === activeItemId)

  // Calculate total hours
  let totalHoursBase = 0

  if (activeProject) {
    activeProject.backlogItems.forEach((item) => {
      item.effortEstimates.forEach((est) => {
        totalHoursBase += est.hours
      })
    })
  }

  // Handles standard hours lookup dynamically on form change
  const handleEstimateTypeChange = (type: string) => {
    setEstimateType(type)
    setHours("")

    if (type === "ABAP") {
      const match = abapEfforts.find(
        (e) => e.type === abapType && e.complexity === complexity
      )
      if (match) setHours(match.standardHours.toString())
    } else if (type === "FUNCTIONAL") {
      const match = functionalEfforts.find(
        (e) => e.complexity === complexity
      )
      if (match) setHours(match.standardHours.toString())
    }
  }

  const handleAbapTypeChange = (type: string) => {
    setAbapType(type)
    const match = abapEfforts.find(
      (e) => e.type === type && e.complexity === complexity
    )
    if (match) setHours(match.standardHours.toString())
  }

  const handleComplexityChange = (comp: string) => {
    setComplexity(comp)
    if (estimateType === "ABAP") {
      const match = abapEfforts.find(
        (e) => e.type === abapType && e.complexity === comp
      )
      if (match) setHours(match.standardHours.toString())
    } else if (estimateType === "FUNCTIONAL") {
      const match = functionalEfforts.find(
        (e) => e.complexity === comp
      )
      if (match) setHours(match.standardHours.toString())
    }
  }

  const handleSaveEstimate = async (formData: FormData) => {
    formData.set("backlogItemId", activeItemId || "")
    formData.set("estimateType", estimateType)
    formData.set("complexity", complexity)
    formData.set("hours", hours)
    formData.set("notes", notes)

    const res = await createEffortEstimate(formData)
    if (res && res.success) {
      setHours("")
      setNotes("")
      setActiveItemId(null)
    }
  }

  const handleDeleteEstimate = async (id: string) => {
    if (confirm("Deseja realmente excluir esta estimativa?")) {
      await deleteEffortEstimate(id)
    }
  }

  const abapObjectTypes = [
    "REPORT", "INTERFACE", "CONVERSION", "ENHANCEMENT", "FORM",
    "WORKFLOW", "BADI", "USER_EXIT", "SMARTFORM", "ADOBE_FORM"
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Project selector panel */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: "280px" }}>
            <label className="input-label">Selecione o Projeto para Estimativa</label>
            <select
              className="input"
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value)
                setActiveItemId(null)
              }}
            >
              <option value="" disabled>Selecione um projeto</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} {proj.client ? `(${proj.client.name})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeProject ? (
        <>
          {/* KPI summary — hours only */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div className="kpi-card glow-blue">
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                Esforço Total (Horas Base)
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px", color: "#e2e8f0" }}>
                {totalHoursBase} Horas
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginTop: "4px" }}>
                Soma de todas as estimativas do projeto
              </span>
            </div>

            <div className="kpi-card glow-green">
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
                Itens com Estimativa
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px", color: "#60a5fa" }}>
                {activeProject.backlogItems.filter(i => i.effortEstimates.length > 0).length}
                <span style={{ fontSize: "16px", color: "var(--color-text-muted)", fontWeight: 500 }}>
                  {" / "}{activeProject.backlogItems.length}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginTop: "4px" }}>
                Itens estimados vs. total do backlog
              </span>
            </div>
          </div>

          {/* Backlog items table */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>📋 Itens do Backlog &amp; Estimativas de Esforço</h3>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição do Item</th>
                    <th>Categoria</th>
                    <th>Módulo</th>
                    <th>Horas Estimadas</th>
                    <th style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProject.backlogItems.map((item) => {
                    const itemHours = item.effortEstimates.reduce((sum, e) => sum + e.hours, 0)

                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ fontWeight: 700, color: "#60a5fa" }}>{item.backlogCode}</td>
                        <td style={{ fontWeight: 600, maxWidth: "240px" }}>
                          <div>{item.description}</div>
                          {item.effortEstimates.length > 0 && (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                              {item.effortEstimates.map((est) => (
                                <span
                                  key={est.id}
                                  className="badge badge-gray"
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 8px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  {est.estimateType}: {est.hours}h
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEstimate(est.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#f87171",
                                      cursor: "pointer",
                                      fontSize: "11px",
                                      padding: 0,
                                    }}
                                    title="Excluir Estimativa"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${item.category === "IMPLEMENTATION" ? "badge-purple" : "badge-green"}`}>
                            {item.category === "IMPLEMENTATION" ? "Implementação" : "Melhoria"}
                          </span>
                        </td>
                        <td>
                          {item.sapModule ? (
                            <span className="badge badge-blue">{item.sapModule.code}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>{itemHours} Horas</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveItemId(item.id)
                              handleEstimateTypeChange("ABAP")
                            }}
                            className="btn-primary"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                          >
                            + Estimar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {activeProject.backlogItems.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
                  Não há itens de backlog cadastrados neste projeto.
                </div>
              )}
            </div>
          </div>

          {/* Effort Estimator Modal */}
          {activeItemId && activeItem && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ padding: "24px", maxWidth: "600px" }}>

                {/* Modal Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800 }}>⚙️ Adicionar Estimativa de Esforço</h3>
                    <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      Item: <strong>{activeItem.backlogCode}</strong> - {activeItem.description}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveItemId(null)}
                    style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: "20px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>

                <form action={handleSaveEstimate}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px", marginBottom: "20px" }}>

                    <div style={{ gridColumn: "span 6" }}>
                      <label className="input-label">Tipo de Esforço *</label>
                      <select
                        name="estimateType"
                        className="input"
                        value={estimateType}
                        onChange={(e) => handleEstimateTypeChange(e.target.value)}
                      >
                        <option value="ABAP">Desenvolvimento ABAP</option>
                        <option value="FUNCTIONAL">Consultoria Funcional</option>
                        <option value="CONSULTING">Consultoria Técnica Geral</option>
                        <option value="TRAINING">Treinamento / Onboarding</option>
                        <option value="MANAGEMENT">Gestão de Projetos</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: "span 6" }}>
                      <label className="input-label">Complexidade *</label>
                      <select
                        name="complexity"
                        className="input"
                        value={complexity}
                        onChange={(e) => handleComplexityChange(e.target.value)}
                      >
                        <option value="SIMPLE">Simples</option>
                        <option value="MEDIUM">Média</option>
                        <option value="COMPLEX">Complexa</option>
                        <option value="VERY_COMPLEX">Muito Complexa</option>
                      </select>
                    </div>

                    {estimateType === "ABAP" && (
                      <div style={{ gridColumn: "span 12" }}>
                        <label className="input-label">Objeto ABAP *</label>
                        <select
                          className="input"
                          value={abapType}
                          onChange={(e) => handleAbapTypeChange(e.target.value)}
                        >
                          {abapObjectTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {estimateType === "FUNCTIONAL" && (
                      <>
                        <div style={{ gridColumn: "span 6" }}>
                          <label className="input-label">Módulo SAP *</label>
                          <select
                            className="input"
                            value={funcModuleId}
                            onChange={(e) => setFuncModuleId(e.target.value)}
                          >
                            <option value="">Selecione o módulo</option>
                            {sapModules.map((m) => (
                              <option key={m.id} value={m.id}>{m.code}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ gridColumn: "span 6" }}>
                          <label className="input-label">Atividade Funcional</label>
                          <input
                            type="text"
                            placeholder="Ex: Configuração de SPRO"
                            className="input"
                            value={funcActivity}
                            onChange={(e) => setFuncActivity(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div style={{ gridColumn: "span 12" }}>
                      <label className="input-label">Esforço Estimado (Horas) *</label>
                      <input
                        type="number"
                        name="hours"
                        required
                        min="0.5"
                        step="0.5"
                        className="input"
                        placeholder="Ex: 8"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                      />
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
                        Sugerido com base na tabela de complexidade padrão.
                      </span>
                    </div>

                    <div style={{ gridColumn: "span 12" }}>
                      <label className="input-label">Observações / Notas</label>
                      <textarea
                        name="notes"
                        rows={2}
                        className="input"
                        style={{ resize: "none" }}
                        placeholder="Ex: Considerar cenários de testes adicionais"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                  </div>

                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setActiveItemId(null)}
                    >
                      Cancelar
                    </button>
                    <FormSubmitButton label="Salvar Estimativa" pendingLabel="Salvando..." />
                  </div>
                </form>

              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--color-text-secondary)" }}>
          📭 Nenhum projeto encontrado para realizar estimativas. Crie um projeto antes.
        </div>
      )}

    </div>
  )
}
