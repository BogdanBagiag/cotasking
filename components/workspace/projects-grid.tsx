'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn, PROJECT_COLORS } from '@/lib/utils'
import { PLAN_LIMITS } from '@/types'
import type { Project, Workspace } from '@/types'
import {
  FolderKanban, Plus, LayoutDashboard, Loader2, Lock,
  MoreHorizontal, Pencil, Trash2, Image as ImageIcon, X, Upload, Check,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'

interface ProjectsGridProps {
  projects: (Project & { boards: Array<{ id: string; name: string }> })[],
  workspace: Workspace
  userRole: string
  locale: string
}

export function ProjectsGrid({ projects, workspace, userRole, locale }: ProjectsGridProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Create state
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [loading, setLoading] = useState(false)

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState<(Project & { boards: any[] }) | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const canCreate = ['owner', 'admin', 'manager', 'member'].includes(userRole)
  const canEdit = ['owner', 'admin', 'manager'].includes(userRole)
  const planLimits = PLAN_LIMITS[workspace.plan]
  const atLimit = projects.length >= (planLimits.projects as number)

  function openEdit(project: Project & { boards: any[] }) {
    setEditProject(project)
    setEditName(project.name)
    setEditDescription(project.description || '')
    setEditColor(project.color)
    setEditImageUrl((project as any).image_url || '')
    setEditOpen(true)
    setOpenMenuId(null)
  }

  function openDelete(project: Project & { boards: any[] }) {
    setEditProject(project)
    setDeleteOpen(true)
    setDeleteConfirm('')
    setOpenMenuId(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        workspace_id: workspace.id,
        name: name.trim(),
        description: description.trim() || null,
        color,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      const { data: board } = await supabase
        .from('boards')
        .insert({ project_id: project.id, name: 'Board principal', position: 0 })
        .select()
        .single()

      if (board) {
        await supabase.from('columns').insert([
          { board_id: board.id, name: 'De făcut', position: 0, color: '#ef4444' },
          { board_id: board.id, name: 'În progres', position: 1, color: '#3b82f6' },
          { board_id: board.id, name: 'Review', position: 2, color: '#f97316' },
          { board_id: board.id, name: 'Finalizat', position: 3, color: '#22c55e' },
        ])
      }

      toast({ title: t('common.success'), description: `Proiect "${project.name}" creat!` })
      setCreateOpen(false)
      setName('')
      setDescription('')
      setColor(PROJECT_COLORS[0])
      router.refresh()
    }

    setLoading(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editProject) return

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Eroare', description: 'Selectează o imagine (JPG, PNG, etc.)', variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Eroare', description: 'Imaginea trebuie să fie sub 2MB.', variant: 'destructive' })
      return
    }

    setUploadingImage(true)
    const ext = file.name.split('.').pop()
    const path = `projects/${editProject.id}/cover.${ext}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (error) {
      toast({ title: 'Eroare upload', description: 'Nu s-a putut încărca imaginea. Poți introduce un URL manual.', variant: 'destructive' })
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setEditImageUrl(publicUrl)
      toast({ title: 'Imagine încărcată!' })
    }
    setUploadingImage(false)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editProject || !editName.trim()) return

    setEditLoading(true)
    const { error } = await supabase
      .from('projects')
      .update({
        name: editName.trim(),
        description: editDescription.trim() || null,
        color: editColor,
        image_url: editImageUrl.trim() || null,
      })
      .eq('id', editProject.id)

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      toast({ title: t('common.success'), description: 'Proiectul a fost actualizat.' })
      setEditOpen(false)
      router.refresh()
    }
    setEditLoading(false)
  }

  async function handleDelete() {
    if (!editProject || deleteConfirm !== editProject.name) return

    setDeleting(true)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', editProject.id)

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Proiect șters', description: `"${editProject.name}" a fost șters permanent.` })
      setDeleteOpen(false)
      router.refresh()
    }
    setDeleting(false)
  }

  return (
    <>
      {/* Limit warning */}
      {atLimit && workspace.plan === 'free' && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <Lock className="w-4 h-4 shrink-0" />
          {t('project.limitReached')}
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="relative group">
            <Link
              href={
                project.boards.length > 0
                  ? `/workspace/${workspace.slug}/board/${project.boards[0].id}`
                  : `/workspace/${workspace.slug}/projects`
              }
              className="block bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all"
            >
              {/* Project image */}
              {(project as any).image_url ? (
                <div className="h-32 w-full overflow-hidden">
                  <img
                    src={(project as any).image_url}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div
                  className="h-3 w-full"
                  style={{ backgroundColor: project.color }}
                />
              )}

              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <FolderKanban className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                  <LayoutDashboard className="w-3 h-3" />
                  {project.boards.length} board{project.boards.length !== 1 ? '-uri' : ''}
                </div>
              </div>
            </Link>

            {/* Edit menu button */}
            {canEdit && (
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpenMenuId(openMenuId === project.id ? null : project.id)
                  }}
                  className={cn(
                    'p-1.5 rounded-lg transition-all',
                    (project as any).image_url
                      ? 'bg-black/40 text-white hover:bg-black/60'
                      : 'bg-card/80 text-muted-foreground hover:bg-accent opacity-0 group-hover:opacity-100'
                  )}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {openMenuId === project.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg py-1 z-20 text-sm">
                      <button
                        onClick={() => openEdit(project)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editează proiectul
                      </button>
                      <button
                        onClick={() => openDelete(project)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-destructive/10 text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Șterge proiectul
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Create new project card */}
        {canCreate && !atLimit && (
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-card border border-dashed border-border rounded-xl p-5 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </div>
            <h3 className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">
              {t('project.create')}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Adaugă un proiect nou
            </p>
          </button>
        )}

        {projects.length === 0 && !canCreate && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t('project.noProjects')}</p>
          </div>
        )}
      </div>

      {/* ═══ Create project dialog ═══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('project.create')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('project.name')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Website Redesign"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t('project.description')} <span className="text-muted-foreground">(opțional)</span></Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scurtă descriere..."
              />
            </div>

            <div className="space-y-2">
              <Label>{t('project.color')}</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all',
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
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

      {/* ═══ Edit project dialog ═══ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editează proiectul</DialogTitle>
            <DialogDescription>Modifică detaliile proiectului.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSave} className="space-y-4">
            {/* Image preview */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Imagine proiect
              </Label>

              {editImageUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={editImageUrl}
                    alt="Preview"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEditImageUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mb-1.5" />
                      <span className="text-xs text-muted-foreground">Click pentru a încărca</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG • max 2MB</span>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Manual URL */}
              <Input
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="Sau lipește un URL de imagine..."
                className="text-xs"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>{t('project.name')}</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{t('project.description')} <span className="text-muted-foreground">(opțional)</span></Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Scurtă descriere..."
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>{t('project.color')}</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditColor(c)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all flex items-center justify-center',
                      editColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {editColor === c && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={editLoading || !editName.trim()}>
                {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvează
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete project dialog ═══ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Șterge proiectul</DialogTitle>
            <DialogDescription>
              Această acțiune este permanentă. Toate board-urile și task-urile vor fi șterse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Scrie <span className="font-mono font-bold">{editProject?.name}</span> pentru a confirma:
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={editProject?.name}
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
              disabled={deleting || deleteConfirm !== editProject?.name}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Șterge permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
