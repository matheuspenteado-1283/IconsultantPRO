import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import FormSubmitButton from "@/components/FormSubmitButton"
import { createSystemEnvironment, deleteSystemEnvironment } from "./actions"

import { enforceModuleAccess } from "@/lib/access"

export const metadata: Metadata = { title: "Sistemas e Ambientes" }

export default async function SystemsPage() {
  await enforceModuleAccess("systems")

  const session = await auth()
  const orgId = (session?.user as any)?.organizationId

  if (!orgId) {
    redirect("/login")
  }

  const [systems, projects] = await Promise.all([
    db.systemEnvironment.findMany({
      where: { project: { organizationId: orgId } },
      include: { project: true },
      orderBy: [{ project: { name: "asc" } }, { environment: "asc" }],
    }),
    db.project.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
  ])

  const envLabels: Record<string, string> = {
    DEV: "Desenvolvimento (DEV)",
    QAS: "Qualidade (QAS)",
    PRD: "Produção (PRD)",
    SBX: "Sandbox (SBX)",
    SANDBOX: "Sandbox (SANDBOX)",
  }

  const envBadges: Record<string, string> = {
    DEV: "badge-blue",
    QAS: "badge-yellow",
    PRD: "badge-red",
    SBX: "badge-gray",
    SANDBOX: "badge-gray",
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>🖥️ Sistemas e Ambientes</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Cadastre e gerencie sistemas SAP e ambientes por projeto (DEV, QAS, PRD, SBX)
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "28px", alignItems: "start" }}>
        {/* Left: Environments list */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ambiente</th>
                  <th>Projeto</th>
                  <th>ID / Versão</th>
                  <th>Observações</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {systems.map((sys) => (
                  <tr key={sys.id}>
                    <td>
                      <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>{sys.name}</span>
                      <span className={`badge ${envBadges[sys.environment] || "badge-gray"}`}>
                        {sys.environment}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/projects/${sys.projectId}`}
                        style={{ color: "#60a5fa", fontWeight: 500, textDecoration: "none" }}
                        className="hover:underline"
                      >
                        {sys.project.name}
                      </Link>
                    </td>
                    <td>
                      <span style={{ display: "block", fontSize: "13px" }}>ID: {sys.systemId || "—"}</span>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        Ver: {sys.version || "—"}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
                      {sys.notes || "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <form
                        action={async () => {
                          "use server"
                          await deleteSystemEnvironment(sys.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="btn-ghost"
                          style={{ fontSize: "13px", padding: "4px 8px", color: "#f87171" }}
                        >
                          Excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {systems.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
                Nenhum sistema ou ambiente cadastrado para os seus projetos.
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Add Form */}
        <div className="card">
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>🖥️ Novo Ambiente SAP</h2>
          <form action={createSystemEnvironment as any} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="projectId">Projeto Associado *</label>
              <select id="projectId" name="projectId" className="input" required>
                <option value="">Selecione um projeto...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label" htmlFor="name">Nome do Ambiente *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="Ex: S/4HANA PRD, SAP ECC DEV"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="input-label" htmlFor="environment">Tipo *</label>
                <select id="environment" name="environment" className="input" required>
                  <option value="DEV">Desenvolvimento (DEV)</option>
                  <option value="QAS">Qualidade (QAS)</option>
                  <option value="PRD">Produção (PRD)</option>
                  <option value="SBX">Sandbox (SBX)</option>
                </select>
              </div>
              <div>
                <label className="input-label" htmlFor="systemId">SID / Host</label>
                <input
                  id="systemId"
                  name="systemId"
                  type="text"
                  className="input"
                  placeholder="Ex: S4P, 10.0.1.5"
                />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="version">Versão do SAP</label>
              <input
                id="version"
                name="version"
                type="text"
                className="input"
                placeholder="Ex: S/4HANA 2023, ECC 6.0 EHP8"
              />
            </div>

            <div>
              <label className="input-label" htmlFor="notes">Observações / Detalhes de Acesso</label>
              <textarea
                id="notes"
                name="notes"
                className="input"
                rows={3}
                placeholder="Notas de infraestrutura, detalhes de conexão ou login..."
                style={{ resize: "vertical", minHeight: "80px" }}
              />
            </div>

            <FormSubmitButton label="Salvar Ambiente" className="btn-primary" />
          </form>
        </div>
      </div>
    </div>
  )
}
