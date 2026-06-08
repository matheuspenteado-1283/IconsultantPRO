import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { deleteAbapEffort, deleteFunctionalEffort } from "./actions"
import { enforceModuleAccess } from "@/lib/access"
import CsvImportButton from "@/components/CsvImportButton"
import { importAbapEffortCsv, importFunctionalEffortCsv } from "../csv-actions"

export const metadata: Metadata = { title: "Tabela de Esforço" }

export default async function EffortPage() {
  await enforceModuleAccess("settings_effort")
  
  const [abapEfforts, functionalEfforts] = await Promise.all([
    db.abapEffort.findMany({
      orderBy: [{ type: "asc" }, { complexity: "asc" }],
    }),
    db.functionalEffort.findMany({
      include: { sapModule: true },
      orderBy: [{ sapModule: { code: "asc" } }, { activityType: "asc" }],
    }),
  ])

  const complexityLabel: Record<string, string> = {
    SIMPLE: "Simples", MEDIUM: "Médio", COMPLEX: "Complexo", VERY_COMPLEX: "Muito Complexo",
  }

  const typeLabel: Record<string, string> = {
    REPORT: "Report", INTERFACE: "Interface", CONVERSION: "Conversão",
    ENHANCEMENT: "Enhancement", FORM: "Formulário", WORKFLOW: "Workflow",
    BADI: "BAdI", USER_EXIT: "User Exit", SMARTFORM: "SmartForm", ADOBE_FORM: "Adobe Form",
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>📊 Tabela de Esforço</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Horas padrão para estimativa de projetos SAP por tipo e complexidade</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/settings/effort/abap/new" className="btn-secondary">+ Esforço ABAP</Link>
          <Link href="/settings/effort/functional/new" className="btn-primary">+ Esforço Funcional</Link>
        </div>
      </div>

      {/* ABAP Efforts */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>💻 Esforço ABAP (WRICEF)</h2>
        <CsvImportButton
          templateFilename="abap_effort_template.csv"
          templateHeaders={['type', 'complexity', 'standardHours', 'description']}
          templateExample={['REPORT', 'SIMPLE', '16', 'Relatório Simples ALV']}
          onImport={importAbapEffortCsv}
          label="Importar ABAP CSV"
        />
      </div>
      <div className="card" style={{ padding: 0, marginBottom: "28px" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Complexidade</th>
                <th>Horas Padrão</th>
                <th>Dias Úteis</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {abapEfforts.map((e) => (
                <tr key={e.id}>
                  <td><span className="badge badge-blue">{typeLabel[e.type] || e.type}</span></td>
                  <td>{complexityLabel[e.complexity] || e.complexity}</td>
                  <td style={{ fontWeight: 600, color: "#60a5fa" }}>{e.standardHours}h</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{Math.ceil(e.standardHours / 8)} dias</td>
                  <td>
                    <span className={`badge ${e.active ? "badge-green" : "badge-gray"}`}>
                      {e.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/settings/effort/abap/${e.id}/edit`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Editar
                      </Link>

                      <form
                        action={async () => {
                          "use server"
                          await deleteAbapEffort(e.id)
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {abapEfforts.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
              Nenhum esforço ABAP cadastrado.
            </div>
          )}
        </div>
      </div>

      {/* Functional Efforts */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>👨‍💼 Esforço Funcional (Módulos SAP)</h2>
        <CsvImportButton
          templateFilename="functional_effort_template.csv"
          templateHeaders={['moduleCode', 'activityType', 'complexity', 'standardHours', 'description']}
          templateExample={['FI', 'Customização / SPRO', 'MEDIUM', '24', 'Configuração de novo IVA']}
          onImport={importFunctionalEffortCsv}
          label="Importar Funcional CSV"
        />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Módulo SAP</th>
                <th>Atividade</th>
                <th>Complexidade</th>
                <th>Horas Padrão</th>
                <th>Dias Úteis</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {functionalEfforts.map((e) => (
                <tr key={e.id}>
                  <td><span className="badge badge-purple">{e.sapModule.code} - {e.sapModule.name}</span></td>
                  <td style={{ fontWeight: 600 }}>{e.activityType}</td>
                  <td>{complexityLabel[e.complexity] || e.complexity}</td>
                  <td style={{ fontWeight: 600, color: "#60a5fa" }}>{e.standardHours}h</td>
                  <td style={{ color: "var(--color-text-secondary)" }}>{Math.ceil(e.standardHours / 8)} dias</td>
                  <td>
                    <span className={`badge ${e.active ? "badge-green" : "badge-gray"}`}>
                      {e.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/settings/effort/functional/${e.id}/edit`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Editar
                      </Link>

                      <form
                        action={async () => {
                          "use server"
                          await deleteFunctionalEffort(e.id)
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {functionalEfforts.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
              Nenhum esforço funcional cadastrado.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
