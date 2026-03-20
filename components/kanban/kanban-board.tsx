'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { KanbanColumn } from './kanban-column'
import { TaskDetailDialog } from './task-detail-dialog'
import { CreateColumnDialog } from './create-column-dialog'
import { RepeatManagementPanel } from './repeat-management-panel'
import { Button } from '@/components/ui/button'
import { isHoliday } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, Settings2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Board, Column, Task, WorkspaceMember, Holiday, Label, Workspace } from '@/types'
import { useToast } from '@/components/ui/use-toast'

type ColumnWithTasks = Column & { tasks: Task[] }

interface KanbanBoardProps {
  board: Board & { columns: ColumnWithTasks[] }
  workspace: Workspace
  members: WorkspaceMember[]
  holidays: Holiday[]
  labels: Label[]
  userRole: string
  currentUserId: string
}

export function KanbanBoard({
  board,
  workspace,
  members,
  holidays,
  labels,
  userRole,
  currentUserId,
}: KanbanBoardProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const supabase = createClient()
  const [columns, setColumns] = useState<ColumnWithTasks[]>(
    board.columns.map((col) => ({ ...col, tasks: col.tasks ?? [] }))
  )
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [createColumnOpen, setCreateColumnOpen] = useState(false)
  const [repeatPanelOpen, setRepeatPanelOpen] = useState(false)
  const [mobileColIndex, setMobileColIndex] = useState(0)

  const canEdit = userRole !== 'viewer'
  const canManageRepeat = userRole === 'owner' || userRole === 'admin'
  const todayIsHoliday = isHoliday(new Date(), holidays)

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || !canEdit) return
      const { source, destination, type } = result

      if (type === 'COLUMN') {
        const newColumns = Array.from(columns)
        const [removed] = newColumns.splice(source.index, 1)
        newColumns.splice(destination.index, 0, removed)
        setColumns(newColumns)
        await Promise.all(
          newColumns.map((col, index) =>
            supabase.from('columns').update({ position: index }).eq('id', col.id)
          )
        )
        return
      }

      const sourceColumn = columns.find((c) => c.id === source.droppableId)
      const destColumn = columns.find((c) => c.id === destination.droppableId)
      if (!sourceColumn || !destColumn) return

      const newColumns: ColumnWithTasks[] = columns.map((col) => ({ ...col, tasks: [...(col.tasks ?? [])] }))
      const srcCol = newColumns.find((c) => c.id === source.droppableId)!
      const dstCol = newColumns.find((c) => c.id === destination.droppableId)!

      const [movedTask] = srcCol.tasks.splice(source.index, 1)
      movedTask.column_id = destination.droppableId
      dstCol.tasks.splice(destination.index, 0, movedTask)
      setColumns(newColumns)

      await supabase
        .from('tasks')
        .update({ column_id: destination.droppableId, position: destination.index })
        .eq('id', movedTask.id)

      await Promise.all([
        ...srcCol.tasks.map((task, index) =>
          supabase.from('tasks').update({ position: index }).eq('id', task.id)
        ),
        ...dstCol.tasks.map((task, index) =>
          supabase.from('tasks').update({ position: index }).eq('id', task.id)
        ),
      ])
    },
    [columns, canEdit, supabase]
  )

  const handleTaskCreated = useCallback((columnId: string, task: Task) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, tasks: [...(col.tasks ?? []), task] } : col
      )
    )
  }, [])

  const handleTaskUpdated = useCallback((updatedTask: Task) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: (col.tasks ?? []).map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
      }))
    )
    setSelectedTask((prev) => prev ? { ...prev, ...updatedTask } : null)
  }, [])

  const handleTaskDeleted = useCallback((taskId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: (col.tasks ?? []).filter((t) => t.id !== taskId),
      }))
    )
    setSelectedTask(null)
  }, [])

  const handleTaskMoved = useCallback((taskId: string, fromColumnId: string, toColumnId: string) => {
    setColumns((prev) => {
      const newCols: ColumnWithTasks[] = prev.map((col) => ({ ...col, tasks: [...(col.tasks ?? [])] }))
      const srcCol = newCols.find((c) => c.id === fromColumnId)
      const dstCol = newCols.find((c) => c.id === toColumnId)
      if (!srcCol || !dstCol) return prev

      const taskIndex = srcCol.tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) return prev

      const [task] = srcCol.tasks.splice(taskIndex, 1)
      task.column_id = toColumnId
      dstCol.tasks.unshift(task)
      return newCols
    })
    setSelectedTask((prev) =>
      prev && prev.id === taskId ? { ...prev, column_id: toColumnId } : prev
    )
  }, [])

  const handleColumnCreated = useCallback((column: Column) => {
    setColumns((prev) => [...prev, { ...column, tasks: [] }])
  }, [])

  const handleColumnDeleted = useCallback((columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId))
    setMobileColIndex((i) => Math.max(0, i - 1))
  }, [])

  const handleColumnUpdated = useCallback((updatedColumn: Column) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === updatedColumn.id ? { ...c, ...updatedColumn } : c))
    )
  }, [])

  const plainColumns: Column[] = columns.map(({ tasks, ...col }) => col)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {todayIsHoliday && (
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 rounded-lg px-4 py-2 text-sm">
              🎉 {t('task.holidayWarning')}
            </div>
          )}
        </div>
        {canManageRepeat && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRepeatPanelOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Gestionare Repetări
          </Button>
        )}
      </div>

      {/* ─── MOBILE: o coloană la un moment, butoane stânga/dreapta ─── */}
      <div className="md:hidden">
        {/* Navigare coloane */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setMobileColIndex(i => Math.max(0, i - 1))}
            disabled={mobileColIndex === 0}
            className="p-2 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {columns.map((col, i) => (
              <button
                key={col.id}
                onClick={() => setMobileColIndex(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === mobileColIndex ? 'w-4 bg-primary' : 'w-2 bg-muted-foreground/30'
                )}
              />
            ))}
          </div>

          <button
            onClick={() => setMobileColIndex(i => Math.min(columns.length - 1, i + 1))}
            disabled={mobileColIndex === columns.length - 1}
            className="p-2 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Coloana curentă */}
        {columns[mobileColIndex] && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <KanbanColumn
              column={columns[mobileColIndex]}
              dragHandleProps={null}
              isDragging={false}
              workspace={workspace}
              members={members}
              holidays={holidays}
              labels={labels}
              canEdit={canEdit}
              canManageRepeat={canManageRepeat}
              onTaskClick={setSelectedTask}
              onTaskCreated={handleTaskCreated}
              onColumnDeleted={handleColumnDeleted}
              onColumnUpdated={handleColumnUpdated}
            />
          </DragDropContext>
        )}
      </div>

      {/* ─── DESKTOP: toate coloanele orizontal ─── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="hidden md:flex md:flex-row md:overflow-x-auto gap-4 pb-4 scrollbar-thin"
            >
              {columns.map((column, index) => (
                <Draggable
                  key={column.id}
                  draggableId={`col-${column.id}`}
                  index={index}
                  isDragDisabled={!canEdit}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <KanbanColumn
                        column={column}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        workspace={workspace}
                        members={members}
                        holidays={holidays}
                        labels={labels}
                        canEdit={canEdit}
                        canManageRepeat={canManageRepeat}
                        onTaskClick={setSelectedTask}
                        onTaskCreated={handleTaskCreated}
                        onColumnDeleted={handleColumnDeleted}
                        onColumnUpdated={handleColumnUpdated}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {canEdit && (
                <div className="kanban-column justify-start">
                  <Button
                    variant="outline"
                    className="w-[300px] border-dashed gap-2 text-muted-foreground hover:text-foreground h-10"
                    onClick={() => setCreateColumnOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    {t('board.addColumn')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          columns={plainColumns}
          workspace={workspace}
          members={members}
          holidays={holidays}
          labels={labels}
          canEdit={canEdit}
          canManageRepeat={canManageRepeat}
          currentUserId={currentUserId}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          onTaskMoved={handleTaskMoved}
        />
      )}

      <CreateColumnDialog
        boardId={board.id}
        position={columns.length}
        open={createColumnOpen}
        onOpenChange={setCreateColumnOpen}
        onColumnCreated={handleColumnCreated}
      />

      {canManageRepeat && (
        <RepeatManagementPanel
          columns={columns}
          open={repeatPanelOpen}
          onOpenChange={setRepeatPanelOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </>
  )
}
