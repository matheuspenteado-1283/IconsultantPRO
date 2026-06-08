"use client"

import { useState } from "react"
import Link from "next/link"
import FormSubmitButton from "@/components/FormSubmitButton"
import { createBacklogItem, updateBacklogItem } from "../actions"

interface BacklogFormProps {
  projects: Array<{ id: string; name: string }>
  users: Array<{ id: string; name: string | null; email: string }>
  sapModules: Array<{ id: string; code: string; name: string }>
  initialData?: any // Prefills for editing
}

export default function BacklogForm({
  projects,
  users,
  sapModules,
  initialData,
}: BacklogFormProps) {
  const isEdit = !!initialData
  const [category, setCategory] = useState<"IMPLEMENTATION" | "IMPROVEMENT">(
    initialData?.category || "IMPLEMENTATION"
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    
    // Add category manually since toggle buttons are used
    formData.set("category", category)

    let result
    if (isEdit) {
      result = await updateBacklogItem(initialData.id, formData)
    } else {
      result = await createBacklogItem(formData)
    }

    if (result && result.error) {
      setError(result.error)
    }
  }

  return (
    <form action={handleSubmit} className="animate-fade-in">
      {error && (
        <div
          style={{
            background: "rgba(220, 38, 38, 0.15)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            color: "#f87171",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>
        
        {/* Core Settings Panel */}
        <div style={{ gridColumn: "span 12" }} className="card">
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "18px" }}>📋 Dados Gerais do Item</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" }}>
            <div style={{ gridColumn: "span 6" }}>
              <label className="input-label">Projeto *</label>
              <select
                name="projectId"
                required
                className="input"
                defaultValue={initialData?.projectId || ""}
              >
                <option value="" disabled>Selecione o Projeto</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "span 6" }}>
              <label className="input-label">Responsável</label>
              <select
                name="responsibleId"
                className="input"
                defaultValue={initialData?.responsibleId || ""}
              >
                <option value="">Não Atribuído</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <label className="input-label">Descrição Resumida *</label>
              <textarea
                name="description"
                required
                rows={2}
                className="input"
                style={{ resize: "vertical" }}
                placeholder="Ex: Criar relatório de faturamento mensal consolidado"
                defaultValue={initialData?.description || ""}
              />
            </div>

            <div style={{ gridColumn: "span 4" }}>
              <label className="input-label">Tipo de Item *</label>
              <select
                name="type"
                required
                className="input"
                defaultValue={initialData?.type || "CONFIGURATION"}
              >
                <option value="CONFIGURATION">Configuração</option>
                <option value="WRICEF">WRICEF</option>
                <option value="CONSULTING">Consultoria</option>
                <option value="TRAINING">Treinamento</option>
                <option value="GUIDANCE">Orientação</option>
              </select>
            </div>

            <div style={{ gridColumn: "span 4" }}>
              <label className="input-label">Prioridade *</label>
              <select
                name="priority"
                required
                className="input"
                defaultValue={initialData?.priority || "MEDIUM"}
              >
                <option value="CRITICAL">Crítica</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>
            </div>

            {isEdit ? (
              <div style={{ gridColumn: "span 4" }}>
                <label className="input-label">Status *</label>
                <select
                  name="status"
                  required
                  className="input"
                  defaultValue={initialData?.status || "OPEN"}
                >
                  <option value="OPEN">Aberto</option>
                  <option value="IN_PROGRESS">Em Progresso</option>
                  <option value="REVIEW">Em Revisão</option>
                  <option value="DONE">Concluído</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            ) : (
              <div style={{ gridColumn: "span 4" }} />
            )}
          </div>
        </div>

        {/* Category Toggle */}
        <div style={{ gridColumn: "span 12" }}>
          <label className="input-label" style={{ marginBottom: "8px" }}>Categoria do Item *</label>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              className={category === "IMPLEMENTATION" ? "btn-primary" : "btn-secondary"}
              style={{ flex: 1, padding: "12px" }}
              onClick={() => setCategory("IMPLEMENTATION")}
            >
              🚀 Implementação
            </button>
            <button
              type="button"
              className={category === "IMPROVEMENT" ? "btn-primary" : "btn-secondary"}
              style={{ flex: 1, padding: "12px" }}
              onClick={() => setCategory("IMPROVEMENT")}
            >
              📈 Melhoria
            </button>
          </div>
        </div>

        {/* Conditional Sub-Forms */}
        <div style={{ gridColumn: "span 12" }} className="card">
          {category === "IMPLEMENTATION" ? (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "18px" }}>🚀 Detalhes da Implementação</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" }}>
                
                <div style={{ gridColumn: "span 4" }}>
                  <label className="input-label">Fase do Projeto</label>
                  <input
                    type="text"
                    name="phase"
                    className="input"
                    placeholder="Ex: Realização"
                    defaultValue={initialData?.implementation?.phase || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 4" }}>
                  <label className="input-label">Módulo SAP</label>
                  <select
                    name="moduleId"
                    className="input"
                    defaultValue={initialData?.moduleId || ""}
                  >
                    <option value="">Não Vinculado</option>
                    {sapModules.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.code} - {mod.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "span 4" }}>
                  <label className="input-label">Estimativa de Horas</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    step="0.5"
                    min="0"
                    className="input"
                    placeholder="Ex: 16"
                    defaultValue={initialData?.implementation?.estimatedHours || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 12" }}>
                  <label className="input-label">Objeto Técnico</label>
                  <input
                    type="text"
                    name="technicalObject"
                    className="input"
                    placeholder="Ex: Programa ZFI_REL_CONSOLIDADO ou Transação ZFI001"
                    defaultValue={initialData?.implementation?.technicalObject || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 6" }}>
                  <label className="input-label">Critérios de Aceite</label>
                  <textarea
                    name="acceptanceCriteria"
                    rows={3}
                    className="input"
                    style={{ resize: "vertical" }}
                    placeholder="Ex: Gerar exportação em PDF e Excel sem erros de formatação"
                    defaultValue={initialData?.implementation?.acceptanceCriteria || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 6" }}>
                  <label className="input-label">Riscos Identificados</label>
                  <textarea
                    name="risks"
                    rows={3}
                    className="input"
                    style={{ resize: "vertical" }}
                    placeholder="Ex: Indisponibilidade temporária de tabelas de log do SAP"
                    defaultValue={initialData?.implementation?.risks || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 12" }}>
                  <label className="input-label">Observações Gerais</label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="input"
                    style={{ resize: "vertical" }}
                    defaultValue={initialData?.implementation?.notes || ""}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "18px" }}>📈 Detalhes da Melhoria</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "16px" }}>
                
                <div style={{ gridColumn: "span 6" }}>
                  <label className="input-label">Situação Atual</label>
                  <textarea
                    name="currentSituation"
                    rows={3}
                    className="input"
                    style={{ resize: "vertical" }}
                    placeholder="Ex: Processo manual em planilha Excel gerando erros frequentes"
                    defaultValue={initialData?.improvement?.currentSituation || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 6" }}>
                  <label className="input-label">Situação Desejada</label>
                  <textarea
                    name="desiredSituation"
                    rows={3}
                    className="input"
                    style={{ resize: "vertical" }}
                    placeholder="Ex: Automação completa integrada no SAP ECC"
                    defaultValue={initialData?.improvement?.desiredSituation || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 6" }}>
                  <label className="input-label">Justificativa de Negócio</label>
                  <textarea
                    name="businessJustification"
                    rows={3}
                    className="input"
                    style={{ resize: "vertical" }}
                    placeholder="Ex: Redução de 80% do tempo de processamento administrativo"
                    defaultValue={initialData?.improvement?.businessJustification || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 6" }}>
                  <label className="input-label">Impacto Operacional</label>
                  <textarea
                    name="operationalImpact"
                    rows={3}
                    className="input"
                    style={{ resize: "vertical" }}
                    placeholder="Ex: Treinamento rápido de 1 hora para a equipe de Faturamento"
                    defaultValue={initialData?.improvement?.operationalImpact || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 12" }}>
                  <label className="input-label">Benefícios Esperados</label>
                  <textarea
                    name="expectedBenefits"
                    rows={2}
                    className="input"
                    style={{ resize: "vertical" }}
                    placeholder="Ex: Maior acurácia dos dados fiscais e velocidade de emissão"
                    defaultValue={initialData?.improvement?.expectedBenefits || ""}
                  />
                </div>

                <div style={{ gridColumn: "span 12" }}>
                  <label className="input-label">Observações Gerais</label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="input"
                    style={{ resize: "vertical" }}
                    defaultValue={initialData?.improvement?.notes || ""}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons Panel */}
        <div style={{ gridColumn: "span 12", display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
          <Link href="/backlog" className="btn-secondary">
            Cancelar
          </Link>
          <FormSubmitButton
            label={isEdit ? "Salvar Alterações" : "Adicionar Item"}
            pendingLabel="Salvando..."
          />
        </div>
      </div>
    </form>
  )
}
