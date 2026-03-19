import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban/kanban-board'

export default async function BoardPage({
  params: { locale, slug, boardId },
}: {
  params: { locale: string; slug: string; boardId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // ═══ Workspace check (must be first for security) ═══
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*, workspace_members!inner(role, user_id)')
    .eq('slug', slug)
    .eq('workspace_members.user_id', user.id)
    .single()

  if (!workspace) return notFound()

  // ═══ ALL remaining queries in PARALLEL (was 5 sequential!) ═══
  const [
    _repeatResult,
    { data: board },
    { data: members },
    { data: holidays },
    { data: labels },
  ] = await Promise.all([
    supabase.rpc('generate_repeat_instances', { p_board_id: boardId }).then(() => null, () => null),
    supabase
      .from('boards')
      .select(`
        *,
        projects(id, name, workspace_id),
        columns(
          *,
          tasks(
            *,
            assignee:profiles!tasks_assignee_profile_fkey(id, full_name, avatar_url),
            labels:task_labels(label:labels(*)),
            subtasks(id, completed),
            _count:comments(count)
          )
        )
      `)
      .eq('id', boardId)
      .single(),
    supabase
      .from('workspace_members')
      .select('*, profile:profiles(*)')
      .eq('workspace_id', workspace.id),
    supabase
      .from('holidays')
      .select('*')
      .eq('workspace_id', workspace.id),
    supabase
      .from('labels')
      .select('*')
      .eq('workspace_id', workspace.id),
  ])

  if (!board) return notFound()
  if ((board.projects as any).workspace_id !== workspace.id) return notFound()

  // Sort columns and tasks by position
  const sortedColumns = (board.columns || []).sort((a: any, b: any) => a.position - b.position)
  sortedColumns.forEach((col: any) => {
    col.tasks = (col.tasks || []).sort((a: any, b: any) => a.position - b.position)
    col.tasks.forEach((task: any) => {
      task.labels = (task.labels || []).map((tl: any) => tl.label).filter(Boolean)
      task._count = {
        subtasks: task.subtasks?.length || 0,
        completed_subtasks: task.subtasks?.filter((s: any) => s.completed).length || 0,
        comments: task._count?.count || 0,
        attachments: 0,
      }
    })
  })

  const userRole = workspace.workspace_members[0]?.role

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <p className="text-sm text-muted-foreground">{(board.projects as any).name}</p>
          <h1 className="text-lg font-semibold">{board.name}</h1>
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-6 py-4">
        <KanbanBoard
          board={{ ...board, columns: sortedColumns }}
          workspace={workspace}
          members={members || []}
          holidays={holidays || []}
          labels={labels || []}
          userRole={userRole}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
