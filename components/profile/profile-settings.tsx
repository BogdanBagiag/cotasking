'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  User, Mail, Lock, Shield, Camera, Loader2, Check,
  Eye, EyeOff, Calendar, Briefcase, AlertTriangle, LogOut,
  Trash2, ChevronRight, Globe,
} from 'lucide-react'

interface ProfileSettingsProps {
  user: {
    id: string
    email: string
    created_at: string
    provider: string
  }
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  }
  workspaces: any[]
  locale: string
}

export function ProfileSettings({ user, profile, workspaces, locale }: ProfileSettingsProps) {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  // ── Profile State ─────────────────────────────
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // ── Email State ───────────────────────────────
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  // ── Password State ────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // ── Avatar Upload State ───────────────────────
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Delete Account ────────────────────────────
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // ── Logout ────────────────────────────────────
  const [loggingOut, setLoggingOut] = useState(false)

  const isEmailProvider = user.provider === 'email'

  // ══════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSaved(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq('id', user.id)

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' })
    } else {
      setProfileSaved(true)
      toast({ title: 'Profil actualizat', description: 'Modificările au fost salvate.' })
      router.refresh()
      setTimeout(() => setProfileSaved(false), 3000)
    }
    setSavingProfile(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Eroare', description: 'Selectează o imagine.', variant: 'destructive' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Eroare', description: 'Imaginea trebuie să fie sub 2MB.', variant: 'destructive' })
      return
    }

    setUploadingAvatar(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      // Storage bucket might not exist - save URL manually instead
      toast({
        title: 'Upload indisponibil',
        description: 'Poți introduce URL-ul avatarului manual mai jos.',
        variant: 'destructive'
      })
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setAvatarUrl(publicUrl)
      toast({ title: 'Avatar încărcat', description: 'Salvează profilul pentru a aplica.' })
    }
    setUploadingAvatar(false)
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return

    setSavingEmail(true)

    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    })

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' })
    } else {
      toast({
        title: 'Email de confirmare trimis',
        description: `Verifică inbox-ul pentru ${newEmail.trim()} și confirmă schimbarea.`,
      })
      setNewEmail('')
    }
    setSavingEmail(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast({ title: 'Eroare', description: 'Parola trebuie să aibă minim 6 caractere.', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Eroare', description: 'Parolele nu se potrivesc.', variant: 'destructive' })
      return
    }

    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Parolă schimbată', description: 'Parola a fost actualizată cu succes.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPassword(false)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    window.location.href = `/${locale}/login`
  }

  async function handleDeleteAccount() {
    // Note: Supabase doesn't allow self-deletion by default
    // This would need a server-side function or edge function
    toast({
      title: 'Funcție indisponibilă',
      description: 'Contactează administratorul pentru ștergerea contului.',
      variant: 'destructive'
    })
    setShowDeleteDialog(false)
  }

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div className="p-6 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Setări profil</h1>
        <p className="text-muted-foreground mt-1">Gestionează informațiile contului tău</p>
      </div>

      {/* ── 1. Profile Info ────────────────────────── */}
      <form onSubmit={handleSaveProfile}>
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Informații profil</h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative group">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="font-medium">{fullName || 'Fără nume'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click pe avatar pentru a schimba fotografia
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="fullName">Nume complet</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ion Popescu"
            />
          </div>

          {/* Avatar URL (manual) */}
          <div className="space-y-2 mb-5">
            <Label htmlFor="avatarUrl">
              URL Avatar <span className="text-muted-foreground text-xs">(opțional)</span>
            </Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <Button type="submit" disabled={savingProfile} className="gap-2">
            {savingProfile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : profileSaved ? (
              <Check className="w-4 h-4" />
            ) : null}
            {savingProfile ? 'Se salvează...' : profileSaved ? 'Salvat!' : 'Salvează profilul'}
          </Button>
        </section>
      </form>

      {/* ── 2. Email ───────────────────────────────── */}
      <form onSubmit={handleChangeEmail}>
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-lg">Email</h2>
          </div>

          <div className="space-y-2 mb-4">
            <Label>Email curent</Label>
            <Input value={user.email} disabled className="bg-muted" />
          </div>

          <div className="space-y-2 mb-5">
            <Label htmlFor="newEmail">Email nou</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email-nou@exemplu.ro"
            />
            <p className="text-xs text-muted-foreground">
              Vei primi un email de confirmare pe noua adresă.
            </p>
          </div>

          <Button type="submit" disabled={savingEmail || !newEmail.trim()} variant="outline" className="gap-2">
            {savingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
            Schimbă emailul
          </Button>
        </section>
      </form>

      {/* ── 3. Password ────────────────────────────── */}
      {isEmailProvider && (
        <form onSubmit={handleChangePassword}>
          <section className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-lg">Parolă</h2>
            </div>

            <div className="space-y-4 mb-5">
              <div className="space-y-2">
                <Label htmlFor="newPw">Parolă nouă</Label>
                <div className="relative">
                  <Input
                    id="newPw"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minim 6 caractere"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-destructive">Minim 6 caractere</p>
                )}
                {newPassword && newPassword.length >= 6 && (
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          newPassword.length < 8 ? 'w-1/3 bg-red-500' :
                          newPassword.length < 12 ? 'w-2/3 bg-yellow-500' :
                          'w-full bg-green-500'
                        )}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {newPassword.length < 8 ? 'Slabă' : newPassword.length < 12 ? 'Medie' : 'Puternică'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPw">Confirmă parola nouă</Label>
                <Input
                  id="confirmPw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetă parola nouă"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-destructive">Parolele nu se potrivesc</p>
                )}
                {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Parolele se potrivesc
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={savingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              variant="outline"
              className="gap-2"
            >
              {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              Schimbă parola
            </Button>
          </section>
        </form>
      )}

      {/* Not email provider notice */}
      {!isEmailProvider && (
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-lg">Parolă</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <p>
              Te-ai autentificat cu <strong className="text-foreground">{user.provider}</strong>.
              Parola se gestionează prin provider-ul tău.
            </p>
          </div>
        </section>
      )}

      {/* ── 4. Account Info ────────────────────────── */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-lg">Informații cont</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">ID utilizator</span>
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{user.id.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-muted-foreground">Metoda de autentificare</span>
            <Badge variant="secondary" className="capitalize">{user.provider}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-muted-foreground">Cont creat</span>
            <span>
              {new Date(user.created_at).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-muted-foreground">Workspace-uri</span>
            <span>{workspaces.length}</span>
          </div>
        </div>
      </section>

      {/* ── 5. Sessions ──────────────────────────── */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-lg">Sesiune</h2>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Deconectează-te
          </Button>
        </div>
      </section>

      {/* ── 6. Danger Zone ───────────────────────── */}
      <section className="bg-card border border-destructive/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h2 className="font-semibold text-lg text-destructive">Zonă periculoasă</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Ștergerea contului este permanentă. Toate datele tale, inclusiv workspace-urile
          pe care le deții, vor fi șterse irecuperabil.
        </p>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Șterge contul
        </Button>
      </section>

      {/* ── Delete Account Dialog ────────────────── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Șterge contul
            </DialogTitle>
            <DialogDescription>
              Această acțiune este ireversibilă. Toate datele tale vor fi șterse permanent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Scrie <span className="font-mono font-bold text-foreground">STERGE</span> pentru a confirma:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="STERGE"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm('') }}>
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'STERGE'}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Confirmă ștergerea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
