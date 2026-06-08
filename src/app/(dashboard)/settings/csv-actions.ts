'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { parseCsv } from '@/lib/csv'

const VALID_ABAP_TYPES = ['REPORT','INTERFACE','CONVERSION','ENHANCEMENT','FORM','WORKFLOW','BADI','USER_EXIT','SMARTFORM','ADOBE_FORM']
const VALID_COMPLEXITY = ['SIMPLE','MEDIUM','COMPLEX','VERY_COMPLEX']

type ImportResult = { imported: number; errors: Array<{ line: number; message: string }> }

export async function importAbapEffortCsv(csvText: string): Promise<ImportResult> {
  const session = await auth()
  if (!session) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  for (const [i, row] of rows.entries()) {
    const line = i + 2
    const type = row.type?.trim().toUpperCase()
    const complexity = row.complexity?.trim().toUpperCase()
    const hours = parseFloat(row.standardHours)

    if (!type || !VALID_ABAP_TYPES.includes(type)) {
      errors.push({ line, message: `type inválido: "${row.type}". Válidos: ${VALID_ABAP_TYPES.join(', ')}` })
      continue
    }
    if (!complexity || !VALID_COMPLEXITY.includes(complexity)) {
      errors.push({ line, message: `complexity inválida: "${row.complexity}". Válidos: ${VALID_COMPLEXITY.join(', ')}` })
      continue
    }
    if (isNaN(hours) || hours <= 0) {
      errors.push({ line, message: `standardHours inválido: "${row.standardHours}"` })
      continue
    }
    data.push({
      type: type as any,
      complexity: complexity as any,
      standardHours: hours,
      description: row.description?.trim() || null
    })
  }

  if (errors.length > 0) return { imported: 0, errors }

  // Upsert to handle unique constraint type_complexity
  for (const item of data) {
    await db.abapEffort.upsert({
      where: { type_complexity: { type: item.type, complexity: item.complexity } },
      create: item,
      update: { standardHours: item.standardHours, description: item.description }
    })
  }

  revalidatePath('/settings/effort')
  return { imported: data.length, errors: [] }
}

export async function importFunctionalEffortCsv(csvText: string): Promise<ImportResult> {
  const session = await auth()
  if (!session) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  const allModules = await db.sapModule.findMany()
  const moduleMap = new Map(allModules.map(m => [m.code.toUpperCase(), m.id]))

  for (const [i, row] of rows.entries()) {
    const line = i + 2
    const moduleCode = row.moduleCode?.trim().toUpperCase()
    const complexity = row.complexity?.trim().toUpperCase()
    const hours = parseFloat(row.standardHours)

    if (!moduleCode || !moduleMap.has(moduleCode)) {
      errors.push({ line, message: `moduleCode inválido ou inexistente: "${row.moduleCode}"` })
      continue
    }
    if (!row.activityType?.trim()) {
      errors.push({ line, message: 'activityType é obrigatório' })
      continue
    }
    if (!complexity || !VALID_COMPLEXITY.includes(complexity)) {
      errors.push({ line, message: `complexity inválida: "${row.complexity}". Válidos: ${VALID_COMPLEXITY.join(', ')}` })
      continue
    }
    if (isNaN(hours) || hours <= 0) {
      errors.push({ line, message: `standardHours inválido` })
      continue
    }

    data.push({
      moduleId: moduleMap.get(moduleCode)!,
      activityType: row.activityType.trim(),
      complexity: complexity as any,
      standardHours: hours,
      description: row.description?.trim() || null
    })
  }

  if (errors.length > 0) return { imported: 0, errors }

  // Since FunctionalEffort has no unique constraint, we create them
  await db.functionalEffort.createMany({
    data,
    skipDuplicates: true
  })

  revalidatePath('/settings/effort')
  return { imported: data.length, errors: [] }
}

export async function importProfessionalPricesCsv(csvText: string): Promise<ImportResult> {
  const session = await auth()
  if (!session) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  for (const [i, row] of rows.entries()) {
    const line = i + 2
    const daily = parseFloat(row.dailyRate)
    const hourly = parseFloat(row.hourlyRate)

    if (!row.profile?.trim()) {
      errors.push({ line, message: 'profile é obrigatório' })
      continue
    }
    if (isNaN(daily) || daily <= 0) {
      errors.push({ line, message: `dailyRate inválido: "${row.dailyRate}"` })
      continue
    }
    if (isNaN(hourly) || hourly <= 0) {
      errors.push({ line, message: `hourlyRate inválido: "${row.hourlyRate}"` })
      continue
    }

    data.push({
      profile: row.profile.trim(),
      dailyRate: daily,
      hourlyRate: hourly,
      currency: row.currency?.trim() || 'BRL'
    })
  }

  if (errors.length > 0) return { imported: 0, errors }

  // Upsert or clear and batch create. Since there is no unique constraint on profile, we can upsert by finding existing profile, or just createMany.
  // To avoid duplicates, let's update if profile exists (by first checking) or just create.
  // Actually, we can check if it exists:
  for (const item of data) {
    const existing = await db.professionalPrice.findFirst({
      where: { profile: item.profile }
    })
    if (existing) {
      await db.professionalPrice.update({
        where: { id: existing.id },
        data: {
          dailyRate: item.dailyRate,
          hourlyRate: item.hourlyRate,
          currency: item.currency,
          active: true
        }
      })
    } else {
      await db.professionalPrice.create({ data: item })
    }
  }

  revalidatePath('/settings/prices')
  return { imported: data.length, errors: [] }
}

export async function importDevelopmentPricesCsv(csvText: string): Promise<ImportResult> {
  const session = await auth()
  if (!session) return { imported: 0, errors: [{ line: 0, message: 'Não autorizado' }] }

  const rows = parseCsv(csvText)
  const errors: ImportResult['errors'] = []
  const data: any[] = []

  for (const [i, row] of rows.entries()) {
    const line = i + 2
    const type = row.type?.trim().toUpperCase()
    const complexity = row.complexity?.trim().toUpperCase()
    const price = parseFloat(row.unitPrice)

    if (!type || !VALID_ABAP_TYPES.includes(type)) {
      errors.push({ line, message: `type inválido: "${row.type}". Válidos: ${VALID_ABAP_TYPES.join(', ')}` })
      continue
    }
    if (!complexity || !VALID_COMPLEXITY.includes(complexity)) {
      errors.push({ line, message: `complexity inválida` })
      continue
    }
    if (isNaN(price) || price <= 0) {
      errors.push({ line, message: `unitPrice inválido: "${row.unitPrice}"` })
      continue
    }

    data.push({
      type: type as any,
      complexity: complexity as any,
      unitPrice: price,
      currency: row.currency?.trim() || 'BRL',
      description: row.description?.trim() || null
    })
  }

  if (errors.length > 0) return { imported: 0, errors }

  // Upsert to handle unique type_complexity constraint
  for (const item of data) {
    await db.developmentPrice.upsert({
      where: { type_complexity: { type: item.type, complexity: item.complexity } },
      create: item,
      update: { unitPrice: item.unitPrice, currency: item.currency, description: item.description }
    })
  }

  revalidatePath('/settings/prices')
  return { imported: data.length, errors: [] }
}
