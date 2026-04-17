export interface TrackDef {
  src: string[]
  loop: boolean
  volume: number
}

export interface SfxDef {
  src: string[]
  volume: number
  loop?: boolean
}

export const MUSIC_TRACKS: Record<string, TrackDef> = {
  menu:     { src: ['/audio/music/menu.mp3'],     loop: true,  volume: 0.5 },
  gameplay: { src: ['/audio/music/gameplay.mp3'], loop: true,  volume: 0.5 },
  intense:  { src: ['/audio/music/intense.mp3'],  loop: true,  volume: 0.5 },
  gameover: { src: ['/audio/music/gameover.mp3'], loop: false, volume: 0.5 },
}

export const SFX: Record<string, SfxDef> = {
  'cook-start':        { src: ['/audio/sfx/cook-start.mp3'],        volume: 0.6 },
  'serve-success':     { src: ['/audio/sfx/serve-success.mp3'],     volume: 0.7 },
  'fire-alarm':        { src: ['/audio/sfx/fire-alarm.mp3'],        volume: 0.6, loop: true },
  'fire-extinguished': { src: ['/audio/sfx/fire-extinguished.mp3'], volume: 0.6 },
  'cool':              { src: ['/audio/sfx/fire-extinguished.mp3'], volume: 0.4 },
  'order-spawn':       { src: ['/audio/sfx/order-spawn.mp3'],       volume: 0.5 },
  'order-expired':     { src: ['/audio/sfx/order-expired.mp3'],     volume: 0.6 },
  'error-buzzer':      { src: ['/audio/sfx/error-buzzer.mp3'],      volume: 0.4 },
  'plating':           { src: ['/audio/sfx/plating.mp3'],           volume: 0.5 },
  'take-item':         { src: ['/audio/sfx/take-item.mp3'],         volume: 0.5 },
  'countdown-beep':    { src: ['/audio/sfx/countdown-beep.mp3'],    volume: 0.6 },
  'round-over':        { src: ['/audio/sfx/round-over.mp3'],        volume: 0.3 },
}
