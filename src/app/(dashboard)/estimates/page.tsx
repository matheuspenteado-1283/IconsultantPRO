import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getUserAllowedModules, isModuleAllowed } from '@/lib/access'

export default async function EstimatesPage() {
  const session = await auth()
  const userId = session?.user?.id
  const email = session?.user?.email || undefined
  if (!userId) redirect('/login')

  const modules = await getUserAllowedModules(userId, email)

  if (isModuleAllowed(modules, 'estimates_financial')) {
    redirect('/estimates/financial')
  }
  if (isModuleAllowed(modules, 'estimates_effort')) {
    redirect('/estimates/effort')
  }
  // Fallback para compatibilidade com moduleKey 'estimates' antigo
  if (isModuleAllowed(modules, 'estimates')) {
    redirect('/estimates/effort')
  }

  redirect('/dashboard?error=access-denied')
}
