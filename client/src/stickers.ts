// Sticker pack for the stickerbomb background.
//
// kind 'cut'  → transparent PNG cut-out (manga panel character). Gets a white die-cut outline.
// kind 'card' → rectangular art (avatar portraits). Gets a white border + a strip of tape.
// kind 'sfx'  → manga sound effect lettering, drawn with the comic font — no image needed.
//
// To add your own: drop a transparent PNG into client/public/stickers/ and add a line here,
// e.g. { kind: 'cut', src: '/stickers/asa.png', name: 'Asa' }.
// Cut-outs look best around 400–700px on the long side with a fully transparent background.

export type Sticker =
  | { kind: 'cut';  src: string; name: string }
  | { kind: 'card'; src: string; name: string }
  | { kind: 'sfx';  text: string; color: string }

export const STICKERS: Sticker[] = [
  // cut-outs already in the project
  { kind: 'cut', src: '/denji.png',   name: 'Denji' },
  { kind: 'cut', src: '/makima.png',  name: 'Makima' },
  { kind: 'cut', src: '/aki.png',     name: 'Aki' },
  { kind: 'cut', src: '/reze.png',    name: 'Reze' },
  { kind: 'cut', src: '/pochita.png', name: 'Pochita' },

  // portraits from the avatar set
  { kind: 'card', src: '/avatars/avatar_asa.png',     name: 'Asa' },
  { kind: 'card', src: '/avatars/avatar_nayuta.png',  name: 'Nayuta' },
  { kind: 'card', src: '/avatars/avatar_kishibe.png', name: 'Kishibe' },
  { kind: 'card', src: '/avatars/avatar_power.png',   name: 'Power' },
  { kind: 'card', src: '/avatars/avatar_yoru.png',    name: 'Yoru' },
  { kind: 'card', src: '/avatars/avatar_kobeni.png',  name: 'Kobeni' },
  { kind: 'card', src: '/avatars/avatar_himeno.png',  name: 'Himeno' },
  { kind: 'card', src: '/avatars/avatar_beam.png',    name: 'Beam' },

  // lettering
  { kind: 'sfx', text: 'BRRRRM!',      color: '#cc2200' },
  { kind: 'sfx', text: 'WOOF!',        color: '#ff8a00' },
  { kind: 'sfx', text: 'DEVIL HUNTER', color: '#111' },
  { kind: 'sfx', text: 'ZUDOM',        color: '#cc2200' },
  { kind: 'sfx', text: '♥',            color: '#ff4f8b' },
]
