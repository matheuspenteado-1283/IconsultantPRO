import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { enforceModuleAccess } from '@/lib/access'
import EffortOnlyDashboard from './components/EffortOnlyDashboard'

export const metadata: Metadata = { title: 'Estimativa de Esforço — Iconsultant Pro' }

export default async function EstimatesEffortPage() {
  await enforceModuleAccess('estimates_effort')
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!orgId) redirect('/login')

  const projects = await db.project.findMany({
    where: { organizationId: orgId },
    include: {
      client: true,
      backlogItems: {
        include: {
          sapModule: true,
          effortEstimates: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { backlogCode: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const abapEfforts = await db.abapEffort.findMany({ orderBy: [{ type: 'asc' }, { complexity: 'asc' }] })
  const functionalEfforts = await db.functionalEffort.findMany({ orderBy: { activityType: 'asc' } })
  const sapModules = await db.sapModule.findMany({ where: { active: true }, orderBy: { code: 'asc' } })

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>⏱️ Estimativa de Esforço</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Registre e visualize as horas estimadas por item de backlog
        </p>
      </div>
      <EffortOnlyDashboard
        projects={projects as any}
        abapEfforts={abapEfforts as any}
        functionalEfforts={functionalEfforts as any}
        sapModules={sapModules as any}
      />
    </div>
  )
}
