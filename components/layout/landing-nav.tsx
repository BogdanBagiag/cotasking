'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/shared/language-switcher'
import { LayoutDashboard, Menu, X } from 'lucide-react'

export function LandingNav() {
  const t = useTranslations()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CoTasking</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Funcționalități
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Prețuri
          </a>
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost" size="sm">{t('auth.login')}</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="font-semibold">{t('auth.signUpFree')}</Button>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
          <a href="#features" className="block text-sm py-2 text-muted-foreground">Funcționalități</a>
          <a href="#pricing" className="block text-sm py-2 text-muted-foreground">Prețuri</a>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login">
              <Button variant="outline" className="w-full">{t('auth.login')}</Button>
            </Link>
            <Link href="/register">
              <Button className="w-full font-semibold">{t('auth.signUpFree')}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
