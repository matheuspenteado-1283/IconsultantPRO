'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { parseCsv } from '@/lib/csv'

const VALID_ENVIRONMENTS = ['DEV', 'QAS', 'PRD', 'SBX', 'SANDBOX']

type ImportResult = { imported: number; errors: Array<{ line: number; message: string }> }

async function getVerifiedProject(projectId: string, orgId: string) {
  return db.project.findFirst({ where: { id: projectId, organizationId: orgId } })
}

export async function importParticipantsCsv(projectId: string, csvText: string): Promise<ImportResult> {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }
  const project = await getVerifiedProject(projectId, orgId)
  if (!project) return { imported: 0, errors: [{ line: 0, message: 'Projeto não encontrado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  rows.forEach((row, i) => {
    const line = i + 2
    if (!row.name?.trim()) {
      errors.push({ line, message: 'Campo "name" obrigatório' })
      return
    }
    if (!row.role?.trim()) {
      errors.push({ line, message: 'Campo "role" obrigatório' })
      return
    }
    data.push({
      projectId,
      name: row.name.trim(),
      role: row.role.trim(),
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      notes: row.notes?.trim() || null
    })
  })

  if (errors.length > 0) return { imported: 0, errors }
  await db.projectParticipant.createMany({ data })
  revalidatePath(`/projects/${projectId}`)
  return { imported: data.length, errors: [] }
}

export async function importSponsorsCsv(projectId: string, csvText: string): Promise<ImportResult> {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }
  const project = await getVerifiedProject(projectId, orgId)
  if (!project) return { imported: 0, errors: [{ line: 0, message: 'Projeto não encontrado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  rows.forEach((row, i) => {
    const line = i + 2
    if (!row.name?.trim()) {
      errors.push({ line, message: 'Campo "name" obrigatório' })
      return
    }
    data.push({
      projectId,
      name: row.name.trim(),
      role: row.role?.trim() || null,
      company: row.company?.trim() || null,
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      authorityLevel: row.authorityLevel?.trim() || null,
      notes: row.notes?.trim() || null
    })
  })

  if (errors.length > 0) return { imported: 0, errors }
  await db.projectSponsor.createMany({ data })
  revalidatePath(`/projects/${projectId}`)
  return { imported: data.length, errors: [] }
}

export async function importRequestersCsv(projectId: string, csvText: string): Promise<ImportResult> {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }
  const project = await getVerifiedProject(projectId, orgId)
  if (!project) return { imported: 0, errors: [{ line: 0, message: 'Projeto não encontrado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  rows.forEach((row, i) => {
    const line = i + 2
    if (!row.name?.trim()) {
      errors.push({ line, message: 'Campo "name" obrigatório' })
      return
    }
    data.push({
      projectId,
      name: row.name.trim(),
      role: row.role?.trim() || null,
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      notes: row.notes?.trim() || null
    })
  })

  if (errors.length > 0) return { imported: 0, errors }
  await db.projectRequester.createMany({ data })
  revalidatePath(`/projects/${projectId}`)
  return { imported: data.length, errors: [] }
}

export async function importSystemsCsv(projectId: string, csvText: string): Promise<ImportResult> {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }
  const project = await getVerifiedProject(projectId, orgId)
  if (!project) return { imported: 0, errors: [{ line: 0, message: 'Projeto não encontrado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  rows.forEach((row, i) => {
    const line = i + 2
    if (!row.name?.trim()) {
      errors.push({ line, message: 'Campo "name" obrigatório' })
      return
    }
    const env = row.environment?.trim().toUpperCase()
    if (!env || !VALID_ENVIRONMENTS.includes(env)) {
      errors.push({ line, message: `environment inválido: "${row.environment}". Válidos: ${VALID_ENVIRONMENTS.join(', ')}` })
      return
    }
    data.push({
      projectId,
      name: row.name.trim(),
      systemId: row.systemId?.trim() || null,
      environment: env === 'SANDBOX' ? 'SBX' : (env as any),
      version: row.version?.trim() || null,
      notes: row.notes?.trim() || null
    })
  })

  if (errors.length > 0) return { imported: 0, errors }
  await db.systemEnvironment.createMany({ data })
  revalidatePath(`/projects/${projectId}`)
  return { imported: data.length, errors: [] }
}

export async function importApproversCsv(projectId: string, csvText: string): Promise<ImportResult> {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }
  const project = await getVerifiedProject(projectId, orgId)
  if (!project) return { imported: 0, errors: [{ line: 0, message: 'Projeto não encontrado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  const crypto = require('crypto')

  rows.forEach((row, i) => {
    const line = i + 2
    if (!row.name?.trim()) {
      errors.push({ line, message: 'Campo "name" obrigatório' })
      return
    }
    if (!row.email?.trim() || !row.email.includes('@')) {
      errors.push({ line, message: 'Campo "email" inválido' })
      return
    }
    data.push({
      projectId,
      name: row.name.trim(),
      email: row.email.trim(),
      approvalStatus: 'PENDING',
      approvalToken: crypto.randomUUID()
    })
  })

  if (errors.length > 0) return { imported: 0, errors }
  await db.projectApprover.createMany({ data })
  revalidatePath(`/projects/${projectId}`)
  return { imported: data.length, errors: [] }
}
