import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import BacklogForm from "./BacklogForm"

export const metadata: Metadata = { title: "Novo Item de Backlog" }

export default async function NewBacklogPage() {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const orgId = (session.user as any).organizationId
  if (!orgId) {
    redirect("/dashboard")
  }

  // Fetch active projects for this organization
  const projects = await db.project.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  })

  // Fetch users in the same organization
  const users = await db.user.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  })

  // Fetch all active SAP Modules
  const sapModules = await db.sapModule.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
  })

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>📋 Novo Item de Backlog</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Adicione um novo requisito, configuração ou objeto ao backlog do projeto
        </p>
      </div>

      <BacklogForm
        projects={projects}
        users={users}
        sapModules={sapModules}
      />
    </div>
  )
}
