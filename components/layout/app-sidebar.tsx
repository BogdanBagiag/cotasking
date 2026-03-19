'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { cn, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog'
import type { Workspace } from '@/types'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CalendarOff,
  Settings,
  Plus,
  ChevronsUpDown,
  Check,
  Loader2,
} from 'lucide-react'

interface AppSidebarProps {
  workspaces: (Workspace & { workspace_members: Array<{ role: string }> })[]
  userId: string
  locale: string
}

export function AppSidebar({ workspaces, userId, locale }: AppSidebarProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createWsOpen, setCreateWsOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const switcherRef = useRef<HTMLDivElement>(null)

  // Clear pending state when pathname changes
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Extract current workspace slug from path
  const workspaceMatch = pathname.match(/\/workspace\/([^\/]+)/)
  const currentSlug = workspaceMatch?.[1]
  const currentWorkspace = workspaces.find((w) => w.slug === currentSlug) || workspaces[0]

  function handleSwitchWorkspace(slug: string) {
    setSwitcherOpen(false)
    router.push(`/workspace/${slug}/projects`)
  }

  function handleNavClick(href: string, e: React.MouseEvent) {
    // If already on this page, don't navigate
    if (pathname.startsWith(href)) return

    e.preventDefault()
    setPendingHref(href)
    startTransition(() => {
      router.push(href)
    })
  }

  const workspaceNav = currentWorkspace
    ? [
        {
          href: `/workspace/${currentWorkspace.slug}/projects`,
          icon: FolderKanban,
          label: t('nav.projects'),
        },
        {
          href: `/workspace/${currentWorkspace.slug}/members`,
          icon: Users,
          label: t('nav.members'),
        },
        {
          href: `/workspace/${currentWorkspace.slug}/holidays`,
          icon: CalendarOff,
          label: t('nav.holidays'),
        },
        {
          href: `/workspace/${currentWorkspace.slug}/settings`,
          icon: Settings,
          label: t('nav.settings'),
        },
      ]
    : []

  return (
    <>
      <aside className="w-64 border-r border-border bg-card flex flex-col h-full shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CoTasking</span>
        </div>

        {/* Workspace switcher */}
        {workspaces.length > 0 && (
          <div className="px-3 py-3 border-b border-border relative" ref={switcherRef}>
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-2 w-full rounded-lg px-2 py-2 hover:bg-accent transition-colors cursor-pointer group"
            >
              {currentWorkspace?.logo_url ? (
                <img
                  src={currentWorkspace.logo_url}
                  alt={currentWorkspace.name}
                  className="w-7 h-7 rounded-md object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {getInitials(currentWorkspace?.name || 'W')}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate">{currentWorkspace?.name || 'Workspace'}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentWorkspace?.plan?.replace('_', ' ')}</p>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>

            {/* Dropdown */}
            {switcherOpen && (
              <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.slug)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">
                        {getInitials(ws.name)}
                      </span>
                    </div>
                    <span className="text-sm truncate flex-1">{ws.name}</span>
                    {ws.slug === currentWorkspace?.slug && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => { setSwitcherOpen(false); setCreateWsOpen(true) }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent transition-colors text-left text-muted-foreground"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">{t('workspace.create')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
          {/* Dashboard */}
          <Link
            href="/dashboard"
onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick('/dashboard', e)}
            className={cn(
              'sidebar-item',
              pathname === '/dashboard' && 'active',
              pendingHref === '/dashboard' && 'bg-accent/50'
            )}
          >
            {pendingHref === '/dashboard' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LayoutDashboard className="w-4 h-4" />
            )}
            {t('nav.dashboard')}
          </Link>

          {/* Workspace nav */}
          {currentWorkspace && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                {currentWorkspace.name}
              </p>
              {workspaceNav.map(({ href, icon: Icon, label }) => {
                const isActive = pathname.startsWith(href)
                const isPendingThis = pendingHref === href

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={(e) => handleNavClick(href, e)}
                    className={cn(
                      'sidebar-item',
                      isActive && 'active',
                      isPendingThis && !isActive && 'bg-accent/50'
                    )}
                  >
                    {isPendingThis && !isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        {/* Create workspace */}
        <div className="px-3 py-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setCreateWsOpen(true)}
          >
            <Plus className="w-4 h-4" />
            {t('workspace.create')}
          </Button>
        </div>
      </aside>

      <CreateWorkspaceDialog
        open={createWsOpen}
        onOpenChange={setCreateWsOpen}
      />
    </>
  )
}
