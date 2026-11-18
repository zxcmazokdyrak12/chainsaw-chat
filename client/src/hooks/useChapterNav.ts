import { useState } from 'react'

// chapters panel: rail on desktop (remembers open/closed), drawer on mobile
export function useChapterNav() {
  const [railOpen, setRailOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('chainsaw_rail') !== 'closed' } catch { return true }
  })
  const toggleRail = (): void => setRailOpen(o => {
    try { localStorage.setItem('chainsaw_rail', o ? 'closed' : 'open') } catch { /* ignore */ }
    return !o
  })
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  return { railOpen, toggleRail, drawerOpen, setDrawerOpen }
}
