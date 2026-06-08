import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { updatePartner } from "../../actions"
import FormSubmitButton from "@/components/FormSubmitButton"

interface EditPartnerPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditPartnerPageProps): Promise<Metadata> {
  const { id } = await params
  const partner = await db.partner.findUnique({ where: { id } })
  return { title: `Editar ${partner?.name || "Parceiro"}` }
}

export default async function EditPartnerPage({ params }: EditPartnerPageProps) {
  const { id } = await params
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId

  if (!orgId) {
    redirect("/login")
  }

  const partner = await db.partner.findFirst({
    where: { id, organizationId: orgId },
  })

  if (!partner) {
    notFound()
  }

  // Bind the action to pass partner.id automatically
  const updatePartnerWithId = updatePartner.bind(null, partner.id)

  return (
    <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/settings/partners" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Parceiros
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>🤝 Editar Parceiro</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Modifique os dados de cadastro para {partner.name}</p>
      </div>

      <div className="card">
        <form action={updatePartnerWithId as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="name">Razão Social / Nome Fantasia *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                defaultValue={partner.name}
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="partnerType">Tipo de Parceiro *</label>
              <select id="partnerType" name="partnerType" className="input" defaultValue={partner.partnerType} required>
                <option value="CLIENT">Cliente</option>
                <option value="SUPPLIER">Fornecedor</option>
                <option value="BUSINESS_PARTNER">Parceiro de Negócios</option>
                <option value="PROSPECT">Prospect / Lead</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="cnpj">CNPJ (opcional)</label>
              <input
                id="cnpj"
                name="cnpj"
                type="text"
                className="input"
                defaultValue={partner.cnpj || ""}
                placeholder="Ex: 00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="input-label" htmlFor="segment">Segmento de Mercado (opcional)</label>
              <input
                id="segment"
                name="segment"
                type="text"
                className="input"
                defaultValue={partner.segment || ""}
                placeholder="Ex: Varejo, Indústria, Energia"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="contactPerson">Pessoa de Contato (opcional)</label>
              <input
                id="contactPerson"
                name="contactPerson"
                type="text"
                className="input"
                defaultValue={partner.contactPerson || ""}
                placeholder="Ex: João da Silva"
              />
            </div>
            <div>
              <label className="input-label" htmlFor="email">E-mail de Contato (opcional)</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                defaultValue={partner.email || ""}
                placeholder="Ex: contato@empresa.com"
              />
            </div>
          </div>

          {/* Row 4 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="phone">Telefone (opcional)</label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="input"
                defaultValue={partner.phone || ""}
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
            <div>
              <label className="input-label" htmlFor="address">Endereço Comercial (opcional)</label>
              <input
                id="address"
                name="address"
                type="text"
                className="input"
                defaultValue={partner.address || ""}
                placeholder="Ex: Av. Paulista, 1000 - São Paulo/SP"
              />
            </div>
          </div>

          {/* Row 5 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="active">Status</label>
              <select id="active" name="active" className="input" defaultValue={partner.active ? "true" : "false"}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          {/* Row 6 */}
          <div>
            <label className="input-label" htmlFor="notes">Observações Adicionais</label>
            <textarea
              id="notes"
              name="notes"
              className="input"
              rows={4}
              defaultValue={partner.notes || ""}
              placeholder="Notas sobre o parceiro, acordos comerciais, etc."
              style={{ resize: "vertical", minHeight: "100px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/settings/partners" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Salvar Alterações" />
          </div>
        </form>
      </div>
    </div>
  )
}
