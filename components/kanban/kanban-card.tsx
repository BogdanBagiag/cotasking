'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, getDueDateStatus, formatDate, isHoliday, getInitials } from '@/lib/utils'
import type { Task, Holiday } from '@/types'
import {
  Calendar, MessageSquare, CheckSquare,
  Flag, Sun, Repeat, Clock, Paperclip, Target, Copy,
} from 'lucide-react'

interface KanbanCardProps {
  task: Task
  holidays: Holiday[]
  isDragging?: boolean
  onClick: () => void
}

const priorityConfig = {
  urgent: { color: '#ef4444', label: 'Urgent' },
  high: { color: '#f97316', label: 'Ridicată' },
  medium: { color: '#eab308', label: 'Medie' },
  low: { color: '#22c55e', label: 'Scăzută' },
}

export const KanbanCard = React.memo(function KanbanCard({ task, holidays, isDragging, onClick }: KanbanCardProps) {
  const t = useTranslations()

  const dueDateStatus = getDueDateStatus(task.due_date)
  const isOnHoliday = task.due_date ? isHoliday(new Date(task.due_date), holidays) : false
  const priority = task.priority ? priorityConfig[task.priority] : null

  const completedSubtasks = task._count?.completed_subtasks || 0
  const totalSubtasks = task._count?.subtasks || 0
  const commentsCount = task._count?.comments || 0
  const attachmentCount = task._count?.attachments || 0
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  const isTemplate = task.is_repeat_template === true
  const isInstance = !!task.repeat_parent_id

  const dueDateColors = {
    overdue: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    today: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
    soon: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
    future: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  }

  return (
    <div
      className={cn(
        'kanban-card relative',
        isDragging && 'dragging',
        task.completed && 'opacity-60',
        isTemplate && 'border-l-[3px] border-l-violet-400 dark:border-l-violet-500'
      )}
      onClick={onClick}
    >
      {/* Cover color strip */}
      {task.cover_color && (
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg"
          style={{ backgroundColor: task.cover_color }}
        />
      )}

      {/* Priority indicator (if no cover color) */}
      {!task.cover_color && task.priority && !isTemplate && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg"
          style={{ backgroundColor: priority?.color }}
        />
      )}

      <div className={cn(task.cover_color && 'pt-1')}>
        {/* Template badge */}
        {isTemplate && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              <Repeat className="w-3 h-3" />
              Șablon repetare
            </span>
          </div>
        )}

        {/* Instance badge */}
        {isInstance && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
              <Copy className="w-3 h-3" />
              Instanță repetare
            </span>
          </div>
        )}

        {/* Labels */}
        {(task.labels?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels!.slice(0, 3).map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
            {(task.labels?.length ?? 0) > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{task.labels!.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h4
          className={cn(
            'text-sm font-medium leading-snug',
            task.completed && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </h4>

        {/* Due date badge - prominent, under title */}
        {task.due_date && (
          <div className={cn(
            'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md text-[11px] font-medium',
            dueDateStatus ? dueDateColors[dueDateStatus] : 'bg-muted text-muted-foreground'
          )}>
            <Target className="w-3 h-3" />
            {dueDateStatus === 'overdue' && '⚠️ '}
            {dueDateStatus === 'today' && '📌 Azi — '}
            {formatDate(task.due_date)}
            {isOnHoliday && <Sun className="w-3 h-3 ml-0.5" />}
          </div>
        )}

        {/* Repeat schedule preview (only on templates) */}
        {isTemplate && task.repeat && (
          <div className="mt-2 text-[11px] text-violet-600 dark:text-violet-400 flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {task.repeat === 'daily' && 'Zilnic'}
            {task.repeat === 'weekly' && task.repeat_days?.length
              ? `Săptămânal: ${task.repeat_days.join(', ')}`
              : task.repeat === 'weekly' ? 'Săptămânal' : ''
            }
            {task.repeat === 'monthly' && 'Lunar'}
            {task.repeat === 'yearly' && 'Anual'}
            {task.repeat_interval && task.repeat_interval > 1
              ? ` (la ${task.repeat_interval} intervale)`
              : ''
            }
          </div>
        )}

        {/* Checklist progress bar */}
        {totalSubtasks > 0 && (
          <div className="w-full bg-muted rounded-full h-1 mt-2">
            <div
              className={cn(
                'rounded-full h-1 transition-all',
                subtaskProgress === 100 ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {/* Repeat (only if template, shown inline above) */}
            {!isTemplate && task.repeat && (
              <span className="flex items-center gap-0.5" title={`Repetare: ${task.repeat}`}>
                <Repeat className="w-3 h-3" />
              </span>
            )}

            {/* Estimated time */}
            {task.estimated_minutes && (
              <span className="flex items-center gap-0.5" title={`Estimare: ${task.estimated_minutes}min`}>
                <Clock className="w-3 h-3" />
                {task.estimated_minutes >= 60
                  ? `${Math.floor(task.estimated_minutes / 60)}h`
                  : `${task.estimated_minutes}m`}
              </span>
            )}

            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <span className={cn(
                'flex items-center gap-0.5',
                subtaskProgress === 100 && 'text-green-500'
              )}>
                <CheckSquare className="w-3 h-3" />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}

            {/* Attachments */}
            {attachmentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip className="w-3 h-3" />
                {attachmentCount}
              </span>
            )}

            {/* Comments */}
            {commentsCount > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="w-3 h-3" />
                {commentsCount}
              </span>
            )}
          </div>

          {/* Assignee + Priority */}
          <div className="flex items-center gap-1.5 shrink-0">
            {task.priority && (
              <Flag
                className="w-3 h-3"
                style={{ color: priority?.color }}
              />
            )}
            {task.assignee && (
              <Avatar className="w-5 h-5 shrink-0">
                {task.assignee.avatar_url && <AvatarImage src={task.assignee.avatar_url} />}
                <AvatarFallback className="text-[9px]">
                  {getInitials(task.assignee.full_name || task.assignee.email || 'U')}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
