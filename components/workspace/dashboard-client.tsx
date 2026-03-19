'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  FolderKanban, ListTodo, CircleCheck, Target, AlertTriangle,
  Users, X, ExternalLink, Calendar, Clock, ChevronRight,
  ArrowUpRight, Flag,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────
interface DashboardTask {
  id: string
  title: string
  completed: boolean
  due_date: string | null
  assignee_id: string | null
  priority: string | null
  column_id: string
  created_at: string
  assignee: { id: string; full_name: string | null; avatar_url: string | null } | null
  columns: {
    id: string
    name: string
    board_id: string
    boards: {
      id: string
      name: string
      project_id: string
      projects: {
        id: string
        name: string
        workspace_id: string
        workspaces: { slug: string }
      }
    }
  } | null
}

interface DashboardProject {
  id: string
  name: string
  color: string
  workspace_id: string
  workspaces: { name: string; slug: string } | null
}

interface DashboardMember {
  id: string
  workspace_id: string
  user_id: string
  role: string
  profile: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
}

interface DashboardClientProps {
  greeting: string
  firstName: string
  locale: string
  currentUserId: string
  workspaces: any[]
  projects: DashboardProject[]
  tasks: DashboardTask[]
  members: DashboardMember[]
}

type FilterType = 'projects' | 'active' | 'completed' | 'mine' | 'overdue' | 'members' | null

// ── Constants ──────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgent', high: 'Ridicat', medium: 'Mediu', low: 'Scăzut',
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietar', admin: 'Admin', manager: 'Manager', member: 'Membru', viewer: 'Vizualizator',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

