import { Howl } from 'howler'
import { MUSIC_TRACKS, SFX } from './audioAssets'

class AudioManager {
  private musicTracks: Record<string, Howl> = {}
  private sfxSounds: Record<string, Howl> = {}
  private currentMusicName: string | null = null
  private intenseMixActive = false
  private musicVolume = 0.5
  private sfxVolume = 0.5
  private _sfxMuted = false
  private sfxThrottles: Record<string, number> = {}
  private initialized = false

  init() {
    if (this.initialized) return
    this.initialized = true

    for (const [name, def] of Object.entries(MUSIC_TRACKS)) {
      this.musicTracks[name] = new Howl({
        src: def.src,
        loop: def.loop,
        volume: 0,
        preload: true,
      })
    }

    for (const [name, def] of Object.entries(SFX)) {
      this.sfxSounds[name] = new Howl({
        src: def.src,
        volume: def.volume * this.sfxVolume,
        preload: true,
      })
    }
  }

  playMusic(track: string) {
    this.init()
    const next = this.musicTracks[track]
    if (!next) return

    if (this.currentMusicName === track) return

    // Stop all other tracks (catches orphaned queued plays from autoplay policy)
    for (const [name, howl] of Object.entries(this.musicTracks)) {
      if (name !== track) {
        howl.stop()
      }
    }
    this.intenseMixActive = false

    // Fade in new track
    const targetVol = MUSIC_TRACKS[track].volume * this.musicVolume
    next.volume(0)
    next.play()
    next.fade(0, targetVol, 1000)
    this.currentMusicName = track
  }

  stopMusic() {
    this.init()
    for (const howl of Object.values(this.musicTracks)) {
      howl.stop()
    }
    this.intenseMixActive = false
    this.currentMusicName = null
  }

  crossfadeToIntense() {
    this.init()
    if (this.intenseMixActive) return

    const gameplay = this.musicTracks['gameplay']
    const intense = this.musicTracks['intense']
    if (!gameplay || !intense) return

    this.intenseMixActive = true
    const intenseVol = MUSIC_TRACKS['intense'].volume * this.musicVolume

    // Start intense track
    intense.volume(0)
    intense.play()
    intense.fade(0, intenseVol, 2000)

    // Fade gameplay down to a bed
    const gpVol = gameplay.volume() as number
    gameplay.fade(gpVol, 0.15 * this.musicVolume, 2000)
  }

  playSfx(name: string) {
    if (this._sfxMuted) return
    this.init()
    const sound = this.sfxSounds[name]
    if (!sound) return

    // Throttle: 500ms min gap per sound
    const now = Date.now()
    if (this.sfxThrottles[name] && now - this.sfxThrottles[name] < 500) return
    this.sfxThrottles[name] = now

    sound.volume(SFX[name].volume * this.sfxVolume)
    sound.play()
  }

  setMusicVolume(v: number) {
    this.musicVolume = v
    // Update currently playing music
    if (this.intenseMixActive) {
      const gameplay = this.musicTracks['gameplay']
      const intense = this.musicTracks['intense']
      if (gameplay?.playing()) gameplay.volume(0.15 * v)
      if (intense?.playing()) intense.volume(MUSIC_TRACKS['intense'].volume * v)
    } else if (this.currentMusicName) {
      const current = this.musicTracks[this.currentMusicName]
      if (current?.playing()) {
        current.volume(MUSIC_TRACKS[this.currentMusicName].volume * v)
      }
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = v
  }

  setMusicMuted(muted: boolean) {
    for (const howl of Object.values(this.musicTracks)) {
      howl.mute(muted)
    }
  }

  setSfxMuted(muted: boolean) {
    this._sfxMuted = muted
  }
}

// Singleton — survives Vite HMR
let instance: AudioManager | null = null
export function getAudioManager(): AudioManager {
  if (!instance) instance = new AudioManager()
  return instance
}
