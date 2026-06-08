"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { sapModuleSchema } from "@/lib/validations"
import { auth } from "@/auth"

export async function createModule(formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const code = formData.get("code") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const result = sapModuleSchema.safeParse({ code, name, description })
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    const existing = await db.sapModule.findUnique({ where: { code: result.data.code.toUpperCase() } })
    if (existing) {
      return { error: "Já existe um módulo com este código." }
    }

    await db.sapModule.create({
      data: {
        code: result.data.code.toUpperCase(),
        name: result.data.name,
        description: result.data.description || null,
        active: true,
      },
    })
  } catch (error) {
    console.error("Error creating module:", error)
    return { error: "Erro ao criar módulo. Tente novamente." }
  }

  revalidatePath("/settings/modules")
  redirect("/settings/modules")
}

export async function updateModule(id: string, formData: FormData) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Não autorizado." }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const active = formData.get("active") === "true"

  if (!name || name.trim().length < 2) {
    return { error: "Nome deve ter pelo menos 2 caracteres" }
  }

  try {
    await db.sapModule.update({
      where: { id },
      data: {
        name,
        description: description || null,
        active,
      },
    })
  } catch (error) {
    console.error("Error updating module:", error)
    return { error: "Erro ao atualizar módulo." }
  }

  revalidatePath("/settings/modules")
  redirect("/settings/modules")
}

export async function toggleModuleActive(id: string) {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Não autorizado.")
  }

  try {
    const mod = await db.sapModule.findUnique({ where: { id } })
    if (!mod) throw new Error("Módulo não encontrado.")

    await db.sapModule.update({
      where: { id },
      data: { active: !mod.active },
    })

    revalidatePath("/settings/modules")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao alternar status do módulo." }
  }
}
