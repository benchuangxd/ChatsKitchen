import { useEffect, useRef } from 'react'
import { GameState, AudioSettings } from '../state/types'
import { getAudioManager } from './AudioManager'

type Screen = 'menu' | 'options' | 'twitch' | 'countdown' | 'playing' | 'gameover'

export function useGameAudio(screen: Screen, state: GameState, audioSettings: AudioSettings) {
  const audio = getAudioManager()
  const prevMsgCount = useRef(state.chatMessages.length)
  const prevOrderCount = useRef(state.orders.length)
  const intenseFired = useRef(false)

  // Music transitions based on screen
  useEffect(() => {
    switch (screen) {
      case 'menu':
      case 'options':
      case 'twitch':
        audio.stopMusic()
        break
      case 'countdown':
        audio.stopMusic()
        break
      case 'playing':
        audio.playMusic('gameplay')
        intenseFired.current = false
        break
      case 'gameover':
        audio.stopMusic()
        audio.playSfx('round-over')
        break
    }
  }, [screen, audio])

  // Volume and mute sync
  useEffect(() => {
    audio.setMusicVolume(audioSettings.musicVolume)
    audio.setSfxVolume(audioSettings.sfxVolume)
    audio.setMusicMuted(audioSettings.musicMuted)
    audio.setSfxMuted(audioSettings.sfxMuted)
  }, [audioSettings.musicVolume, audioSettings.sfxVolume, audioSettings.musicMuted, audioSettings.sfxMuted, audio])

  // Intense music crossfade when time is low
  useEffect(() => {
    if (screen === 'playing' && state.timeLeft <= 30000 && state.timeLeft > 0 && !intenseFired.current) {
      intenseFired.current = true
      audio.crossfadeToIntense()
    }
  }, [screen, state.timeLeft, audio])

  // SFX triggers from state changes
  useEffect(() => {
    if (screen !== 'playing') return

    const msgCount = state.chatMessages.length
    const orderCount = state.orders.filter(o => !o.served).length

    // New order spawned
    if (orderCount > prevOrderCount.current) {
      audio.playSfx('order-spawn')
    }
    prevOrderCount.current = orderCount

    // Check new chat messages for event-based SFX
    if (msgCount > prevMsgCount.current) {
      const newMessages = state.chatMessages.slice(prevMsgCount.current)
      for (const msg of newMessages) {
        const text = msg.text.toLowerCase()

        if (msg.type === 'error') {
          audio.playSfx('error-buzzer')
        } else if (text.includes('served')) {
          audio.playSfx('serve-success')
        } else if (text.includes('on fire')) {
          audio.playSfx('fire-alarm')
        } else if (text.includes('put out the fire')) {
          audio.playSfx('fire-extinguished')
        } else if (text.includes('expired')) {
          audio.playSfx('order-expired')
        } else if (text.includes('started plating')) {
          audio.playSfx('plating')
        } else if (text.includes('took')) {
          audio.playSfx('take-item')
        } else if (text.includes('started') && (text.includes('chop') || text.includes('grill') || text.includes('fry') || text.includes('boil') || text.includes('toast'))) {
          audio.playSfx('cook-start')
        }
      }
    }
    prevMsgCount.current = msgCount
  })
}
