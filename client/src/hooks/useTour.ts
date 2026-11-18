import { useEffect, useState } from 'react'

// onboarding tour — shown once after the first time you get into the chat
export function useTour(inChat: boolean, goToChat: () => void) {
  const [tourOpen, setTourOpen] = useState<boolean>(false)

  const startTour = (): void => { goToChat(); setTimeout(() => setTourOpen(true), 350) }
  const closeTour = (): void => {
    setTourOpen(false)
    try { localStorage.setItem('chainsaw_tutorial_done', '1') } catch { /* private mode */ }
  }

  useEffect(() => {
    if (!inChat) return
    let done = false
    try { done = localStorage.getItem('chainsaw_tutorial_done') === '1' } catch { /* ignore */ }
    if (done) return
    const t = setTimeout(() => setTourOpen(true), 1200) // let the room load first
    return () => clearTimeout(t)
  }, [inChat])

  return { tourOpen, startTour, closeTour }
}
