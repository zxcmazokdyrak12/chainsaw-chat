// where the login lives:
//  • accounts (password / GitHub / Google) → localStorage, survives restarts
//  • guests → sessionStorage, a signed name that ends with the tab
const ACCOUNT = 'token'
const GUEST = 'guest_token'

const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn() } catch { return fallback } }

export const getAccountToken = (): string | null => safe(() => localStorage.getItem(ACCOUNT), null)
export const getToken = (): string | null =>
  getAccountToken() ?? safe(() => sessionStorage.getItem(GUEST), null)

export const setAccountToken = (t: string) => safe(() => { sessionStorage.removeItem(GUEST); localStorage.setItem(ACCOUNT, t) }, undefined)
export const setGuestToken = (t: string) => safe(() => sessionStorage.setItem(GUEST, t), undefined)
export const clearTokens = () => safe(() => { localStorage.removeItem(ACCOUNT); sessionStorage.removeItem(GUEST) }, undefined)

export const authHeader = (): Record<string, string> => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}
