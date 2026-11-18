import { API_URL } from '../config'
import { authHeader } from './auth'

// Web Push: notifications even when every tab is closed (needs the service worker + an account)
export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const toKey = (b64u: string) => {
  const b64 = (b64u + '='.repeat((4 - (b64u.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return 'This browser has no push notifications (on iPhone: add the app to the Home Screen first)'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'Notifications are blocked for this site'
  const keyRes = await fetch(`${API_URL}/push/key`).catch(() => null)
  if (!keyRes?.ok) return 'Push is not set up on the server yet'
  const { key } = await keyRes.json() as { key: string }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription() ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) })
  const r = await fetch(`${API_URL}/push/subscribe`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(sub.toJSON()),
  })
  if (!r.ok) return (await r.json().catch(() => ({}))).error || 'Could not subscribe'
  return null
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await fetch(`${API_URL}/push/unsubscribe`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {})
  await sub.unsubscribe().catch(() => {})
}
