'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function createMeeting(data: {
  title: string
  platform: string
  projectId?: string
  participants?: string
}) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  const userId = session?.user?.id
  if (!session || !orgId || !userId) return { error: 'Não autorizado' }

  try {
    const participantsList = data.participants
      ? data.participants.split(',').map(p => p.trim()).filter(Boolean)
      : []

    const meeting = await db.meeting.create({
      data: {
        organizationId: orgId,
        projectId: data.projectId || null,
        title: data.title,
        platform: data.platform as any,
        participants: participantsList,
        status: 'PENDING',
        createdById: userId,
      }
    })
    revalidatePath('/meetings')
    return { success: true, meetingId: meeting.id }
  } catch (error: any) {
    return { error: error.message || 'Erro ao criar reunião' }
  }
}

export async function updateMeetingDuration(meetingId: string, durationSeconds: number) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  try {
    await db.meeting.update({
      where: { id: meetingId, organizationId: orgId },
      data: { durationSeconds }
    })
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateActionItemStatus(id: string, status: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  try {
    await db.meetingActionItem.update({
      where: { id },
      data: { status: status as any }
    })
    revalidatePath('/meetings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteMeeting(id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  try {
    const meeting = await db.meeting.findFirst({ where: { id, organizationId: orgId } })
    if (!meeting) return { error: 'Reunião não encontrada' }
    await db.meeting.delete({ where: { id } })
    revalidatePath('/meetings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
