import type { Metadata } from "next"
import Link from "next/link"
import { createModule } from "../actions"
import FormSubmitButton from "@/components/FormSubmitButton"

export const metadata: Metadata = { title: "Novo Módulo SAP" }

export default async function NewModulePage() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/settings/modules" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Módulos SAP
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>⚙️ Novo Módulo SAP</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Cadastre um novo módulo SAP para utilização nos projetos</p>
      </div>

      <div className="card">
        <form action={createModule as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label className="input-label" htmlFor="code">Código do Módulo</label>
            <input
              id="code"
              name="code"
              type="text"
              className="input"
              placeholder="Ex: FI, MM, SD, ABAP"
              required
              maxLength={10}
              style={{ textTransform: "uppercase" }}
            />
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              Identificador curto e único do módulo (letras maiúsculas).
            </span>
          </div>

          <div>
            <label className="input-label" htmlFor="name">Nome do Módulo</label>
            <input
              id="name"
              name="name"
              type="text"
              className="input"
              placeholder="Ex: Financial Accounting"
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="description">Descrição / Tradução</label>
            <textarea
              id="description"
              name="description"
              className="input"
              rows={4}
              placeholder="Ex: Contabilidade Financeira"
              style={{ resize: "vertical", minHeight: "100px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/settings/modules" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Salvar Módulo" />
          </div>
        </form>
      </div>
    </div>
  )
}
