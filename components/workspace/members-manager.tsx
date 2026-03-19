'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
// No dropdown-menu or popover needed - using custom menus
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  Users, UserPlus, Mail, Shield, ChevronDown,
  MoreHorizontal, Trash2, Clock, Check, Crown, Eye,
  Briefcase, UserCog, Loader2, Send, AlertTriangle, X,
} from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

interface Member {
  id: string
  workspace_id: string
  user_id: string
  role: string
  created_at: string
  profile: Profile | null
}

interface Invitation {
  id: string
  workspace_id: string
  email: string
  role: string
  status: string
  invited_by: string
  created_at: string
}

interface MembersManagerProps {
  workspace: any
  members: Member[]
  invitations: Invitation[]
  currentUserId: string
  userRole: string
  locale: string
}

const ROLES = [
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Acces complet, poate gestiona membrii' },
  { value: 'manager', label: 'Manager', icon: Briefcase, description: 'Poate gestiona proiecte și task-uri' },
  { value: 'member', label: 'Membru', icon: Users, description: 'Poate crea și edita task-uri' },
  { value: 'viewer', label: 'Vizualizator', icon: Eye, description: 'Doar vizualizare, fără editare' },
] as const

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietar',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Membru',
  viewer: 'Vizualizator',
}

const ROLE_ICONS: Record<string, any> = {
  owner: Crown,
  admin: Shield,
  manager: Briefcase,
  member: Users,
  viewer: Eye,
}

