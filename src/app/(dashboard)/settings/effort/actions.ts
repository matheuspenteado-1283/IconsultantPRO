"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { abapEffortSchema, functionalEffortSchema } from "@/lib/validations"
import { auth } from "@/auth"

// ========================
// ABAP EFFORT
// ========================

export async function createAbapEffort(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const type = formData.get("type") as any
  const complexity = formData.get("complexity") as any
  const standardHours = parseFloat(formData.get("standardHours") as string)
  const description = formData.get("description") as string

  const result = abapEffortSchema.safeParse({
    type,
    complexity,
    standardHours,
    description: description || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    const existing = await db.abapEffort.findUnique({
      where: {
        type_complexity: {
          type: result.data.type,
          complexity: result.data.complexity,
        },
      },
    })

    if (existing) {
      return { error: "Já existe uma estimativa cadastrada para este tipo e complexidade." }
    }

    await db.abapEffort.create({
      data: {
        ...result.data,
        active: true,
      },
    })
  } catch (error) {
    console.error("Error creating ABAP effort:", error)
    return { error: "Erro ao criar esforço ABAP." }
  }

  revalidatePath("/settings/effort")
  redirect("/settings/effort")
}

export async function updateAbapEffort(id: string, formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const standardHours = parseFloat(formData.get("standardHours") as string)
  const description = formData.get("description") as string
  const active = formData.get("active") === "true"

  if (isNaN(standardHours) || standardHours <= 0) {
    return { error: "Horas padrão devem ser um número positivo." }
  }

  try {
    await db.abapEffort.update({
      where: { id },
      data: {
        standardHours,
        description: description || null,
        active,
      },
    })
  } catch (error) {
    console.error("Error updating ABAP effort:", error)
    return { error: "Erro ao atualizar esforço ABAP." }
  }

  revalidatePath("/settings/effort")
  redirect("/settings/effort")
}

export async function deleteAbapEffort(id: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Não autorizado.")
  }

  try {
    await db.abapEffort.delete({
      where: { id },
    })
    revalidatePath("/settings/effort")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar esforço ABAP." }
  }
}

// ========================
// FUNCTIONAL EFFORT
// ========================

export async function createFunctionalEffort(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const moduleId = formData.get("moduleId") as string
  const activityType = formData.get("activityType") as string
  const complexity = formData.get("complexity") as any
  const standardHours = parseFloat(formData.get("standardHours") as string)
  const description = formData.get("description") as string

  const result = functionalEffortSchema.safeParse({
    moduleId,
    activityType,
    complexity,
    standardHours,
    description: description || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await db.functionalEffort.create({
      data: {
        ...result.data,
        active: true,
      },
    })
  } catch (error) {
    console.error("Error creating functional effort:", error)
    return { error: "Erro ao criar esforço funcional." }
  }

  revalidatePath("/settings/effort")
  redirect("/settings/effort")
}

export async function updateFunctionalEffort(id: string, formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const activityType = formData.get("activityType") as string
  const standardHours = parseFloat(formData.get("standardHours") as string)
  const description = formData.get("description") as string
  const active = formData.get("active") === "true"

  if (!activityType || activityType.trim().length < 1) {
    return { error: "Tipo de atividade é obrigatório." }
  }
  if (isNaN(standardHours) || standardHours <= 0) {
    return { error: "Horas padrão devem ser positivas." }
  }

  try {
    await db.functionalEffort.update({
      where: { id },
      data: {
        activityType,
        standardHours,
        description: description || null,
        active,
      },
    })
  } catch (error) {
    console.error("Error updating functional effort:", error)
    return { error: "Erro ao atualizar esforço funcional." }
  }

  revalidatePath("/settings/effort")
  redirect("/settings/effort")
}

export async function deleteFunctionalEffort(id: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Não autorizado.")
  }

  try {
    await db.functionalEffort.delete({
      where: { id },
    })
    revalidatePath("/settings/effort")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar esforço funcional." }
  }
}