// ── Main Component ─────────────────────────────────
export function DashboardClient({
  greeting, firstName, locale, currentUserId,
  workspaces, projects, tasks, members,
}: DashboardClientProps) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterType>(null)

  // ── Computed Stats ────────────────────────────────
  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const completed = tasks.filter(t => t.completed)
    const active = tasks.filter(t => !t.completed)
    const mine = tasks.filter(t => t.assignee_id === currentUserId && !t.completed)
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.completed) return false
      return new Date(t.due_date) < new Date()
    })
    const completionRate = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0

    return { totalTasks, completed, active, mine, overdue, completionRate }
  }, [tasks, currentUserId])

  // ── Filtered Items ────────────────────────────────
  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'active': return stats.active
      case 'completed': return stats.completed
      case 'mine': return stats.mine
      case 'overdue': return stats.overdue
      default: return []
    }
  }, [activeFilter, stats])

  // ── Upcoming deadlines (top 10, not overdue) ──────
  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter(t => t.due_date && !t.completed && new Date(t.due_date) >= new Date())
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 10)
  }, [tasks])

  // ── My tasks (top 10) ────────────────────────────
  const myTasksList = useMemo(() => {
    return tasks
      .filter(t => t.assignee_id === currentUserId && !t.completed)
      .sort((a, b) => {
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (a.due_date) return -1
        if (b.due_date) return 1
        return 0
      })
      .slice(0, 10)
  }, [tasks, currentUserId])

  function handleStatClick(filter: FilterType) {
    setActiveFilter(activeFilter === filter ? null : filter)
  }

  function navigateToTask(task: DashboardTask) {
    const board = task.columns?.boards
    const ws = board?.projects?.workspaces
    if (ws && board) {
      router.push(`/${locale}/workspace/${ws.slug}/board/${board.id}`)
    }
  }

  function navigateToProject(project: DashboardProject) {
    if (project.workspaces) {
      router.push(`/${locale}/workspace/${project.workspaces.slug}/projects`)
    }
  }

  // ── Stat Cards Config ─────────────────────────────
  const statCards: {
    key: FilterType
    label: string
    value: number
    icon: any
    color: string
    bg: string
    subtext?: string
  }[] = [
    {
      key: 'projects', label: 'Proiecte', value: projects.length,
      icon: FolderKanban, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      key: 'active', label: 'Task-uri active', value: stats.active.length,
      icon: ListTodo, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      key: 'completed', label: 'Completate', value: stats.completed.length,
      icon: CircleCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30',
      subtext: stats.totalTasks > 0 ? `${stats.completionRate}% din total` : undefined,
    },
    {
      key: 'mine', label: 'Task-urile mele', value: stats.mine.length,
      icon: Target, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      key: 'overdue', label: 'Întârziate', value: stats.overdue.length,
      icon: AlertTriangle,
      color: stats.overdue.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
      bg: stats.overdue.length > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30',
    },
    {
      key: 'members', label: 'Membri', value: members.length,
      icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    },
  ]

  const FILTER_TITLES: Record<string, string> = {
    projects: 'Proiecte',
    active: 'Task-uri active',
    completed: 'Task-uri completate',
    mine: 'Task-urile mele',
    overdue: 'Task-uri întârziate',
    members: 'Membri',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{greeting}, {firstName}! 👋</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      {/* ── Stat Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const isActive = activeFilter === stat.key
          return (
            <button
              key={stat.key}
              onClick={() => handleStatClick(stat.key)}
              className={cn(
                'bg-card border rounded-xl p-4 text-left transition-all hover:shadow-md',
                isActive
                  ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2 rounded-lg', stat.bg)}>
                  <stat.icon className={cn('w-4 h-4', stat.color)} />
                </div>
                {stat.value > 0 && (
                  <ChevronRight className={cn(
                    'w-3.5 h-3.5 text-muted-foreground transition-transform',
                    isActive && 'rotate-90'
                  )} />
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              {stat.subtext && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.subtext}</p>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Expanded Detail Panel ───────────────────── */}
      {activeFilter && (
        <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-semibold text-sm">
              {FILTER_TITLES[activeFilter]}
              <span className="text-muted-foreground font-normal ml-2">
                ({activeFilter === 'projects' ? projects.length : activeFilter === 'members' ? members.length : filteredTasks.length})
              </span>
            </h3>
            <button
              onClick={() => setActiveFilter(null)}
              className="p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {/* Projects list */}
            {activeFilter === 'projects' && (
              projects.length === 0 ? (
                <EmptyState text="Niciun proiect" />
              ) : (
                projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => navigateToProject(project)}
                    className="flex items-center gap-3 px-5 py-3.5 w-full text-left hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color || '#3b82f6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.workspaces?.name}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))
              )
            )}

            {/* Members list */}
            {activeFilter === 'members' && (
              members.length === 0 ? (
                <EmptyState text="Niciun membru" />
              ) : (
                members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={member.profile?.avatar_url || ''} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {member.profile?.full_name?.charAt(0)?.toUpperCase() ||
                         member.profile?.email?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.profile?.full_name || 'Fără nume'}
                        {member.user_id === currentUserId && (
                          <span className="text-xs text-muted-foreground ml-1">(tu)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.profile?.email}
                      </p>
                    </div>
                    <Badge variant="secondary" className={cn('text-[10px]', ROLE_COLORS[member.role])}>
                      {ROLE_LABELS[member.role]}
                    </Badge>
                  </div>
                ))
              )
            )}

            {/* Tasks lists */}
            {activeFilter !== 'projects' && activeFilter !== 'members' && (
              filteredTasks.length === 0 ? (
                <EmptyState text={
                  activeFilter === 'overdue' ? 'Niciun task întârziat! 🎉' :
                  activeFilter === 'mine' ? 'Niciun task asignat ție' :
                  'Niciun task'
                } />
              ) : (
                filteredTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    locale={locale}
                    onClick={() => navigateToTask(task)}
                  />
                ))
              )
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Grid: My Tasks + Upcoming ────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* My Tasks */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            <h2 className="font-semibold text-sm">Task-urile mele</h2>
            {myTasksList.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {myTasksList.length}
              </span>
            )}
          </div>
          {myTasksList.length === 0 ? (
            <EmptyState text="Niciun task activ asignat ție" icon={Target} />
          ) : (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {myTasksList.map(task => (
                <TaskRow key={task.id} task={task} locale={locale} onClick={() => navigateToTask(task)} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-sm">Deadline-uri apropiate</h2>
            {upcomingDeadlines.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {upcomingDeadlines.length}
              </span>
            )}
          </div>
          {upcomingDeadlines.length === 0 ? (
            <EmptyState text="Niciun deadline apropiat" icon={Clock} />
          ) : (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {upcomingDeadlines.map(task => (
                <TaskRow key={task.id} task={task} locale={locale} showDeadlineUrgency onClick={() => navigateToTask(task)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Task Row Component ─────────────────────────────
function TaskRow({
  task, locale, showDeadlineUrgency, onClick,
}: {
  task: DashboardTask
  locale: string
  showDeadlineUrgency?: boolean
  onClick: () => void
}) {
  const project = task.columns?.boards?.projects
  const boardName = task.columns?.boards?.name
  const columnName = task.columns?.name

  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date()
  const isToday = task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString()

  const getDaysUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getUrgencyBadge = (date: string) => {
    const days = getDaysUntil(date)
    if (days < 0) return { text: 'Întârziat', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    if (days === 0) return { text: 'Azi', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
    if (days === 1) return { text: 'Mâine', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
    if (days <= 3) return { text: `${days} zile`, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    return { text: `${days} zile`, cls: 'bg-muted text-muted-foreground' }
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-3.5 w-full text-left hover:bg-muted/30 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-sm truncate',
          task.completed && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {project && (
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
              {project.name} › {boardName}
            </span>
          )}
          {columnName && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {columnName}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.assignee && (
          <Avatar className="w-5 h-5">
            <AvatarImage src={task.assignee.avatar_url || ''} />
            <AvatarFallback className="text-[8px]">
              {task.assignee.full_name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        )}

        {task.priority && (
          <Badge variant="secondary" className={cn('text-[10px]', PRIORITY_COLORS[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </Badge>
        )}

        {task.due_date && showDeadlineUrgency && (
          <Badge variant="secondary" className={cn('text-[10px] gap-1', getUrgencyBadge(task.due_date).cls)}>
            {getDaysUntil(task.due_date) < 0 && <AlertTriangle className="w-3 h-3" />}
            {getUrgencyBadge(task.due_date).text}
          </Badge>
        )}

        {task.due_date && !showDeadlineUrgency && (
          <div className={cn(
            'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
            isOverdue && !isToday
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : isToday
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-muted text-muted-foreground'
          )}>
            {isOverdue && !isToday && <AlertTriangle className="w-3 h-3" />}
            <Calendar className="w-3 h-3" />
            {new Date(task.due_date).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', {
              day: 'numeric', month: 'short',
            })}
          </div>
        )}

        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  )
}

// ── Empty State ────────────────────────────────────
function EmptyState({ text, icon: Icon }: { text: string; icon?: any }) {
  const IconComp = Icon || ListTodo
  return (
    <div className="text-center py-10 text-muted-foreground">
      <IconComp className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
