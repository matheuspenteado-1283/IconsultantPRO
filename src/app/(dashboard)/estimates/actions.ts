"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { EstimateType, Complexity } from "@prisma/client"

export async function createEffortEstimate(formData: FormData) {
  const session = await auth()
  if (!session) {
    return { error: "Não autorizado." }
  }

  const backlogItemId = formData.get("backlogItemId") as string
  const estimateType = formData.get("estimateType") as EstimateType
  const complexityStr = formData.get("complexity") as string
  const hoursStr = formData.get("hours") as string
  const notes = formData.get("notes") as string

  if (!backlogItemId) {
    return { error: "Item de backlog é obrigatório." }
  }

  if (!estimateType) {
    return { error: "Tipo de estimativa é obrigatório." }
  }

  const hours = parseFloat(hoursStr)
  if (isNaN(hours) || hours <= 0) {
    return { error: "Horas devem ser um valor numérico positivo." }
  }

  const complexity = complexityStr ? (complexityStr as Complexity) : null

  try {
    await db.effortEstimate.create({
      data: {
        backlogItemId,
        estimateType,
        complexity,
        hours,
        notes: notes || null,
      },
    })
  } catch (err) {
    console.error("Error creating effort estimate:", err)
    return { error: "Erro ao salvar estimativa de esforço." }
  }

  revalidatePath("/estimates")
  revalidatePath("/estimates/effort")
  revalidatePath("/estimates/financial")
  revalidatePath("/backlog")
  return { success: true }
}

export async function deleteEffortEstimate(id: string) {
  const session = await auth()
  if (!session) {
    return { error: "Não autorizado." }
  }

  try {
    await db.effortEstimate.delete({
      where: { id },
    })
  } catch (err) {
    console.error("Error deleting effort estimate:", err)
    return { error: "Erro ao excluir estimativa." }
  }

  revalidatePath("/estimates")
  revalidatePath("/estimates/effort")
  revalidatePath("/estimates/financial")
  revalidatePath("/backlog")
  return { success: true }
}
