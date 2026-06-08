import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { updateAbapEffort } from "@/app/(dashboard)/settings/effort/actions"
import FormSubmitButton from "@/components/FormSubmitButton"

interface EditAbapEffortPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditAbapEffortPageProps): Promise<Metadata> {
  const { id } = await params
  const effort = await db.abapEffort.findUnique({ where: { id } })
  return { title: `Editar Esforço ${effort?.type || ""}` }
}

export default async function EditAbapEffortPage({ params }: EditAbapEffortPageProps) {
  const { id } = await params
  const effort = await db.abapEffort.findUnique({ where: { id } })

  if (!effort) {
    notFound()
  }

  const updateAbapEffortWithId = updateAbapEffort.bind(null, effort.id)

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
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>💻 Editar Esforço ABAP</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Modifique as horas padrão para {typeLabels[effort.type]} ({complexityLabels[effort.complexity]})</p>
      </div>

      <div className="card">
        <form action={updateAbapEffortWithId as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="type">Tipo de Objeto ABAP</label>
              <input
                id="type"
                type="text"
                className="input"
                value={typeLabels[effort.type] || effort.type}
                disabled
                style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-text-muted)", cursor: "not-allowed" }}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="complexity">Complexidade</label>
              <input
                id="complexity"
                type="text"
                className="input"
                value={complexityLabels[effort.complexity] || effort.complexity}
                disabled
                style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-text-muted)", cursor: "not-allowed" }}
              />
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
              defaultValue={effort.standardHours}
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
              defaultValue={effort.description || ""}
              placeholder="Ex: Relatório ALV complexo"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="active">Status</label>
            <select id="active" name="active" className="input" defaultValue={effort.active ? "true" : "false"}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/settings/effort" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Salvar Alterações" />
          </div>
        </form>
      </div>
    </div>
  )
}
