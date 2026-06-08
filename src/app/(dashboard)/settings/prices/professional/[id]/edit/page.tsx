import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { updateProfessionalPrice } from "@/app/(dashboard)/settings/prices/actions"
import FormSubmitButton from "@/components/FormSubmitButton"

interface EditProfPricePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditProfPricePageProps): Promise<Metadata> {
  const { id } = await params
  const price = await db.professionalPrice.findUnique({ where: { id } })
  return { title: `Editar Preço ${price?.profile || ""}` }
}

export default async function EditProfessionalPricePage({ params }: EditProfPricePageProps) {
  const { id } = await params
  const price = await db.professionalPrice.findUnique({ where: { id } })

  if (!price) {
    notFound()
  }

  const updateProfPriceWithId = updateProfessionalPrice.bind(null, price.id)

  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/settings/prices" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Preços
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>👨‍💼 Editar Preço Profissional</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Modifique os valores do perfil {price.profile}</p>
      </div>

      <div className="card">
        <form action={updateProfPriceWithId as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label className="input-label" htmlFor="profile">Perfil / Cargo *</label>
            <input
              id="profile"
              name="profile"
              type="text"
              className="input"
              defaultValue={price.profile}
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
                defaultValue={price.dailyRate}
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
                defaultValue={price.hourlyRate}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="currency">Moeda</label>
              <select id="currency" name="currency" className="input" defaultValue={price.currency}>
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="input-label" htmlFor="active">Status</label>
              <select id="active" name="active" className="input" defaultValue={price.active ? "true" : "false"}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
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
