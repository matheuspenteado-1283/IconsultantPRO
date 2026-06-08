import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { toggleModuleActive } from "./actions"

import { enforceModuleAccess } from "@/lib/access"

export const metadata: Metadata = { title: "Módulos SAP" }

export default async function ModulesPage() {
  await enforceModuleAccess("settings_modules")
  
  const modules = await db.sapModule.findMany({ orderBy: { code: "asc" } })

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>⚙️ Módulos SAP</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Cadastro de módulos SAP utilizados nos projetos</p>
        </div>
        <Link href="/settings/modules/new" className="btn-primary">+ Novo Módulo</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod.id}>
                  <td><span className="badge badge-blue">{mod.code}</span></td>
                  <td style={{ fontWeight: 600 }}>{mod.name}</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{mod.description || "—"}</td>
                  <td>
                    <span className={`badge ${mod.active ? "badge-green" : "badge-gray"}`}>
                      {mod.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/settings/modules/${mod.id}/edit`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Editar
                      </Link>

                      <form
                        action={async () => {
                          "use server"
                          await toggleModuleActive(mod.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="btn-ghost"
                          style={{
                            fontSize: "13px",
                            padding: "4px 8px",
                            color: mod.active ? "#f87171" : "#34d399",
                          }}
                        >
                          {mod.active ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {modules.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
              Nenhum módulo cadastrado. <Link href="/settings/modules/new" style={{ color: "#60a5fa" }}>Adicionar →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
