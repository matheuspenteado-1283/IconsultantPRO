"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { ProposalStatus, Complexity } from "@prisma/client"
import { proposalSchema } from "@/lib/validations"

export async function createProposal(formData: FormData) {
  const session = await auth()
  const user = session?.user as any
  if (!user || !user.id || !user.organizationId) {
    return { error: "Não autorizado." }
  }

  const projectId = formData.get("projectId") as string
  const title = formData.get("title") as string
  const contingencyStr = formData.get("contingency") as string
  const discountStr = formData.get("discount") as string
  const validUntilStr = formData.get("validUntil") as string
  const notes = formData.get("notes") as string

  // Validate fields with Zod
  const validation = proposalSchema.safeParse({
    projectId,
    title,
    contingency: parseFloat(contingencyStr || "0"),
    discount: parseFloat(discountStr || "0"),
    validUntil: validUntilStr || undefined,
    notes: notes || undefined,
  })

  if (!validation.success) {
    const errorMsg = validation.error.issues.map((i) => i.message).join(", ")
    return { error: errorMsg }
  }

  const data = validation.data
  const contingency = data.contingency
  const discount = data.discount
  const validUntil = data.validUntil ? new Date(data.validUntil) : null

  try {
    // 1. Fetch project backlog items and estimates
    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: user.organizationId },
      include: {
        backlogItems: {
          include: {
            effortEstimates: true,
          },
        },
      },
    })

    if (!project) {
      return { error: "Projeto não encontrado ou inválido." }
    }

    // 2. Fetch prices to calculate accurate totals
    const developmentPrices = await db.developmentPrice.findMany({
      where: { active: true },
    })
    const professionalPrices = await db.professionalPrice.findMany({
      where: { active: true },
    })

    const defaultDevPrice = developmentPrices.find((p) => p.complexity === "MEDIUM")?.unitPrice || 1200
    const defaultProfRate = professionalPrices[0]?.hourlyRate || 150

    // Helper to calculate cost for a single estimate
    const getEstimateCost = (est: { estimateType: string; complexity: Complexity | null; hours: number }) => {
      if (est.estimateType === "ABAP") {
        const match = developmentPrices.find((p) => p.complexity === (est.complexity || "MEDIUM"))
        return match ? match.unitPrice : est.hours * defaultProfRate
      } else {
        const match = professionalPrices[0] // Default profile selection or fallback
        const rate = match ? match.hourlyRate : defaultProfRate
        return est.hours * rate
      }
    }

    let totalEffort = 0
    let totalPriceBase = 0

    // Prepare proposal items data array
    const proposalItemsData: Array<{
      backlogItemId: string
      description: string
      effortHours: number
      unitPrice: number
      totalPrice: number
      notes: string | null
    }> = []

    for (const item of project.backlogItems) {
      const itemHours = item.effortEstimates.reduce((sum, e) => sum + e.hours, 0)
      const itemCost = item.effortEstimates.reduce((sum, e) => sum + getEstimateCost(e), 0)

      totalEffort += itemHours
      totalPriceBase += itemCost

      proposalItemsData.push({
        backlogItemId: item.id,
        description: item.description,
        effortHours: itemHours,
        unitPrice: itemHours > 0 ? itemCost / itemHours : 0,
        totalPrice: itemCost,
        notes: item.effortEstimates.map(e => e.notes).filter(Boolean).join("; ") || null,
      })
    }

    const totalPriceAdjusted = totalPriceBase * (1 + contingency / 100)
    const finalPrice = totalPriceAdjusted * (1 - discount / 100)

    // 3. Create proposal and its items in a transaction
    const proposal = await db.$transaction(async (tx) => {
      const prop = await tx.proposal.create({
        data: {
          projectId,
          createdById: user.id,
          title: data.title,
          totalEffort,
          totalPrice: totalPriceBase,
          contingency,
          discount,
          finalPrice,
          status: "DRAFT",
          notes: data.notes || null,
          validUntil,
        },
      })

      // Add proposal items
      await tx.proposalItem.createMany({
        data: proposalItemsData.map((item) => ({
          proposalId: prop.id,
          backlogItemId: item.backlogItemId,
          description: item.description,
          effortHours: item.effortHours,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes,
        })),
      })

      // Update the generated PDF URL to point to the local API endpoint
      const updatedProp = await tx.proposal.update({
        where: { id: prop.id },
        data: {
          generatedPdfUrl: `/api/proposals/${prop.id}/pdf`,
        },
      })

      return updatedProp
    })

    revalidatePath("/proposals")
    revalidatePath("/dashboard")
    return { success: true, proposalId: proposal.id }

  } catch (err) {
    console.error("Error creating proposal:", err)
    return { error: "Erro interno do servidor ao gerar proposta comercial." }
  }
}

export async function deleteProposal(id: string) {
  const session = await auth()
  const user = session?.user as any
  if (!user || !user.organizationId) {
    return { error: "Não autorizado." }
  }

  try {
    // Cascade delete of items is handled at Prisma schema level with onDelete: Cascade
    await db.proposal.delete({
      where: {
        id,
        project: { organizationId: user.organizationId }
      },
    })
  } catch (err) {
    console.error("Error deleting proposal:", err)
    return { error: "Erro ao excluir proposta comercial." }
  }

  revalidatePath("/proposals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateProposalStatus(id: string, status: ProposalStatus) {
  const session = await auth()
  const user = session?.user as any
  if (!user || !user.organizationId) {
    return { error: "Não autorizado." }
  }

  try {
    await db.proposal.update({
      where: {
        id,
        project: { organizationId: user.organizationId }
      },
      data: { status },
    })
  } catch (err) {
    console.error("Error updating proposal status:", err)
    return { error: "Erro ao atualizar status da proposta." }
  }

  revalidatePath("/proposals")
  revalidatePath("/dashboard")
  return { success: true }
}
