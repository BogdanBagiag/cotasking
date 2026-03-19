'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { cn, formatDate } from '@/lib/utils'
import type { Holiday, Workspace } from '@/types'
import { CalendarOff, Plus, Trash2, RefreshCw, Lock, Loader2 } from 'lucide-react'

interface HolidaysManagerProps {
  holidays: Holiday[]
  workspace: Workspace
  canManage: boolean
  locale: string
}

export function HolidaysManager({ holidays: initial, workspace, canManage, locale }: HolidaysManagerProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const supabase = createClient()
  const [holidays, setHolidays] = useState(initial)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [loading, setLoading] = useState(false)

  const isPremium = workspace.plan !== 'free'

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !date) return

    setLoading(true)

    const { data, error } = await supabase
      .from('holidays')
      .insert({ workspace_id: workspace.id, name: name.trim(), date, recurring })
      .select()
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      setHolidays((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
      setCreateOpen(false)
      setName('')
      setDate('')
      setRecurring(false)
      toast({ title: t('common.success'), description: `Zi liberă "${data.name}" adăugată!` })
    }

    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm(t('holiday.deleteConfirm'))) return

    const { error } = await supabase.from('holidays').delete().eq('id', id)
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      setHolidays((prev) => prev.filter((h) => h.id !== id))
    }
  }

  if (!isPremium) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t('holiday.premiumRequired')}</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Fă upgrade la Premium pentru a configura zilele libere ale companiei.
        </p>
        <Button>{t('common.upgrade')}</Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          {holidays.length === 0 ? t('holiday.noHolidays') : `${holidays.length} zile libere configurate`}
        </p>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('holiday.add')}
          </Button>
        )}
      </div>

      {holidays.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <CalendarOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{t('holiday.addFirst')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center">
                  <CalendarOff className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{holiday.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {formatDate(holiday.date, locale)}
                    {holiday.recurring && (
                      <>
                        <span>·</span>
                        <RefreshCw className="w-3 h-3" />
                        Recurentă anual
                      </>
                    )}
                  </p>
                </div>
              </div>

              {canManage && (
                <button
                  onClick={() => handleDelete(holiday.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('holiday.add')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('holiday.name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Crăciun" autoFocus required />
            </div>
            <div className="space-y-2">
              <Label>{t('holiday.date')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="recurring" className="cursor-pointer">{t('holiday.recurring')}</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={loading || !name.trim() || !date}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
