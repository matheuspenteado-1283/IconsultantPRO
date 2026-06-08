import type { Metadata } from "next"
import Link from "next/link"
import { createProfessionalPrice } from "@/app/(dashboard)/settings/prices/actions"
import FormSubmitButton from "@/components/FormSubmitButton"

export const metadata: Metadata = { title: "Novo Preço Profissional" }

export default function NewProfessionalPricePage() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/settings/prices" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Preços
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>👨‍💼 Novo Preço Profissional</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Cadastre um perfil profissional e suas taxas horária/diária</p>
      </div>

      <div className="card">
        <form action={createProfessionalPrice as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label className="input-label" htmlFor="profile">Perfil / Cargo *</label>
            <input
              id="profile"
              name="profile"
              type="text"
              className="input"
              placeholder="Ex: Consultor Sênior FICO, Arquiteto SAP"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="dailyRate">Valor da Diária (R$) *</label>
              <input
                id="dailyRate"
                name="dailyRate"
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                placeholder="Ex: 1800.00"
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="hourlyRate">Valor da Hora (R$) *</label>
              <input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                placeholder="Ex: 225.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="currency">Moeda</label>
            <select id="currency" name="currency" className="input" defaultValue="BRL">
              <option value="BRL">BRL (R$)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
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
