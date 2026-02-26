'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useThemeStore } from '@/lib/theme'

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const root = window.document.documentElement
    const effectiveTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    
    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)
  }, [theme])

  if (!mounted) return null

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <button
      onClick={cycleTheme}
      className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
      title={`Current: ${theme} mode`}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
