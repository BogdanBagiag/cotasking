'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1" />
      {['ro', 'en'].map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`text-xs font-medium px-2 py-1 rounded-md transition-colors uppercase ${
            locale === loc
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  )
}
