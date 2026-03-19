import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns'
import { ro, enUS } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, locale: string = 'ro') {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy', { locale: locale === 'ro' ? ro : enUS })
}

export function formatDateTime(date: string | Date, locale: string = 'ro') {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy HH:mm', { locale: locale === 'ro' ? ro : enUS })
}

export function getDueDateStatus(dueDate: string | null): 'overdue' | 'today' | 'soon' | 'future' | null {
  if (!dueDate) return null
  const date = new Date(dueDate)
  if (isPast(date) && !isToday(date)) return 'overdue'
  if (isToday(date)) return 'today'
  if (isTomorrow(date) || date <= addDays(new Date(), 3)) return 'soon'
  return 'future'
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function isHoliday(date: Date, holidays: Array<{ date: string; recurring: boolean }>): boolean {
  return holidays.some((h) => {
    const holidayDate = new Date(h.date)
    if (h.recurring) {
      return (
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getDate() === date.getDate()
      )
    }
    return (
      holidayDate.getFullYear() === date.getFullYear() &&
      holidayDate.getMonth() === date.getMonth() &&
      holidayDate.getDate() === date.getDate()
    )
  })
}

export const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#6366f1', '#84cc16', '#f59e0b',
]

export const LABEL_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Gray', value: '#6b7280' },
]
