import { useState } from 'react'
import { TwitchStatus } from '../hooks/useTwitchChat'
import styles from './MainMenu.module.css'

interface Props {
  onPlay: () => void
  onLevels: () => void
  onOptions: () => void
  onTutorial: () => void
  twitchChannel: string | null
  twitchStatus: TwitchStatus
  twitchError: string | undefined
  onTwitchConnect: (channel: string) => void
  onTwitchDisconnect: () => void
}

export default function MainMenu({ onPlay, onLevels, onOptions, onTutorial, twitchChannel, twitchStatus, twitchError, onTwitchConnect, onTwitchDisconnect }: Props) {
  const [twitchInput, setTwitchInput] = useState(twitchChannel || '')
  const isConnected = twitchStatus === 'connected'
  const isConnecting = twitchStatus === 'connecting'

  const handleConnect = () => {
    if (!twitchInput.trim()) return
    onTwitchConnect(twitchInput.trim())
  }

  return (
    <div className={styles.menu}>
      <h1 className={styles.title}>🍳 Let Chat Cook 🔪</h1>
      <p className={styles.subtitle}>A Livestream Chat Restaurant Game — v0.1</p>
      <p className={styles.disclaimer}>Work in progress — EVERYTHING may change, PROGRESS will disappear / be deleted</p>
      <div className={styles.buttons}>
        <div className={styles.sectionHeader}>Twitch</div>
        <div className={styles.twitchForm}>
          <input
            className={styles.twitchInput}
            value={twitchInput}
            onChange={e => setTwitchInput(e.target.value)}
            placeholder="channel name"
            disabled={isConnecting || isConnected}
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
          />
          {isConnected ? (
            <button className={styles.twitchDisconnectBtn} onClick={onTwitchDisconnect}>
              Disconnect
            </button>
          ) : (
            <button
              className={styles.twitchConnectBtn}
              onClick={handleConnect}
              disabled={isConnecting || !twitchInput.trim()}
            >
              {isConnecting ? '...' : 'Connect'}
            </button>
          )}
        </div>
        {isConnected && twitchChannel && (
          <div className={styles.twitchStatus}>
            <span className={styles.twitchDot} />
            Welcome <span className={styles.twitchChannel}>{twitchChannel}</span> and your community!
          </div>
        )}
        {!isConnected && twitchStatus === 'error' && (
          <div className={`${styles.twitchStatus} ${styles.twitchStatusWarning}`}>
            <span className={styles.twitchDotWarning} />
            {twitchError || 'Connection failed'}
          </div>
        )}
        <div className={styles.sectionHeader}>Play</div>
        <button className={`${styles.btn} ${styles.btnFreePlay}`} onClick={onPlay}>
          Free Play
        </button>
        <button className={`${styles.btn} ${styles.btnLevels}`} onClick={onLevels}>
          Play Levels
        </button>
        <button className={`${styles.btn} ${styles.btnTutorial}`} onClick={onTutorial}>
          Tutorial
        </button>
        <button className={`${styles.btn} ${styles.btnOptions}`} onClick={onOptions}>
          Options
        </button>
      </div>
      <p className={styles.footer}>created by THIANzeren</p>
    </div>
  )
}
