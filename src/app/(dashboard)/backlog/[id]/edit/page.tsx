import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import BacklogForm from "../../new/BacklogForm"

export const metadata: Metadata = { title: "Editar Item de Backlog" }

interface EditBacklogPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBacklogPage({ params }: EditBacklogPageProps) {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const orgId = (session.user as any).organizationId
  if (!orgId) {
    redirect("/dashboard")
  }

  // Fetch the backlog item with sub-relations
  const backlogItem = await db.backlogItem.findUnique({
    where: { id },
    include: {
      implementation: true,
      improvement: true,
      project: true,
    },
  })

  if (!backlogItem || backlogItem.project.organizationId !== orgId) {
    notFound()
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
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>📋 Editar Item {backlogItem.backlogCode}</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Modifique as informações do item de backlog
        </p>
      </div>

      <BacklogForm
        projects={projects}
        users={users}
        sapModules={sapModules}
        initialData={backlogItem}
      />
    </div>
  )
}
