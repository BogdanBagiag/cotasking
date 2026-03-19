'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import type { Column } from '@/types'

const COLUMN_COLORS = [
  '#6b7280', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
]

interface CreateColumnDialogProps {
  boardId: string
  position: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onColumnCreated: (column: Column) => void
}

export function CreateColumnDialog({
  boardId,
  position,
  open,
  onOpenChange,
  onColumnCreated,
}: CreateColumnDialogProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLUMN_COLORS[0])
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)

    const { data, error } = await supabase
      .from('columns')
      .insert({ board_id: boardId, name: name.trim(), position, color })
      .select()
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      onColumnCreated(data)
      setName('')
      setColor(COLUMN_COLORS[0])
      onOpenChange(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('board.addColumn')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="colName">{t('board.columnName')}</Label>
            <Input
              id="colName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: În progres"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Culoare</Label>
            <div className="flex gap-2 flex-wrap">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
