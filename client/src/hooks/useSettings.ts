import { useState, useEffect } from 'react'

// Define a strict type for individual setting options
export interface Settings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  sendOnEnter: boolean
  soundEnabled: boolean
  pochitaEnabled: boolean
  showTyping: boolean
}

const DEFAULTS: Settings = {
  theme: 'system',      // 'light' | 'dark' | 'system'
  fontSize: 'medium',   // 'small' | 'medium' | 'large'
  sendOnEnter: true,    // true = Enter sends, Ctrl+Enter = new line
  soundEnabled: true,   // sounds chainsaw on startup and when CAPS LOCK is on
  pochitaEnabled: true, // show Pochita hearts on cute words
  showTyping: true,     // send typing events
}

export function useSettings() {
  // Explicitly pass the Settings interface to the state hook
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('chainsaw_settings')
      const parsed = saved ? (JSON.parse(saved) as Partial<Settings>) : {}
      return { ...DEFAULTS, ...parsed }
    } catch {
      return DEFAULTS
    }
  })

  // Save to localStorage whenever settings state changes
  useEffect(() => {
    localStorage.setItem('chainsaw_settings', JSON.stringify(settings))
  }, [settings])

  // Apply CSS custom property (variable) for font size scaling
  useEffect(() => {
    // Explicitly type the dictionary map using our literal union keys
    const sizes: Record<Settings['fontSize'], string> = { 
      small: '12px', 
      medium: '14px', 
      large: '17px' 
    }
    document.documentElement.style.setProperty('--font-size-base', sizes[settings.fontSize] || '14px')
  }, [settings.fontSize])

  /**
   * Type-safe updater function. 
   * Generics ensure that the value matches the exact key being updated.
   */
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  /**
   * Evaluates the real active theme — resolving 'system' choice into hard 'dark' or 'light'
   */
  const resolveTheme = (settingsOverride?: Settings): 'dark' | 'light' => {
    const s = settingsOverride || settings
    if (s.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return s.theme
  }

  return { settings, update, resolveTheme }
}