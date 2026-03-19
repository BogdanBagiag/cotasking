import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateWorkspacePrompt } from '@/components/workspace/create-workspace-prompt'
import { DashboardClient } from '@/components/workspace/dashboard-client'

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // ═══ Profile + workspaces in PARALLEL ═══
  const [{ data: profile }, { data: workspaces }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('workspaces')
      .select('*, workspace_members!inner(role)')
      .eq('workspace_members.user_id', user.id),
  ])

  const hasWorkspace = (workspaces?.length ?? 0) > 0
  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bună dimineața' : hour < 18 ? 'Bună ziua' : 'Bună seara'

  if (!hasWorkspace) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{greeting}, {firstName}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <CreateWorkspacePrompt locale={locale} />
      </div>
    )
  }

  const workspaceIds = workspaces!.map(w => w.id)

  // ═══ Get column IDs with ONE query instead of 3 sequential ═══
  const { data: columns } = await supabase
    .from('columns')
    .select('id, boards!inner(projects!inner(workspace_id))')
    .in('boards.projects.workspace_id', workspaceIds)

  const columnIds = (columns || []).map((c: any) => c.id)
  const safeColumnIds = columnIds.length > 0
    ? columnIds
    : ['00000000-0000-0000-0000-000000000000']

  // ═══ ALL data queries in PARALLEL ═══
  const [{ data: projectsRaw }, { data: allTasks }, { data: allMembers }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, color, workspace_id, workspaces(name, slug)')
      .in('workspace_id', workspaceIds),
    supabase
      .from('tasks')
      .select(`
        id, title, completed, due_date, assignee_id, priority, column_id, created_at,
        assignee:profiles(id, full_name, avatar_url),
        columns(id, name, board_id, boards(id, name, project_id, projects(id, name, workspace_id, workspaces(slug))))
      `)
      .in('column_id', safeColumnIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('workspace_members')
      .select('id, workspace_id, user_id, role, profile:profiles(id, full_name, email, avatar_url)')
      .in('workspace_id', workspaceIds),
  ])

  // Normalize workspaces from array to single object (Supabase returns array for joins)
  const projects = (projectsRaw || []).map(p => ({
    ...p,
    workspaces: Array.isArray(p.workspaces) ? p.workspaces[0] : p.workspaces,
  }))

  return (
    <DashboardClient
      greeting={greeting}
      firstName={firstName}
      locale={locale}
      currentUserId={user.id}
      workspaces={workspaces || []}
      projects={projects as any}
      tasks={allTasks || []}
      members={allMembers || []}
    />
  )
}
