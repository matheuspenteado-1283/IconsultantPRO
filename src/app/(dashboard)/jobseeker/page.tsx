import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { searchJobsAI } from "./actions"
import JobSeekerDashboard from "./components/JobSeekerDashboard"

import { enforceModuleAccess } from "@/lib/access"

export const metadata: Metadata = { title: "JobSeeker IA — SAP" }

export default async function JobSeekerPage() {
  await enforceModuleAccess("jobseeker")

  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const orgId = (session.user as any).organizationId
  if (!orgId) {
    redirect("/dashboard")
  }

  // Fetch initial recommended jobs list
  const initialJobs = await searchJobsAI("", [])

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>🔍 JobSeeker IA</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Agente de IA para busca conversacional de vagas e projetos SAP — otimizado para o perfil de Matheus Penteado
        </p>
      </div>

      <JobSeekerDashboard initialJobs={initialJobs} />
    </div>
  )
}
