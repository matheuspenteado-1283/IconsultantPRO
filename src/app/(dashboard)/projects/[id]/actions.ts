"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { participantSchema, systemEnvironmentSchema } from "@/lib/validations"
import { auth } from "@/auth"

// ========================
// PROJECT PARTICIPANTS
// ========================

export async function addParticipant(projectId: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  const name = formData.get("name") as string
  const role = formData.get("role") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const notes = formData.get("notes") as string

  const result = participantSchema.safeParse({ name, role, email: email || undefined, phone: phone || undefined, notes: notes || undefined })
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: "Projeto não encontrado." }

    await db.projectParticipant.create({
      data: {
        projectId,
        name: result.data.name,
        role: result.data.role,
        email: result.data.email || null,
        phone: result.data.phone || null,
        notes: result.data.notes || null,
      },
    })
  } catch (error) {
    console.error("Error adding participant:", error)
    return { error: "Erro ao adicionar integrante." }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteParticipant(projectId: string, id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    throw new Error("Não autorizado.")
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) throw new Error("Projeto não encontrado.")

    await db.projectParticipant.delete({ where: { id } })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar integrante." }
  }
}

// ========================
// SYSTEMS / ENVIRONMENTS
// ========================

export async function addSystem(projectId: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

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
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: "Projeto não encontrado." }

    await db.systemEnvironment.create({
      data: {
        ...result.data,
      },
    })
  } catch (error) {
    console.error("Error adding system environment:", error)
    return { error: "Erro ao cadastrar ambiente SAP." }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/systems")
  return { success: true }
}

export async function deleteSystem(projectId: string, id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    throw new Error("Não autorizado.")
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) throw new Error("Projeto não encontrado.")

    await db.systemEnvironment.delete({ where: { id } })
    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/systems")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar ambiente SAP." }
  }
}

// ========================
// SPONSORS
// ========================

export async function addSponsor(projectId: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  const name = formData.get("name") as string
  const role = formData.get("role") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const authorityLevel = formData.get("authorityLevel") as string
  const notes = formData.get("notes") as string

  if (!name || name.trim().length < 2) {
    return { error: "Nome do Sponsor é obrigatório." }
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: "Projeto não encontrado." }

    await db.projectSponsor.create({
      data: {
        projectId,
        name,
        role: role || null,
        email: email || null,
        phone: phone || null,
        authorityLevel: authorityLevel || null,
        notes: notes || null,
      },
    })
  } catch (error) {
    console.error("Error adding sponsor:", error)
    return { error: "Erro ao adicionar Sponsor." }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteSponsor(projectId: string, id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    throw new Error("Não autorizado.")
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) throw new Error("Projeto não encontrado.")

    await db.projectSponsor.delete({ where: { id } })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar Sponsor." }
  }
}

// ========================
// REQUESTERS
// ========================

export async function addRequester(projectId: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  const name = formData.get("name") as string
  const role = formData.get("role") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const notes = formData.get("notes") as string

  if (!name || name.trim().length < 2) {
    return { error: "Nome do Requisitante é obrigatório." }
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: "Projeto não encontrado." }

    await db.projectRequester.create({
      data: {
        projectId,
        name,
        role: role || null,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
      },
    })
  } catch (error) {
    console.error("Error adding requester:", error)
    return { error: "Erro ao adicionar Requisitante." }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteRequester(projectId: string, id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    throw new Error("Não autorizado.")
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) throw new Error("Projeto não encontrado.")

    await db.projectRequester.delete({ where: { id } })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar Requisitante." }
  }
}

// ========================
// APPROVERS
// ========================

export async function addApprover(projectId: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    return { error: "Não autorizado." }
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string

  if (!name || name.trim().length < 2) {
    return { error: "Nome do Aprovador é obrigatório." }
  }
  if (!email || !email.includes("@")) {
    return { error: "E-mail do Aprovador inválido." }
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: "Projeto não encontrado." }

    const crypto = await import("crypto")
    const { sendApprovalEmail } = await import("@/lib/email")
    const approvalToken = crypto.randomUUID()

    await db.projectApprover.create({
      data: {
        projectId,
        name,
        email,
        approvalStatus: "PENDING",
        approvalToken,
      },
    })

    try {
      await sendApprovalEmail(email, name, project.name, approvalToken)
    } catch (emailError) {
      console.error("Error sending approval email:", emailError)
    }
  } catch (error) {
    console.error("Error adding approver:", error)
    return { error: "Erro ao adicionar Aprovador." }
  }

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteApprover(projectId: string, id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) {
    throw new Error("Não autorizado.")
  }

  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) throw new Error("Projeto não encontrado.")

    await db.projectApprover.delete({ where: { id } })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Erro ao deletar Aprovador." }
  }
}

// ========================
// UPDATE ACTIONS
// ========================

export async function updateParticipant(projectId: string, id: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }
  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: 'Projeto não encontrado' }
    await db.projectParticipant.update({
      where: { id },
      data: {
        name: (formData.get('name') as string) || undefined,
        role: (formData.get('role') as string) || undefined,
        email: (formData.get('email') as string) || null,
        phone: (formData.get('phone') as string) || null,
        notes: (formData.get('notes') as string) || null,
      }
    })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (e: any) { return { error: e.message } }
}

export async function updateSystem(projectId: string, id: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }
  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: 'Projeto não encontrado' }
    await db.systemEnvironment.update({
      where: { id },
      data: {
        name: formData.get('name') as string,
        systemId: (formData.get('systemId') as string) || null,
        environment: formData.get('environment') as any,
        version: (formData.get('version') as string) || null,
        notes: (formData.get('notes') as string) || null,
      }
    })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (e: any) { return { error: e.message } }
}

export async function updateSponsor(projectId: string, id: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }
  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: 'Projeto não encontrado' }
    await db.projectSponsor.update({
      where: { id },
      data: {
        name: formData.get('name') as string,
        role: (formData.get('role') as string) || null,
        company: (formData.get('company') as string) || null,
        email: (formData.get('email') as string) || null,
        phone: (formData.get('phone') as string) || null,
        authorityLevel: (formData.get('authorityLevel') as string) || null,
        notes: (formData.get('notes') as string) || null,
      }
    })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (e: any) { return { error: e.message } }
}

export async function updateRequester(projectId: string, id: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }
  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: 'Projeto não encontrado' }
    await db.projectRequester.update({
      where: { id },
      data: {
        name: formData.get('name') as string,
        role: (formData.get('role') as string) || null,
        email: (formData.get('email') as string) || null,
        phone: (formData.get('phone') as string) || null,
        notes: (formData.get('notes') as string) || null,
      }
    })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (e: any) { return { error: e.message } }
}

export async function updateApprover(projectId: string, id: string, formData: FormData) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }
  try {
    const project = await db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
    if (!project) return { error: 'Projeto não encontrado' }
    await db.projectApprover.update({
      where: { id },
      data: {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
      }
    })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (e: any) { return { error: e.message } }
}
