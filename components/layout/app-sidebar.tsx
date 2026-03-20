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
  X,
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
  const [mobileSwitcherOpen, setMobileSwitcherOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const switcherRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const workspaceMatch = pathname.match(/\/workspace\/([^\/]+)/)
  const currentSlug = workspaceMatch?.[1]
  const currentWorkspace = workspaces.find((w) => w.slug === currentSlug) || workspaces[0]

  function handleSwitchWorkspace(slug: string) {
  setSwitcherOpen(false)
  setMobileSwitcherOpen(false)
  router.push('/dashboard')
}

  function handleNavClick(href: string, e: React.MouseEvent) {
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

  const bottomNavItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: t('nav.dashboard'),
      isWorkspaceTrigger: workspaces.length > 1,
    },
    ...workspaceNav.map((item) => ({ ...item, isWorkspaceTrigger: false })),
  ]

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col h-full shrink-0">
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
                <img src={currentWorkspace.logo_url} alt={currentWorkspace.name} className="w-7 h-7 rounded-md object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{getInitials(currentWorkspace?.name || 'W')}</span>
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate">{currentWorkspace?.name || 'Workspace'}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentWorkspace?.plan?.replace('_', ' ')}</p>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>

            {switcherOpen && (
              <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button key={ws.id} onClick={() => handleSwitchWorkspace(ws.slug)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">{getInitials(ws.name)}</span>
                    </div>
                    <span className="text-sm truncate flex-1">{ws.name}</span>
                    {ws.slug === currentWorkspace?.slug && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button onClick={() => { setSwitcherOpen(false); setCreateWsOpen(true) }}
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
          <Link href="/dashboard"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick('/dashboard', e)}
            className={cn('sidebar-item', pathname === '/dashboard' && 'active', pendingHref === '/dashboard' && 'bg-accent/50')}
          >
            {pendingHref === '/dashboard' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutDashboard className="w-4 h-4" />}
            {t('nav.dashboard')}
          </Link>

          {currentWorkspace && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                {currentWorkspace.name}
              </p>
              {workspaceNav.map(({ href, icon: Icon, label }) => {
                const isActive = pathname.startsWith(href)
                const isPendingThis = pendingHref === href
                return (
                  <Link key={href} href={href} onClick={(e) => handleNavClick(href, e)}
                    className={cn('sidebar-item', isActive && 'active', isPendingThis && !isActive && 'bg-accent/50')}
                  >
                    {isPendingThis && !isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </nav>

        <div className="px-3 py-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setCreateWsOpen(true)}
          >
            <Plus className="w-4 h-4" />
            {t('workspace.create')}
          </Button>
        </div>
      </aside>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around px-2 py-2">
        {bottomNavItems.slice(0, 5).map(({ href, icon: Icon, label, isWorkspaceTrigger }) => {
          const isActive = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href)
          const isPendingThis = pendingHref === href

          return (
            <Link
              key={href}
              href={href}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if (isWorkspaceTrigger) {
                  e.preventDefault()
                  setMobileSwitcherOpen(true)
                  return
                }
                handleNavClick(href, e)
              }}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors min-w-[48px]',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn('p-1.5 rounded-xl transition-colors', isActive && 'bg-primary/10')}>
                {isPendingThis && !isActive
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Icon className="w-5 h-5" />
                }
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ─── MOBILE WORKSPACE SWITCHER MODAL ─── */}
      {mobileSwitcherOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMobileSwitcherOpen(false)} />
          <div className="fixed bottom-20 left-4 right-4 z-50 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm">{t('workspace.switchWorkspace')}</h3>
              <button onClick={() => setMobileSwitcherOpen(false)} className="p-1 rounded-lg hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-2 max-h-64 overflow-y-auto">
              {workspaces.map((ws) => (
                <button key={ws.id} onClick={() => handleSwitchWorkspace(ws.slug)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{getInitials(ws.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ws.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{ws.plan?.replace('_', ' ')}</p>
                  </div>
                  {ws.slug === currentWorkspace?.slug && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button onClick={() => { setMobileSwitcherOpen(false); setCreateWsOpen(true) }}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left text-muted-foreground"
                >
                  <div className="w-8 h-8 rounded-lg border-2 border-dashed border-border flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{t('workspace.create')}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <CreateWorkspaceDialog open={createWsOpen} onOpenChange={setCreateWsOpen} />
    </>
  )
}
