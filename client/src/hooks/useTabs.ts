import { useRef, useState } from 'react'

export type TabId = 'chat' | 'rooms' | 'settings' | 'profile' | string

// tab switch = quick screentone cut: tone covers the page (90ms), page swaps, tone dissolves (120ms)
export function useTabs(initial: TabId = 'chat') {
  const [activeTab, setActiveTab] = useState<TabId>(initial)
  const [toneCut, setToneCut] = useState<boolean>(false)
  const cutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const switchTab = (tab: TabId): void => {
    if (tab === activeTab) return
    if (cutTimer.current) clearTimeout(cutTimer.current)
    setToneCut(true)
    cutTimer.current = setTimeout(() => { setActiveTab(tab); setToneCut(false) }, 90)
  }
  return { activeTab, setActiveTab, toneCut, switchTab }
}
