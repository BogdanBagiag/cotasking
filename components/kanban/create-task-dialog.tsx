'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn, formatDate } from '@/lib/utils'
import { RepeatPicker, getRepeatDisplayText, type RepeatConfig } from './repeat-picker'
import {
  Loader2, Calendar, Repeat, AlignLeft, CheckSquare,
  User, Flag, Clock, Palette, Plus, X, ChevronDown, ChevronUp, Target,
} from 'lucide-react'
import type { Task, WorkspaceMember, Label as LabelType, Workspace } from '@/types'

interface CreateTaskDialogProps {
  columnId: string
  position: number
  workspace: Workspace
  members: WorkspaceMember[]
  labels: LabelType[]
  canManageRepeat: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: (task: Task) => void
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

const DUE_DATE_PRESETS = [
  { label: 'Azi', days: 0 },
  { label: 'Mâine', days: 1 },
  { label: '+3 zile', days: 3 },
  { label: '+1 săpt.', days: 7 },
  { label: '+2 săpt.', days: 14 },
  { label: '+1 lună', days: 30 },
] as const

function getDateFromOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function CreateTaskDialog({
  columnId,
  position,
  workspace,
  members,
  labels,
  canManageRepeat,
  open,
  onOpenChange,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [coverColor, setCoverColor] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [showMore, setShowMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [repeatPickerOpen, setRepeatPickerOpen] = useState(false)
  const [repeatConfig, setRepeatConfig] = useState<RepeatConfig>({
    repeat: null,
    repeat_days: null,
    repeat_time: null,
    repeat_interval: 1,
  })

  function resetForm() {
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority('')
    setAssigneeId('')
    setCoverColor('')
    setEstimatedMinutes('')
    setChecklistItems([])
    setNewChecklistItem('')
    setSelectedLabels([])
    setShowMore(false)
    setRepeatConfig({ repeat: null, repeat_days: null, repeat_time: null, repeat_interval: 1 })
  }

  function addChecklistItem() {
    if (!newChecklistItem.trim()) return
    setChecklistItems(prev => [...prev, newChecklistItem.trim()])
    setNewChecklistItem('')
  }

  function removeChecklistItem(index: number) {
    setChecklistItems(prev => prev.filter((_, i) => i !== index))
  }

  function toggleLabel(labelId: string) {
    setSelectedLabels(prev =>
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    )
  }

  const repeatDisplay = getRepeatDisplayText(repeatConfig)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        column_id: columnId,
        title: title.trim(),
        description: description.trim() || null,
        position,
        due_date: dueDate || null,
        repeat: repeatConfig.repeat,
        repeat_days: repeatConfig.repeat_days,
        repeat_time: repeatConfig.repeat_time,
        repeat_interval: repeatConfig.repeat_interval,
        is_repeat_template: !!repeatConfig.repeat,
        priority: priority || null,
        assignee_id: assigneeId || null,
        cover_color: coverColor || null,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        created_by: user.id,
      })
      .select(`
        *,
        assignee:profiles!tasks_assignee_profile_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    if (checklistItems.length > 0) {
      await supabase.from('subtasks').insert(
        checklistItems.map((item, i) => ({
          task_id: data.id,
          title: item,
          position: i,
        }))
      )
    }

    if (selectedLabels.length > 0) {
      await supabase.from('task_labels').insert(
        selectedLabels.map(labelId => ({
          task_id: data.id,
          label_id: labelId,
        }))
      )
    }

    const taskLabels = labels.filter(l => selectedLabels.includes(l.id))

    onTaskCreated({
      ...data,
      labels: taskLabels,
      subtasks: checklistItems.map((item, i) => ({
        id: `temp-${i}`,
        task_id: data.id,
        title: item,
        completed: false,
        position: i,
        created_at: new Date().toISOString(),
      })),
      comments: [],
      _count: {
        subtasks: checklistItems.length,
        completed_subtasks: 0,
        comments: 0,
        attachments: 0,
      },
    })

    resetForm()
    onOpenChange(false)
    toast({ title: t('common.success'), description: 'Task creat cu succes!' })
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('task.create')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          {coverColor && (
            <div className="h-3 -mx-6 -mt-4 rounded-t-lg" style={{ backgroundColor: coverColor }} />
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">{t('task.name')} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Implementează autentificarea"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              {t('task.description')}
            </Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descriere task (opțional)..."
              rows={3}
              className="w-full text-sm bg-muted/30 border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Due date with presets - admin only */}
          {canManageRepeat && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Data limită
            </Label>
            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5">
              {DUE_DATE_PRESETS.map(p => {
                const presetDate = getDateFromOffset(p.days)
                const isActive = dueDate === presetDate
                return (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => setDueDate(isActive ? '' : presetDate)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                      isActive
                        ? 'bg-primary text-white border-primary'
                        : 'bg-muted/30 border-border hover:bg-muted text-foreground'
                    )}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
            {/* Custom date */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Show selected date */}
            {dueDate && (
              <p className="text-xs text-primary font-medium flex items-center gap-1">
                <Target className="w-3 h-3" />
                Deadline: {formatDate(dueDate)}
              </p>
            )}
          </div>
          )}

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              {t('task.priority')}
            </Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— Fără</option>
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t('task.assignee')}
            </Label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— Neasignat</option>
              {members.map(m => (
                <option key={(m as any).profile?.id} value={(m as any).profile?.id}>
                  {(m as any).profile?.full_name || (m as any).profile?.email}
                </option>
              ))}
            </select>
          </div>

          {/* Checklist */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              Checklist
            </Label>
            {checklistItems.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1">{item}</span>
                    <button type="button" onClick={() => removeChecklistItem(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                placeholder="Adaugă item..."
                className="h-9 text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={addChecklistItem} className="h-9 px-3">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Labels */}
          {labels.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t('task.labels')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {labels.map(label => {
                  const active = selectedLabels.includes(label.id)
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-opacity',
                        active ? 'opacity-100 text-white' : 'opacity-40 hover:opacity-70 text-white'
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

          {/* More options */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showMore ? 'Mai puține opțiuni' : 'Mai multe opțiuni'}
          </button>

          {showMore && (
            <div className="space-y-4 pt-1 border-t border-border">
              {canManageRepeat && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  Repetare
                </Label>
                <button
                  type="button"
                  onClick={() => setRepeatPickerOpen(true)}
                  className={cn(
                    'w-full text-left text-sm border border-border rounded-lg px-3 py-2 transition-colors',
                    repeatConfig.repeat
                      ? 'bg-primary/5 border-primary/30 text-foreground'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {repeatDisplay || 'Configurează repetare...'}
                </button>
              </div>
              )}

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Timp estimat (minute)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="Ex: 120"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Culoare copertă
                </Label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCoverColor('')}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 border-dashed border-border flex items-center justify-center',
                      !coverColor && 'ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                  {COVER_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoverColor(c)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-transform hover:scale-110',
                        coverColor === c && 'ring-2 ring-primary ring-offset-2 scale-110'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false) }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.create')}
            </Button>
          </div>
        </form>

        <RepeatPicker
          value={repeatConfig}
          onChange={setRepeatConfig}
          open={repeatPickerOpen}
          onClose={() => setRepeatPickerOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
