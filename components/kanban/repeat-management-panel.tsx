'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { cn, formatDate, getDueDateStatus } from '@/lib/utils'
import { RepeatPicker, getRepeatDisplayText, type RepeatConfig } from './repeat-picker'
import type { Task, Column } from '@/types'
import {
  Repeat, Calendar, Target, Clock, Search,
  ChevronRight, X, Settings2, AlertTriangle,
} from 'lucide-react'

interface RepeatManagementPanelProps {
  columns: Column[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: (task: Task) => void
}

const DUE_DATE_PRESETS = [
  { label: 'Azi', days: 0 },
  { label: 'Mâine', days: 1 },
  { label: '+3z', days: 3 },
  { label: '+1s', days: 7 },
  { label: '+2s', days: 14 },
  { label: '+1l', days: 30 },
] as const

function getDateFromOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function RepeatManagementPanel({
  columns,
  open,
  onOpenChange,
  onTaskUpdated,
}: RepeatManagementPanelProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [repeatPickerOpen, setRepeatPickerOpen] = useState(false)
  const [editingRepeatConfig, setEditingRepeatConfig] = useState<RepeatConfig>({
    repeat: null, repeat_days: null, repeat_time: null, repeat_interval: 1,
  })
  const [filter, setFilter] = useState<'all' | 'repeat' | 'no-repeat'>('all')

  // Gather all tasks from all columns
  const allTasks = columns.flatMap(col =>
    (col.tasks || []).map(task => ({ ...task, _columnName: col.name, _columnColor: col.color }))
  )

  const filteredTasks = allTasks
    .filter(task => {
      if (filter === 'repeat' && !task.repeat) return false
      if (filter === 'no-repeat' && task.repeat) return false
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      // Repeat tasks first, then by due date
      if (a.repeat && !b.repeat) return -1
      if (!a.repeat && b.repeat) return 1
      return 0
    })

  const repeatCount = allTasks.filter(t => t.repeat).length
  const noDueDateCount = allTasks.filter(t => !t.due_date).length

  async function updateTask(taskId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      const original = allTasks.find(t => t.id === taskId)
      if (original) {
        onTaskUpdated({ ...original, ...data })
      }
      toast({ title: 'Actualizat', description: 'Cardul a fost actualizat.' })
    }
  }

  function openRepeatEditor(task: any) {
    setEditingTaskId(task.id)
    setEditingRepeatConfig({
      repeat: task.repeat || null,
      repeat_days: task.repeat_days || null,
      repeat_time: task.repeat_time || null,
      repeat_interval: task.repeat_interval ?? 1,
    })
    setRepeatPickerOpen(true)
  }

  function handleRepeatSave(config: RepeatConfig) {
    if (editingTaskId) {
      updateTask(editingTaskId, {
        repeat: config.repeat,
        repeat_days: config.repeat_days,
        repeat_time: config.repeat_time,
        repeat_interval: config.repeat_interval,
      })
    }
    setEditingTaskId(null)
  }

  function setDueDate(taskId: string, date: string | null) {
    updateTask(taskId, { due_date: date })
  }

  function removeRepeat(taskId: string) {
    updateTask(taskId, {
      repeat: null,
      repeat_days: null,
      repeat_time: null,
      repeat_interval: 1,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0" aria-describedby={undefined}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <DialogHeader className="space-y-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Settings2 className="w-5 h-5 text-primary" />
              Gestionare Repetări & Deadline-uri
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-1">
            Controlează repetările și datele limită pentru toate cardurile de pe board.
            Doar adminii pot modifica aceste setări.
          </p>

          {/* Stats */}
          <div className="flex gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              <Repeat className="w-3 h-3" />
              {repeatCount} cu repetare
            </div>
            {noDueDateCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 px-2.5 py-1 rounded-full font-medium">
                <AlertTriangle className="w-3 h-3" />
                {noDueDateCount} fără deadline
              </div>
            )}
            <div className="text-xs text-muted-foreground px-2.5 py-1">
              {allTasks.length} carduri total
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută carduri..."
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'repeat', 'no-repeat'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                  filter === f
                    ? 'bg-primary text-white border-primary'
                    : 'bg-muted/30 border-border hover:bg-muted text-foreground'
                )}
              >
                {f === 'all' ? 'Toate' : f === 'repeat' ? 'Cu repetare' : 'Fără repetare'}
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        <div className="overflow-y-auto max-h-[calc(85vh-220px)]">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Repeat className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Niciun card găsit</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTasks.map(task => {
                const dueDateStatus = getDueDateStatus(task.due_date)
                const repeatDisplay = getRepeatDisplayText({
                  repeat: task.repeat,
                  repeat_days: task.repeat_days,
                  repeat_time: task.repeat_time,
                  repeat_interval: task.repeat_interval ?? 1,
                })

                return (
                  <div key={task.id} className="px-6 py-3 hover:bg-muted/30 transition-colors">
                    {/* Row 1: Title + Column */}
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={cn(
                        'text-sm font-medium flex-1 truncate',
                        task.completed && 'line-through text-muted-foreground'
                      )}>
                        {task.title}
                      </h4>
                      <span
                        className="text-[10px] font-medium text-white px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: (task as any)._columnColor || '#6b7280' }}
                      >
                        {(task as any)._columnName}
                      </span>
                    </div>

                    {/* Row 2: Repeat + Due Date controls */}
                    <div className="flex items-start gap-4">
                      {/* Repeat control */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Repeat className="w-2.5 h-2.5" />
                          REPETARE
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openRepeatEditor(task)}
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-lg border transition-colors text-left truncate max-w-[200px]',
                              task.repeat
                                ? 'bg-primary/5 border-primary/30 text-foreground font-medium'
                                : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                            )}
                          >
                            {repeatDisplay || 'Fără repetare'}
                          </button>
                          {task.repeat && (
                            <button
                              onClick={() => removeRepeat(task.id)}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Șterge repetarea"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Due date control */}
                      <div className="shrink-0">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Target className="w-2.5 h-2.5" />
                          DATA LIMITĂ
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Current date badge */}
                          {task.due_date ? (
                            <span className={cn(
                              'text-[11px] font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1',
                              dueDateStatus === 'overdue' && 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
                              dueDateStatus === 'today' && 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
                              dueDateStatus === 'soon' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
                              dueDateStatus === 'future' && 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
                            )}>
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDate(task.due_date)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}

                          {/* Quick set buttons */}
                          <div className="flex gap-0.5">
                            {DUE_DATE_PRESETS.slice(0, 4).map(p => (
                              <button
                                key={p.days}
                                onClick={() => setDueDate(task.id, getDateFromOffset(p.days))}
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {p.label}
                              </button>
                            ))}
                            {task.due_date && (
                              <button
                                onClick={() => setDueDate(task.id, null)}
                                className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Repeat Picker Modal */}
        <RepeatPicker
          value={editingRepeatConfig}
          onChange={handleRepeatSave}
          open={repeatPickerOpen}
          onClose={() => { setRepeatPickerOpen(false); setEditingTaskId(null) }}
        />
      </DialogContent>
    </Dialog>
  )
}
