// Three original "contract devils" — drawn for this project, ink on newsprint.
// One 80×80 drawing per (devil, mood). The bottom ~18 units hide behind the input panel.
import type { CSSProperties } from 'react'

export type CompanionKind = 'inkling' | 'static' | 'seal'
export type Mood = 'sleep' | 'idle' | 'hype' | 'listen' | 'panic'

export const COMPANIONS: { id: CompanionKind; name: string; blurb: string }[] = [
  { id: 'inkling', name: 'INK IMP', blurb: 'a blot that dozes off when the chat goes quiet' },
  { id: 'static', name: 'STATIC DEVIL', blurb: 'an old TV that turns to snow when the line drops' },
  { id: 'seal', name: 'SEAL DEVIL', blurb: 'a hanko stamp that stamps along to your CAPS' },
]

const INK = 'var(--ink)'
const PAPER = 'var(--paper)'

interface ArtProps { kind: CompanionKind; mood: Mood; size?: number; style?: CSSProperties; still?: boolean }

export default function CompanionArt({ kind, mood, size = 64, style, still }: ArtProps) {
  const body = kind === 'inkling' ? <Inkling mood={mood} /> : kind === 'static' ? <Static mood={mood} /> : <Seal mood={mood} />
  return (
    <svg
      viewBox="0 0 80 80" width={size} height={size} aria-hidden="true"
      className={still ? 'cmp-still' : `cmp-anim cmp-${mood}`}
      style={{ overflow: 'visible', display: 'block', ...style }}
    >
      {body}
    </svg>
  )
}

// ── shared bits ─────────────────────────────────────────────────

const Zzz = () => (
  <g className="cmp-z" fill={INK} fontFamily="BlambotClassic, sans-serif" fontWeight={900}>
    <text x="60" y="26" fontSize="11">z</text>
    <text x="67" y="16" fontSize="8">z</text>
    <text x="72" y="9" fontSize="6">z</text>
  </g>
)

const SpeedLines = () => (
  <g stroke={INK} strokeWidth="2.4" strokeLinecap="round">
    <path d="M3 30 L11 34" /><path d="M1 40 L10 41" /><path d="M3 50 L11 47" />
    <path d="M77 30 L69 34" /><path d="M79 40 L70 41" /><path d="M77 50 L69 47" />
  </g>
)

const SoundArcs = ({ side = 'right' }: { side?: 'left' | 'right' }) => (
  <g stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" className="cmp-arcs"
    transform={side === 'left' ? 'translate(80 0) scale(-1 1)' : undefined}>
    <path d="M70 38 q4 6 0 12" /><path d="M75 33 q8 11 0 22" />
  </g>
)

const Sweat = ({ x, y }: { x: number; y: number }) => (
  <path className="cmp-drop" d={`M${x} ${y} q5 7 0 10 q-5 -3 0 -10Z`} fill={PAPER} stroke={INK} strokeWidth="1.6" />
)

// ── INK IMP: a blot with horns and one big eye ──────────────────

function Inkling({ mood }: { mood: Mood }) {
  const hornTip = mood === 'hype' ? 12 : mood === 'sleep' ? 26 : 20
  const squash = mood === 'sleep' ? 'translate(0 6) scale(1 0.92)' : undefined
  return (
    <g>
      {mood === 'hype' && <SpeedLines />}
      <g transform={squash}>
        {/* horns */}
        <path d={`M28 38 L22 ${hornTip} L35 33 Z`} fill={INK} />
        <path d={`M52 38 L58 ${hornTip} L45 33 Z`} fill={INK} />
        {/* the blot */}
        <path d="M12 84 C11 58 19 33 40 31 C61 33 69 58 68 84 Z" fill={INK} />
        {/* drips on the shoulders */}
        <circle cx="15" cy="66" r="3" fill={INK} /><circle cx="66" cy={mood === 'panic' ? 74 : 68} r="2.4" fill={INK} />
        {/* little arms */}
        <g stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none">
          {mood === 'hype'
            ? <><path d="M16 56 Q8 48 9 38" /><path d="M64 56 Q72 48 71 38" /></>
            : mood === 'listen'
              ? <><path d="M16 60 Q9 60 8 54" /><path d="M64 52 Q71 46 69 40" /></>
              : <><path d="M16 62 Q9 62 7 56" /><path d="M64 62 Q71 62 73 56" /></>}
        </g>
        {/* eye */}
        {mood === 'sleep' && <path d="M30 52 q10 7 20 0" stroke={PAPER} strokeWidth="3" fill="none" strokeLinecap="round" />}
        {mood === 'idle' && (
          <g className="cmp-blink">
            <ellipse cx="40" cy="50" rx="11" ry="10" fill={PAPER} />
            <circle cx="36.5" cy="53" r="4.2" fill={INK} />
            <circle cx="35" cy="51.5" r="1.2" fill={PAPER} />
          </g>
        )}
        {mood === 'hype' && (
          <g>
            <ellipse cx="40" cy="46" rx="11" ry="9" fill={PAPER} />
            <circle cx="40" cy="47" r="3.4" fill={INK} />
            <path d="M27 36 L54 43 L54 34 L27 34 Z" fill={INK} />
            {/* shouting mouth with teeth */}
            <path d="M29 56 L51 56 L47 66 L33 66 Z" fill={PAPER} />
            <path d="M31 56 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4" fill={INK} />
          </g>
        )}
        {mood === 'listen' && (
          <g>
            <ellipse cx="40" cy="49" rx="11.5" ry="12" fill={PAPER} />
            <circle cx="44" cy="45" r="3" fill={INK} />
          </g>
        )}
        {mood === 'panic' && (
          <g>
            <ellipse cx="40" cy="50" rx="11" ry="10" fill={PAPER} />
            <path className="cmp-spin" d="M40 50 m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -6 0 a5 5 0 1 1 10 0 a7 7 0 1 1 -14 0"
              stroke={INK} strokeWidth="1.6" fill="none" />
          </g>
        )}
      </g>
      {mood === 'sleep' && <Zzz />}
      {mood === 'listen' && <SoundArcs />}
      {mood === 'panic' && <><Sweat x={70} y={26} /><Sweat x={9} y={32} /></>}
    </g>
  )
}

