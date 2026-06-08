import { enforceModuleAccess } from '@/lib/access'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MeetingsClient } from './components/MeetingsClient'

export const metadata = {
  title: 'Reuniões — Iconsultant Pro',
  description: 'Grave, transcreva e analise reuniões automaticamente com IA.',
}

export default async function MeetingsPage() {
  await enforceModuleAccess('meetings')

  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) redirect('/login')

  const [meetings, projects] = await Promise.all([
    db.meeting.findMany({
      where: { organizationId: orgId },
      include: {
        project: { select: { id: true, name: true } },
        summary: { select: { summary: true } },
        transcription: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return <MeetingsClient meetings={meetings as any} projects={projects} />
}
