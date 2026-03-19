'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    // When pathname changes, complete the bar
    if (prevPathRef.current !== pathname) {
      if (timerRef.current) clearInterval(timerRef.current)
      setProgress(100)
      const t = setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 200)
      prevPathRef.current = pathname
      return () => clearTimeout(t)
    }
  }, [pathname])

  useEffect(() => {
    // Intercept link clicks to start progress bar immediately
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Skip external, hash, mailto links
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      // Skip if modifier keys (new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey) return
      // Skip if same page
      if (href === pathname) return

      // Start progress
      setLoading(true)
      setProgress(20)

      if (timerRef.current) clearInterval(timerRef.current)
      let p = 20
      timerRef.current = setInterval(() => {
        p += Math.random() * 8
        if (p > 90) p = 90
        setProgress(p)
      }, 400)
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
