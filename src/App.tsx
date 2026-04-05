import { useReducer, useCallback, useState } from 'react'
import { gameReducer, createInitialState } from './state/gameReducer'
import { parseCommand } from './state/commandProcessor'
import { AudioSettings, GameOptions, LevelProgress, PlayerStats } from './state/types'
import { useGameLoop } from './hooks/useGameLoop'
import { useBotSimulation } from './hooks/useBotSimulation'
import { useTwitchChat } from './hooks/useTwitchChat'
import { useGameAudio } from './audio/useGameAudio'
import MainMenu from './components/MainMenu'
import OptionsScreen from './components/OptionsScreen'
import TwitchConnect from './components/TwitchConnect'
import Countdown from './components/Countdown'
import GameOver from './components/GameOver'
import LevelSelect from './components/LevelSelect'
import { getLevelConfig, getStarRating } from './data/levels'
import StatsBar from './components/StatsBar'
import Kitchen from './components/Kitchen'
import OrdersBar from './components/DiningRoom'
import ChatPanel from './components/ChatPanel'
import InfoBar from './components/InfoBar'
import styles from './App.module.css'

type Screen = 'menu' | 'levelselect' | 'options' | 'twitch' | 'countdown' | 'playing' | 'gameover'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [gameOptions, setGameOptions] = useState<GameOptions>({ cookingSpeed: 1, orderSpeed: 1, shiftDuration: 120000, stationCapacity: { chopping: 3, cooking: 2, plating: 2 } })
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(gameOptions.shiftDuration, gameOptions.cookingSpeed, gameOptions.orderSpeed, gameOptions.stationCapacity)
  )
  const [botsEnabled, setBotsEnabled] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [twitchChannel, setTwitchChannel] = useState<string | null>(null)
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem('audioSettings')
      return saved ? { musicVolume: 0.5, sfxVolume: 0.5, musicMuted: false, sfxMuted: false, ...JSON.parse(saved) } : { musicVolume: 0.5, sfxVolume: 0.5, musicMuted: false, sfxMuted: false }
    } catch {
      return { musicVolume: 0.5, sfxVolume: 0.5, musicMuted: false, sfxMuted: false }
    }
  })
  const [finalStats, setFinalStats] = useState<{ money: number; served: number; lost: number; playerStats: Record<string, PlayerStats> }>({ money: 0, served: 0, lost: 0, playerStats: {} })
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)
  const [levelProgress, setLevelProgress] = useState<LevelProgress>(() => {
    try {
      const saved = localStorage.getItem('chatsKitchen_levelProgress')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const handleCommand = useCallback((user: string, text: string) => {
    const action = parseCommand(user, text)
    if (action) dispatch(action)
  }, [])

  const handleTwitchMessage = useCallback((user: string, text: string) => {
    dispatch({ type: 'ADD_CHAT', username: user, text, msgType: 'normal' })
    handleCommand(user, text)
  }, [handleCommand])

  const twitchChat = useTwitchChat(twitchChannel, handleTwitchMessage)
  const handleChatSend = useCallback((text: string) => {
    dispatch({ type: 'ADD_CHAT', username: 'You', text, msgType: 'normal' })
    handleCommand('You', text)
  }, [handleCommand])

  const handleGameOver = useCallback(() => {
    setFinalStats({ money: state.money, served: state.served, lost: state.lost, playerStats: state.playerStats })
    if (currentLevel != null) {
      const stars = getStarRating(currentLevel, state.money)
      if (stars > (levelProgress[currentLevel] || 0)) {
        const updated = { ...levelProgress, [currentLevel]: stars }
        setLevelProgress(updated)
        localStorage.setItem('chatsKitchen_levelProgress', JSON.stringify(updated))
      }
    }
    setScreen('gameover')
  }, [state.money, state.served, state.lost, state.playerStats, currentLevel, levelProgress])

  const resetGame = useCallback(() => {
    setCurrentLevel(null)
    dispatch({ type: 'RESET', shiftDuration: gameOptions.shiftDuration, cookingSpeed: gameOptions.cookingSpeed, orderSpeed: gameOptions.orderSpeed, stationCapacity: gameOptions.stationCapacity })
    setScreen('countdown')
  }, [gameOptions])

  const startLevel = useCallback((level: number) => {
    const config = getLevelConfig(level)
    setCurrentLevel(level)
    dispatch({ type: 'RESET', shiftDuration: config.shiftDuration, cookingSpeed: config.cookingSpeed, orderSpeed: config.orderSpeed, stationCapacity: gameOptions.stationCapacity })
    setScreen('countdown')
  }, [gameOptions.stationCapacity])

  const handleAudioChange = useCallback((settings: AudioSettings) => {
    setAudioSettings(settings)
    localStorage.setItem('audioSettings', JSON.stringify(settings))
  }, [])

  const isPlaying = screen === 'playing'
  useGameLoop(state, dispatch, isPlaying ? handleGameOver : undefined)
  useBotSimulation(state, dispatch, handleCommand, isPlaying && botsEnabled)
  useGameAudio(screen, state, audioSettings)

  if (screen === 'menu') {
    return (
      <MainMenu
        onPlay={resetGame}
        onLevels={() => setScreen('levelselect')}
        onOptions={() => setScreen('options')}
        onTwitch={() => setScreen('twitch')}
        twitchChannel={twitchChannel}
        twitchConnected={twitchChat.status === 'connected'}
      />
    )
  }

  if (screen === 'levelselect') {
    return (
      <LevelSelect
        progress={levelProgress}
        onSelectLevel={startLevel}
        onBack={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'options') {
    return <OptionsScreen options={gameOptions} onChange={setGameOptions} audioSettings={audioSettings} onAudioChange={handleAudioChange} onBack={() => setScreen('menu')} />
  }

  if (screen === 'twitch') {
    return (
      <TwitchConnect
        channel={twitchChannel}
        status={twitchChat.status}
        error={twitchChat.error}
        onConnect={(ch) => setTwitchChannel(ch)}
        onDisconnect={() => setTwitchChannel(null)}
        onBack={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'countdown') {
    return <Countdown onDone={() => setScreen('playing')} />
  }

  if (screen === 'gameover') {
    return (
      <GameOver
        money={finalStats.money}
        served={finalStats.served}
        lost={finalStats.lost}
        playerStats={finalStats.playerStats}
        level={currentLevel}
        onPlayAgain={currentLevel != null ? () => startLevel(currentLevel) : resetGame}
        onNextLevel={currentLevel != null && currentLevel < 10 ? () => startLevel(currentLevel + 1) : undefined}
        onMenu={() => setScreen('menu')}
      />
    )
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1>🧑‍🍳 Let Chat Cook</h1>
        <StatsBar
          money={state.money}
          served={state.served}
          lost={state.lost}
          timeLeft={state.timeLeft}
        />
        <div className={styles.headerButtons}>
          {twitchChannel && twitchChat.status === 'connected' && (
            <span className={styles.twitchIndicator}>
              <span className={styles.twitchDot} />
              {twitchChannel}
            </span>
          )}
          <button
            className={`${styles.muteToggle} ${audioSettings.musicMuted ? styles.muteToggleMuted : ''}`}
            onClick={() => handleAudioChange({ ...audioSettings, musicMuted: !audioSettings.musicMuted })}
          >
            {audioSettings.musicMuted ? 'Music: OFF' : 'Music: ON'}
          </button>
          <button
            className={`${styles.muteToggle} ${audioSettings.sfxMuted ? styles.muteToggleMuted : ''}`}
            onClick={() => handleAudioChange({ ...audioSettings, sfxMuted: !audioSettings.sfxMuted })}
          >
            {audioSettings.sfxMuted ? 'SFX: OFF' : 'SFX: ON'}
          </button>
          <button
            className={`${styles.chatToggle} ${chatOpen ? styles.chatToggleOn : ''}`}
            onClick={() => setChatOpen(o => !o)}
          >
            Chat
          </button>
          <button
            className={`${styles.botToggle} ${botsEnabled ? styles.botToggleOn : styles.botToggleOff}`}
            onClick={() => setBotsEnabled(b => !b)}
          >
            {botsEnabled ? 'Bots: ON' : 'Bots: OFF'}
          </button>
          <button className={styles.exitBtn} onClick={() => setScreen('menu')}>
            Exit
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <main className={styles.main}>
          <OrdersBar state={state} />
          <Kitchen state={state} />
        </main>
        {chatOpen && (
          <ChatPanel
            messages={state.chatMessages}
            onSend={handleChatSend}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>
      <InfoBar />
    </div>
  )
}
