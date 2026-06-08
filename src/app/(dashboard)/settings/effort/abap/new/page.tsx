import type { Metadata } from "next"
import Link from "next/link"
import { createAbapEffort } from "@/app/(dashboard)/settings/effort/actions"
import FormSubmitButton from "@/components/FormSubmitButton"

export const metadata: Metadata = { title: "Novo Esforço ABAP" }

export default function NewAbapEffortPage() {
  const typeLabels: Record<string, string> = {
    REPORT: "Report", INTERFACE: "Interface", CONVERSION: "Conversão",
    ENHANCEMENT: "Enhancement", FORM: "Formulário", WORKFLOW: "Workflow",
    BADI: "BAdI", USER_EXIT: "User Exit", SMARTFORM: "SmartForm", ADOBE_FORM: "Adobe Form",
  }

  const complexityLabels: Record<string, string> = {
    SIMPLE: "Simples", MEDIUM: "Médio", COMPLEX: "Complexo", VERY_COMPLEX: "Muito Complexo",
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/settings/effort" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Esforços
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>💻 Novo Esforço ABAP</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Cadastre um esforço padrão em horas para desenvolvimentos ABAP</p>
      </div>

      <div className="card">
        <form action={createAbapEffort as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="type">Tipo de Objeto ABAP *</label>
              <select id="type" name="type" className="input" required>
                {Object.entries(typeLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label" htmlFor="complexity">Complexidade *</label>
              <select id="complexity" name="complexity" className="input" required>
                {Object.entries(complexityLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="standardHours">Horas Padrão *</label>
            <input
              id="standardHours"
              name="standardHours"
              type="number"
              step="0.5"
              min="0.5"
              className="input"
              placeholder="Ex: 16.0"
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="description">Descrição do Esforço (opcional)</label>
            <input
              id="description"
              name="description"
              type="text"
              className="input"
              placeholder="Ex: Desenvolvimento básico de ALV Report"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/settings/effort" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Salvar Esforço" />
          </div>
        </form>
      </div>
    </div>
  )
}
