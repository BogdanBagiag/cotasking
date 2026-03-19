import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Check, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PricingSection() {
  const t = useTranslations()

  const plans = [
    {
      key: 'free',
      highlighted: false,
    },
    {
      key: 'premium',
      highlighted: true,
    },
    {
      key: 'premiumPlus',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t('pricing.title')}</h2>
          <p className="text-xl text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(({ key, highlighted }) => {
            const planKey = `pricing.plans.${key}` as any
            const features = t.raw(`pricing.plans.${key}.features`) as string[]

            return (
              <div
                key={key}
                className={cn(
                  'relative rounded-2xl border p-6',
                  highlighted
                    ? 'border-primary shadow-xl shadow-primary/10 bg-card ring-1 ring-primary/20'
                    : 'border-border bg-card'
                )}
              >
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {t('pricing.mostPopular')}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-1">
                    {t(`pricing.plans.${key}.name` as any)}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {t(`pricing.plans.${key}.description` as any)}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">
                      {t(`pricing.plans.${key}.price` as any)}
                    </span>
                    {key !== 'free' && (
                      <span className="text-muted-foreground text-sm">/lună</span>
                    )}
                  </div>
                </div>

                <Link href="/register">
                  <Button
                    className="w-full mb-6"
                    variant={highlighted ? 'default' : 'outline'}
                  >
                    {key === 'free' ? t('auth.signUpFree') : t('pricing.choosePlan')}
                  </Button>
                </Link>

                <ul className="space-y-2.5">
                  {features.map((feature: string) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
