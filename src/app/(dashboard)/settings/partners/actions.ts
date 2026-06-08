"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { partnerSchema } from "@/lib/validations"
import { auth } from "@/auth"

export async function createPartner(formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado ou sem organização." }
  }

  const name = formData.get("name") as string
  const cnpj = formData.get("cnpj") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const segment = formData.get("segment") as string
  const partnerType = formData.get("partnerType") as any
  const contactPerson = formData.get("contactPerson") as string
  const notes = formData.get("notes") as string

  const result = partnerSchema.safeParse({
    name,
    cnpj: cnpj || undefined,
    email: email || undefined,
    phone: phone || undefined,
    address: address || undefined,
    segment: segment || undefined,
    partnerType,
    contactPerson: contactPerson || undefined,
    notes: notes || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await db.partner.create({
      data: {
        ...result.data,
        organizationId: orgId,
        active: true,
      },
    })
  } catch (error) {
    console.error("Error creating partner:", error)
    return { error: "Erro ao criar parceiro." }
  }

  revalidatePath("/settings/partners")
  redirect("/settings/partners")
}

export async function updatePartner(id: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  const name = formData.get("name") as string
  const cnpj = formData.get("cnpj") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const segment = formData.get("segment") as string
  const partnerType = formData.get("partnerType") as any
  const contactPerson = formData.get("contactPerson") as string
  const notes = formData.get("notes") as string
  const active = formData.get("active") === "true"

  const result = partnerSchema.safeParse({
    name,
    cnpj: cnpj || undefined,
    email: email || undefined,
    phone: phone || undefined,
    address: address || undefined,
    segment: segment || undefined,
    partnerType,
    contactPerson: contactPerson || undefined,
    notes: notes || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    // Verify owner
    const existing = await db.partner.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existing) {
      return { error: "Parceiro não encontrado ou sem autorização." }
    }

    await db.partner.update({
      where: { id },
      data: {
        ...result.data,
        active,
      },
    })
  } catch (error) {
    console.error("Error updating partner:", error)
    return { error: "Erro ao atualizar parceiro." }
  }

  revalidatePath("/settings/partners")
  redirect("/settings/partners")
}

export async function deletePartner(id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    throw new Error("Não autorizado.")
  }

  try {
    const existing = await db.partner.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existing) throw new Error("Parceiro não encontrado.")

    await db.partner.delete({
      where: { id },
    })

    revalidatePath("/settings/partners")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar parceiro." }
  }
}
