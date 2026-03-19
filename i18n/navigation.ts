// ✅ Nou (v4)
import { createNavigation } from 'next-intl/navigation'
import { locales, defaultLocale } from './request'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({ locales, defaultLocale })