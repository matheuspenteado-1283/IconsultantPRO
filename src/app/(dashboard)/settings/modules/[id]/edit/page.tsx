import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { updateModule } from "../../actions"
import FormSubmitButton from "@/components/FormSubmitButton"

interface EditModulePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditModulePageProps): Promise<Metadata> {
  const { id } = await params
  const mod = await db.sapModule.findUnique({ where: { id } })
  return { title: `Editar Módulo ${mod?.code || ""}` }
}

export default async function EditModulePage({ params }: EditModulePageProps) {
  const { id } = await params
  const mod = await db.sapModule.findUnique({ where: { id } })

  if (!mod) {
    notFound()
  }

  // Create a bound action that includes the module ID
  const updateModuleWithId = updateModule.bind(null, mod.id)

  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/settings/modules" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Módulos SAP
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>⚙️ Editar Módulo SAP</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Modifique os dados do módulo {mod.code}</p>
      </div>

      <div className="card">
        <form action={updateModuleWithId as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label className="input-label" htmlFor="code">Código do Módulo</label>
            <input
              id="code"
              type="text"
              className="input"
              value={mod.code}
              disabled
              style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-text-muted)", cursor: "not-allowed" }}
            />
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              O código do módulo não pode ser alterado após a criação.
            </span>
          </div>

          <div>
            <label className="input-label" htmlFor="name">Nome do Módulo</label>
            <input
              id="name"
              name="name"
              type="text"
              className="input"
              defaultValue={mod.name}
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
              defaultValue={mod.description || ""}
              style={{ resize: "vertical", minHeight: "100px" }}
            />
          </div>

          <div>
            <label className="input-label" htmlFor="active">Status</label>
            <select id="active" name="active" className="input" defaultValue={mod.active ? "true" : "false"}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/settings/modules" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Salvar Alterações" />
          </div>
        </form>
      </div>
    </div>
  )
}
