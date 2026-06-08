"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { backlogItemSchema, implementationFormSchema, improvementFormSchema } from "@/lib/validations"
import { BacklogType, Priority, BacklogCategory, BacklogStatus } from "@prisma/client"

export async function createBacklogItem(formData: FormData) {
  const session = await auth()
  if (!session) {
    return { error: "Não autorizado." }
  }

  const projectId = formData.get("projectId") as string
  const description = formData.get("description") as string
  const responsibleId = formData.get("responsibleId") as string
  const type = formData.get("type") as BacklogType
  const priority = (formData.get("priority") || "MEDIUM") as Priority
  const category = formData.get("category") as BacklogCategory
  const moduleId = formData.get("moduleId") as string

  // Core validation
  const coreParsed = backlogItemSchema.safeParse({
    projectId,
    description,
    responsibleId: responsibleId || undefined,
    type,
    priority,
    category,
    moduleId: moduleId || undefined,
  })

  if (!coreParsed.success) {
    return { error: coreParsed.error.issues[0].message }
  }

  // Category specific validation and extractions
  let implementationData: any = null
  let improvementData: any = null

  if (category === "IMPLEMENTATION") {
    const phase = formData.get("phase") as string
    const technicalObject = formData.get("technicalObject") as string
    const estimatedHoursStr = formData.get("estimatedHours") as string
    const acceptanceCriteria = formData.get("acceptanceCriteria") as string
    const risks = formData.get("risks") as string
    const notes = formData.get("notes") as string

    const estimatedHours = estimatedHoursStr ? parseFloat(estimatedHoursStr) : undefined

    const parsedSub = implementationFormSchema.safeParse({
      phase,
      technicalObject,
      estimatedHours,
      acceptanceCriteria,
      risks,
      notes,
    })

    if (!parsedSub.success) {
      return { error: parsedSub.error.issues[0].message }
    }

    implementationData = {
      phase: phase || null,
      technicalObject: technicalObject || null,
      estimatedHours: estimatedHours || null,
      acceptanceCriteria: acceptanceCriteria || null,
      risks: risks || null,
      notes: notes || null,
    }
  } else if (category === "IMPROVEMENT") {
    const currentSituation = formData.get("currentSituation") as string
    const desiredSituation = formData.get("desiredSituation") as string
    const businessJustification = formData.get("businessJustification") as string
    const operationalImpact = formData.get("operationalImpact") as string
    const expectedBenefits = formData.get("expectedBenefits") as string
    const notes = formData.get("notes") as string

    const parsedSub = improvementFormSchema.safeParse({
      currentSituation,
      desiredSituation,
      businessJustification,
      operationalImpact,
      expectedBenefits,
      notes,
    })

    if (!parsedSub.success) {
      return { error: parsedSub.error.issues[0].message }
    }

    improvementData = {
      currentSituation: currentSituation || null,
      desiredSituation: desiredSituation || null,
      businessJustification: businessJustification || null,
      operationalImpact: operationalImpact || null,
      expectedBenefits: expectedBenefits || null,
      notes: notes || null,
    }
  }

  try {
    // Generate sequential backlog code BKL-XXX by counting project items
    const count = await db.backlogItem.count({ where: { projectId } })
    const nextCode = `BKL-${(count + 1).toString().padStart(3, "0")}`

    await db.$transaction(async (tx) => {
      const item = await tx.backlogItem.create({
        data: {
          projectId,
          backlogCode: nextCode,
          description,
          responsibleId: responsibleId || null,
          type,
          priority,
          category,
          moduleId: moduleId || null,
          status: "OPEN" as BacklogStatus,
        },
      })

      if (category === "IMPLEMENTATION" && implementationData) {
        await tx.implementation.create({
          data: {
            backlogItemId: item.id,
            ...implementationData,
          },
        })
      } else if (category === "IMPROVEMENT" && improvementData) {
        await tx.improvement.create({
          data: {
            backlogItemId: item.id,
            ...improvementData,
          },
        })
      }
    })
  } catch (err) {
    console.error("Error creating backlog item:", err)
    return { error: "Erro ao criar item de backlog." }
  }

  revalidatePath("/backlog")
  redirect("/backlog")
}

