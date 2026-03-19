import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileSettings } from '@/components/profile/profile-settings'

export default async function ProfilePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Count workspaces
  const { data: workspaces } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(name)')
    .eq('user_id', user.id)

  return (
    <ProfileSettings
      user={{
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        provider: user.app_metadata?.provider || 'email',
      }}
      profile={profile || { id: user.id, full_name: '', avatar_url: '', email: user.email || '' }}
      workspaces={workspaces || []}
      locale={locale}
    />
  )
}
