import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { deletePartner } from "./actions"

import { enforceModuleAccess } from "@/lib/access"

export const metadata: Metadata = { title: "Parceiros e Clientes" }

export default async function PartnersPage() {
  await enforceModuleAccess("settings_partners")

  const session = await auth()
  const orgId = (session?.user as any)?.organizationId

  const partners = orgId
    ? await db.partner.findMany({
        where: { organizationId: orgId },
        orderBy: { name: "asc" },
      })
    : []

  const typeLabels: Record<string, string> = {
    CLIENT: "Cliente",
    SUPPLIER: "Fornecedor",
    BUSINESS_PARTNER: "Parceiro",
    PROSPECT: "Prospect",
  }

  const typeBadges: Record<string, string> = {
    CLIENT: "badge-green",
    SUPPLIER: "badge-blue",
    BUSINESS_PARTNER: "badge-purple",
    PROSPECT: "badge-yellow",
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>🤝 Parceiros e Clientes</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Gerencie os seus clientes, fornecedores e parceiros de negócios</p>
        </div>
        <Link href="/settings/partners/new" className="btn-primary">+ Novo Parceiro</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Contato</th>
                <th>E-mail / Telefone</th>
                <th>Segmento</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id}>
                  <td style={{ fontWeight: 600 }}>
                    {partner.name}
                    {partner.cnpj && (
                      <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 400, marginTop: "2px" }}>
                        CNPJ: {partner.cnpj}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${typeBadges[partner.partnerType] || "badge-gray"}`}>
                      {typeLabels[partner.partnerType] || partner.partnerType}
                    </span>
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {partner.contactPerson || "—"}
                  </td>
                  <td>
                    {partner.email && (
                      <span style={{ display: "block", fontSize: "13px" }}>{partner.email}</span>
                    )}
                    {partner.phone && (
                      <span style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {partner.phone}
                      </span>
                    )}
                    {!partner.email && !partner.phone && "—"}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {partner.segment || "—"}
                  </td>
                  <td>
                    <span className={`badge ${partner.active ? "badge-green" : "badge-gray"}`}>
                      {partner.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/settings/partners/${partner.id}/edit`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Editar
                      </Link>

                      <form
                        action={async () => {
                          "use server"
                          await deletePartner(partner.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="btn-ghost"
                          style={{
                            fontSize: "13px",
                            padding: "4px 8px",
                            color: "#f87171",
                          }}
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
          {partners.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--color-text-secondary)" }}>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>🤝</div>
              <h3 style={{ fontSize: "16px", marginBottom: "6px" }}>Nenhum parceiro cadastrado</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "13px", marginBottom: "20px" }}>
                Cadastre seu primeiro parceiro de negócios, fornecedor ou cliente.
              </p>
              <Link href="/settings/partners/new" className="btn-primary">Criar Primeiro Parceiro</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
