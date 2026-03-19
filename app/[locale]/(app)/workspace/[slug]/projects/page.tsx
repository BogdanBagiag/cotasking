import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProjectsGrid } from '@/components/workspace/projects-grid'

export default async function ProjectsPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string }
}) {
  const supabase = createClient()

  // ═══ Auth + translations in parallel ═══
  const [{ data: { user } }, t] = await Promise.all([
    supabase.auth.getUser(),
    getTranslations(),
  ])
  if (!user) redirect(`/${locale}/login`)

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*, workspace_members!inner(role, user_id)')
    .eq('slug', slug)
    .eq('workspace_members.user_id', user.id)
    .single()

  if (!workspace) return notFound()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, boards(id, name)')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  const userRole = workspace.workspace_members[0]?.role

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('project.title')}</h1>
          <p className="text-muted-foreground mt-1">{workspace.name}</p>
        </div>
      </div>

      <ProjectsGrid
        projects={projects || []}
        workspace={workspace}
        userRole={userRole}
        locale={locale}
      />
    </div>
  )
}
