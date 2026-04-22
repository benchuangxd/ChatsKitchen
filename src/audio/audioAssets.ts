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

// One-shot event stings (start / success / fail)
export const EVENT_SFX: Record<string, SfxDef> = {
  'event-rat-start':           { src: ['/audio/events/rat_invasion-start.mp3'],        volume: 0.7 },
  'event-rat-success':         { src: ['/audio/events/rat_invasion-success.mp3'],      volume: 0.7 },
  'event-rat-fail':            { src: ['/audio/events/rat_invasion-fail.mp3'],         volume: 0.7 },
  'event-angry-chef-start':    { src: ['/audio/events/angry_chef-start.mp3'],          volume: 0.7 },
  'event-angry-chef-success':  { src: ['/audio/events/angry_chef-success.mp3'],        volume: 0.7 },
  'event-angry-chef-fail':     { src: ['/audio/events/angry_chef-fail.mp3'],           volume: 0.7 },
  'event-power-trip-start':    { src: ['/audio/events/power_trip-start.mp3'],          volume: 0.7 },
  'event-power-trip-success':  { src: ['/audio/events/power_trip-success.mp3'],        volume: 0.7 },
  'event-smoke-blast-start':   { src: ['/audio/events/smoke_blast-start.mp3'],         volume: 0.7 },
  'event-smoke-blast-success': { src: ['/audio/events/smoke_blast-success.mp3'],       volume: 0.7 },
  'event-glitch-start':        { src: ['/audio/events/glitched_orders-start.mp3'],     volume: 0.7 },
  'event-glitch-success':      { src: ['/audio/events/glitched_orders-success.mp3'],   volume: 0.7 },
  'event-chant-start':         { src: ['/audio/events/chefs_chant-start.mp3'],         volume: 0.7 },
  'event-chant-success':       { src: ['/audio/events/chefs_chant-success.mp3'],       volume: 0.8 },
  'event-chant-fail':          { src: ['/audio/events/chefs_chant-fail.mp3'],          volume: 0.6 },
  'event-mystery-start':       { src: ['/audio/events/mystery_recipe-start.mp3'],      volume: 0.7 },
  'event-mystery-success':     { src: ['/audio/events/mystery_recipe-success.mp3'],    volume: 0.7 },
  'event-mystery-fail':        { src: ['/audio/events/mystery_recipe-fail.mp3'],       volume: 0.6 },
  'event-frenzy-start':        { src: ['/audio/events/typing_frenzy-start.mp3'],       volume: 0.7 },
  'event-frenzy-success':      { src: ['/audio/events/typing_frenzy-success.mp3'],     volume: 0.8 },
  'event-frenzy-fail':         { src: ['/audio/events/typing_frenzy-fail.mp3'],        volume: 0.6 },
  'event-dance-start':         { src: ['/audio/events/dance-start.mp3'],               volume: 0.7 },
  'event-dance-success':       { src: ['/audio/events/dance-success.mp3'],             volume: 0.8 },
  'event-dance-fail':          { src: ['/audio/events/dance-fail.mp3'],                volume: 0.6 },
}

// Looping ambient tracks (duck gameplay/intense music while active)
export const EVENT_AMBIENT: Record<string, SfxDef> = {
  'event-rat-ambient':         { src: ['/audio/events/rat_invasion-ambient.mp3'],      volume: 0.4 },
  'event-angry-chef-ambient':  { src: ['/audio/events/angry_chef-ambient.mp3'],        volume: 0.35 },
  'event-power-trip-ambient':  { src: ['/audio/events/power_trip-ambient.mp3'],        volume: 0.4 },
  'event-smoke-blast-ambient': { src: ['/audio/events/smoke_blast-ambient.mp3'],       volume: 0.4 },
  'event-glitch-ambient':      { src: ['/audio/events/glitched_orders-ambient.mp3'],   volume: 0.4 },
  'event-chant-ambient':       { src: ['/audio/events/chefs_chant-ambient.mp3'],       volume: 0.45 },
  'event-mystery-ambient':     { src: ['/audio/events/mystery_recipe-ambient.mp3'],    volume: 0.35 },
  'event-frenzy-ambient':      { src: ['/audio/events/typing_frenzy-ambient.mp3'],     volume: 0.45 },
  'event-dance-ambient':       { src: ['/audio/events/dance-ambient.mp3'],             volume: 0.5 },
}
