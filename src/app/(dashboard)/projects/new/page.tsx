import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { createProject } from "../actions"
import FormSubmitButton from "@/components/FormSubmitButton"

export const metadata: Metadata = { title: "Novo Projeto SAP" }

export default async function NewProjectPage() {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId

  if (!orgId) {
    redirect("/login")
  }

  const [clients, sapModules] = await Promise.all([
    db.partner.findMany({
      where: { organizationId: orgId, partnerType: "CLIENT", active: true },
      orderBy: { name: "asc" },
    }),
    db.sapModule.findMany({
      where: { active: true },
      orderBy: { code: "asc" },
    }),
  ])

  return (
    <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/projects" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Projetos
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>📁 Novo Projeto SAP</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Inicie um novo projeto para gerenciar participantes, escopo e estimativas</p>
      </div>

      <div className="card">
        <form action={createProject as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="name">Nome do Projeto *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="Ex: Implementação S/4HANA Finance"
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="code">Código / Sigla</label>
              <input
                id="code"
                name="code"
                type="text"
                className="input"
                placeholder="Ex: PRJ-S4H"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="clientId">Cliente *</label>
              <select id="clientId" name="clientId" className="input" required>
                <option value="">Selecione um cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {clients.length === 0 && (
                <span style={{ fontSize: "11px", color: "var(--color-warning)", marginTop: "4px", display: "block" }}>
                  Nenhum cliente ativo. <Link href="/settings/partners/new" style={{ color: "#60a5fa" }}>Cadastrar Cliente →</Link>
                </span>
              )}
            </div>
            <div>
              <label className="input-label" htmlFor="status">Status Inicial *</label>
              <select id="status" name="status" className="input" defaultValue="PROSPECTING" required>
                <option value="PROSPECTING">Prospecção / Pré-venda</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="ON_HOLD">Suspenso</option>
                <option value="COMPLETED">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="startDate">Data de Início</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="input"
              />
            </div>
            <div>
              <label className="input-label" htmlFor="endDate">Data de Fim (Estimada)</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className="input"
              />
            </div>
          </div>

          {/* SAP Modules checkboxes */}
          <div>
            <label className="input-label" style={{ marginBottom: "12px" }}>Módulos SAP Envolvidos</label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "10px",
              padding: "16px",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
              border: "1px solid var(--color-border)"
            }}>
              {sapModules.map((m) => (
                <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                  <input
                    type="checkbox"
                    name="modules"
                    value={m.id}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: 600 }}>{m.code}</span>
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>{m.name.slice(0, 10)}...</span>
                </label>
              ))}
              {sapModules.length === 0 && (
                <span style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Nenhum módulo SAP cadastrado.</span>
              )}
            </div>
          </div>

          {/* Scope and Description */}
          <div>
            <label className="input-label" htmlFor="scope">Escopo do Projeto</label>
            <textarea
              id="scope"
              name="scope"
              className="input"
              rows={4}
              placeholder="Descreva detalhadamente o escopo do projeto (módulos, integrações, entregáveis)..."
              style={{ resize: "vertical", minHeight: "100px" }}
            />
          </div>

          <div>
            <label className="input-label" htmlFor="description">Descrição Resumida</label>
            <input
              id="description"
              name="description"
              type="text"
              className="input"
              placeholder="Ex: Upgrade de ECC para S/4HANA com foco no módulo financeiro"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/projects" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Criar Projeto" />
          </div>
        </form>
      </div>
    </div>
  )
}
