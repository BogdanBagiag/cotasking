import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { MembersManager } from '@/components/workspace/members-manager'

export default async function MembersPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string }
}) {
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

  // ═══ Members + invitations in PARALLEL ═══
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from('workspace_members')
      .select('*, profile:profiles(id, full_name, email, avatar_url)')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const userRole = workspace.workspace_members[0]?.role

  return (
    <MembersManager
      workspace={workspace}
      members={members || []}
      invitations={invitations || []}
      currentUserId={user.id}
      userRole={userRole}
      locale={locale}
    />
  )
}
