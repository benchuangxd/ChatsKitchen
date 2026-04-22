import { Howl } from 'howler'
import { MUSIC_TRACKS, SFX, EVENT_SFX, EVENT_AMBIENT } from './audioAssets'

const MUSIC_BED_VOLUME = 0.15

class AudioManager {
  private musicTracks: Record<string, Howl> = {}
  private sfxSounds: Record<string, Howl> = {}
  private eventSfxSounds: Record<string, Howl> = {}
  private eventAmbientSounds: Record<string, Howl> = {}
  private currentMusicName: string | null = null
  private intenseMixActive = false
  private activeEventAmbientKey: string | null = null
  private ambientDuckingActive = false
  private masterVolume = 1
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
        loop: def.loop ?? false,
        preload: true,
      })
    }

    for (const [name, def] of Object.entries(EVENT_SFX)) {
      this.eventSfxSounds[name] = new Howl({
        src: def.src,
        volume: def.volume,
        loop: false,
        preload: true,
      })
    }

    for (const [name, def] of Object.entries(EVENT_AMBIENT)) {
      this.eventAmbientSounds[name] = new Howl({
        src: def.src,
        volume: def.volume,
        loop: true,
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
    const targetVol = MUSIC_TRACKS[track].volume * this.musicVolume * this.masterVolume
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
    this.ambientDuckingActive = false
    this.activeEventAmbientKey = null
  }

  crossfadeToIntense() {
    this.init()
    if (this.intenseMixActive) return

    const gameplay = this.musicTracks['gameplay']
    const intense = this.musicTracks['intense']
    if (!gameplay || !intense) return

    this.intenseMixActive = true
    const intenseVol = MUSIC_TRACKS['intense'].volume * this.musicVolume * this.masterVolume

    // Start intense track at 1.5× speed (raises BPM ~50%)
    intense.rate(1.5)
    intense.volume(0)
    intense.play()
    intense.fade(0, intenseVol, 2000)

    // If ambient is already ducking gameplay, skip fading it — already at bed level
    if (!this.ambientDuckingActive) {
      const gpVol = gameplay.volume() as number
      gameplay.fade(gpVol, MUSIC_BED_VOLUME * this.musicVolume * this.masterVolume, 2000)
    }
  }

  setIntenseRate(rate: number) {
    const intense = this.musicTracks['intense']
    if (intense?.playing()) intense.rate(rate)
  }

  stopSfx(name: string) {
    const sound = this.sfxSounds[name]
    if (sound) sound.stop()
  }

  stopAllSfx() {
    for (const howl of Object.values(this.sfxSounds)) {
      howl.stop()
    }
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

    if (SFX[name].loop && sound.playing()) return
    sound.volume(SFX[name].volume * this.sfxVolume * this.masterVolume)
    sound.play()
  }

  playEventSfx(key: string) {
    if (this._sfxMuted) return
    this.init()
    const sound = this.eventSfxSounds[key]
    const def = EVENT_SFX[key]
    if (!sound || !def) return
    sound.volume(def.volume * this.sfxVolume * this.masterVolume)
    sound.play()
  }

  startEventAmbient(key: string) {
    this.init()
    const ambient = this.eventAmbientSounds[key]
    const def = EVENT_AMBIENT[key]
    if (!ambient || !def) return

    // Determine which music track to duck
    const trackToDuck = this.intenseMixActive
      ? this.musicTracks['intense']
      : this.musicTracks['gameplay']

    if (trackToDuck?.playing()) {
      const currentVol = trackToDuck.volume() as number
      trackToDuck.fade(currentVol, MUSIC_BED_VOLUME * this.musicVolume * this.masterVolume, 500)
    }

    const targetVol = def.volume * this.musicVolume * this.masterVolume
    ambient.volume(0)
    ambient.play()
    ambient.fade(0, targetVol, 500)

    this.activeEventAmbientKey = key
    this.ambientDuckingActive = true
  }

  stopEventAmbient() {
    if (!this.activeEventAmbientKey) return
    this.init()

    const key = this.activeEventAmbientKey
    const ambient = this.eventAmbientSounds[key]
    if (ambient?.playing()) ambient.fade(ambient.volume() as number, 0, 500)

    // Restore ducked music track
    const trackToRestore = this.intenseMixActive
      ? this.musicTracks['intense']
      : this.musicTracks['gameplay']

    if (trackToRestore?.playing()) {
      const trackName = this.intenseMixActive ? 'intense' : (this.currentMusicName ?? 'gameplay')
      const fullVol = MUSIC_TRACKS[trackName]
        ? MUSIC_TRACKS[trackName].volume * this.musicVolume * this.masterVolume
        : this.musicVolume * this.masterVolume
      trackToRestore.fade(trackToRestore.volume() as number, fullVol, 500)
    }

    this.activeEventAmbientKey = null
    this.ambientDuckingActive = false
  }

  setMasterVolume(v: number) {
    this.masterVolume = v
    this.setMusicVolume(this.musicVolume)
    this.setSfxVolume(this.sfxVolume)
  }

  setMusicVolume(v: number) {
    this.musicVolume = v
    const effective = v * this.masterVolume
    if (this.intenseMixActive) {
      const gameplay = this.musicTracks['gameplay']
      const intense = this.musicTracks['intense']
      if (gameplay?.playing()) gameplay.volume(MUSIC_BED_VOLUME * effective)
      if (intense?.playing()) {
        // If event ambient is ducking the intense track, keep it at bed level
        const intenseTarget = this.ambientDuckingActive
          ? MUSIC_BED_VOLUME * effective
          : MUSIC_TRACKS['intense'].volume * effective
        intense.volume(intenseTarget)
      }
    } else if (this.currentMusicName) {
      const current = this.musicTracks[this.currentMusicName]
      if (current?.playing()) {
        const target = this.ambientDuckingActive
          ? MUSIC_BED_VOLUME * effective
          : MUSIC_TRACKS[this.currentMusicName].volume * effective
        current.volume(target)
      }
    }
    // Update active ambient volume if playing
    if (this.activeEventAmbientKey) {
      const ambient = this.eventAmbientSounds[this.activeEventAmbientKey]
      const ambDef = EVENT_AMBIENT[this.activeEventAmbientKey]
      if (ambient && ambDef) ambient.volume(ambDef.volume * v * this.masterVolume)
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
