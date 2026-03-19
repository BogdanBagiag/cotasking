'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { cn, getDueDateStatus, formatDate, formatDateTime, getInitials, isHoliday } from '@/lib/utils'
import { getRepeatDisplayText } from './repeat-picker'
import type { Task, Column, WorkspaceMember, Holiday, Label, Workspace, Subtask, Comment, Profile } from '@/types'
import {
  Calendar, User, Flag, Tag, CheckSquare, MessageSquare,
  Trash2, Check, Plus, X, Sun, AlignLeft, Repeat,
  Clock, ArrowRight, Palette, Paperclip,
} from 'lucide-react'

interface TaskDetailDialogProps {
  task: Task
  columns: Column[]
  workspace: Workspace
  members: WorkspaceMember[]
  holidays: Holiday[]
  labels: Label[]
  canEdit: boolean
  canManageRepeat: boolean
  currentUserId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: (task: Task) => void
  onTaskDeleted: (taskId: string) => void
  onTaskMoved: (taskId: string, fromColumnId: string, toColumnId: string) => void
}

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
  { value: 'high', label: 'Ridicată', color: '#f97316' },
  { value: 'medium', label: 'Medie', color: '#eab308' },
  { value: 'low', label: 'Scăzută', color: '#22c55e' },
] as const

const COVER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280',
]



