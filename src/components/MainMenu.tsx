import styles from './MainMenu.module.css'

interface Props {
  onPlay: () => void
  onLevels: () => void
  onOptions: () => void
  onTwitch: () => void
  twitchChannel: string | null
  twitchConnected: boolean
}

export default function MainMenu({ onPlay, onLevels, onOptions, onTwitch, twitchChannel, twitchConnected }: Props) {
  return (
    <div className={styles.menu}>
      <h1 className={styles.title}>🍳 Let Chat Cook 🔪</h1>
      <p className={styles.subtitle}>A Livestream Chat Restaurant Game — v0.1</p>
      <p className={styles.disclaimer}>Work in progress — EVERYTHING may change, NO data is saved when you close the browser</p>
      <div className={styles.buttons}>
        <div className={styles.sectionHeader}>Twitch</div>
        <button className={`${styles.btn} ${styles.btnTwitch}`} onClick={onTwitch}>
          Connect to Twitch
        </button>
        {twitchConnected && twitchChannel && (
          <div className={styles.twitchStatus}>
            <span className={styles.twitchDot} />
            Welcome <span className={styles.twitchChannel}>{twitchChannel}</span> and your community!
          </div>
        )}
        {!twitchConnected && (
          <div className={`${styles.twitchStatus} ${styles.twitchStatusWarning}`}>
            <span className={styles.twitchDotWarning} />
            Disconnected
          </div>
        )}
        <div className={styles.sectionHeader}>Play</div>
        <button className={`${styles.btn} ${styles.btnLevels}`} onClick={onLevels}>
          Play Levels
        </button>
        <button className={`${styles.btn} ${styles.btnFreePlay}`} onClick={onPlay}>
          Free Play
        </button>
        <button className={`${styles.btn} ${styles.btnOptions}`} onClick={onOptions}>
          Options
        </button>
      </div>
      <p className={styles.footer}>created by THIANzeren</p>
    </div>
  )
}
