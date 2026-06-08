import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import SystemsSection from "./components/SystemsSection"
import ParticipantsSection from "./components/ParticipantsSection"
import SponsorsSection from "./components/SponsorsSection"
import RequestersSection from "./components/RequestersSection"
import ApproversSection from "./components/ApproversSection"

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  return { title: project?.name || "Detalhes do Projeto" }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId

  if (!orgId) {
    redirect("/login")
  }

  const project = await db.project.findFirst({
    where: { id, organizationId: orgId },
    include: {
      client: true,
      projectModules: { include: { sapModule: true } },
      participants: true,
      systems: true,
      sponsors: true,
      requester: true,
      approvers: true,
    },
  })

  if (!project) {
    notFound()
  }

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

  const envLabels: Record<string, string> = {
    DEV: "Desenvolvimento (DEV)",
    QAS: "Qualidade (QAS)",
    PRD: "Produção (PRD)",
    SBX: "Sandbox (SBX)",
    SANDBOX: "Sandbox (SANDBOX)",
  }

  const envBadges: Record<string, string> = {
    DEV: "badge-blue",
    QAS: "badge-yellow",
    PRD: "badge-red",
    SBX: "badge-gray",
    SANDBOX: "badge-gray",
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Não definido"
    return new Date(date).toLocaleDateString("pt-BR")
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <Link href="/projects" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            ← Voltar para Projetos
          </Link>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            {project.code ? `[${project.code}] ` : ""}
            {project.name}
          </h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span className={`badge ${statusBadges[project.status]}`}>
              {statusLabels[project.status]}
            </span>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
              🏢 Cliente: <strong style={{ color: "var(--color-text-primary)" }}>{project.client?.name || "Nenhum"}</strong>
            </span>
            <span style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
              📅 Prazo: <strong style={{ color: "var(--color-text-primary)" }}>{formatDate(project.startDate)}</strong> até <strong style={{ color: "var(--color-text-primary)" }}>{formatDate(project.endDate)}</strong>
            </span>
          </div>
        </div>
        <Link href={`/projects/${project.id}/edit`} className="btn-primary">
          📝 Editar Projeto
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
        {/* ==========================================
            LEFT COLUMN: Details, Scope, Modules, Environments
            ========================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Details & Scope */}
          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>📄 Escopo e Detalhes</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Descrição</span>
                <p style={{ fontSize: "14px", marginTop: "4px", color: "var(--color-text-primary)" }}>{project.description || "Nenhuma descrição fornecida."}</p>
              </div>
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Escopo Detalhado</span>
                <p style={{ fontSize: "14px", marginTop: "4px", color: "var(--color-text-secondary)", whiteSpace: "pre-line" }}>{project.scope || "Nenhum detalhe de escopo registrado."}</p>
              </div>
            </div>
          </div>

          {/* SAP Modules */}
          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>⚙️ Módulos SAP Envolvidos</h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {project.projectModules.map((pm) => (
                <div key={pm.moduleId} style={{ background: "rgba(30, 64, 175, 0.1)", border: "1px solid rgba(30, 64, 175, 0.25)", padding: "8px 14px", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 800, color: "#60a5fa", fontSize: "14px" }}>{pm.sapModule.code}</span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{pm.sapModule.name}</span>
                </div>
              ))}
              {project.projectModules.length === 0 && (
                <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>Nenhum módulo SAP vinculado. Edite o projeto para vincular módulos.</p>
              )}
            </div>
          </div>

          {/* Systems / Environments */}
          <SystemsSection systems={project.systems} projectId={project.id} />
        </div>

        {/* ==========================================
            RIGHT COLUMN: Participants, Sponsors, Requesters, Approvers
            ========================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Participants */}
          <ParticipantsSection participants={project.participants} projectId={project.id} />

          {/* Stakeholders (Sponsors & Requisitantes) */}
          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>🤝 Sponsors e Requisitantes</h2>
            <SponsorsSection sponsors={project.sponsors} projectId={project.id} />
            <RequestersSection requesters={project.requester} projectId={project.id} />
          </div>

          {/* Approvers */}
          <ApproversSection approvers={project.approvers as any} projectId={project.id} />
        </div>
      </div>
    </div>
  )
}
