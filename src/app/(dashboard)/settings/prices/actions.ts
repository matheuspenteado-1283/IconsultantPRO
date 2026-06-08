"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { professionalPriceSchema, developmentPriceSchema } from "@/lib/validations"
import { auth } from "@/auth"

// ========================
// PROFESSIONAL PRICES
// ========================

export async function createProfessionalPrice(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const profile = formData.get("profile") as string
  const dailyRate = parseFloat(formData.get("dailyRate") as string)
  const hourlyRate = parseFloat(formData.get("hourlyRate") as string)
  const currency = formData.get("currency") as string

  const result = professionalPriceSchema.safeParse({
    profile,
    dailyRate,
    hourlyRate,
    currency,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await db.professionalPrice.create({
      data: {
        ...result.data,
        active: true,
      },
    })
  } catch (error) {
    console.error("Error creating professional price:", error)
    return { error: "Erro ao criar preço profissional." }
  }

  revalidatePath("/settings/prices")
  redirect("/settings/prices")
}

export async function updateProfessionalPrice(id: string, formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const profile = formData.get("profile") as string
  const dailyRate = parseFloat(formData.get("dailyRate") as string)
  const hourlyRate = parseFloat(formData.get("hourlyRate") as string)
  const currency = formData.get("currency") as string
  const active = formData.get("active") === "true"

  const result = professionalPriceSchema.safeParse({
    profile,
    dailyRate,
    hourlyRate,
    currency,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await db.professionalPrice.update({
      where: { id },
      data: {
        ...result.data,
        active,
      },
    })
  } catch (error) {
    console.error("Error updating professional price:", error)
    return { error: "Erro ao atualizar preço profissional." }
  }

  revalidatePath("/settings/prices")
  redirect("/settings/prices")
}

export async function deleteProfessionalPrice(id: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Não autorizado.")
  }

  try {
    await db.professionalPrice.delete({
      where: { id },
    })
    revalidatePath("/settings/prices")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar preço profissional." }
  }
}

// ========================
// DEVELOPMENT PRICES
// ========================

export async function createDevelopmentPrice(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const type = formData.get("type") as any
  const complexity = formData.get("complexity") as any
  const unitPrice = parseFloat(formData.get("unitPrice") as string)
  const currency = formData.get("currency") as string
  const description = formData.get("description") as string

  const result = developmentPriceSchema.safeParse({
    type,
    complexity,
    unitPrice,
    currency,
    description: description || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    // Unique check
    const existing = await db.developmentPrice.findUnique({
      where: {
        type_complexity: {
          type: result.data.type,
          complexity: result.data.complexity,
        },
      },
    })

    if (existing) {
      return { error: "Já existe um preço de desenvolvimento cadastrado para este tipo e complexidade." }
    }

    await db.developmentPrice.create({
      data: {
        ...result.data,
        active: true,
      },
    })
  } catch (error) {
    console.error("Error creating dev price:", error)
    return { error: "Erro ao criar preço de desenvolvimento." }
  }

  revalidatePath("/settings/prices")
  redirect("/settings/prices")
}

export async function updateDevelopmentPrice(id: string, formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const unitPrice = parseFloat(formData.get("unitPrice") as string)
  const currency = formData.get("currency") as string
  const description = formData.get("description") as string
  const active = formData.get("active") === "true"

  if (isNaN(unitPrice) || unitPrice <= 0) {
    return { error: "Preço unitário inválido." }
  }

  try {
    await db.developmentPrice.update({
      where: { id },
      data: {
        unitPrice,
        currency,
        description: description || null,
        active,
      },
    })
  } catch (error) {
    console.error("Error updating dev price:", error)
    return { error: "Erro ao atualizar preço de desenvolvimento." }
  }

  revalidatePath("/settings/prices")
  redirect("/settings/prices")
}

export async function deleteDevelopmentPrice(id: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Não autorizado.")
  }

  try {
    await db.developmentPrice.delete({
      where: { id },
    })
    revalidatePath("/settings/prices")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar preço de desenvolvimento." }
  }
}
