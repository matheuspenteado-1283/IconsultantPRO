import { enforceModuleAccess } from '@/lib/access'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { MeetingDetailClient } from '../components/MeetingDetailClient'

export const metadata = {
  title: 'Detalhe da Reunião — Iconsultant Pro',
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await enforceModuleAccess('meetings')

  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) redirect('/login')

  const meeting = await db.meeting.findFirst({
    where: { id, organizationId: orgId },
    include: {
      project: { select: { id: true, name: true } },
      transcription: { select: { fullText: true, source: true, language: true } },
      summary: {
        select: { summary: true, keyPoints: true, decisions: true, nextSteps: true, sentiment: true },
      },
      actionItems: { orderBy: { createdAt: 'asc' } },
      createdBy: { select: { name: true, email: true } },
    },
  })

  if (!meeting) notFound()

  return <MeetingDetailClient meeting={meeting as any} />
}
