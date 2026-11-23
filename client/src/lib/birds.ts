// Sparrows outside the window, made on the spot with Web Audio — no file needed.
// Each chirp is a short, fast sine sweep; they come in little bursts at random moments,
// left and right, so it never sounds like a loop.
// If client/public/peace/ambient.mp3 exists, that recording is played instead.

type AC = AudioContext
let ctx: AC | null = null
const getCtx = (): AC | null => {
  try {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = ctx ?? new C()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

function chirp(c: AC, out: AudioNode, at: number, pan: number) {
  const f0 = 3200 + Math.random() * 1800
  const len = 0.05 + Math.random() * 0.07
  const o = c.createOscillator(); o.type = 'sine'
  o.frequency.setValueAtTime(f0, at)
  o.frequency.exponentialRampToValueAtTime(f0 * (1.25 + Math.random() * 0.4), at + len * 0.4)
  o.frequency.exponentialRampToValueAtTime(f0 * 0.8, at + len)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(0.5, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + len)
  const p = c.createStereoPanner(); p.pan.value = pan
  o.connect(g).connect(p).connect(out)
  o.start(at); o.stop(at + len + 0.02)
}

export interface Ambience { stop: (fadeMs?: number) => void }

export function startBirds(volume = 0.08): Ambience {
  // a real recording, if one was dropped in
  const file = new Audio('/peace/ambient.mp3')
  let usingFile = false
  let stopped = false
  file.loop = true
  file.volume = volume * 2
  file.play().then(() => { if (stopped) file.pause(); else usingFile = true }).catch(() => {})

  const c = getCtx()
  let timer: ReturnType<typeof setTimeout> | null = null
  const master = c?.createGain()
  if (c && master) {
    master.gain.setValueAtTime(0.0001, c.currentTime)
    master.gain.exponentialRampToValueAtTime(volume, c.currentTime + 1.5)
    master.connect(c.destination)
    const burst = () => {
      if (stopped) return
      if (!usingFile) {
        const pan = -0.8 + Math.random() * 1.6
        const n = 2 + Math.floor(Math.random() * 4)
        let t = c.currentTime + 0.05
        for (let i = 0; i < n; i++) { chirp(c, master, t, pan); t += 0.09 + Math.random() * 0.12 }
      }
      timer = setTimeout(burst, 500 + Math.random() * 1600)
    }
    burst()
  }

  return {
    stop(fadeMs = 800) {
      stopped = true
      if (timer) clearTimeout(timer)
      if (c && master) {
        master.gain.cancelScheduledValues(c.currentTime)
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), c.currentTime)
        master.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + fadeMs / 1000)
        setTimeout(() => master.disconnect(), fadeMs + 100)
      }
      const v0 = file.volume
      const t0 = performance.now()
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / fadeMs)
        file.volume = v0 * (1 - k)
        if (k < 1) requestAnimationFrame(step); else file.pause()
      }
      requestAnimationFrame(step)
    },
  }
}
