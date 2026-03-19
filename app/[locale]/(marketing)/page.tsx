import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { LandingNav } from '@/components/layout/landing-nav'
import { PricingSection } from '@/components/shared/pricing-section'
import {
  LayoutDashboard,
  Users,
  CalendarOff,
  Bell,
  Building2,
  Globe,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from 'lucide-react'

export default function LandingPage() {
  const t = useTranslations()

  const features = [
    {
      icon: LayoutDashboard,
      key: 'kanban',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      icon: Users,
      key: 'team',
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      icon: CalendarOff,
      key: 'holidays',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      icon: Bell,
      key: 'notifications',
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      icon: Building2,
      key: 'multitenancy',
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-950/30',
    },
    {
      icon: Globe,
      key: 'i18n',
      color: 'text-cyan-500',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    },
  ]

  return (
    <div className="min-h-screen">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        {/* Background decoration */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(213 94% 47% / 0.12), transparent)',
          }}
        />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5" />
            {t('landing.hero.badge')}
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-balance mb-6 animate-fade-in">
            {t('landing.hero.title').split(' ').slice(0, 3).join(' ')}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, hsl(213 94% 47%), #7c3aed)',
              }}
            >
              {t('landing.hero.title').split(' ').slice(3).join(' ')}
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            {t('landing.hero.subtitle')}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-primary/25">
                {t('landing.hero.cta')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              {t('landing.hero.ctaSecondary')}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {t('landing.hero.noCard')}
          </p>
        </div>

        {/* Mock UI preview */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 text-center text-xs text-muted-foreground font-mono">
                cotasking.app/workspace/acme-corp
              </div>
            </div>
            {/* Mock kanban board */}
            <div className="p-6 bg-muted/20">
              <div className="flex gap-4 overflow-hidden">
                {['De făcut', 'În progres', 'Review', 'Finalizat'].map((col, i) => (
                  <div key={col} className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">{col}</span>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        {[3, 2, 1, 4][i]}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: [3, 2, 1, 2][i] }).map((_, j) => (
                        <div
                          key={j}
                          className="bg-card border border-border rounded-lg p-3 shadow-sm"
                        >
                          <div
                            className="h-2.5 bg-muted rounded-full mb-2"
                            style={{ width: `${60 + Math.random() * 30}%` }}
                          />
                          <div className="h-2 bg-muted/60 rounded-full mb-3" style={{ width: '80%' }} />
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {j % 2 === 0 && (
                                <div className="h-4 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full" />
                              )}
                              {j % 3 === 0 && (
                                <div className="h-4 w-10 bg-violet-100 dark:bg-violet-900/30 rounded-full" />
                              )}
                            </div>
                            <div className="w-5 h-5 rounded-full bg-primary/20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('landing.features.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, key, color, bg }) => (
              <div
                key={key}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold mb-2">
                  {t(`landing.features.${key}.title` as any)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`landing.features.${key}.description` as any)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 px-6 border-y border-border bg-card">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          {[
            { icon: Shield, text: 'GDPR Compliant' },
            { icon: Zap, text: '99.9% Uptime' },
            { icon: Globe, text: 'Hosted in EU' },
            { icon: Users, text: 'Multi-tenant' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm font-medium">
              <Icon className="w-4 h-4 text-primary" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-3xl p-12"
            style={{
              background: 'linear-gradient(135deg, hsl(213 94% 47% / 0.1), hsl(262 83% 58% / 0.1))',
              border: '1px solid hsl(213 94% 47% / 0.2)',
            }}
          >
            <h2 className="text-4xl font-bold mb-4">{t('landing.cta.title')}</h2>
            <p className="text-lg text-muted-foreground mb-8">{t('landing.cta.subtitle')}</p>
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base font-semibold gap-2">
                {t('landing.cta.button')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">CoTasking</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CoTasking. Toate drepturile rezervate.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termeni</a>
            <a href="#" className="hover:text-foreground transition-colors">Confidențialitate</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
