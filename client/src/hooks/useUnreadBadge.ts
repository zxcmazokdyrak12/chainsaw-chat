import { useEffect, useRef } from 'react'

const BASE_TITLE = 'Chainsaw Chat ⛓'

// While the tab is in the background: "(3) Chainsaw Chat" in the title, a blood-red counter on the
// favicon and — if allowed — a system notification. Everything resets when you come back.
export function useUnreadBadge(opts: { desktop: boolean }) {
  const unread = useRef(0)
  const iconHref = useRef<string | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const setFavicon = (n: number) => {
    const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
    if (!link) return
    if (iconHref.current === null) iconHref.current = link.href
    if (!n) { link.href = iconHref.current; return }
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, 64, 64)
      ctx.fillStyle = '#b3140c'
      ctx.beginPath(); ctx.arc(44, 20, 19, 0, Math.PI * 2); ctx.fill()
      ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(n > 9 ? '9+' : String(n), 44, 21)
      link.href = c.toDataURL('image/png')
    }
    img.src = iconHref.current
  }

  const reset = () => {
    unread.current = 0
    document.title = BASE_TITLE
    setFavicon(0)
  }

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') reset() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', reset)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', reset) }
  }, [])

  // call for every incoming message from somebody else
  const notify = (from: string, text: string) => {
    if (document.visibilityState === 'visible' && document.hasFocus()) return
    unread.current += 1
    document.title = `(${unread.current}) ${BASE_TITLE}`
    setFavicon(unread.current)
    if (optsRef.current.desktop && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(from, { body: text.slice(0, 120), icon: '/favicon.svg', tag: 'chainsaw-chat', silent: true })
        n.onclick = () => { window.focus(); n.close() }
      } catch { /* some mobile browsers only allow notifications from a service worker */ }
    }
  }

  return { notify }
}