export function TaskDetailDialog({
  task,
  columns,
  workspace,
  members,
  holidays,
  labels,
  canEdit,
  canManageRepeat,
  currentUserId,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskDeleted,
  onTaskMoved,
}: TaskDetailDialogProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const supabase = createClient()

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [taskLabels, setTaskLabels] = useState<Label[]>(task.labels || [])
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentTask, setCurrentTask] = useState(task)

  const dueDateStatus = getDueDateStatus(currentTask.due_date)
  const onHoliday = currentTask.due_date
    ? isHoliday(new Date(currentTask.due_date), holidays)
    : false

  const currentColumn = columns.find(c => c.id === currentTask.column_id)
  const sortedColumns = [...columns].sort((a, b) => a.position - b.position)

  useEffect(() => {
    if (open) {
      setCurrentTask(task)
      setTitle(task.title)
      setDescription(task.description || '')
      setTaskLabels(task.labels || [])
      loadSubtasks()
      loadComments()
    }
  }, [open, task.id])

  async function loadSubtasks() {
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', task.id)
      .order('position')
    setSubtasks(data || [])
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at')
    if (!error && data) {
      // Fetch profiles for comment authors
      const userIds = [...new Set(data.map(c => c.user_id))]
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
        setComments(data.map(c => ({ ...c, profile: profileMap[c.user_id] || null })))
      } else {
        setComments(data)
      }
    } else {
      if (error) console.warn('Comments not available:', error.message)
      setComments([])
    }
  }

  async function updateTask(updates: Record<string, any>) {
    setSaving(true)
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)
      .select()
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      const updated = { ...currentTask, ...data }
      setCurrentTask(updated)
      onTaskUpdated(updated)
    }
    setSaving(false)
  }

  async function moveToColumn(targetColumnId: string) {
    if (targetColumnId === currentTask.column_id) return
    const oldColumnId = currentTask.column_id
    const { error } = await supabase
      .from('tasks')
      .update({ column_id: targetColumnId, position: 0 })
      .eq('id', task.id)

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      const updated = { ...currentTask, column_id: targetColumnId }
      setCurrentTask(updated)
      onTaskMoved(task.id, oldColumnId, targetColumnId)
    }
  }

  async function handleTitleBlur() {
    if (title !== currentTask.title && title.trim()) {
      await updateTask({ title: title.trim() })
    }
  }

  async function handleDescriptionBlur() {
    if (description !== (currentTask.description || '')) {
      await updateTask({ description: description || null })
    }
  }

  async function handleToggleComplete() {
    const newCompleted = !currentTask.completed
    await updateTask({ completed: newCompleted })
    if (newCompleted && sortedColumns.length > 0) {
      const lastColumn = sortedColumns[sortedColumns.length - 1]
      if (lastColumn.id !== currentTask.column_id) {
        await moveToColumn(lastColumn.id)
      }
    }
  }

  async function addSubtask() {
    if (!newSubtask.trim()) return
    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: task.id, title: newSubtask.trim(), position: subtasks.length })
      .select()
      .single()
    if (!error && data) {
      setSubtasks(prev => [...prev, data])
      setNewSubtask('')
    }
  }

  async function toggleSubtask(subtaskId: string, completed: boolean) {
    await supabase.from('subtasks').update({ completed }).eq('id', subtaskId)
    setSubtasks(prev => prev.map(s => (s.id === subtaskId ? { ...s, completed } : s)))
  }

  async function deleteSubtask(subtaskId: string) {
    await supabase.from('subtasks').delete().eq('id', subtaskId)
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId))
  }

  async function addComment() {
    if (!newComment.trim()) return
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: task.id, user_id: currentUserId, content: newComment.trim() })
      .select('*')
      .single()
    if (!error && data) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', currentUserId)
        .single()
      setComments(prev => [...prev, { ...data, profile: profile || null }])
      setNewComment('')
    }
  }

  async function handleToggleLabel(label: Label) {
    const hasLabel = taskLabels.some(l => l.id === label.id)
    if (hasLabel) {
      await supabase.from('task_labels').delete().eq('task_id', task.id).eq('label_id', label.id)
      setTaskLabels(prev => prev.filter(l => l.id !== label.id))
    } else {
      await supabase.from('task_labels').insert({ task_id: task.id, label_id: label.id })
      setTaskLabels(prev => [...prev, label])
    }
  }

  async function handleDelete() {
    if (!confirm('Ești sigur că vrei să ștergi acest task?')) return
    await supabase.from('tasks').delete().eq('id', task.id)
    onTaskDeleted(task.id)
    onOpenChange(false)
  }

  const assignee = members.find(m => (m as any).profile?.id === currentTask.assignee_id)?.profile as Profile | undefined
  const completedSubtasks = subtasks.filter(s => s.completed).length
  const subtaskProgress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0

  const repeatDisplay = getRepeatDisplayText({
    repeat: currentTask.repeat,
    repeat_days: currentTask.repeat_days,
    repeat_time: currentTask.repeat_time,
    repeat_interval: currentTask.repeat_interval ?? 1,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 [&>button:last-child]:hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{currentTask.title}</DialogTitle>
        {/* Cover color */}
        {currentTask.cover_color && (
          <div className="h-4 rounded-t-lg shrink-0" style={{ backgroundColor: currentTask.cover_color }} />
        )}

        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 z-10">
          <div className="flex items-start gap-3">
            <button
              onClick={handleToggleComplete}
              disabled={!canEdit}
              className={cn(
                'mt-0.5 w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                currentTask.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-border hover:border-primary'
              )}
            >
              {currentTask.completed && <Check className="w-3.5 h-3.5" />}
            </button>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              disabled={!canEdit}
              className={cn(
                'flex-1 text-lg font-semibold bg-transparent border-none outline-none',
                currentTask.completed && 'line-through text-muted-foreground'
              )}
            />

            {canEdit && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status buttons */}
          {canEdit && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {sortedColumns.map(col => (
                <button
                  key={col.id}
                  onClick={() => moveToColumn(col.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    col.id === currentTask.column_id
                      ? 'text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                  style={col.id === currentTask.column_id ? { backgroundColor: col.color || '#3b82f6' } : {}}
                >
                  {col.id !== currentTask.column_id && <ArrowRight className="w-3 h-3" />}
                  {col.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_220px] gap-0">
          {/* Main content */}
          <div className="px-6 py-4 space-y-6 border-r border-border">
            {/* Description */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <AlignLeft className="w-4 h-4" />
                {t('task.description')}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                disabled={!canEdit}
                placeholder={t('task.noDescription')}
                rows={4}
                className="w-full text-sm bg-muted/30 border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            {/* Labels */}
            {labels.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Tag className="w-4 h-4" />
                  {t('task.labels')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {labels.map(label => {
                    const active = taskLabels.some(l => l.id === label.id)
                    return (
                      <button
                        key={label.id}
                        onClick={() => canEdit && handleToggleLabel(label)}
                        disabled={!canEdit}
                        className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-opacity',
                          active ? 'opacity-100 text-white' : 'opacity-40 hover:opacity-70'
                        )}
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <CheckSquare className="w-4 h-4" />
                Checklist
                {subtasks.length > 0 && (
                  <span className="text-xs">{completedSubtasks}/{subtasks.length}</span>
                )}
              </div>

              {subtasks.length > 0 && (
                <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                  <div
                    className={cn(
                      'rounded-full h-1.5 transition-all',
                      subtaskProgress === 100 ? 'bg-green-500' : 'bg-primary'
                    )}
                    style={{ width: `${subtaskProgress}%` }}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                {subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggleSubtask(subtask.id, !subtask.completed)}
                      className={cn(
                        'w-[18px] h-[18px] rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                        subtask.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-border hover:border-primary'
                      )}
                    >
                      {subtask.completed && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <span className={cn('text-sm flex-1', subtask.completed && 'line-through text-muted-foreground')}>
                      {subtask.title}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => deleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    placeholder="Adaugă item..."
                    className="h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={addSubtask} className="h-8 px-2">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Attachments placeholder */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Paperclip className="w-4 h-4" />
                Atașamente
              </div>
              <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground">
                <Paperclip className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
                Drag & drop fișiere sau click pentru a atașa
                <p className="mt-1 text-[10px]">(necesită configurare Storage)</p>
              </div>
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <MessageSquare className="w-4 h-4" />
                {t('task.comments')}
                {comments.length > 0 && <span className="text-xs">{comments.length}</span>}
              </div>

              <div className="space-y-3 mb-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                      {(comment as any).profile?.avatar_url && (
                        <AvatarImage src={(comment as any).profile.avatar_url} />
                      )}
                      <AvatarFallback className="text-[9px]">
                        {getInitials((comment as any).profile?.full_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium">
                          {(comment as any).profile?.full_name || 'Utilizator'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addComment()}
                  placeholder={t('task.addComment')}
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addComment} className="h-8 px-2">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="px-4 py-4 space-y-4 text-sm">
            {/* Status */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Status</p>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: currentColumn?.color || '#6b7280' }}
              >
                {currentColumn?.name || 'Necunoscut'}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {t('task.assignee')}
              </p>
              {canEdit ? (
                <select
                  value={currentTask.assignee_id || ''}
                  onChange={(e) => updateTask({ assignee_id: e.target.value || null })}
                  className="w-full text-sm bg-muted/30 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">— Neasignat</option>
                  {members.map(m => (
                    <option key={(m as any).profile?.id} value={(m as any).profile?.id}>
                      {(m as any).profile?.full_name || (m as any).profile?.email}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  {assignee ? (
                    <>
                      <Avatar className="w-5 h-5">
                        {assignee.avatar_url && <AvatarImage src={assignee.avatar_url} />}
                        <AvatarFallback className="text-[9px]">{getInitials(assignee.full_name || 'U')}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee.full_name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Neasignat</span>
                  )}
                </div>
              )}
            </div>

            {/* Due date - READ ONLY (se setează doar la creare) */}
            <div>
              <p className={cn(
                'text-xs font-medium mb-1.5 flex items-center gap-1.5',
                onHoliday ? 'text-orange-500' : 'text-muted-foreground'
              )}>
                {onHoliday ? <Sun className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                Data limită
                {onHoliday && <span className="text-[10px]">(zi liberă)</span>}
              </p>

              {currentTask.due_date ? (
                <div className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
                  dueDateStatus === 'overdue' && 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
                  dueDateStatus === 'today' && 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900',
                  dueDateStatus === 'soon' && 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900',
                  dueDateStatus === 'future' && 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
                  !dueDateStatus && 'bg-muted text-muted-foreground border-border',
                )}>
                  <Calendar className="w-3 h-3" />
                  {dueDateStatus === 'overdue' && '⚠️ '}
                  {dueDateStatus === 'today' && 'Azi — '}
                  {formatDate(currentTask.due_date)}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Fără dată limită</span>
              )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" />
                {t('task.priority')}
              </p>
              {canEdit ? (
                <select
                  value={currentTask.priority || ''}
                  onChange={(e) => updateTask({ priority: e.target.value || null })}
                  className="w-full text-sm bg-muted/30 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">— Fără</option>
                  {PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm capitalize">{currentTask.priority || '—'}</span>
              )}
            </div>

            {/* Repeat - read only, manage from creation or Gestionare Repetări */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5" />
                Repetare
              </p>
              <span className={cn(
                'text-sm block px-2 py-1.5 rounded-lg',
                currentTask.repeat
                  ? 'bg-primary/5 border border-primary/20 text-foreground'
                  : 'text-muted-foreground'
              )}>
                {repeatDisplay || 'Fără repetare'}
              </span>
              {currentTask.repeat && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Gestionează din „Gestionare Repetări"
                </p>
              )}
            </div>

            {/* Estimated time */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Timp estimat
              </p>
              {canEdit ? (
                <input
                  type="number"
                  min="0"
                  value={currentTask.estimated_minutes || ''}
                  onChange={(e) => updateTask({ estimated_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="minute"
                  className="w-full text-sm bg-muted/30 border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <span className="text-sm">
                  {currentTask.estimated_minutes
                    ? currentTask.estimated_minutes >= 60
                      ? `${Math.floor(currentTask.estimated_minutes / 60)}h ${currentTask.estimated_minutes % 60}m`
                      : `${currentTask.estimated_minutes}m`
                    : '—'}
                </span>
              )}
            </div>

            {/* Cover color */}
            {canEdit && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Copertă
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => updateTask({ cover_color: null })}
                    className={cn(
                      'w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center',
                      !currentTask.cover_color && 'ring-1 ring-primary ring-offset-1'
                    )}
                  >
                    <X className="w-2.5 h-2.5 text-muted-foreground" />
                  </button>
                  {COVER_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => updateTask({ cover_color: c })}
                      className={cn(
                        'w-5 h-5 rounded-full',
                        currentTask.cover_color === c && 'ring-1 ring-primary ring-offset-1'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Created */}
            <div className="pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground">
                Creat {formatDateTime(task.created_at)}
              </p>
              {task.updated_at !== task.created_at && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Actualizat {formatDateTime(task.updated_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
