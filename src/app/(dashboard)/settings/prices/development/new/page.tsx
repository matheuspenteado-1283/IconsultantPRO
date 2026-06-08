import type { Metadata } from "next"
import Link from "next/link"
import { createDevelopmentPrice } from "@/app/(dashboard)/settings/prices/actions"
import FormSubmitButton from "@/components/FormSubmitButton"

export const metadata: Metadata = { title: "Novo Preço de Desenvolvimento" }

export default function NewDevelopmentPricePage() {
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
        <Link href="/settings/prices" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Preços
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>💻 Novo Preço Desenvolvimento</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Cadastre um preço unitário para desenvolvimentos ABAP / WRICEF</p>
      </div>

      <div className="card">
        <form action={createDevelopmentPrice as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="unitPrice">Preço Unitário (R$) *</label>
              <input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                placeholder="Ex: 4800.00"
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="currency">Moeda</label>
              <select id="currency" name="currency" className="input" defaultValue="BRL">
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="description">Descrição do Objeto (opcional)</label>
            <input
              id="description"
              name="description"
              type="text"
              className="input"
              placeholder="Ex: Relatório simples ALV, Formulário Smartform"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/settings/prices" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Salvar Preço" />
          </div>
        </form>
      </div>
    </div>
  )
}
