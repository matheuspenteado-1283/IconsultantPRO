import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { updateDevelopmentPrice } from "@/app/(dashboard)/settings/prices/actions"
import FormSubmitButton from "@/components/FormSubmitButton"

interface EditDevPricePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditDevPricePageProps): Promise<Metadata> {
  const { id } = await params
  const price = await db.developmentPrice.findUnique({ where: { id } })
  return { title: `Editar Preço ${price?.type || ""}` }
}

export default async function EditDevelopmentPricePage({ params }: EditDevPricePageProps) {
  const { id } = await params
  const price = await db.developmentPrice.findUnique({ where: { id } })

  if (!price) {
    notFound()
  }

  const updateDevPriceWithId = updateDevelopmentPrice.bind(null, price.id)

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
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>💻 Editar Preço Desenvolvimento</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Modifique as configurações de preço para {typeLabels[price.type]} ({complexityLabels[price.complexity]})</p>
      </div>

      <div className="card">
        <form action={updateDevPriceWithId as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="type">Tipo de Objeto ABAP</label>
              <input
                id="type"
                type="text"
                className="input"
                value={typeLabels[price.type] || price.type}
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
                value={complexityLabels[price.complexity] || price.complexity}
                disabled
                style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-text-muted)", cursor: "not-allowed" }}
              />
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
                defaultValue={price.unitPrice}
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="currency">Moeda</label>
              <select id="currency" name="currency" className="input" defaultValue={price.currency}>
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
              defaultValue={price.description || ""}
              placeholder="Ex: Relatório simples ALV, Formulário Smartform"
            />
          </div>

          <div>
            <label className="input-label" htmlFor="active">Status</label>
            <select id="active" name="active" className="input" defaultValue={price.active ? "true" : "false"}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/settings/prices" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Salvar Alterações" />
          </div>
        </form>
      </div>
    </div>
  )
}
