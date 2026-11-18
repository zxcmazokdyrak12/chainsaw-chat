// The title on the login page, laid out like the title block of a tankōbon cover:
// volume / chapter line, CHAINSAW in brush lettering, a rule made of chain teeth, a CHAT box and a 契 seal.

const INK = '#f2efe6'
const DARK = '#0d0d0d'

// a saw-tooth path across the width
const teeth = (w: number, y: number, h: number, step: number) => {
  let d = `M0 ${y}`
  for (let x = 0; x < w; x += step) d += ` L${x + step / 2} ${y - h} L${x + step} ${y}`
  return d
}

function Volume() {
  return (
    <div aria-hidden style={{ width: 'min(420px, 92vw)', color: INK, fontFamily: 'BlambotClassic, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11px', letterSpacing: '3px', opacity: 0.8 }}>
        <span>VOL. 1</span><span>第0話 · CHAPTER 0</span>
      </div>
      <div style={{ height: '3px', background: INK, margin: '4px 0 6px' }} />
      <div style={{ fontFamily: "'DeathRattle', 'BlambotClassic', sans-serif", fontSize: 'clamp(48px, 15vw, 76px)', lineHeight: 0.95, letterSpacing: '1px', textShadow: `5px 5px 0 #b3140c` }}>
        CHAINSAW
      </div>
      {/* a rule made of chain teeth */}
      <svg viewBox="0 0 420 16" preserveAspectRatio="none" style={{ width: '100%', height: '14px', display: 'block', margin: '6px 0' }}>
        <path d={teeth(420, 14, 10, 14) + ' L420 16 L0 16 Z'} fill={INK} />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ background: INK, color: DARK, fontSize: 'clamp(24px, 8vw, 34px)', letterSpacing: '12px', padding: '0 4px 0 14px', lineHeight: 1.15 }}>CHAT</span>
        <span className="login-tagline" style={{ flex: 1, fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', letterSpacing: '1px', lineHeight: 1.4, opacity: 0.85 }}>
          a messenger drawn<br />like a manga page
        </span>
        <span style={{
          width: '44px', height: '44px', borderRadius: '50%', border: '3px solid #b3140c', color: '#b3140c',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'serif', fontWeight: 900, fontSize: '22px', transform: 'rotate(-12deg)',
        }}>契</span>
      </div>
    </div>
  )
}

export default function LoginLogo() {
  return (
    <h1 style={{
      margin: 0, display: 'flex', justifyContent: 'center',
      // its own black panel, so the stickers behind never eat the letters
      background: DARK, border: `3px solid ${INK}`, boxShadow: `6px 6px 0 rgba(0,0,0,.6), 0 0 0 6px ${DARK}`,
      padding: '16px 22px 18px', transform: 'rotate(-0.6deg)', maxWidth: 'calc(100vw - 40px)', boxSizing: 'border-box',
    }}>
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Chainsaw Chat</span>
      <Volume />
    </h1>
  )
}
