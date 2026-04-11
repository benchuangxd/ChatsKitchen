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
    <div className={styles.screen}>

      {/* ── LEFT PANEL ── */}
      <div className={styles.leftCol}>

        <div>
          <div className={styles.title}>Let Chat Cook</div>
          <div className={styles.subtitle}>A Livestream Chat Restaurant Game — v0.1</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.steps}>
          <div className={styles.sectionLabel}>How to play</div>

          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Connect to your Twitch channel</div>
              <div className={styles.stepDesc}>Your chat becomes the kitchen crew</div>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Type commands from the recipe</div>
              <div className={styles.stepDesc}>e.g. chop lettuce · grill patty · serve 1</div>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Serve orders before time's up</div>
              <div className={styles.stepDesc}>Earn money, climb the leaderboard</div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.streamerSection}>
          <div className={styles.sectionLabel}>Streamer Mode</div>
          <p className={styles.streamerDesc}>
            Enable <strong>Auto-Restart</strong> in Free Play to loop rounds automatically.
            Mods and broadcasters can control the session live from chat:
          </p>
          <div className={styles.cheatsheet}>
            <span className={styles.csCmd}>!start</span>
            <span className={styles.csDesc}>begin next round immediately</span>
            <span className={styles.csCmd}>!exit</span>
            <span className={styles.csDesc}>end the current round</span>
            <span className={styles.csCmd}>!onAutoRestart</span>
            <span className={styles.csDesc}>enable auto-restart</span>
            <span className={styles.csCmd}>!offAutoRestart</span>
            <span className={styles.csDesc}>disable auto-restart</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.leftFooter}>
          created by THIANzeren &nbsp;·&nbsp; work in progress — progress may reset
        </div>

      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.rightCol}>

        {/* Twitch Connect Card */}
        <div className={styles.twitchCard}>
          <div className={styles.twitchLabel}>TWITCH CONNECT</div>
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
              <span className={`${styles.twitchDot} ${styles.twitchDotWarning}`} />
              {twitchError || 'Connection failed'}
            </div>
          )}
        </div>

        {/* Game modes */}
        <div className={styles.modes}>

          <button className={styles.modeFreePlay} onClick={onPlay}>
            <div>
              <div className={styles.fpName}>Free Play</div>
              <div className={styles.fpDesc}>Pick recipes, set duration &amp; difficulty</div>
            </div>
            <div className={styles.fpArrow}>▶</div>
          </button>

          <button className={styles.modeAdventures} onClick={onLevels}>
            <div>
              <div className={styles.lvName}>Adventures</div>
              <div className={styles.lvDesc}>10 escalating challenges — earn stars on each</div>
            </div>
            <div className={styles.lvArrow}>→</div>
          </button>

          <div className={styles.modeBottomRow}>
            <button className={styles.modeTutorial} onClick={onTutorial}>Tutorial</button>
            <button className={styles.modeOptions} onClick={onOptions}>Options</button>
          </div>

        </div>

      </div>
    </div>
  )
}
