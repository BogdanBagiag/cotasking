'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface RepeatConfig {
  repeat: string | null
  repeat_days: string[] | null
  repeat_time: string | null
  repeat_interval: number
}

interface RepeatPickerProps {
  value: RepeatConfig
  onChange: (config: RepeatConfig) => void
  open: boolean
  onClose: () => void
}

const REPEAT_TYPES = [
  { value: 'daily', label: 'Zilnic' },
  { value: 'weekly', label: 'Săptămânal' },
  { value: 'monthly', label: 'Lunar' },
  { value: 'yearly', label: 'Anual' },
] as const

const WEEKDAYS = [
  { value: 'sun', label: 'Du' },
  { value: 'mon', label: 'Lu' },
  { value: 'tue', label: 'Ma' },
  { value: 'wed', label: 'Mi' },
  { value: 'thu', label: 'Jo' },
  { value: 'fri', label: 'Vi' },
  { value: 'sat', label: 'Sâ' },
] as const

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
] as const

const INTERVAL_LABELS: Record<string, [string, string]> = {
  daily: ['zi', 'zile'],
  weekly: ['săptămână', 'săptămâni'],
  monthly: ['lună', 'luni'],
  yearly: ['an', 'ani'],
}

export function RepeatPicker({ value, onChange, open, onClose }: RepeatPickerProps) {
  const [type, setType] = useState<string>(value.repeat || 'weekly')
  const [days, setDays] = useState<string[]>(value.repeat_days || [])
  const [time, setTime] = useState(value.repeat_time || '10:00')
  const [interval, setInterval] = useState(value.repeat_interval || 1)
  const [monthDay, setMonthDay] = useState('1')
  const [yearMonth, setYearMonth] = useState('01')
  const [yearDay, setYearDay] = useState('01')

  useEffect(() => {
    if (open) {
      setType(value.repeat || 'weekly')
      setTime(value.repeat_time || '10:00')
      setInterval(value.repeat_interval || 1)

      if (value.repeat === 'monthly' && value.repeat_days?.length) {
        setMonthDay(value.repeat_days[0])
        setDays(value.repeat_days)
      } else if (value.repeat === 'yearly' && value.repeat_days?.length) {
        const parts = value.repeat_days[0].split('-')
        if (parts.length === 2) {
          setYearMonth(parts[0])
          setYearDay(parts[1])
        }
        setDays(value.repeat_days)
      } else {
        setDays(value.repeat_days || [])
      }
    }
  }, [open])

  if (!open) return null

  function toggleWeekday(day: string) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  function handleSave() {
    let finalDays: string[] | null = null
    if (type === 'weekly') {
      finalDays = days.length > 0 ? days : null
    } else if (type === 'monthly') {
      finalDays = [monthDay]
    } else if (type === 'yearly') {
      finalDays = [`${yearMonth}-${yearDay}`]
    }

    onChange({
      repeat: type,
      repeat_days: finalDays,
      repeat_time: time,
      repeat_interval: interval,
    })
    onClose()
  }

  function handleRemove() {
    onChange({
      repeat: null,
      repeat_days: null,
      repeat_time: null,
      repeat_interval: 1,
    })
    onClose()
  }

  function getNextOccurrence(): Date | null {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (type === 'daily') {
      const next = new Date(today)
      next.setDate(next.getDate() + 1)
      return next
    }

    if (type === 'weekly' && days.length > 0) {
      const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
      const todayDay = now.getDay()
      const sortedDayNums = days.map(d => dayMap[d]).filter(n => n !== undefined).sort((a, b) => a - b)

      for (const dayNum of sortedDayNums) {
        const diff = dayNum - todayDay
        if (diff > 0) {
          const next = new Date(today)
          next.setDate(next.getDate() + diff)
          return next
        }
      }
      const next = new Date(today)
      const diff = 7 - todayDay + sortedDayNums[0]
      next.setDate(next.getDate() + diff)
      return next
    }

    if (type === 'monthly') {
      const dayNum = parseInt(monthDay)
      const next = new Date(now.getFullYear(), now.getMonth(), dayNum)
      if (next <= today) {
        next.setMonth(next.getMonth() + interval)
      }
      return next
    }

    if (type === 'yearly') {
      const monthNum = parseInt(yearMonth) - 1
      const dayNum = parseInt(yearDay)
      const next = new Date(now.getFullYear(), monthNum, dayNum)
      if (next <= today) {
        next.setFullYear(next.getFullYear() + interval)
      }
      return next
    }

    return null
  }

  function getPreviewText(): string {
    const parts: string[] = []
    const [singular, plural] = INTERVAL_LABELS[type] || ['', '']

    if (type === 'daily') {
      parts.push(interval === 1 ? 'în fiecare zi' : `la fiecare ${interval} ${plural}`)
    }

    if (type === 'weekly') {
      const selectedDays = days.length > 0 ? days : []
      const dayLabels = selectedDays
        .sort((a, b) => WEEKDAYS.findIndex(w => w.value === a) - WEEKDAYS.findIndex(w => w.value === b))
        .map(d => WEEKDAYS.find(w => w.value === d)?.label || d)

      if (interval === 1) {
        parts.push(dayLabels.length > 0 ? `în fiecare ${dayLabels.join(', ')}` : 'în fiecare săptămână')
      } else {
        parts.push(`la fiecare ${interval} ${plural}`)
        if (dayLabels.length > 0) parts.push(`în zilele: ${dayLabels.join(', ')}`)
      }
    }

    if (type === 'monthly') {
      const dayNum = parseInt(monthDay)
      parts.push(interval === 1 ? `în fiecare lună pe ${dayNum}` : `la fiecare ${interval} ${plural} pe ${dayNum}`)
    }

    if (type === 'yearly') {
      const monthNum = parseInt(yearMonth)
      const dayNum = parseInt(yearDay)
      const monthName = MONTHS[monthNum - 1]
      parts.push(interval === 1 ? `în fiecare an pe ${dayNum} ${monthName}` : `la fiecare ${interval} ${plural} pe ${dayNum} ${monthName}`)
    }

    if (time) parts.push(`la ora ${time}`)

    const nextDate = getNextOccurrence()
    if (nextDate) {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      const formatted = nextDate.toLocaleDateString('ro-RO', options)
      return `Se repetă ${parts.join(' ')}.\n\n📅 Următoarea apariție: ${formatted} la ${time || '10:00'}\n💡 Setează data limită direct pe card.`
    }

    return `Se repetă ${parts.join(' ')}.`
  }

  const daysInSelectedMonth = type === 'yearly'
    ? new Date(2026, parseInt(yearMonth), 0).getDate()
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-xl shadow-xl w-[360px] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Repetare Card</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Repeat type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Se repetă</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setDays([]) }}
              className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring font-medium"
            >
              {REPEAT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">La ora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Weekly: day picker */}
          {type === 'weekly' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">În zilele</label>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={cn(
                      'flex flex-col items-center py-2 rounded-lg text-xs font-medium transition-colors border',
                      days.includes(day.value)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-muted/30 border-border hover:bg-muted text-foreground'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: day of month */}
          {type === 'monthly' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">În ziua</label>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setMonthDay(String(d))}
                    className={cn(
                      'py-1.5 rounded-md text-xs font-medium transition-colors border',
                      monthDay === String(d)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-muted/30 border-border hover:bg-muted text-foreground'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Yearly: month + day */}
          {type === 'yearly' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Luna</label>
                <select
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                  className="w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Ziua</label>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setYearDay(String(d).padStart(2, '0'))}
                      className={cn(
                        'py-1.5 rounded-md text-xs font-medium transition-colors border',
                        yearDay === String(d).padStart(2, '0')
                          ? 'bg-primary text-white border-primary'
                          : 'bg-muted/30 border-border hover:bg-muted text-foreground'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Interval */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">La fiecare</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="99"
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">
                {interval === 1 ? INTERVAL_LABELS[type]?.[0] : INTERVAL_LABELS[type]?.[1]}
              </span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {getPreviewText()}
            </p>
          </div>
        </div>

        {/* Actions - sticky footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-border shrink-0">
          <Button size="sm" onClick={handleSave} className="flex-1">
            Salvează
          </Button>
          <Button size="sm" variant="destructive" onClick={handleRemove} className="flex-1">
            Elimină
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper: display text
export function getRepeatDisplayText(config: Pick<RepeatConfig, 'repeat' | 'repeat_days' | 'repeat_time' | 'repeat_interval'>): string {
  if (!config.repeat) return ''

  const WEEKDAY_MAP: Record<string, string> = {
    sun: 'Du', mon: 'Lu', tue: 'Ma', wed: 'Mi', thu: 'Jo', fri: 'Vi', sat: 'Sâ',
  }

  const interval = config.repeat_interval || 1

  if (config.repeat === 'daily') {
    return interval === 1 ? 'Zilnic' : `La ${interval} zile`
  }

  if (config.repeat === 'weekly') {
    const dayLabels = (config.repeat_days || []).map(d => WEEKDAY_MAP[d] || d).join(', ')
    if (interval === 1) {
      return dayLabels ? `Săpt: ${dayLabels}` : 'Săptămânal'
    }
    return `La ${interval} săpt.${dayLabels ? `: ${dayLabels}` : ''}`
  }

  if (config.repeat === 'monthly') {
    const day = config.repeat_days?.[0] || '1'
    return interval === 1 ? `Lunar pe ${day}` : `La ${interval} luni pe ${day}`
  }

  if (config.repeat === 'yearly') {
    const datePart = config.repeat_days?.[0] || '01-01'
    const [m, d] = datePart.split('-')
    const MONTHS_SHORT = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthLabel = MONTHS_SHORT[parseInt(m) - 1] || m
    return interval === 1 ? `Anual: ${d} ${monthLabel}` : `La ${interval} ani: ${d} ${monthLabel}`
  }

  return config.repeat
}
