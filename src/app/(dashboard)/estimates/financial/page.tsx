import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { enforceModuleAccess } from '@/lib/access'
import EstimatorDashboard from '../components/EstimatorDashboard'

export const metadata: Metadata = { title: 'Estimativa Financeira — Iconsultant Pro' }

export default async function EstimatesFinancialPage() {
  await enforceModuleAccess('estimates_financial')
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
  const professionalPrices = await db.professionalPrice.findMany({ where: { active: true }, orderBy: { profile: 'asc' } })
  const developmentPrices = await db.developmentPrice.findMany({ where: { active: true }, orderBy: [{ type: 'asc' }, { complexity: 'asc' }] })
  const sapModules = await db.sapModule.findMany({ where: { active: true }, orderBy: { code: 'asc' } })

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>💰 Estimativa Financeira</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Visualize preços calculados, contingência e desconto comercial
        </p>
      </div>
      <EstimatorDashboard
        projects={projects as any}
        abapEfforts={abapEfforts as any}
        functionalEfforts={functionalEfforts as any}
        professionalPrices={professionalPrices as any}
        developmentPrices={developmentPrices as any}
        sapModules={sapModules as any}
      />
    </div>
  )
}