export function MembersManager({
  workspace,
  members: initialMembers,
  invitations: initialInvitations,
  currentUserId,
  userRole,
  locale,
}: MembersManagerProps) {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState<Member | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('member')
  const [sending, setSending] = useState(false)
  const [openRoleMenu, setOpenRoleMenu] = useState<string | null>(null)
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null)

  const canManage = userRole === 'owner' || userRole === 'admin' || userRole === 'manager'
  const canChangeRoles = userRole === 'owner' || userRole === 'admin'
  const isOwner = userRole === 'owner'

  // ── Invite Member ──────────────────────────────────
  async function handleInvite() {
    const email = inviteEmail.trim().toLowerCase()
    if (!email) return

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Email invalid', description: 'Introdu un email valid.', variant: 'destructive' })
      return
    }

    // Check if already a member
    const existingMember = members.find(m => m.profile?.email?.toLowerCase() === email)
    if (existingMember) {
      toast({ title: 'Deja membru', description: 'Această persoană este deja în workspace.', variant: 'destructive' })
      return
    }

    // Check if already invited
    const existingInvite = invitations.find(i => i.email.toLowerCase() === email)
    if (existingInvite) {
      toast({ title: 'Deja invitat', description: 'Există deja o invitație pentru acest email.', variant: 'destructive' })
      return
    }

    setSending(true)

    try {
      // Check if user already exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('email', email)
        .maybeSingle()

      if (existingProfile) {
        // User exists → add directly to workspace_members
        const { data: newMember, error } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspace.id,
            user_id: existingProfile.id,
            role: inviteRole,
            invited_by: currentUserId,
          })
          .select('*, profile:profiles(id, full_name, email, avatar_url)')
          .single()

        if (error) {
          toast({ title: 'Eroare', description: error.message, variant: 'destructive' })
        } else {
          setMembers(prev => [...prev, newMember])
          toast({
            title: 'Membru adăugat!',
            description: `${existingProfile.full_name || email} a fost adăugat ca ${ROLE_LABELS[inviteRole]}.`,
          })
          setShowInviteDialog(false)
          setInviteEmail('')
          setInviteRole('member')
        }
      } else {
        // User doesn't exist → create pending invitation
        const { data: invitation, error } = await supabase
          .from('workspace_invitations')
          .insert({
            workspace_id: workspace.id,
            email: email,
            role: inviteRole,
            invited_by: currentUserId,
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            toast({ title: 'Deja invitat', description: 'Există deja o invitație pentru acest email.', variant: 'destructive' })
          } else {
            toast({ title: 'Eroare', description: error.message, variant: 'destructive' })
          }
        } else {
          setInvitations(prev => [invitation, ...prev])
          toast({
            title: 'Invitație trimisă!',
            description: `${email} va fi adăugat automat când își creează cont.`,
          })
          setShowInviteDialog(false)
          setInviteEmail('')
          setInviteRole('member')
        }
      }
    } catch (err) {
      toast({ title: 'Eroare', description: 'Ceva nu a mers bine.', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  // ── Change Role ────────────────────────────────────
  async function handleChangeRole(member: Member, newRole: string) {
    if (member.role === newRole) return
    if (member.role === 'owner') return // Can't change owner role

    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('id', member.id)

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' })
    } else {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
      toast({
        title: 'Rol actualizat',
        description: `${member.profile?.full_name || 'Membrul'} este acum ${ROLE_LABELS[newRole]}.`,
      })
    }
  }

  // ── Remove Member ──────────────────────────────────
  async function handleRemoveMember() {
    if (!showRemoveDialog) return

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', showRemoveDialog.id)

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' })
    } else {
      setMembers(prev => prev.filter(m => m.id !== showRemoveDialog.id))
      toast({
        title: 'Membru eliminat',
        description: `${showRemoveDialog.profile?.full_name || 'Membrul'} a fost eliminat din workspace.`,
      })
    }
    setShowRemoveDialog(null)
  }

  // ── Cancel Invitation ──────────────────────────────
  async function handleCancelInvitation(invitation: Invitation) {
    const { error } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', invitation.id)

    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' })
    } else {
      setInvitations(prev => prev.filter(i => i.id !== invitation.id))
      toast({ title: 'Invitație anulată' })
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Membri</h1>
          <p className="text-muted-foreground mt-1">
            {members.length} {members.length === 1 ? 'membru' : 'membri'} în {workspace.name}
            {invitations.length > 0 && (
              <span className="text-primary"> · {invitations.length} invitații pending</span>
            )}
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invită membru
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-3 bg-muted/30 border-b border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Membri activi
          </h2>
        </div>

        <div className="divide-y divide-border">
          {members.map((member) => {
            const RoleIcon = ROLE_ICONS[member.role] || Users
            const isSelf = member.user_id === currentUserId
            const isMemberOwner = member.role === 'owner'

            return (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={member.profile?.avatar_url || ''} />
                  <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                    {member.profile?.full_name?.charAt(0)?.toUpperCase() ||
                     member.profile?.email?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {member.profile?.full_name || 'Fără nume'}
                    </p>
                    {isSelf && (
                      <span className="text-xs text-muted-foreground">(tu)</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.profile?.email}
                  </p>
                </div>

                {/* Role badge / dropdown */}
                {canChangeRoles && !isMemberOwner && !isSelf ? (
                  <div className="relative">
                    <button
                      onClick={() => setOpenRoleMenu(openRoleMenu === member.id ? null : member.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80',
                        ROLE_COLORS[member.role]
                      )}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {ROLE_LABELS[member.role]}
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                    {openRoleMenu === member.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenRoleMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 p-1">
                          {ROLES.map(role => (
                            <button
                              key={role.value}
                              onClick={() => { handleChangeRole(member, role.value); setOpenRoleMenu(null) }}
                              className="flex items-start gap-3 py-2.5 px-3 w-full text-left rounded-md hover:bg-muted transition-colors"
                            >
                              <role.icon className="w-4 h-4 mt-0.5 shrink-0" />
                              <div>
                                <p className={cn('font-medium text-sm', member.role === role.value && 'text-primary')}>
                                  {role.label}
                                  {member.role === role.value && ' ✓'}
                                </p>
                                <p className="text-xs text-muted-foreground">{role.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className={cn('gap-1.5', ROLE_COLORS[member.role])}>
                    <RoleIcon className="w-3 h-3" />
                    {ROLE_LABELS[member.role]}
                  </Badge>
                )}

                {/* Actions */}
                {canChangeRoles && !isMemberOwner && !isSelf && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenActionMenu(openActionMenu === member.id ? null : member.id)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openActionMenu === member.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenActionMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg z-50 p-1">
                          <button
                            onClick={() => { setShowRemoveDialog(member); setOpenActionMenu(null) }}
                            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Elimină din workspace
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-muted/30 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Invitații în așteptare
            </h2>
          </div>

          <div className="divide-y divide-border">
            {invitations.map((invitation) => {
              const RoleIcon = ROLE_ICONS[invitation.role] || Users
              const invitedBy = members.find(m => m.user_id === invitation.invited_by)

              return (
                <div key={invitation.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invitat de {invitedBy?.profile?.full_name || 'cineva'} ·{' '}
                      {new Date(invitation.created_at).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>

                  <Badge variant="outline" className="gap-1.5 text-xs">
                    <RoleIcon className="w-3 h-3" />
                    {ROLE_LABELS[invitation.role]}
                  </Badge>

                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>

                  {canManage && (
                    <button
                      onClick={() => handleCancelInvitation(invitation)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Anulează invitația"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state for non-managers */}
      {members.length <= 1 && !canManage && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Ești singurul membru. Contactează administratorul pentru a adăuga alți membri.</p>
        </div>
      )}

      {/* ── Invite Dialog ──────────────────────────── */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invită membru nou
            </DialogTitle>
            <DialogDescription>
              Adaugă un angajat în workspace-ul <strong>{workspace.name}</strong>. 
              Dacă are deja cont, va fi adăugat instant. Altfel, va fi adăugat automat la crearea contului.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="angajat@firma.ro"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rol</label>
              <div className="grid gap-2">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    onClick={() => setInviteRole(role.value)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                      inviteRole === role.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                    )}
                  >
                    <role.icon className={cn(
                      'w-4 h-4 mt-0.5 shrink-0',
                      inviteRole === role.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        inviteRole === role.value && 'text-primary'
                      )}>
                        {role.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                    {inviteRole === role.value && (
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Anulează
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || sending}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'Se trimite...' : 'Invită'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Confirmation Dialog ─────────────── */}
      <Dialog open={!!showRemoveDialog} onOpenChange={(open) => !open && setShowRemoveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Elimină membru
            </DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să elimini pe <strong>{showRemoveDialog?.profile?.full_name || showRemoveDialog?.profile?.email}</strong> din workspace-ul <strong>{workspace.name}</strong>? 
              Această persoană nu va mai avea acces la proiecte, board-uri și task-uri.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(null)}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Elimină
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
