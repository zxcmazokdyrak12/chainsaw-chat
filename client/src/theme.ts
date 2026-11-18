import { useEffect, useState } from 'react'
import type { Settings } from './hooks/useSettings'

export interface ThemeTokens {
  [key: string]: string
  appBg: string
  headerBg: string
  headerBorder: string
  inputZoneBg: string
  inputBorder: string
  inputBg: string
  inputColor: string
  nameColor: string
  sfxColor: string
  titleColor: string
  titleAccent: string
  btnBg: string
  btnColor: string
  shadow: string
  halftone: string
  sidebarBg: string
  sidebarBorder: string
}

// manga page: black ink on newsprint. Greys come from screentone (see index.css), not from flat fills.
export const LIGHT: ThemeTokens = {
  appBg: '#f5f2ea', headerBg: '#f5f2ea', headerBorder: '#111',
  inputZoneBg: '#f5f2ea', inputBorder: '#111', inputBg: '#fbf9f4', inputColor: '#111',
  nameColor: '#111', sfxColor: '#111', titleColor: '#111', titleAccent: '#111',
  btnBg: '#111', btnColor: '#f5f2ea', shadow: '4px 4px 0 #111',
  halftone: 'rgba(0,0,0,0.07)', sidebarBg: '#f5f2ea', sidebarBorder: '#111',
}

// "negative" page: white ink on black, like Fujimoto's inverted spreads
export const DARK: ThemeTokens = {
  appBg: '#0e0e0e', headerBg: '#0e0e0e', headerBorder: '#f2efe6',
  inputZoneBg: '#0e0e0e', inputBorder: '#f2efe6', inputBg: '#161616', inputColor: '#f2efe6',
  nameColor: '#f2efe6', sfxColor: '#f2efe6', titleColor: '#f2efe6', titleAccent: '#f2efe6',
  btnBg: '#f2efe6', btnColor: '#111', shadow: '4px 4px 0 #f2efe6',
  halftone: 'rgba(255,255,255,0.04)', sidebarBg: '#0e0e0e', sidebarBorder: '#f2efe6',
}

type Resolved = 'light' | 'dark' | 'system'

// resolves the setting ('system' follows the OS) and keeps --ink/--paper css vars in sync
export function useTheme(settingTheme: Settings['theme'], resolveTheme: () => string) {
  const [resolvedTheme, setResolvedTheme] = useState<Resolved>(() => resolveTheme() as Resolved)

  useEffect(() => {
    setResolvedTheme(resolveTheme() as Resolved)
  }, [settingTheme, resolveTheme])

  useEffect(() => {
    if (settingTheme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settingTheme])

  const theme = resolvedTheme
  useEffect(() => { document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light' }, [theme])
  const T: ThemeTokens = theme === 'light' ? LIGHT : DARK
  return { theme, T }
}