// ── STATIC DEVIL: a CRT with antenna horns ──────────────────────

const NOISE = [
  [24, 38, 9], [36, 38, 14], [27, 42, 6], [41, 43, 12], [23, 47, 15], [44, 48, 8],
  [29, 52, 10], [46, 53, 9], [24, 57, 7], [35, 57, 13], [27, 61, 16], [48, 61, 7],
]
const EQ = [8, 14, 20, 11, 17, 9, 13]

function Static({ mood }: { mood: Mood }) {
  const droop = mood === 'sleep'
  const a1 = droop ? 'M33 29 L20 22' : mood === 'hype' ? 'M33 29 L27 6' : 'M33 29 L24 11'
  const a2 = droop ? 'M47 29 L60 22' : mood === 'hype' ? 'M47 29 L53 6' : 'M47 29 L56 11'
  const t1 = droop ? [20, 22] : mood === 'hype' ? [27, 6] : [24, 11]
  const t2 = droop ? [60, 22] : mood === 'hype' ? [53, 6] : [56, 11]
  return (
    <g>
      {mood === 'hype' && (
        <g stroke={INK} strokeWidth="2" fill="none" strokeLinejoin="round">
          <path d="M20 4 l4 3 l-3 2 l4 3" /><path d="M60 4 l-4 3 l3 2 l-4 3" />
        </g>
      )}
      {/* antenna horns */}
      <g stroke={INK} strokeWidth="3.2" strokeLinecap="round" className={mood === 'listen' ? 'cmp-wiggle' : undefined}>
        <path d={a1} /><path d={a2} />
      </g>
      <circle cx={t1[0]} cy={t1[1]} r="2.8" fill={INK} /><circle cx={t2[0]} cy={t2[1]} r="2.8" fill={INK} />
      {/* set */}
      <rect x="13" y="28" width="54" height="56" rx="7" fill={INK} />
      <g stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none">
        {mood === 'hype'
          ? <><path d="M13 50 Q5 44 7 34" /><path d="M67 50 Q75 44 73 34" /></>
          : <><path d="M13 58 Q6 58 5 52" /><path d="M67 58 Q74 58 75 52" /></>}
      </g>
      {/* screen */}
      <rect x="19" y="34" width="42" height="32" rx="6" fill={PAPER} />
      {mood === 'sleep' && (
        <>
          <rect x="19" y="34" width="42" height="32" rx="6" fill={INK} opacity="0.82" />
          <text x="33" y="55" fill={PAPER} fontSize="10" fontFamily="BlambotClassic, sans-serif">z z</text>
        </>
      )}
      {mood === 'idle' && (
        <g>
          <g className="cmp-blink">
            <rect x="31" y="42" width="3.4" height="7" rx="1.5" fill={INK} />
            <rect x="45.6" y="42" width="3.4" height="7" rx="1.5" fill={INK} />
          </g>
          <path d="M36 56 q4 3 8 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
      {mood === 'hype' && (
        <g stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M27 40 l7 4 l-7 4" /><path d="M53 40 l-7 4 l7 4" />
          <path d="M28 57 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" />
        </g>
      )}
      {mood === 'listen' && (
        <g fill={INK}>
          {EQ.map((h, i) => (
            <rect key={i} className="cmp-eq" x={24 + i * 5} y={50 - h / 2} width="3" height={h}
              style={{ animationDelay: `${i * 0.09}s` }} />
          ))}
        </g>
      )}
      {mood === 'panic' && (
        <g>
          <g className="cmp-noise" stroke={INK} strokeWidth="1.6">
            {NOISE.map(([x, y, w], i) => <path key={i} d={`M${x} ${y} h${w}`} />)}
          </g>
          <rect x="21" y="45" width="38" height="10" fill={INK} />
          <text x="40" y="52.5" textAnchor="middle" fill={PAPER} fontSize="5" fontFamily="BlambotClassic, sans-serif" letterSpacing="0.3">NO SIGNAL</text>
        </g>
      )}
      {/* knobs */}
      <circle cx="24" cy="73" r="2.2" fill={PAPER} /><circle cx="31" cy="73" r="2.2" fill={PAPER} />
      {mood === 'panic' && <Sweat x={72} y={24} />}
    </g>
  )
}

// ── SEAL DEVIL: a hanko stamp with a 契 on its forehead ─────────

function Seal({ mood }: { mood: Mood }) {
  const tilt = mood === 'sleep' ? 'rotate(-9 40 84)' : mood === 'listen' ? 'rotate(8 40 84)' : undefined
  return (
    <g>
      {mood === 'hype' && <SpeedLines />}
      <g transform={tilt}>
        {/* knob + neck */}
        <circle cx="40" cy="17" r="7.5" fill={INK} />
        <rect x="35.5" y="21" width="9" height="10" fill={INK} />
        {/* body */}
        <rect x="18" y="29" width="44" height="58" rx="11" fill={PAPER} stroke={INK} strokeWidth="3.2" />
        {/* hatched band at the stamping end */}
        <g stroke={INK} strokeWidth="1.4" opacity="0.7">
          {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${20 + i * 6} 80 l6 -8`} />)}
        </g>
        <path d="M19.5 71 h41" stroke={INK} strokeWidth="2.2" />
        {/* forehead mark */}
        <circle cx="40" cy="38" r="5.5" fill="none" stroke={INK} strokeWidth="1.4" />
        <text x="40" y="41" textAnchor="middle" fontSize="7.5" fill={INK} fontFamily="serif" fontWeight={700}>契</text>
        {/* arms */}
        <g stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none">
          {mood === 'hype'
            ? <><path d="M18 52 Q10 46 11 36" /><path d="M62 52 Q70 46 69 36" /></>
            : <><path d="M18 60 Q11 60 9 54" /><path d="M62 60 Q69 60 71 54" /></>}
        </g>
        {/* face */}
        {mood === 'sleep' && (
          <g stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M29 51 h7" /><path d="M44 51 h7" /><circle cx="40" cy="60" r="2" />
          </g>
        )}
        {mood === 'idle' && (
          <g>
            <g className="cmp-blink" fill={INK}>
              <circle cx="32.5" cy="51" r="2.7" /><circle cx="47.5" cy="51" r="2.7" />
            </g>
            <path d="M35 58 q5 3.5 10 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M42 59.4 l1.6 3.4 l1.6 -3.6 Z" fill={PAPER} stroke={INK} strokeWidth="1" />
          </g>
        )}
        {mood === 'hype' && (
          <g>
            <g stroke={INK} strokeWidth="2.4" strokeLinecap="round"><path d="M27 45 l8 3" /><path d="M53 45 l-8 3" /></g>
            <circle cx="32" cy="51" r="2.4" fill={INK} /><circle cx="48" cy="51" r="2.4" fill={INK} />
            <path d="M29 56 h22 l-4 9 h-14 Z" fill={INK} />
            <path d="M32 56 l2 3.5 l2 -3.5 M44 56 l2 3.5 l2 -3.5" fill={PAPER} stroke={PAPER} strokeWidth="1" />
            {/* blush hatching */}
            <g stroke={INK} strokeWidth="1"><path d="M22 54 l3 -3 M24 55 l3 -3" /><path d="M53 54 l3 -3 M55 55 l3 -3" /></g>
          </g>
        )}
        {mood === 'listen' && (
          <g>
            <circle cx="32" cy="50" r="4.6" fill={PAPER} stroke={INK} strokeWidth="2" />
            <circle cx="33" cy="49" r="2" fill={INK} />
            <circle cx="48" cy="51" r="2.2" fill={INK} />
            <path d="M37 59 h6" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {mood === 'panic' && (
          <g>
            <g fill="none" stroke={INK} strokeWidth="1.8"><circle cx="32" cy="51" r="4" /><circle cx="48" cy="51" r="4" /></g>
            <circle cx="32" cy="51" r="1.2" fill={INK} /><circle cx="48" cy="51" r="1.2" fill={INK} />
            <path d="M34 61 q3 -3 6 0 q3 3 6 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* cracks */}
            <path d="M22 33 l5 6 l-3 4 l5 5" stroke={INK} strokeWidth="1.6" fill="none" />
            <path d="M58 64 l-4 3 l2 4" stroke={INK} strokeWidth="1.6" fill="none" />
          </g>
        )}
      </g>
      {mood === 'sleep' && <Zzz />}
      {mood === 'listen' && <SoundArcs side="left" />}
      {mood === 'panic' && <><Sweat x={70} y={24} /><Sweat x={10} y={30} /></>}
    </g>
  )
}
