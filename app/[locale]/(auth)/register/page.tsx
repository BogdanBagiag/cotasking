'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { LayoutDashboard, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordMismatch'),
        variant: 'destructive',
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordTooShort'),
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('auth.emailSent')}</h1>
          <p className="text-muted-foreground mb-6">{t('auth.checkEmail')}</p>
          <Link href="/login">
            <Button variant="outline">{t('auth.login')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div
        className="hidden lg:flex lg:flex-1 items-center justify-center p-12"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, hsl(213 94% 47%))',
        }}
      >
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">CoTasking</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-balance leading-tight">
            Începe gratuit. Fă upgrade când ești gata.
          </h2>
          <p className="text-white/70 text-lg">
            Planul Free include 3 proiecte, 5 membri și board Kanban complet. Nu este necesar un card de credit.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { number: '3', label: 'proiecte gratuite' },
              { number: '5', label: 'membri inclusi' },
              { number: '∞', label: 'task-uri' },
              { number: '0€', label: 'pentru totdeauna' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-3xl font-bold text-white mb-1">{item.number}</div>
                <div className="text-white/70 text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">CoTasking</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">{t('auth.signUpFree')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('auth.hasAccount')}{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ion Popescu"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="ion@companie.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minim 8 caractere"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 font-semibold mt-2" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('auth.signUpFree')}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {t('auth.agreeTo')}{' '}
            <a href="#" className="underline hover:text-foreground">
              {t('auth.terms')}
            </a>{' '}
            {t('common.and')}{' '}
            <a href="#" className="underline hover:text-foreground">
              {t('auth.privacy')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
