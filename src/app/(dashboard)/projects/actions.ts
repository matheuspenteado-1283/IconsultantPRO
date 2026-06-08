"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { projectSchema } from "@/lib/validations"
import { auth } from "@/auth"

export async function createProject(formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const clientId = formData.get("clientId") as string
  const status = formData.get("status") as any
  const scope = formData.get("scope") as string
  const description = formData.get("description") as string
  const startDateStr = formData.get("startDate") as string
  const endDateStr = formData.get("endDate") as string

  // Read module IDs directly from checkboxes named "modules"
  const selectedModuleIds = formData.getAll("modules") as string[]

  const result = projectSchema.safeParse({
    name,
    code: code || undefined,
    clientId: clientId || undefined,
    status,
    scope: scope || undefined,
    description: description || undefined,
    startDate: startDateStr || undefined,
    endDate: endDateStr || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    const startDate = startDateStr ? new Date(startDateStr) : null
    const endDate = endDateStr ? new Date(endDateStr) : null

    // Create project and link modules in a transaction
    await db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: result.data.name,
          code: result.data.code || null,
          clientId: result.data.clientId || null,
          status: result.data.status,
          scope: result.data.scope || null,
          description: result.data.description || null,
          startDate,
          endDate,
          organizationId: orgId,
        },
      })

      // Link modules
      if (selectedModuleIds && selectedModuleIds.length > 0) {
        await tx.projectModule.createMany({
          data: selectedModuleIds.map((mId) => ({
            projectId: project.id,
            moduleId: mId,
          })),
        })
      }
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return { error: "Erro ao criar projeto." }
  }

  revalidatePath("/projects")
  redirect("/projects")
}

export async function updateProject(id: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const clientId = formData.get("clientId") as string
  const status = formData.get("status") as any
  const scope = formData.get("scope") as string
  const description = formData.get("description") as string
  const startDateStr = formData.get("startDate") as string
  const endDateStr = formData.get("endDate") as string

  // Read module IDs directly from checkboxes named "modules"
  const selectedModuleIds = formData.getAll("modules") as string[]

  const result = projectSchema.safeParse({
    name,
    code: code || undefined,
    clientId: clientId || undefined,
    status,
    scope: scope || undefined,
    description: description || undefined,
    startDate: startDateStr || undefined,
    endDate: endDateStr || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    const existing = await db.project.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) {
      return { error: "Projeto não encontrado ou sem permissão." }
    }

    const startDate = startDateStr ? new Date(startDateStr) : null
    const endDate = endDateStr ? new Date(endDateStr) : null

    await db.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          name: result.data.name,
          code: result.data.code || null,
          clientId: result.data.clientId || null,
          status: result.data.status,
          scope: result.data.scope || null,
          description: result.data.description || null,
          startDate,
          endDate,
        },
      })

      // Update module links: delete existing and insert new
      await tx.projectModule.deleteMany({
        where: { projectId: id },
      })

      if (selectedModuleIds && selectedModuleIds.length > 0) {
        await tx.projectModule.createMany({
          data: selectedModuleIds.map((mId) => ({
            projectId: id,
            moduleId: mId,
          })),
        })
      }
    })
  } catch (error) {
    console.error("Error updating project:", error)
    return { error: "Erro ao atualizar projeto." }
  }

  revalidatePath("/projects")
  revalidatePath(`/projects/${id}`)
  redirect("/projects")
}

export async function deleteProject(id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    throw new Error("Não autorizado.")
  }

  try {
    const existing = await db.project.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!existing) throw new Error("Projeto não encontrado.")

    await db.project.delete({
      where: { id },
    })

    revalidatePath("/projects")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar projeto." }
  }
}
