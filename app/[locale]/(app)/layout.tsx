import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { NavigationProgress } from '@/components/shared/navigation-progress'

export default async function AppLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(role)
    `)
    .eq('workspace_members.user_id', user.id)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <NavigationProgress />
      <AppSidebar workspaces={workspaces || []} userId={user.id} locale={locale} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader userId={user.id} />
        <main className="flex-1 overflow-auto page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
