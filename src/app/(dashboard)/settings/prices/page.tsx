import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { deleteProfessionalPrice, deleteDevelopmentPrice } from "./actions"
import { enforceModuleAccess } from "@/lib/access"
import CsvImportButton from "@/components/CsvImportButton"
import { importProfessionalPricesCsv, importDevelopmentPricesCsv } from "../csv-actions"

export const metadata: Metadata = { title: "Tabela de Preços" }

export default async function PricesPage() {
  await enforceModuleAccess("settings_prices")

  const [professional, development] = await Promise.all([
    db.professionalPrice.findMany({ orderBy: { profile: "asc" } }),
    db.developmentPrice.findMany({ orderBy: [{ type: "asc" }, { complexity: "asc" }] }),
  ])

  const complexityLabel: Record<string, string> = {
    SIMPLE: "Simples",
    MEDIUM: "Médio",
    COMPLEX: "Complexo",
    VERY_COMPLEX: "Muito Complexo",
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
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>💰 Tabela de Preços</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Preços profissionais e de desenvolvimento para propostas</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/settings/prices/professional/new" className="btn-secondary">+ Preço Profissional</Link>
          <Link href="/settings/prices/development/new" className="btn-primary">+ Preço Desenvolvimento</Link>
        </div>
      </div>

      {/* Professional Prices */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>👨‍💼 Preços Profissionais</h2>
        <CsvImportButton
          templateFilename="precos_profissionais_template.csv"
          templateHeaders={['profile', 'dailyRate', 'hourlyRate', 'currency']}
          templateExample={['Consultor SAP FI Sênior', '1200', '150', 'BRL']}
          onImport={importProfessionalPricesCsv}
          label="Importar Profissional CSV"
        />
      </div>
      <div className="card" style={{ padding: 0, marginBottom: "28px" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Perfil</th>
                <th>Diária (R$)</th>
                <th>Hora (R$)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {professional.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.profile}</td>
                  <td style={{ color: "#34d399", fontWeight: 600 }}>{formatCurrency(p.dailyRate)}</td>
                  <td style={{ color: "#60a5fa" }}>{formatCurrency(p.hourlyRate)}</td>
                  <td>
                    <span className={`badge ${p.active ? "badge-green" : "badge-gray"}`}>
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/settings/prices/professional/${p.id}/edit`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Editar
                      </Link>

                      <form
                        action={async () => {
                          "use server"
                          await deleteProfessionalPrice(p.id)
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
          {professional.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
              Nenhum preço profissional cadastrado.
            </div>
          )}
        </div>
      </div>

      {/* Development Prices */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>💻 Preços de Desenvolvimento (ABAP)</h2>
        <CsvImportButton
          templateFilename="precos_desenvolvimento_template.csv"
          templateHeaders={['type', 'complexity', 'unitPrice', 'currency', 'description']}
          templateExample={['REPORT', 'SIMPLE', '800', 'BRL', 'Preço padrão para Report simples']}
          onImport={importDevelopmentPricesCsv}
          label="Importar Desenvolvimento CSV"
        />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Complexidade</th>
                <th>Preço Unitário (R$)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {development.map((d) => (
                <tr key={d.id}>
                  <td><span className="badge badge-blue">{typeLabel[d.type] || d.type}</span></td>
                  <td>{complexityLabel[d.complexity] || d.complexity}</td>
                  <td style={{ color: "#34d399", fontWeight: 600 }}>{formatCurrency(d.unitPrice)}</td>
                  <td>
                    <span className={`badge ${d.active ? "badge-green" : "badge-gray"}`}>
                      {d.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/settings/prices/development/${d.id}/edit`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Editar
                      </Link>

                      <form
                        action={async () => {
                          "use server"
                          await deleteDevelopmentPrice(d.id)
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
          {development.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
              Nenhum preço de desenvolvimento cadastrado.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
