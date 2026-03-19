'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { generateSlug } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    setSlug(generateSlug(val))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: name.trim(), slug: slug.trim(), owner_id: user.id })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        toast({ title: t('common.error'), description: 'Acest URL este deja folosit. Alege altul.', variant: 'destructive' })
      } else {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
      }
    } else {
      onOpenChange(false)
      setName('')
      setSlug('')
      toast({ title: t('common.success'), description: `Workspace "${data.name}" creat!` })
      router.push(`/workspace/${data.slug}/projects`)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('workspace.create')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wsName">{t('workspace.name')}</Label>
            <Input
              id="wsName"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: ACME Corp"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wsSlug">{t('workspace.slug')}</Label>
            <div className="flex items-center gap-0 rounded-md border border-input overflow-hidden">
              <span className="px-3 py-2 bg-muted text-muted-foreground text-sm border-r border-input shrink-0">
                cotasking.app/
              </span>
              <input
                id="wsSlug"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
                placeholder="acme-corp"
                required
              />
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
