'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Trash2, Link2, RefreshCw, Check, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[ăâ]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export default function SettingsPage() {
  const t = useTranslations()
  const { locale, slug } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [originalSlug, setOriginalSlug] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [workspace, setWorkspace] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true) // auto-generate slug from name

  // Load workspace data
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('workspaces')
        .select('*, workspace_members!inner(role, user_id)')
        .eq('slug', slug)
        .eq('workspace_members.user_id', user.id)
        .single()

      if (data) {
        setWorkspace(data)
        setName(data.name)
        setNewSlug(data.slug)
        setOriginalSlug(data.slug)
        setDescription(data.description || '')
        setUserRole(data.workspace_members[0]?.role)
        setAutoSlug(false)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  // Check slug availability when it changes
  useEffect(() => {
    if (!newSlug || newSlug === originalSlug) {
      setSlugAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true)
      const { data } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', newSlug)
        .maybeSingle()

      setSlugAvailable(data === null) // available if no workspace found
      setCheckingSlug(false)
    }, 500) // debounce 500ms

    return () => clearTimeout(timer)
  }, [newSlug, originalSlug])

  const isOwner = userRole === 'owner'
  const canEdit = ['owner', 'admin'].includes(userRole)

  function handleNameChange(value: string) {
    setName(value)
    if (autoSlug) {
      setNewSlug(generateSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setAutoSlug(false)
    // only allow valid slug characters
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
    setNewSlug(cleaned)
  }

  function regenerateSlug() {
    const generated = generateSlug(name)
    setNewSlug(generated)
    setAutoSlug(true)
  }

  const slugChanged = newSlug !== originalSlug
  const canSave = name.trim() && newSlug.trim() && newSlug.length >= 2 &&
    (!slugChanged || slugAvailable === true)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!workspace || !canEdit || !canSave) return

    setSaving(true)

    const updateData: any = {
      name: name.trim(),
      description: description.trim() || null,
    }

    if (slugChanged) {
      updateData.slug = newSlug.trim()
    }

    const { error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', workspace.id)

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast({ title: 'Eroare', description: 'Acest URL este deja folosit de alt workspace.', variant: 'destructive' })
      } else {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
      }
    } else {
      toast({ title: t('common.success'), description: 'Setările au fost salvate.' })

      if (slugChanged) {
        // Redirect to new URL
        setOriginalSlug(newSlug)
        window.location.href = `/${locale}/workspace/${newSlug}/settings`
      }
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!workspace || deleteConfirm !== workspace.name) return

    setDeleting(true)
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspace.id)

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
      setDeleting(false)
    } else {
      window.location.href = `/${locale}/dashboard`
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Workspace-ul nu a fost găsit.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('common.settings')}</h1>
        <p className="text-muted-foreground mt-1">{workspace.name}</p>
      </div>

      {/* General settings */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">General</h2>

          <div className="space-y-2">
            <Label htmlFor="wsName">{t('workspace.name')}</Label>
            <Input
              id="wsName"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={!canEdit}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wsDesc">{t('workspace.description')} <span className="text-muted-foreground">({t('common.optional')})</span></Label>
            <Input
              id="wsDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder="Descrierea workspace-ului..."
            />
          </div>

          {/* Editable slug */}
          <div className="space-y-2">
            <Label htmlFor="wsSlug">URL (slug)</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  /workspace/
                </div>
                <Input
                  id="wsSlug"
                  value={newSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={!canEdit}
                  className="pl-[90px] pr-8 font-mono text-sm"
                  placeholder="url-workspace"
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingSlug && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  )}
                  {!checkingSlug && slugChanged && slugAvailable === true && (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  )}
                  {!checkingSlug && slugChanged && slugAvailable === false && (
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  )}
                </div>
              </div>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={regenerateSlug}
                  title="Regenerează din nume"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Slug status messages */}
            {slugChanged && !checkingSlug && slugAvailable === true && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                URL disponibil
              </p>
            )}
            {slugChanged && !checkingSlug && slugAvailable === false && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Acest URL este deja folosit
              </p>
            )}
            {!slugChanged && (
              <p className="text-xs text-muted-foreground">
                Modifică URL-ul sau schimbă numele pentru a genera unul nou automat.
              </p>
            )}
            {slugChanged && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                Link-urile vechi către /{originalSlug} nu vor mai funcționa.
              </p>
            )}
            {newSlug.length > 0 && newSlug.length < 2 && (
              <p className="text-xs text-destructive">URL-ul trebuie să aibă minim 2 caractere.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('workspace.plan')}</Label>
            <Input value={workspace.plan.replace('_', ' ').toUpperCase()} disabled className="bg-muted" />
          </div>

          {canEdit && (
            <div className="pt-2">
              <Button type="submit" disabled={saving || !canSave}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Danger zone */}
      {isOwner && (
        <div className="mt-8 bg-card border border-destructive/30 rounded-xl p-6">
          <h2 className="font-semibold text-lg text-destructive mb-2">Zonă periculoasă</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Ștergerea workspace-ului este permanentă. Toate proiectele, board-urile și task-urile vor fi pierdute.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Șterge workspace-ul
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Șterge workspace-ul</DialogTitle>
            <DialogDescription>
              Această acțiune este permanentă și nu poate fi anulată.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('workspace.deleteConfirm')}
            </p>
            <div className="space-y-2">
              <Label>Scrie <span className="font-mono font-bold">{workspace.name}</span> pentru a confirma:</Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={workspace.name}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm('') }}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== workspace.name}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