export async function updateBacklogItem(id: string, formData: FormData) {
  const session = await auth()
  if (!session) {
    return { error: "Não autorizado." }
  }

  const projectId = formData.get("projectId") as string
  const description = formData.get("description") as string
  const responsibleId = formData.get("responsibleId") as string
  const type = formData.get("type") as BacklogType
  const priority = formData.get("priority") as Priority
  const category = formData.get("category") as BacklogCategory
  const moduleId = formData.get("moduleId") as string
  const status = (formData.get("status") || "OPEN") as BacklogStatus

  // Core validation
  const coreParsed = backlogItemSchema.safeParse({
    projectId,
    description,
    responsibleId: responsibleId || undefined,
    type,
    priority,
    category,
    moduleId: moduleId || undefined,
  })

  if (!coreParsed.success) {
    return { error: coreParsed.error.issues[0].message }
  }

  // Category specific sub-forms
  let implementationData: any = null
  let improvementData: any = null

  if (category === "IMPLEMENTATION") {
    const phase = formData.get("phase") as string
    const technicalObject = formData.get("technicalObject") as string
    const estimatedHoursStr = formData.get("estimatedHours") as string
    const acceptanceCriteria = formData.get("acceptanceCriteria") as string
    const risks = formData.get("risks") as string
    const notes = formData.get("notes") as string

    const estimatedHours = estimatedHoursStr ? parseFloat(estimatedHoursStr) : undefined

    const parsedSub = implementationFormSchema.safeParse({
      phase,
      technicalObject,
      estimatedHours,
      acceptanceCriteria,
      risks,
      notes,
    })

    if (!parsedSub.success) {
      return { error: parsedSub.error.issues[0].message }
    }

    implementationData = {
      phase: phase || null,
      technicalObject: technicalObject || null,
      estimatedHours: estimatedHours || null,
      acceptanceCriteria: acceptanceCriteria || null,
      risks: risks || null,
      notes: notes || null,
    }
  } else if (category === "IMPROVEMENT") {
    const currentSituation = formData.get("currentSituation") as string
    const desiredSituation = formData.get("desiredSituation") as string
    const businessJustification = formData.get("businessJustification") as string
    const operationalImpact = formData.get("operationalImpact") as string
    const expectedBenefits = formData.get("expectedBenefits") as string
    const notes = formData.get("notes") as string

    const parsedSub = improvementFormSchema.safeParse({
      currentSituation,
      desiredSituation,
      businessJustification,
      operationalImpact,
      expectedBenefits,
      notes,
    })

    if (!parsedSub.success) {
      return { error: parsedSub.error.issues[0].message }
    }

    improvementData = {
      currentSituation: currentSituation || null,
      desiredSituation: desiredSituation || null,
      businessJustification: businessJustification || null,
      operationalImpact: operationalImpact || null,
      expectedBenefits: expectedBenefits || null,
      notes: notes || null,
    }
  }

  try {
    await db.$transaction(async (tx) => {
      // Update core item
      await tx.backlogItem.update({
        where: { id },
        data: {
          projectId,
          description,
          responsibleId: responsibleId || null,
          type,
          priority,
          category,
          moduleId: moduleId || null,
          status,
        },
      })

      if (category === "IMPLEMENTATION" && implementationData) {
        // Upsert Implementation
        await tx.implementation.upsert({
          where: { backlogItemId: id },
          update: implementationData,
          create: {
            backlogItemId: id,
            ...implementationData,
          },
        })
        // Delete potential Improvement to keep DB consistent
        await tx.improvement.deleteMany({ where: { backlogItemId: id } })
      } else if (category === "IMPROVEMENT" && improvementData) {
        // Upsert Improvement
        await tx.improvement.upsert({
          where: { backlogItemId: id },
          update: improvementData,
          create: {
            backlogItemId: id,
            ...improvementData,
          },
        })
        // Delete potential Implementation to keep DB consistent
        await tx.implementation.deleteMany({ where: { backlogItemId: id } })
      }
    })
  } catch (err) {
    console.error("Error updating backlog item:", err)
    return { error: "Erro ao atualizar item de backlog." }
  }

  revalidatePath("/backlog")
  redirect("/backlog")
}

export async function deleteBacklogItem(id: string) {
  const session = await auth()
  if (!session) {
    return { error: "Não autorizado." }
  }

  try {
    await db.backlogItem.delete({
      where: { id },
    })
  } catch (err) {
    console.error("Error deleting backlog item:", err)
    return { error: "Erro ao excluir item de backlog." }
  }

  revalidatePath("/backlog")
  return { success: true }
}
