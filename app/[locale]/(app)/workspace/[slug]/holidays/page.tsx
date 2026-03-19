import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { HolidaysManager } from '@/components/workspace/holidays-manager'

export default async function HolidaysPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string }
}) {
  const t = await getTranslations()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*, workspace_members!inner(role, user_id)')
    .eq('slug', slug)
    .eq('workspace_members.user_id', user.id)
    .single()

  if (!workspace) return notFound()

  const { data: holidays } = await supabase
    .from('holidays')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('date', { ascending: true })

  const userRole = workspace.workspace_members[0]?.role
  const canManage = ['owner', 'admin', 'manager'].includes(userRole)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('holiday.title')}</h1>
        <p className="text-muted-foreground mt-1">
          Configurează zilele libere pentru {workspace.name}
        </p>
      </div>

      <HolidaysManager
        holidays={holidays || []}
        workspace={workspace}
        canManage={canManage}
        locale={locale}
      />
    </div>
  )
}
