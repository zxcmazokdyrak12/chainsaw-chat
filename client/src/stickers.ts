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
  | { kind: 'card'; src: string; name: string; ratio?: string } // ratio 'auto' keeps the panel's own shape
  | { kind: 'sfx';  text: string; color: string }

export const STICKERS: Sticker[] = [
  // manga cut-outs (client/public/stickers)
  { kind: 'cut', src: '/stickers/aki_smoke.webp',      name: 'Aki' },
  { kind: 'cut', src: '/stickers/aki_sketch.webp',     name: 'Aki' },
  { kind: 'cut', src: '/stickers/aki_quanxi.webp',     name: 'Aki & Quanxi' },
  { kind: 'cut', src: '/stickers/kishibe_quanxi.webp', name: 'Kishibe & Quanxi' },
  { kind: 'cut', src: '/stickers/makima_sit.webp',     name: 'Makima' },
  { kind: 'cut', src: '/stickers/asa_hug.webp',        name: 'Yoru' },
  { kind: 'cut', src: '/stickers/asa_carry.webp',      name: 'Asa & Denji' },
  { kind: 'cut', src: '/stickers/asa_pochita.webp',    name: 'Asa & Pochita' },
  { kind: 'cut', src: '/stickers/power_salute.webp',   name: 'Power' },
  { kind: 'cut', src: '/stickers/power_meowy.webp',    name: 'Power & Meowy' },
  { kind: 'cut', src: '/stickers/reze_smile.webp',     name: 'Reze' },
  { kind: 'cut', src: '/stickers/reze_flowers.webp',   name: 'Reze' },
  { kind: 'cut', src: '/stickers/kobeni_face.webp',    name: 'Kobeni' },
  { kind: 'cut', src: '/stickers/kobeni_peace.webp',   name: 'Kobeni' },
  { kind: 'cut', src: '/stickers/kobeni_sweat.webp',   name: 'Kobeni' },
  { kind: 'cut', src: '/stickers/himeno_cig.webp',     name: 'Himeno' },
  { kind: 'cut', src: '/stickers/himeno_wink.webp',    name: 'Himeno' },
  { kind: 'cut', src: '/stickers/yoru_face.webp',      name: 'Yoru' },
  { kind: 'cut', src: '/stickers/yoru_point.webp',     name: 'Yoru' },
  { kind: 'cut', src: '/stickers/yoru_side.webp',      name: 'Yoru' },
  { kind: 'cut', src: '/stickers/denji_asa_teeth.webp', name: 'Denji & Asa' },

  // manga panels — taped on as photo cards
  { kind: 'card', src: '/stickers/panel_kishibe_note.jpg',   name: 'Kishibe',        ratio: 'auto' },
  { kind: 'card', src: '/stickers/panel_denji_flower.jpg',   name: 'Denji',          ratio: 'auto' },
  { kind: 'card', src: '/stickers/panel_asa_denji.jpg',      name: 'Asa & Denji',    ratio: 'auto' },
  { kind: 'card', src: '/stickers/panel_denji_makima.jpg',   name: 'Denji & Makima', ratio: 'auto' },
  { kind: 'card', src: '/stickers/panel_makima_lighter.jpg', name: 'Makima',         ratio: 'auto' },
  { kind: 'card', src: '/stickers/panel_asa_selfie.jpg',     name: 'Asa & Denji',    ratio: 'auto' },
  { kind: 'card', src: '/stickers/panel_sleepover.jpg',      name: 'Sleepover',      ratio: 'auto' },
  { kind: 'card', src: '/stickers/panel_denji_kobeni.jpg',   name: 'Denji & Kobeni', ratio: 'auto' },
  { kind: 'card', src: '/stickers/panel_himeno_window.jpg',  name: 'Himeno',         ratio: 'auto' },

  // close-ups cut from the same panels
  { kind: 'card', src: '/stickers/crop_makima_eyes.jpg',      name: 'Makima',      ratio: 'auto' },
  { kind: 'card', src: '/stickers/crop_makima_face.jpg',      name: 'Makima',      ratio: 'auto' },
  { kind: 'card', src: '/stickers/crop_makima_hall.jpg',      name: 'Makima',      ratio: 'auto' },
  { kind: 'card', src: '/stickers/crop_denji_hall.jpg',       name: 'Denji',       ratio: 'auto' },
  { kind: 'card', src: '/stickers/crop_denji_tongue.jpg',     name: 'Denji',       ratio: 'auto' },
  { kind: 'card', src: '/stickers/crop_denji_grin.jpg',       name: 'Denji',       ratio: 'auto' },
  { kind: 'card', src: '/stickers/crop_asa_laugh.jpg',        name: 'Asa',         ratio: 'auto' },
  { kind: 'card', src: '/stickers/crop_asa_denji_selfie.jpg', name: 'Asa & Denji', ratio: 'auto' },
  { kind: 'card', src: '/stickers/crop_kishibe_face.jpg',     name: 'Kishibe',     ratio: 'auto' },

  // lettering
  { kind: 'sfx', text: 'BRRRRM!',      color: '#cc2200' },
  { kind: 'sfx', text: 'DEVIL HUNTER', color: '#111' },
  { kind: 'sfx', text: 'ZUDOM',        color: '#cc2200' },
  { kind: 'sfx', text: '♥',            color: '#ff4f8b' },
]
