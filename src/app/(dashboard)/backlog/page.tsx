import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { deleteBacklogItem } from "./actions"

import { enforceModuleAccess } from "@/lib/access"

export const metadata: Metadata = { title: "Backlog de Itens" }

interface BacklogPageProps {
  searchParams: Promise<{
    projectId?: string
    status?: string
    category?: string
  }>
}

export default async function BacklogPage({ searchParams }: BacklogPageProps) {
  await enforceModuleAccess("backlog")

  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const orgId = (session.user as any).organizationId
  if (!orgId) {
    redirect("/dashboard")
  }

  // Resolve search parameters
  const { projectId, status, category } = await searchParams

  // Fetch projects for filter dropdown
  const projects = await db.project.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  })

  // Build prisma query where clause
  const whereClause: any = {
    project: {
      organizationId: orgId,
    },
  }

  if (projectId) {
    whereClause.projectId = projectId
  }
  if (status) {
    whereClause.status = status
  }
  if (category) {
    whereClause.category = category
  }

  // Fetch filtered backlog items
  const backlogItems = await db.backlogItem.findMany({
    where: whereClause,
    include: {
      project: true,
      responsible: true,
      sapModule: true,
    },
    orderBy: [
      { project: { name: "asc" } },
      { backlogCode: "asc" },
    ],
  })

  // Maps and labels
  const typeLabels: Record<string, string> = {
    CONFIGURATION: "Configuração",
    WRICEF: "WRICEF",
    CONSULTING: "Consultoria",
    TRAINING: "Treinamento",
    GUIDANCE: "Orientação",
  }

  const priorityLabels: Record<string, string> = {
    CRITICAL: "Crítica",
    HIGH: "Alta",
    MEDIUM: "Média",
    LOW: "Baixa",
  }

  const priorityBadges: Record<string, string> = {
    CRITICAL: "badge-red",
    HIGH: "badge-yellow",
    MEDIUM: "badge-blue",
    LOW: "badge-gray",
  }

  const categoryLabels: Record<string, string> = {
    IMPLEMENTATION: "Implementação",
    IMPROVEMENT: "Melhoria",
  }

  const categoryBadges: Record<string, string> = {
    IMPLEMENTATION: "badge-purple",
    IMPROVEMENT: "badge-green",
  }

  const statusLabels: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em Progresso",
    REVIEW: "Revisão",
    DONE: "Concluído",
    CANCELLED: "Cancelado",
  }

  const statusBadges: Record<string, string> = {
    OPEN: "badge-gray",
    IN_PROGRESS: "badge-blue",
    REVIEW: "badge-yellow",
    DONE: "badge-green",
    CANCELLED: "badge-red",
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>📋 Backlog do Projeto</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Gerencie e estime os requisitos de implementação e melhorias do SAP
          </p>
        </div>
        <Link href="/backlog/new" className="btn-primary">
          + Novo Item
        </Link>
      </div>

      {/* Filters form */}
      <form
        method="GET"
        action="/backlog"
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: "200px" }}>
          <label className="input-label">Projeto</label>
          <select name="projectId" className="input" defaultValue={projectId || ""}>
            <option value="">Todos os Projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: "160px" }}>
          <label className="input-label">Categoria</label>
          <select name="category" className="input" defaultValue={category || ""}>
            <option value="">Todas</option>
            <option value="IMPLEMENTATION">Implementação</option>
            <option value="IMPROVEMENT">Melhoria</option>
          </select>
        </div>

        <div style={{ minWidth: "160px" }}>
          <label className="input-label">Status</label>
          <select name="status" className="input" defaultValue={status || ""}>
            <option value="">Todos</option>
            <option value="OPEN">Aberto</option>
            <option value="IN_PROGRESS">Em Progresso</option>
            <option value="REVIEW">Em Revisão</option>
            <option value="DONE">Concluído</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button type="submit" className="btn-secondary" style={{ padding: "10px 16px" }}>
            Filtrar
          </button>
          {(projectId || status || category) && (
            <Link href="/backlog" className="btn-ghost" style={{ display: "flex", alignItems: "center" }}>
              Limpar
            </Link>
          )}
        </div>
      </form>

      {/* Backlog items list */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Projeto</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Categoria</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {backlogItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: "#60a5fa" }}>{item.backlogCode}</td>
                  <td style={{ fontWeight: 600, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.project.name}
                  </td>
                  <td
                    style={{
                      maxWidth: "280px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={item.description}
                  >
                    {item.description}
                  </td>
                  <td>{typeLabels[item.type] || item.type}</td>
                  <td>
                    <span className={`badge ${priorityBadges[item.priority] || "badge-gray"}`}>
                      {priorityLabels[item.priority] || item.priority}
                    </span>
                  </td>
                  <td style={{ color: "var(--color-text-secondary)" }}>
                    {item.responsible?.name || "Não Atribuído"}
                  </td>
                  <td>
                    <span className={`badge ${categoryBadges[item.category] || "badge-gray"}`}>
                      {categoryLabels[item.category] || item.category}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadges[item.status] || "badge-gray"}`}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/backlog/${item.id}/edit`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Editar
                      </Link>

                      <form
                        action={async () => {
                          "use server"
                          await deleteBacklogItem(item.id)
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
          {backlogItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
              <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "var(--color-text-primary)" }}>
                Nenhum item de backlog encontrado
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
                Ajuste os filtros ou crie um novo item de backlog para começar.
              </p>
              <Link href="/backlog/new" className="btn-primary">
                Adicionar Item
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
