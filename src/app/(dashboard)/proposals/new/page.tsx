import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import NewProposalForm from "./NewProposalForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nova Proposta Comercial",
}

export default async function NewProposalPage() {
  const session = await auth()
  const user = session?.user as any
  if (!user || !user.organizationId) {
    redirect("/login")
  }

  // 1. Fetch active projects in organization
  const rawProjects = await db.project.findMany({
    where: { organizationId: user.organizationId },
    include: {
      client: true,
      backlogItems: {
        include: {
          effortEstimates: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // 2. Fetch prices
  const developmentPrices = await db.developmentPrice.findMany({
    where: { active: true },
  })
  const professionalPrices = await db.professionalPrice.findMany({
    where: { active: true },
  })

  const defaultDevPrice = developmentPrices.find((p) => p.complexity === "MEDIUM")?.unitPrice || 1200
  const defaultProfRate = professionalPrices[0]?.hourlyRate || 150

  const getEstimateCost = (est: { estimateType: string; complexity: string | null; hours: number }) => {
    if (est.estimateType === "ABAP") {
      const match = developmentPrices.find((p) => p.complexity === (est.complexity || "MEDIUM"))
      return match ? match.unitPrice : est.hours * defaultProfRate
    } else {
      const match = professionalPrices[0]
      const rate = match ? match.hourlyRate : defaultProfRate
      return est.hours * rate
    }
  }

  // 3. Pre-calculate values for the projects
  const projects = rawProjects.map((proj) => {
    let baseHours = 0
    let baseCost = 0

    proj.backlogItems.forEach((item) => {
      item.effortEstimates.forEach((est) => {
        baseHours += est.hours
        baseCost += getEstimateCost({
          estimateType: est.estimateType,
          complexity: est.complexity,
          hours: est.hours,
        })
      })
    })

    return {
      id: proj.id,
      name: proj.name,
      clientName: proj.client?.name || "",
      baseHours,
      baseCost,
    }
  })

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>📄 Nova Proposta Comercial</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Importe estimativas de backlog e configure ajustes de forma interativa.
        </p>
      </div>

      <NewProposalForm projects={projects} />
    </div>
  )
}
