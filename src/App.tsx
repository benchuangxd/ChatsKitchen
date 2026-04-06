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
import TutorialModal from './components/TutorialModal'
import TutorialPrompt from './components/TutorialPrompt'
import { getLevelConfig, getStarRating } from './data/levels'
import { RECIPES } from './data/recipes'
import StatsBar from './components/StatsBar'
import Kitchen from './components/Kitchen'
import OrdersBar from './components/DiningRoom'
import ChatPanel from './components/ChatPanel'
import InfoBar from './components/InfoBar'
import styles from './App.module.css'

type Screen = 'menu' | 'levelselect' | 'options' | 'twitch' | 'countdown' | 'playing' | 'gameover'
type TutorialDestination = 'menu' | 'freeplay' | 'levelselect'

const DEFAULT_GAME_OPTIONS: GameOptions = {
  cookingSpeed: 1,
  orderSpeed: 1,
  shiftDuration: 120000,
  stationCapacity: { chopping: 3, cooking: 2, plating: 2 },
  enabledRecipes: Object.keys(RECIPES).filter(k => k !== 'mushroom_soup' && k !== 'fish_burger'),
  allowShortformCommands: true
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.5,
  musicMuted: false,
  sfxMuted: false
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [gameOptions, setGameOptions] = useState<GameOptions>(() => {
    try {
      const saved = localStorage.getItem('chatsKitchen_gameOptions')
      return saved ? { ...DEFAULT_GAME_OPTIONS, ...JSON.parse(saved) } : DEFAULT_GAME_OPTIONS
    } catch {
      return DEFAULT_GAME_OPTIONS
    }
  })
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    createInitialState(gameOptions.shiftDuration, gameOptions.cookingSpeed, gameOptions.orderSpeed, gameOptions.stationCapacity)
  )
  const [botsEnabled, setBotsEnabled] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [twitchChannel, setTwitchChannel] = useState<string | null>(() => {
    try {
      return localStorage.getItem('chatsKitchen_twitchChannel')
    } catch {
      return null
    }
  })
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem('audioSettings')
      return saved ? { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(saved) } : DEFAULT_AUDIO_SETTINGS
    } catch {
      return DEFAULT_AUDIO_SETTINGS
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
  const [hideTutorialPrompt, setHideTutorialPrompt] = useState(() => {
    try {
      return localStorage.getItem('chatsKitchen_hideTutorialPrompt') === 'true'
    } catch {
      return false
    }
  })
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false)
  const [tutorialDestination, setTutorialDestination] = useState<TutorialDestination>('menu')

  const startFreePlay = useCallback(() => {
    setCurrentLevel(null)
    dispatch({ type: 'RESET', shiftDuration: gameOptions.shiftDuration, cookingSpeed: gameOptions.cookingSpeed, orderSpeed: gameOptions.orderSpeed, stationCapacity: gameOptions.stationCapacity, enabledRecipes: gameOptions.enabledRecipes })
    setScreen('countdown')
  }, [gameOptions])

  const continueFromTutorial = useCallback((destination: TutorialDestination) => {
    if (destination === 'freeplay') {
      startFreePlay()
      return
    }

    if (destination === 'levelselect') {
      setScreen('levelselect')
      return
    }

    setScreen('menu')
  }, [startFreePlay])

  const openTutorial = useCallback((destination: TutorialDestination) => {
    setShowTutorialPrompt(false)
    setTutorialDestination(destination)
    setTutorialOpen(true)
  }, [])

  const dismissTutorialPrompt = useCallback(() => {
    setShowTutorialPrompt(false)
    continueFromTutorial(tutorialDestination)
  }, [continueFromTutorial, tutorialDestination])

  const disableTutorialPrompt = useCallback(() => {
    setHideTutorialPrompt(true)
    try {
      localStorage.setItem('chatsKitchen_hideTutorialPrompt', 'true')
    } catch {
      // Ignore storage failures; in-memory state already updated above.
    }
    setShowTutorialPrompt(false)
    continueFromTutorial(tutorialDestination)
  }, [continueFromTutorial, tutorialDestination])

  const handleMenuTutorial = useCallback(() => {
    setTutorialDestination('menu')
    setTutorialOpen(true)
    setShowTutorialPrompt(false)
  }, [])

  const handleMenuPlay = useCallback((destination: TutorialDestination) => {
    if (!hideTutorialPrompt) {
      setTutorialDestination(destination)
      setShowTutorialPrompt(true)
      return
    }

    continueFromTutorial(destination)
  }, [continueFromTutorial, hideTutorialPrompt])

  const handleTutorialStartCooking = useCallback(() => {
    setTutorialOpen(false)
    continueFromTutorial(tutorialDestination)
  }, [continueFromTutorial, tutorialDestination])

  const handleCommand = useCallback((user: string, text: string) => {
    const action = parseCommand(user, text, gameOptions.allowShortformCommands)
    if (action) dispatch(action)
  }, [gameOptions.allowShortformCommands])

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

  const startLevel = useCallback((level: number) => {
    const config = getLevelConfig(level)
    setCurrentLevel(level)
    dispatch({ type: 'RESET', shiftDuration: config.shiftDuration, cookingSpeed: config.cookingSpeed, orderSpeed: config.orderSpeed, stationCapacity: gameOptions.stationCapacity, enabledRecipes: gameOptions.enabledRecipes })
    setScreen('countdown')
  }, [gameOptions.stationCapacity])

  const handleAudioChange = useCallback((settings: AudioSettings) => {
    setAudioSettings(settings)
    localStorage.setItem('audioSettings', JSON.stringify(settings))
  }, [])

  const handleGameOptionsChange = useCallback((options: GameOptions) => {
    setGameOptions(options)
    try {
      localStorage.setItem('chatsKitchen_gameOptions', JSON.stringify(options))
    } catch {
      // Ignore storage failures and keep the in-memory state change.
    }
  }, [])

  const handleTwitchChannelChange = useCallback((ch: string | null) => {
    setTwitchChannel(ch)
    try {
      if (ch) localStorage.setItem('chatsKitchen_twitchChannel', ch)
      else localStorage.removeItem('chatsKitchen_twitchChannel')
    } catch {
      // Ignore storage failures and keep the in-memory state change.
    }
  }, [])

  const handleResetAll = useCallback(() => {
    setGameOptions(DEFAULT_GAME_OPTIONS)
    setAudioSettings(DEFAULT_AUDIO_SETTINGS)
    setLevelProgress({})
    handleTwitchChannelChange(null)
    setHideTutorialPrompt(false)
    setShowTutorialPrompt(false)
    setTutorialDestination('menu')
    setTutorialOpen(false)

    try {
      localStorage.setItem('audioSettings', JSON.stringify(DEFAULT_AUDIO_SETTINGS))
      localStorage.removeItem('chatsKitchen_levelProgress')
      // Removing keys lets lazy initialisers fall back to defaults on next load.
      localStorage.removeItem('chatsKitchen_gameOptions')
      localStorage.removeItem('chatsKitchen_hideTutorialPrompt')
    } catch {
      // Ignore storage failures and keep the in-memory reset behavior.
    }
  }, [handleTwitchChannelChange])

  const isPlaying = screen === 'playing'
  useGameLoop(state, dispatch, isPlaying ? handleGameOver : undefined)
  useBotSimulation(state, dispatch, handleCommand, isPlaying && botsEnabled)
  useGameAudio(screen, state, audioSettings)

  const gameplayModeLabel = currentLevel != null ? `Level ${currentLevel}` : 'Free Play'

  let content

  if (screen === 'menu') {
    content = (
      <MainMenu
        onPlay={() => handleMenuPlay('freeplay')}
        onLevels={() => handleMenuPlay('levelselect')}
        onOptions={() => setScreen('options')}
        onTutorial={handleMenuTutorial}
        onTwitch={() => setScreen('twitch')}
        twitchChannel={twitchChannel}
        twitchConnected={twitchChat.status === 'connected'}
      />
    )
  } else if (screen === 'levelselect') {
    content = (
      <LevelSelect
        progress={levelProgress}
        onSelectLevel={startLevel}
        onBack={() => setScreen('menu')}
        twitchChannel={twitchChannel}
        twitchConnected={twitchChat.status === 'connected'}
      />
    )
  } else if (screen === 'options') {
    content = <OptionsScreen options={gameOptions} onChange={handleGameOptionsChange} audioSettings={audioSettings} onAudioChange={handleAudioChange} onResetAll={handleResetAll} onBack={() => setScreen('menu')} />
  } else if (screen === 'twitch') {
    content = (
      <TwitchConnect
        channel={twitchChannel}
        status={twitchChat.status}
        error={twitchChat.error}
        onConnect={(ch) => handleTwitchChannelChange(ch)}
        onDisconnect={() => handleTwitchChannelChange(null)}
        onBack={() => setScreen('menu')}
      />
    )
  } else if (screen === 'countdown') {
    content = <Countdown onDone={() => setScreen('playing')} />
  } else if (screen === 'gameover') {
    content = (
      <GameOver
        money={finalStats.money}
        served={finalStats.served}
        lost={finalStats.lost}
        playerStats={finalStats.playerStats}
        level={currentLevel}
        onPlayAgain={currentLevel != null ? () => startLevel(currentLevel) : startFreePlay}
        onNextLevel={currentLevel != null && currentLevel < 10 ? () => startLevel(currentLevel + 1) : undefined}
        onMenu={() => setScreen('menu')}
      />
    )
  } else {
    content = (
      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            <h1>🧑‍🍳 Let Chat Cook</h1>
            <span className={styles.levelIndicator}>{gameplayModeLabel}</span>
          </div>
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
        <InfoBar shortformEnabled={gameOptions.allowShortformCommands} />
      </div>
    )
  }

  return (
    <>
      {content}
      {showTutorialPrompt && screen === 'menu' && !tutorialOpen && (
        <TutorialPrompt
          onYes={() => openTutorial(tutorialDestination)}
          onNo={dismissTutorialPrompt}
          onDontShowAgain={disableTutorialPrompt}
        />
      )}
      {tutorialOpen && (
        <TutorialModal
          onClose={() => setTutorialOpen(false)}
          onStartCooking={handleTutorialStartCooking}
        />
      )}
    </>
  )
}
