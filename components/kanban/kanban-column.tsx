'use client'

import { useState } from 'react'
import { Droppable, Draggable, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { KanbanCard } from './kanban-card'
import { CreateTaskDialog } from './create-task-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { Column, Task, WorkspaceMember, Holiday, Label, Workspace } from '@/types'
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Palette, Check } from 'lucide-react'

interface KanbanColumnProps {
  column: Column & { tasks: Task[] }
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined
  isDragging: boolean
  workspace: Workspace
  members: WorkspaceMember[]
  holidays: Holiday[]
  labels: Label[]
  canEdit: boolean
  canManageRepeat: boolean
  onTaskClick: (task: Task) => void
  onTaskCreated: (columnId: string, task: Task) => void
  onColumnDeleted: (columnId: string) => void
  onColumnUpdated: (column: Column) => void
}

// Preset colors for columns
const COLUMN_COLORS = [
  { value: '#ef4444', label: 'Roșu' },
  { value: '#f97316', label: 'Portocaliu' },
  { value: '#eab308', label: 'Galben' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Albastru' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Roz' },
  { value: '#6b7280', label: 'Gri' },
]

// Default colors for common column names
const DEFAULT_COLUMN_COLORS: Record<string, string> = {
  'de făcut': '#ef4444',
  'to do': '#ef4444',
  'todo': '#ef4444',
  'backlog': '#6b7280',
  'în progres': '#3b82f6',
  'in progress': '#3b82f6',
  'review': '#f97316',
  'în review': '#f97316',
  'finalizat': '#22c55e',
  'done': '#22c55e',
  'completat': '#22c55e',
  'testing': '#8b5cf6',
  'blocat': '#ef4444',
  'blocked': '#ef4444',
}

function getColumnColor(column: Column): string {
  if (column.color) return column.color
  const normalized = column.name.toLowerCase().trim()
  return DEFAULT_COLUMN_COLORS[normalized] || '#6b7280'
}

// Convert hex to rgb for CSS
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '107, 114, 128'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}

export function KanbanColumn({
  column,
  dragHandleProps,
  isDragging,
  workspace,
  members,
  holidays,
  labels,
  canEdit,
  canManageRepeat,
  onTaskClick,
  onTaskCreated,
  onColumnDeleted,
  onColumnUpdated,
}: KanbanColumnProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const supabase = createClient()
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(column.name)

  const color = getColumnColor(column)
  const rgb = hexToRgb(color)

  async function handleRename() {
    if (!name.trim() || name === column.name) {
      setEditingName(false)
      setName(column.name)
      return
    }

    const { data, error } = await supabase
      .from('columns')
      .update({ name: name.trim() })
      .eq('id', column.id)
      .select()
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
      setName(column.name)
    } else {
      onColumnUpdated(data)
    }
    setEditingName(false)
  }

  async function handleColorChange(newColor: string) {
    const { data, error } = await supabase
      .from('columns')
      .update({ color: newColor })
      .eq('id', column.id)
      .select()
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      onColumnUpdated(data)
    }
    setColorPickerOpen(false)
    setMenuOpen(false)
  }

  async function handleDelete() {
    if (!confirm(t('board.deleteColumnConfirm'))) return

    const { error } = await supabase.from('columns').delete().eq('id', column.id)

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      onColumnDeleted(column.id)
    }
    setMenuOpen(false)
  }

  return (
    <div
      className={cn(
  'w-full md:w-[300px] md:shrink-0 rounded-xl overflow-hidden',
  isDragging && 'opacity-80 shadow-xl'
)}
      style={{
        backgroundColor: `rgba(${rgb}, 0.04)`,
        border: `1px solid rgba(${rgb}, 0.15)`,
      }}
    >
      {/* Colored top bar */}
      <div
        className="h-2 w-full rounded-t-xl"
        style={{ backgroundColor: color }}
      />

      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3 group">
        {/* Drag handle */}
        {canEdit && (
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-1"
          style={{ backgroundColor: color, outlineColor: `rgba(${rgb}, 0.3)` }}
        />

        {/* Name */}
        {editingName ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setEditingName(false); setName(column.name) }
            }}
            className="h-7 text-sm font-semibold px-1.5 py-0 border-none focus-visible:ring-1"
            autoFocus
          />
        ) : (
          <h3 className="text-sm font-semibold flex-1 truncate">
            {column.name}
          </h3>
        )}

        {/* Task count badge */}
        <span
          className="text-xs font-semibold rounded-full px-2 py-0.5 shrink-0"
          style={{
            backgroundColor: `rgba(${rgb}, 0.10)`,
            color: `rgba(${rgb}, 0.8)`,
          }}
        >
          {column.tasks.length}
        </span>

        {/* Column menu */}
        {canEdit && (
          <div className="relative">
            <button
              onClick={() => { setMenuOpen(!menuOpen); setColorPickerOpen(false) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setColorPickerOpen(false) }} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg py-1 z-20 text-sm">
                  <button
                    onClick={() => { setEditingName(true); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Redenumește
                  </button>

                  {/* Color picker toggle */}
                  <button
                    onClick={() => setColorPickerOpen(!colorPickerOpen)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Schimbă culoarea
                  </button>

                  {/* Inline color picker */}
                  {colorPickerOpen && (
                    <div className="px-3 py-2 border-t border-border">
                      <div className="grid grid-cols-5 gap-1.5">
                        {COLUMN_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => handleColorChange(c.value)}
                            className={cn(
                              'w-7 h-7 rounded-full transition-all hover:scale-110 flex items-center justify-center',
                              color === c.value && 'ring-2 ring-offset-2 ring-foreground/30'
                            )}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          >
                            {color === c.value && (
                              <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tasks droppable area */}
      <Droppable droppableId={column.id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'space-y-2 min-h-[80px] rounded-lg px-2 pb-2 transition-colors',
              snapshot.isDraggingOver && 'bg-primary/5'
            )}
            style={snapshot.isDraggingOver ? {
              backgroundColor: `rgba(${rgb}, 0.08)`,
            } : {}}
          >
            {column.tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
                isDragDisabled={!canEdit}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <KanbanCard
                      task={task}
                      holidays={holidays}
                      isDragging={snapshot.isDragging}
                      onClick={() => onTaskClick(task)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div
                className="flex items-center justify-center h-20 text-xs text-muted-foreground rounded-lg border border-dashed border-border"
              >
                {canEdit ? 'Trage task-uri aici sau adaugă unul nou' : 'Niciun task'}
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Add task button */}
      {canEdit && (
        <div className="px-2 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setCreateTaskOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Task nou
          </Button>
        </div>
      )}

      <CreateTaskDialog
        columnId={column.id}
        position={column.tasks.length}
        workspace={workspace}
        members={members}
        labels={labels}
        canManageRepeat={canManageRepeat}
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={(task) => onTaskCreated(column.id, task)}
      />
    </div>
  )
}
