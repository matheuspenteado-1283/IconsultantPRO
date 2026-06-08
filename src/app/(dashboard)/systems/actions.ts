"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { systemEnvironmentSchema } from "@/lib/validations"
import { auth } from "@/auth"

export async function createSystemEnvironment(formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  const projectId = formData.get("projectId") as string
  const name = formData.get("name") as string
  const systemId = formData.get("systemId") as string
  const environment = formData.get("environment") as any
  const version = formData.get("version") as string
  const description = formData.get("description") as string
  const notes = formData.get("notes") as string

  const result = systemEnvironmentSchema.safeParse({
    projectId,
    name,
    systemId: systemId || undefined,
    environment,
    version: version || undefined,
    description: description || undefined,
    notes: notes || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    // Verify project belongs to user's org
    const project = await db.project.findFirst({
      where: { id: projectId, organizationId: orgId },
    })

    if (!project) {
      return { error: "Projeto não encontrado ou sem autorização." }
    }

    await db.systemEnvironment.create({
      data: {
        ...result.data,
      },
    })
  } catch (error) {
    console.error("Error creating system:", error)
    return { error: "Erro ao cadastrar ambiente." }
  }

  revalidatePath("/systems")
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteSystemEnvironment(id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    throw new Error("Não autorizado.")
  }

  try {
    const sys = await db.systemEnvironment.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!sys || sys.project.organizationId !== orgId) {
      throw new Error("Ambiente não encontrado.")
    }

    await db.systemEnvironment.delete({
      where: { id },
    })

    revalidatePath("/systems")
    revalidatePath(`/projects/${sys.projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar ambiente." }
  }
}
