import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { deleteProject } from "./actions"
import { enforceModuleAccess } from "@/lib/access"

export const metadata: Metadata = { title: "Projetos" }

export default async function ProjectsPage() {
  await enforceModuleAccess("projects")
  
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId

  const projects = orgId
    ? await db.project.findMany({
        where: { organizationId: orgId },
        include: {
          client: true,
          projectModules: {
            include: { sapModule: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  const statusLabels: Record<string, string> = {
    PROSPECTING: "Prospecção",
    IN_PROGRESS: "Em Andamento",
    ON_HOLD: "Suspenso",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  }

  const statusBadges: Record<string, string> = {
    PROSPECTING: "badge-yellow",
    IN_PROGRESS: "badge-blue",
    ON_HOLD: "badge-purple",
    COMPLETED: "badge-green",
    CANCELLED: "badge-red",
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("pt-BR")
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>📁 Projetos</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Gerencie os seus projetos SAP e propostas comerciais</p>
        </div>
        <Link href="/projects/new" className="btn-primary">+ Novo Projeto</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código / Projeto</th>
                <th>Cliente</th>
                <th>Módulos SAP</th>
                <th>Status</th>
                <th>Início / Fim</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link
                      href={`/projects/${project.id}`}
                      style={{ color: "var(--color-text-primary)", textDecoration: "none" }}
                      className="hover:underline"
                    >
                      {project.code ? `[${project.code}] ` : ""}
                      {project.name}
                    </Link>
                    {project.description && (
                      <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 400, marginTop: "2px" }} className="truncate-2">
                        {project.description}
                      </span>
                    )}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
                    {project.client?.name || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {project.projectModules.map((pm) => (
                        <span key={pm.moduleId} className="badge badge-blue" style={{ fontSize: "10px" }}>
                          {pm.sapModule.code}
                        </span>
                      ))}
                      {project.projectModules.length === 0 && (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusBadges[project.status] || "badge-gray"}`}>
                      {statusLabels[project.status] || project.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "block", fontSize: "13px" }}>{formatDate(project.startDate)}</span>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                      {formatDate(project.endDate)}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link
                        href={`/projects/${project.id}`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Ver Detalhes
                      </Link>
                      <Link
                        href={`/projects/${project.id}/edit`}
                        className="btn-ghost"
                        style={{ fontSize: "13px", padding: "4px 8px" }}
                      >
                        Editar
                      </Link>

                      <form
                        action={async () => {
                          "use server"
                          await deleteProject(project.id)
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
          {projects.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--color-text-secondary)" }}>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>📁</div>
              <h3 style={{ fontSize: "16px", marginBottom: "6px" }}>Nenhum projeto ainda</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "13px", marginBottom: "20px" }}>
                Crie seu primeiro projeto SAP para começar a gerenciar participantes, ambientes e backlogs.
              </p>
              <Link href="/projects/new" className="btn-primary">Criar Primeiro Projeto</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
