// chat commands: a message that is exactly "/pochita" etc. plays an effect for everybody in the room
export interface ChatCommand {
  cmd: string
  desc: string
  sfx: string        // big lettering over the feed
  shake?: number     // px
  flash?: boolean    // white flash (gunshot)
  roar?: boolean     // chainsaw sound
  hearts?: boolean   // Pochita hearts
}

export const COMMANDS: ChatCommand[] = [
  { cmd: '/pochita', desc: 'Pochita runs by, hearts everywhere', sfx: 'WOOF!', hearts: true },
  { cmd: '/power',   desc: "the strongest fiend's entrance",    sfx: "I'M THE STRONGEST!!", shake: 8 },
  { cmd: '/brrr',    desc: 'pull the cord',                      sfx: 'BRRRRRM!!', shake: 12, roar: true },
  { cmd: '/bang',    desc: 'one shot, one flash',                sfx: 'BANG!', flash: true, shake: 4 },
  { cmd: '/pudding', desc: 'somebody ate it',                    sfx: 'WHO ATE MY PUDDING?!', shake: 6 },
]

export const findCommand = (text: string | null | undefined): ChatCommand | null => {
  const t = (text ?? '').trim().toLowerCase()
  return COMMANDS.find(c => c.cmd === t) ?? null
}

export const HELP_TEXT = 'Commands: ' + COMMANDS.map(c => `${c.cmd} — ${c.desc}`).join(' · ')
